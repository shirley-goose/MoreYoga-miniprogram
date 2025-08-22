// 老师工作台页面
Page({
  data: {
    teacherInfo: {},
    pendingCount: 0
  },

  onLoad() {
    this.loadTeacherInfo();
    this.loadPendingCount();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadPendingCount();
  },

  // 加载老师信息
  loadTeacherInfo() {
    const teacherInfo = wx.getStorageSync('teacher_info');
    if (!teacherInfo || !teacherInfo.id) {
      wx.redirectTo({
        url: '/pages/admin-login/admin-login'
      });
      return;
    }

    this.setData({
      teacherInfo: teacherInfo
    });
  },

  // 加载待处理申请数量
  async loadPendingCount() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getTeacherRequests',
        data: {
          teacherId: this.data.teacherInfo.id
        }
      });

      if (result.result && result.result.success) {
        this.setData({
          pendingCount: result.result.pendingRequests.length || 0
        });
      }
    } catch (error) {
      console.error('加载待处理申请数量失败:', error);
    }
  },

  // 导航到指定页面
  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url
    });
  },



  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('teacher_info');
          wx.removeStorageSync('teacher_token');
          
          wx.showToast({
            title: '退出成功',
            icon: 'success'
          });

          // 跳转到登录页
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/admin-login/admin-login'
            });
          }, 1500);
        }
      }
    });
  }
});
