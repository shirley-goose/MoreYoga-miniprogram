// 师资简介列表页面
Page({
  data: {
    teachersList: [
      {
        id: 'yinger',
        name: '莹儿',
        avatar: '../../images/yinger_avatar.jpg', 
      },
      {
        id: 'zhouzhou',
        name: '周周',
        avatar: '../../images/zhouzhou_avatar.jpg', 
      },
      {
        id: 'yaqin',
        name: '雅琴',
        avatar: '', // 照片待补充
      },
      {
        id: 'qiqi',
        name: '岐岐',
        avatar: '../../images/qiqi_avatar.jpg', 
      },
      {
        id: 'chengmin',
        name: '程敏',
        avatar: '../../images/chengmin_avatar.jpg', 
      }
    ]
  },

  onLoad(options) {
    console.log('师资简介列表页面加载', options);
  },

  onShow() {
    // 页面显示时的逻辑
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 跳转到老师详情页
  goToTeacherDetail(e) {
    const teacherId = e.currentTarget.dataset.teacherId;
    console.log('跳转到老师详情页:', teacherId);
    
    wx.navigateTo({
      url: `/pages/teacher-intro/teacher-intro?teacherId=${teacherId}`
    });
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '墨瑜伽 - 师资简介',
      path: '/pages/teacher-list/teacher-list',
      imageUrl: '../../images/logo.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '墨瑜伽 - 师资简介',
      query: '',
      imageUrl: '../../images/logo.png'
    };
  }
});
