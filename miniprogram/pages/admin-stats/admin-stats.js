Page({
  data: {
    loading: true,
    upcomingCourses: [], // 未发生课程
    completedCourses: [], // 已完成课程
    currentTab: 'upcoming' // 当前选中的tab：upcoming 或 completed
  },

  onLoad() {
    this.checkAdminPermission();
  },

  onShow() {
    // 每次显示时刷新数据
    if (!this.data.loading) {
      this.loadCourseStats();
    }
  },

  // 检查管理员权限
  checkAdminPermission() {
    const adminLoggedIn = wx.getStorageSync('admin_logged_in');
    if (!adminLoggedIn) {
      wx.showModal({
        title: '权限不足',
        content: '请先登录管理员账号',
        showCancel: false,
        success: () => {
          wx.redirectTo({
            url: '../admin-login/admin-login'
          });
        }
      });
      return false;
    }
    this.loadCourseStats();
    return true;
  },

  // 加载课程统计数据
  async loadCourseStats() {
    try {
      this.setData({ loading: true });

      // 先更新所有预约状态
      await wx.cloud.callFunction({
        name: 'updateAllBookingStatus'
      });

      // 并行获取未发生和已完成的课程数据
      const [upcomingResult, completedResult] = await Promise.all([
        wx.cloud.callFunction({ name: 'getCourseStats' }),
        wx.cloud.callFunction({ name: 'getCompletedCourses' })
      ]);

      console.log('未发生课程结果:', upcomingResult);
      console.log('已完成课程结果:', completedResult);

      let upcomingCourses = [];
      let completedCourses = [];

      // 处理未发生课程数据
      if (upcomingResult.result && upcomingResult.result.success) {
        upcomingCourses = (upcomingResult.result.courses || []).map(course => ({
          ...course,
          showDetail: false,
          dateStr: this.formatDate(course.date),
          timeStr: this.formatTime(course.startTime, course.endTime)
        }));
      }

      // 处理已完成课程数据
      if (completedResult.result && completedResult.result.success) {
        completedCourses = (completedResult.result.courses || []).map(course => ({
          ...course,
          showDetail: false,
          dateStr: this.formatDate(course.date),
          timeStr: this.formatTime(course.startTime, course.endTime)
        }));
      }

      console.log('处理后的未发生课程:', upcomingCourses);
      console.log('处理后的已完成课程:', completedCourses);

      this.setData({
        upcomingCourses: upcomingCourses,
        completedCourses: completedCourses,
        loading: false
      });

    } catch (error) {
      console.error('加载课程统计失败:', error);
      this.setData({ loading: false });
      
      wx.showToast({
        title: '加载失败: ' + error.message,
        icon: 'none',
        duration: 3000
      });
    }
  },

  // 切换tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
  },

  // 切换课程详情显示（统一处理）
  toggleCourseDetail(e) {
    const index = e.currentTarget.dataset.index;
    const { currentTab } = this.data;
    
    if (currentTab === 'upcoming') {
      const upcomingCourses = this.data.upcomingCourses;
      upcomingCourses[index].showDetail = !upcomingCourses[index].showDetail;
      this.setData({ upcomingCourses: upcomingCourses });
    } else {
      const completedCourses = this.data.completedCourses;
      completedCourses[index].showDetail = !completedCourses[index].showDetail;
      this.setData({ completedCourses: completedCourses });
    }
  },

  // 格式化日期
  formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 判断是今天、明天还是其他日期
    if (d.toDateString() === today.toDateString()) {
      return '今天';
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return '明天';
    } else {
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekday = weekdays[d.getDay()];
      return `${month}月${day}日 ${weekday}`;
    }
  },

  // 格式化时间
  formatTime(startTime, endTime) {
    if (!startTime) return '';
    
    const formatSingleTime = (timeStr) => {
      if (!timeStr) return '';
      // 修复iOS兼容性问题，使用斜杠格式
      const time = new Date(`2000/01/01 ${timeStr}`);
      if (isNaN(time.getTime())) {
        // 如果还是失败，直接解析时间字符串
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
          const hours = parseInt(parts[0], 10);
          const minutes = parseInt(parts[1], 10);
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        return timeStr; // 如果无法解析，直接返回原字符串
      }
      const hours = time.getHours();
      const minutes = time.getMinutes();
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const start = formatSingleTime(startTime);
    const end = formatSingleTime(endTime);
    
    return end ? `${start}-${end}` : start;
  },

  // 返回
  navigateBack() {
    wx.navigateBack();
  }
});
