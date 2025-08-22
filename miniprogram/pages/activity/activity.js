Page({
  data: {
    activityList: [
      {
        title: '读书会',
        bgImage: '../../images/activity_reading.png'
      },
      {
        title: '品茶',
        bgImage: '../../images/activity_tea.png'
      },
      {
        title: '针灸',
        bgImage: '../../images/activity_acupuncture.png'
      }
    ],

  },
  onActivityTap(e) {
    const activity = e.currentTarget.dataset.activity;
    wx.showToast({
      title: `${activity.title} 功能开发中`,
      icon: 'none'
    });
  },

  onShow() {
    // 更新自定义TabBar状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
  }
}); 