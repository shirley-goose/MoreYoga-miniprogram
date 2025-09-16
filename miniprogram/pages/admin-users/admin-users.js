Page({
  data: {
    searchKeyword: '',
    userList: [],
    loading: false,
    
    // 编辑弹窗
    showEditModal: false,
    selectedUser: null,
    submitting: false,
    
    // 操作类型
    operationTypes: ['增加', '设置', '扣除'],
    operationValues: ['add', 'set', 'deduct'],
    
    // 编辑表单
    editForm: {
      operationIndex: 0,
      groupCredits: '',
      termCredits: '',
      reason: ''
    }
  },

  async onLoad() {
    await this.loadUsers();
  },

  // 加载用户列表
  async loadUsers() {
    this.setData({ loading: true });
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'getAllUsers',
        data: { 
          keyword: this.data.searchKeyword,
          limit: 50
        }
      });
      
      if (result.result && result.result.success) {
        this.setData({
          userList: result.result.data
        });
      } else {
        wx.showToast({
          title: '加载用户失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 搜索用户
  async searchUsers() {
    await this.loadUsers();
  },

  // 选择用户
  selectUser(e) {
    const user = e.currentTarget.dataset.user;
    this.setData({
      selectedUser: user,
      showEditModal: true,
      editForm: {
        operationIndex: 0,
        groupCredits: '',
        termCredits: '',
        reason: ''
      }
    });
  },

  // 隐藏编辑弹窗
  hideEditModal() {
    this.setData({
      showEditModal: false,
      selectedUser: null
    });
  },

  // 阻止弹窗关闭
  preventClose() {
    // 空函数，阻止事件冒泡
  },

  // 操作类型选择
  onOperationChange(e) {
    this.setData({
      'editForm.operationIndex': parseInt(e.detail.value)
    });
  },

  // 编辑表单输入
  onEditFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`editForm.${field}`]: value
    });
  },

  // 提交修改
  async submitEdit() {
    const form = this.data.editForm;
    const user = this.data.selectedUser;
    const operationValues = this.data.operationValues;
    
    // 验证表单
    const groupCredits = parseInt(form.groupCredits) || 0;
    const termCredits = parseInt(form.termCredits) || 0;
    
    if (groupCredits === 0 && termCredits === 0) {
      wx.showToast({
        title: '请输入要修改的课时数量',
        icon: 'none'
      });
      return;
    }
    
    if (!form.reason.trim()) {
      wx.showToast({
        title: '请输入操作说明',
        icon: 'none'
      });
      return;
    }
    
    // 确认操作
    const operation = this.data.operationTypes[form.operationIndex];
    const confirmText = `确定要${operation}用户 ${user.nickName} 的课时吗？\n团课: ${groupCredits}次\n私教: ${termCredits}次`;
    
    const confirmResult = await new Promise(resolve => {
      wx.showModal({
        title: '确认操作',
        content: confirmText,
        success: res => resolve(res.confirm)
      });
    });
    
    if (!confirmResult) return;
    
    this.setData({ submitting: true });
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'adminUpdateCredits',
        data: {
          userOpenid: user.openid,
          groupCreditsChange: groupCredits,
          termCreditsChange: termCredits,
          operation: operationValues[form.operationIndex],
          reason: form.reason.trim()
        }
      });
      
      if (result.result && result.result.success) {
        wx.showToast({
          title: '修改成功',
          icon: 'success'
        });
        
        // 关闭弹窗并刷新列表
        this.hideEditModal();
        await this.loadUsers();
      } else {
        wx.showModal({
          title: '修改失败',
          content: result.result.message || '修改课时失败，请重试',
          showCancel: false
        });
      }
    } catch (error) {
      console.error('修改用户课时失败:', error);
      wx.showToast({
        title: '修改失败',
        icon: 'error'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 返回
  navigateBack() {
    wx.navigateBack();
  }
});
