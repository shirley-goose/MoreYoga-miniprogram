// 老师预约申请页面
Page({
  data: {
    currentTab: 'pending',
    pendingRequests: [],
    processedRequests: [],
    pendingCount: 0,
    teacherInfo: {
      id: '',
      name: ''
    }
  },

  onLoad() {
    console.log('预约申请页面加载');
    this.loadTeacherInfo();
    this.loadRequests();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadRequests();
  },

  // 处理取消申请
  handleCancelRequest(e) {
    const { id, action } = e.currentTarget.dataset;
    const actionText = action === 'approve' ? '同意取消' : '拒绝取消';
    
    wx.showModal({
      title: '确认操作',
      content: `确定要${actionText}这个申请吗？`,
      success: async (res) => {
        if (res.confirm) {
          await this.processCancelRequest(id, action);
        }
      }
    });
  },

  // 处理取消申请
  async processCancelRequest(requestId, action) {
    try {
      wx.showLoading({ title: '处理中...' });

      const result = await wx.cloud.callFunction({
        name: 'handleCancelRequest',
        data: {
          requestId: requestId,
          action: action // 'approve' 或 'reject'
        }
      });

      wx.hideLoading();

      if (result.result && result.result.success) {
        const actionText = action === 'approve' ? '同意取消' : '拒绝取消';
        wx.showToast({
          title: `${actionText}成功`,
          icon: 'success'
        });
        
        // 刷新列表
        this.loadRequests();
      } else {
        wx.showModal({
          title: '处理失败',
          content: result.result?.message || '操作失败，请重试',
          showCancel: false
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('处理取消申请失败:', error);
      wx.showModal({
        title: '处理失败',
        content: '网络错误，请重试',
        showCancel: false
      });
    }
  },

  // 返回上一页
  goBack() {
    console.log('点击返回按钮');
    // 获取页面栈信息
    const pages = getCurrentPages();
    console.log('当前页面栈长度:', pages.length);
    
    if (pages.length > 1) {
      // 有上一页，正常返回
      wx.navigateBack({
        fail: (err) => {
          console.error('返回失败:', err);
          // 返回失败时跳转到老师工作台
          wx.redirectTo({
            url: '/pages/teacher-dashboard/teacher-dashboard'
          });
        }
      });
    } else {
      // 没有上一页，直接跳转到老师工作台
      console.log('没有上一页，跳转到老师工作台');
      wx.redirectTo({
        url: '/pages/teacher-dashboard/teacher-dashboard'
      });
    }
  },

  // 加载老师信息
  loadTeacherInfo() {
    try {
      const teacherInfo = wx.getStorageSync('teacher_info');
      if (teacherInfo) {
        this.setData({ teacherInfo });
        console.log('加载老师信息成功:', teacherInfo);
      } else {
        console.error('未找到老师信息');
      }
    } catch (error) {
      console.error('加载老师信息失败:', error);
    }
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
  },

  // 加载预约申请
  async loadRequests() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const { teacherInfo } = this.data;
      if (!teacherInfo.id) {
        console.error('缺少老师信息');
        wx.hideLoading();
        return;
      }

      console.log('准备调用云函数，teacherInfo:', teacherInfo);
      
      // 调用云函数获取预约申请
      const result = await wx.cloud.callFunction({
        name: 'getTeacherRequests',
        data: {
          teacherId: teacherInfo.id
        }
      });
      
      console.log('云函数调用结果:', result);

      wx.hideLoading();

      if (result.result && result.result.success) {
        const { pendingRequests, processedRequests } = result.result;
        
        // 格式化时间显示
        const formatRequests = (requests) => {
          return requests.map(request => ({
            ...request,
            createTimeDisplay: this.formatCreateTime(request.createTime)
          }));
        };

        this.setData({
          pendingRequests: formatRequests(pendingRequests),
          processedRequests: formatRequests(processedRequests),
          pendingCount: pendingRequests.length
        });

        console.log('加载预约申请成功:', {
          pending: pendingRequests.length,
          processed: processedRequests.length
        });
      } else {
        console.error('获取预约申请失败:', result.result?.message || result.result);
        console.error('完整结果:', result);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('加载预约申请失败:', error);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    }
  },

  // 处理预约申请
  async handleRequest(e) {
    const { id, action } = e.currentTarget.dataset;
    
    const actionText = action === 'confirm' ? '确认' : '拒绝';
    
    wx.showModal({
      title: `${actionText}预约`,
      content: `确定要${actionText}这个预约申请吗？`,
      success: async (res) => {
        if (res.confirm) {
          await this.processRequest(id, action);
        }
      }
    });
  },

  // 处理预约申请
  async processRequest(requestId, action) {
    try {
      wx.showLoading({ title: '处理中...' });

      const result = await wx.cloud.callFunction({
        name: 'handlePrivateBooking',
        data: {
          requestId: requestId,
          action: action, // 'confirm' 或 'reject'
          teacherId: this.data.teacherInfo.id
        }
      });

      wx.hideLoading();

      if (result.result && result.result.success) {
        const actionText = action === 'confirm' ? '确认' : '拒绝';
        wx.showToast({
          title: `${actionText}成功`,
          icon: 'success'
        });
        
        // 刷新列表
        this.loadRequests();
      } else {
        wx.showModal({
          title: '处理失败',
          content: result.result?.message || '操作失败，请重试',
          showCancel: false
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('处理预约申请失败:', error);
      wx.showModal({
        title: '处理失败',
        content: '网络错误，请重试',
        showCancel: false
      });
    }
  },

  // 格式化创建时间
  formatCreateTime(createTime) {
    if (!createTime) return '';
    
    try {
      const date = new Date(createTime);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) {
        return '刚刚';
      } else if (diffMins < 60) {
        return `${diffMins}分钟前`;
      } else if (diffHours < 24) {
        return `${diffHours}小时前`;
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else {
        // 显示具体日期
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return `${month}月${day}日 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    } catch (error) {
      console.error('时间格式化错误:', error);
      return '';
    }
  }
});
