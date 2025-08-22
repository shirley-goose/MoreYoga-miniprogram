Page({
  data: {
    isAdmin: false,
    adminInfo: null
  },

  onLoad() {
    this.checkAdminPermission();
  },

  // 检查管理员权限（支持新的openid验证方式）
  async checkAdminPermission() {
    // 首先检查本地存储的登录状态
    const adminLoggedIn = wx.getStorageSync('admin_logged_in');
    const adminInfo = wx.getStorageSync('admin_info');
    
    if (adminLoggedIn && adminInfo) {
      // 已登录，设置管理员状态
      this.setData({ 
        isAdmin: true,
        adminInfo: adminInfo
      });
      return;
    }
    
    // 检查是否有老师token
    const adminToken = wx.getStorageSync('admin_token');
    if (adminToken) {
      try {
        const result = await wx.cloud.callFunction({
          name: 'verifyAdminToken',
          data: { token: adminToken }
        });

        if (result.result && result.result.success) {
          // token有效，设置权限
          this.setData({ 
            isAdmin: true,
            adminInfo: result.result.adminInfo || { name: '老师', role: 'teacher' }
          });
          return;
        }
      } catch (error) {
        console.error('验证token失败:', error);
      }
    }
    
    // 最后尝试openid验证（管理员直接访问）
    try {
      const result = await wx.cloud.callFunction({
        name: 'checkAdminAccess'
      });
      
      if (result.result && result.result.success && result.result.isAdmin) {
        // 是管理员，直接设置权限
        this.setData({ 
          isAdmin: true,
          adminInfo: result.result.adminInfo
        });
        
        // 保存到本地存储
        wx.setStorageSync('admin_info', result.result.adminInfo);
        wx.setStorageSync('admin_logged_in', true);
        return;
      }
    } catch (error) {
      console.error('验证管理员权限失败:', error);
    }
    
    // 所有验证都失败，跳转到登录页
    wx.redirectTo({
      url: '../admin-login/admin-login'
    });
  },



  // 导航到指定页面
  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({ url });
  },



  // 查看日志
  viewLogs() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出管理后台吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('admin_logged_in');
          wx.removeStorageSync('admin_info');
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
          
          // 跳转到登录页
          setTimeout(() => {
            wx.redirectTo({
              url: '../admin-login/admin-login'
            });
          }, 1500);
        }
      }
    });
  },

  // 返回
  navigateBack() {
    wx.navigateBack();
  }
});
