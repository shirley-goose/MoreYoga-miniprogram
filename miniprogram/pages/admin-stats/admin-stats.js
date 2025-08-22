Page({
  data: {
    loading: true,
    courseList: []
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

      // 调用云函数获取未发生的课程数据
      const result = await wx.cloud.callFunction({
        name: 'getCourseStats'
      });

      console.log('云函数完整返回结果:', result);

      if (result.result && result.result.success) {
        const courseList = result.result.courses || [];
        
        console.log('获取到的课程列表:', courseList);
        console.log('调试信息:', result.result.debug);
        
        // 处理数据格式
        const processedList = courseList.map(course => ({
          ...course,
          showDetail: false, // 默认不展开
          dateStr: this.formatDate(course.date),
          timeStr: this.formatTime(course.startTime, course.endTime)
        }));

        console.log('处理后的课程列表:', processedList);

        // 如果没有数据，显示详细的调试信息
        if (processedList.length === 0) {
          const debug = result.result.debug || {};
          wx.showModal({
            title: '调试信息',
            content: `数据库总预约: ${debug.allBookingsCount || 0}\n符合状态预约: ${debug.totalBookings || 0}\n状态列表: ${debug.statusList?.join(',') || '无'}\n成功处理: ${debug.processedCount || 0}\n时间过滤跳过: ${debug.skippedByTime || 0}\n用户未找到: ${debug.userNotFound || 0}\n最终课程: ${debug.finalProcessed || 0}`,
            showCancel: false
          });
        }

        this.setData({
          courseList: processedList,
          loading: false
        });
      } else {
        console.error('云函数返回失败:', result.result);
        throw new Error(result.result?.error || '获取数据失败');
      }

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

  // 切换课程详情显示
  toggleCourseDetail(e) {
    const index = e.currentTarget.dataset.index;
    const courseList = this.data.courseList;
    
    courseList[index].showDetail = !courseList[index].showDetail;
    
    this.setData({
      courseList: courseList
    });
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
