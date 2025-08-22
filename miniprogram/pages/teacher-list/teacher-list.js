// 师资简介列表页面
Page({
  data: {
    teachersList: [
      {
        id: 'yinger',
        name: '莹儿',
        avatar: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/images/teacher_yinger-6c1741.png', // 已有照片
        specialtyTag: '产后调理专家'
      },
      {
        id: 'zhouzhou',
        name: '周周',
        avatar: '', // 照片待补充
        specialtyTag: '流瑜伽导师'
      },
      {
        id: 'yaqin',
        name: '雅琴',
        avatar: '', // 照片待补充
        specialtyTag: '阴瑜伽专家'
      },
      {
        id: 'qiqi',
        name: '岐岐',
        avatar: '', // 照片待补充
        specialtyTag: '空中瑜伽导师'
      },
      {
        id: 'chengmin',
        name: '程敏',
        avatar: '', // 照片待补充
        specialtyTag: '体式精进导师'
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
      imageUrl: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/logo.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '墨瑜伽 - 师资简介',
      query: '',
      imageUrl: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/logo.png'
    };
  }
});
