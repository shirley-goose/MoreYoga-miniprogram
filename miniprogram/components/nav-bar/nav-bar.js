// 自定义导航栏组件
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 导航栏标题
    title: {
      type: String,
      value: '墨瑜伽'
    },
    // 是否显示返回按钮
    showBack: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 点击返回按钮
    onBackTap() {
      // 触发父组件的返回事件
      this.triggerEvent('back');
      
      // 默认行为：返回上一页
      wx.navigateBack({
        delta: 1
      });
    }
  }
});
