// 瑜伽理论页面
Page({
  data: {
    theoryList: [
      { name: '身体结构' },
      { name: '瑜伽哲学' },
      { name: '呼吸理论' },
      { name: '心身体感觉知' }
    ]
  },

  onLoad() {
    // 页面加载时的逻辑
  },

  onShow() {
    // 页面显示时的逻辑
  },

  // 返回上一页
  navigateBack() {
    wx.navigateBack({
      delta: 1
    });
  }
});
