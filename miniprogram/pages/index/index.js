Page({
  data: {
    introList: [
      {
        icon: '../../images/icon_场馆介绍.png',
        title: '场馆介绍',
        path: '/pages/venue-intro/venue-intro'
      },
      {
        icon: '../../images/icon_师资简介.png',
        title: '师资简介',
        path: '/pages/teacher-list/teacher-list'
      },
      {
        icon: '../../images/icon_课程主题.png',
        title: '课程主题',
        path: '/pages/course-theme/course-theme'
      },
      {
        icon: '../../images/icon_瑜伽理论.png',
        title: '瑜伽理论',
        path: '/pages/yoga-theory/yoga-theory'
      }
    ],
    currentTab: 0
  },

  onLoad() {
    // 页面加载时的逻辑
  },

  onShow() {
    // 更新自定义TabBar状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }
  },

  // 点击介绍模块跳转
  onIntroTap(e) {
    const index = e.currentTarget.dataset.index;
    const path = this.data.introList[index].path;
    wx.navigateTo({
      url: path
    });
  }
}); 