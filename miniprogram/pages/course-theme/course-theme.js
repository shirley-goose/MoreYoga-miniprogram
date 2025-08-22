// 课程主题页面
Page({
  data: {
    courseList: [
      { name: '集训营' },
      { name: '古典瑜伽' },
      { name: '女性瑜伽' },
      { name: '理疗放松' },
      { name: '流动' },
      { name: '体态调整' }
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
