// app.js
App({
  onLaunch() {
    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-9g5oms9v90aabf59', // 云环境ID - 需要在微信开发者工具中创建
        traceUser: true
      });
    }
    
    // 初始化用户信息
    this.initUserInfo();
  },
  
  // 初始化用户信息
  async initUserInfo() {
    try {
      // 获取用户登录状态
      const loginRes = await wx.cloud.callFunction({
        name: 'login'
      });
      
      if (loginRes.result && loginRes.result.openid) {
        this.globalData.openid = loginRes.result.openid;
        
        // 检查用户是否已注册
        const userRes = await wx.cloud.callFunction({
          name: 'getUser'
        });
        
        if (userRes.result) {
          this.globalData.userInfo = userRes.result;
        }
      }
    } catch (error) {
      console.error('初始化用户信息失败:', error);
    }
  },
  
  
  globalData: {
    // CDN图片链接配置
    cdnImages: {
      background: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/background.png',
      logo: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/logo.png',
      // 其他图片...
    }
  }
}); 