Component({
  data: {
    selected: 0,
    color: "#ffffff",
    selectedColor: "#4caf50",
    backgroundColor: "#202632",
    list: [
      {
        pagePath: "/pages/index/index",
        text: "知",
        iconPath: "/images/tab_知.png",
        selectedIconPath: "/images/tab_知_active.png"
      },
      {
        pagePath: "/pages/course/course", 
        text: "练",
        iconPath: "/images/tab_练.png",
        selectedIconPath: "/images/tab_练_active.png"
      },
      {
        pagePath: "/pages/activity/activity",
        text: "聚", 
        iconPath: "/images/tab_聚.png",
        selectedIconPath: "/images/tab_聚_active.png"
      },
      {
        pagePath: "/pages/profile/profile",
        text: "我",
        iconPath: "/images/tab_我.png", 
        selectedIconPath: "/images/tab_我_active.png"
      }
    ]
  },
  
  attached() {
    // 获取当前页面路径，增加安全检查
    try {
      const pages = getCurrentPages();
      if (pages && pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        if (currentPage && currentPage.route) {
          const currentPath = `/${currentPage.route}`;
          
          // 找到对应的tabbar项
          const selectedIndex = this.data.list.findIndex(item => item.pagePath === currentPath);
          if (selectedIndex !== -1) {
            this.setData({
              selected: selectedIndex
            });
          }
        }
      }
    } catch (error) {
      console.error('TabBar attached error:', error);
      // 如果出错，默认选中第一个tab
      this.setData({
        selected: 0
      });
    }
  },
  
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      
      wx.switchTab({
        url,
        success: () => {
          this.setData({
            selected: data.index
          });
        }
      });
    }
  }
}); 