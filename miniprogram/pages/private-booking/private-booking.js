// 私教预约页面
Page({
  data: {
    weekDays: [],
    selectedDate: '',
    selectedDateDisplay: '',
    availableTeachers: [],
    
    // 所有老师信息
    allTeachers: [
      {
        id: 'yinger',
        name: '莹儿老师',
        avatar: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/images/teacher_yinger-6c1741.png',
        specialties: ['产后修复', '体态调整', '女性调理'],
        price: 300
      },
      {
        id: 'zhouzhou',
        name: '周周老师',
        avatar: '',
        specialties: ['流瑜伽', '正位瑜伽', '哈他瑜伽'],
        price: 280
      },
      {
        id: 'yaqin',
        name: '雅琴老师',
        avatar: '',
        specialties: ['阴瑜伽', '冥想瑜伽', '理疗瑜伽'],
        price: 320
      },
      {
        id: 'qiqi',
        name: '岐岐老师',
        avatar: '',
        specialties: ['空中瑜伽', '力量瑜伽', '倒立专项'],
        price: 350
      },
      {
        id: 'chengmin',
        name: '程敏老师',
        avatar: '',
        specialties: ['体式精进', '后弯专项', '平衡体式'],
        price: 280
      }
    ],


  },

  onLoad(options) {
    console.log('私教预约页面加载', options);
    this.initWeekCalendar();
  },



  onShow() {
    // 页面显示时重新检查日历和加载数据
    this.checkAndUpdateWeekCalendar();
    
    // 检查是否需要刷新私教预约数据
    this.checkAndRefreshPrivateBookings();
  },

  // 初始化周日历
  initWeekCalendar() {
    const today = new Date();
    const weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date();
      currentDate.setDate(today.getDate() + i);
      
      const dateStr = this.formatDate(currentDate);
      const weekName = this.getWeekName(currentDate, i);
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      
      weekDays.push({
        date: dateStr,
        weekName: weekName,
        dateText: `${month}/${day}`
      });
    }
    
    // 默认选择今天
    const todayStr = this.formatDate(today);
    
    this.setData({
      weekDays,
      selectedDate: todayStr,
      selectedDateDisplay: this.getDateDisplay(today)
    });
    
    // 加载今天的可用老师
    this.loadAvailableTeachers(todayStr);
  },

  // 检查并更新周日历（如果跨天了）
  checkAndUpdateWeekCalendar() {
    const today = new Date();
    const todayStr = this.formatDate(today);
    const firstDayStr = this.data.weekDays.length > 0 ? this.data.weekDays[0].date : '';
    
    // 如果第一天不是今天，重新初始化日历
    if (firstDayStr !== todayStr) {
      console.log('检测到日期变化，更新日历以今天为起点');
      this.initWeekCalendar();
    }
  },

  // 检查并刷新私教预约数据
  checkAndRefreshPrivateBookings() {
    const app = getApp();
    if (app.globalData.needRefreshPrivateBookings) {
      console.log('检测到需要刷新私教预约数据');
      // 重置标记
      app.globalData.needRefreshPrivateBookings = false;
      
      // 如果有选择的日期，重新加载该日期的数据
      if (this.data.selectedDate) {
        this.loadAvailableTeachers(this.data.selectedDate);
      }
    }
  },

  // 获取星期几显示名称
  getWeekName(date, index) {
    const weekNames = ['日', '一', '二', '三', '四', '五', '六'];
    
    if (index === 0) {
      return '今天';
    } else if (index === 1) {
      return '明天';
    } else {
      return weekNames[date.getDay()];
    }
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 获取日期显示文本
  getDateDisplay(date) {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const dateStr = this.formatDate(date);
    const todayStr = this.formatDate(today);
    const tomorrowStr = this.formatDate(tomorrow);
    
    if (dateStr === todayStr) {
      return '今天';
    } else if (dateStr === tomorrowStr) {
      return '明天';
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日`;
    }
  },

  // 日期选择
  onDateSelect(e) {
    const date = e.currentTarget.dataset.date;
    const selectedDate = new Date(date);
    
    this.setData({
      selectedDate: date,
      selectedDateDisplay: this.getDateDisplay(selectedDate)
    });
    
    // 加载选中日期的可用老师
    this.loadAvailableTeachers(date);
  },

  // 加载指定日期的可用老师
  async loadAvailableTeachers(date) {
    console.log('加载日期的可用老师:', date);
    
    try {
      wx.showLoading({
        title: '加载中...'
      });

      // 调用云函数获取可用老师
      const result = await wx.cloud.callFunction({
        name: 'getAvailableTeachers',
        data: {
          date: date
        }
      });

      wx.hideLoading();

      if (result.result && result.result.success) {
        const availableTeachers = result.result.teachers || [];
        console.log('当日可用老师:', availableTeachers);
        
        this.setData({
          availableTeachers: availableTeachers
        });
      } else {
        console.error('获取可用老师失败:', result.result?.error);
        this.setData({
          availableTeachers: []
        });
      }

    } catch (error) {
      wx.hideLoading();
      console.error('加载可用老师失败:', error);
      this.setData({
        availableTeachers: []
      });
      
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 选择老师，跳转到时间段选择页面
  selectTeacher(e) {
    const teacher = e.currentTarget.dataset.teacher;
    const date = e.currentTarget.dataset.date;
    
    console.log('选择老师:', teacher);
    console.log('选择日期:', date);
    
    // 跳转到私教预约确认页面，传递老师和日期信息
    wx.navigateTo({
      url: `/pages/private-booking-confirm/private-booking-confirm?teacherId=${teacher.id}&teacherName=${teacher.name}&price=${teacher.price}&date=${date}&availableSlots=${JSON.stringify(teacher.availableSlots)}`
    });
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '墨瑜伽 - 私教预约',
      path: '/pages/private-booking/private-booking',
      imageUrl: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/logo.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '墨瑜伽 - 私教预约',
      query: '',
      imageUrl: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/logo.png'
    };
  }
}); 