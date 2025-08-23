// 老师已结课程页面
Page({
  data: {
    currentTab: 'private',
    privateCourses: [],
    groupCourses: [],
    teacherInfo: {
      id: '',
      name: ''
    }
  },

  onLoad() {
    console.log('已结课程页面加载');
    this.loadTeacherInfo();
    this.loadArchivedCourses();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadArchivedCourses();
  },

  // 返回上一页
  goBack() {
    console.log('点击返回按钮');
    const pages = getCurrentPages();
    
    if (pages.length > 1) {
      wx.navigateBack({
        fail: (err) => {
          console.error('返回失败:', err);
          wx.redirectTo({
            url: '/pages/teacher-dashboard/teacher-dashboard'
          });
        }
      });
    } else {
      wx.redirectTo({
        url: '/pages/teacher-dashboard/teacher-dashboard'
      });
    }
  },

  // 加载老师信息
  loadTeacherInfo() {
    try {
      console.log('开始加载老师信息...');
      
      const teacherInfo = wx.getStorageSync('teacher_info');
      console.log('从本地存储获取的老师信息:', teacherInfo);
      
      if (teacherInfo && teacherInfo.id) {
        this.setData({ teacherInfo });
        console.log('加载老师信息成功:', teacherInfo);
      } else {
        console.error('未找到老师信息或信息不完整');
        wx.showModal({
          title: '提示',
          content: '老师信息缺失，请重新登录',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              wx.redirectTo({
                url: '/pages/admin-login/admin-login'
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('加载老师信息失败:', error);
    }
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
  },

  // 加载已结课程
  async loadArchivedCourses() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const { teacherInfo } = this.data;
      console.log('开始加载已结课程，老师信息:', teacherInfo);
      
      if (!teacherInfo || !teacherInfo.id) {
        console.error('缺少老师信息');
        wx.hideLoading();
        wx.showModal({
          title: '错误',
          content: '老师信息缺失，请重新登录',
          showCancel: false
        });
        return;
      }

      console.log('调用getTeacherCourses云函数，teacherId:', teacherInfo.id);

      // 调用云函数获取已结课程
      const result = await wx.cloud.callFunction({
        name: 'getTeacherCourses',
        data: {
          teacherId: teacherInfo.id,
          type: 'archived' // 指定获取已结课程
        }
      });

      console.log('云函数返回结果:', result);
      wx.hideLoading();

      if (result.result && result.result.success) {
        const { privateCourses, groupCourses } = result.result;
        
        console.log('云函数返回的原始团课数据:', groupCourses);
        console.log('云函数返回的原始私教数据:', privateCourses);
        
        const processedGroupCourses = this.processGroupCourses(groupCourses || []);
        console.log('处理后的团课数据:', processedGroupCourses);
        
        this.setData({
          privateCourses: privateCourses || [],
          groupCourses: processedGroupCourses
        });

        console.log('设置页面数据完成:', {
          private: privateCourses?.length || 0,
          group: processedGroupCourses?.length || 0
        });
        
        // 显示加载结果
        wx.showToast({
          title: `加载成功: 私教${privateCourses?.length || 0}节, 团课${processedGroupCourses?.length || 0}节`,
          icon: 'none',
          duration: 3000
        });
      } else {
        console.error('获取已结课程失败:', result.result?.message);
        wx.showModal({
          title: '加载失败',
          content: result.result?.message || '未知错误',
          showCancel: false
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('加载已结课程失败:', error);
      wx.showModal({
        title: '网络错误', 
        content: `错误详情: ${error.message}`,
        showCancel: false
      });
    }
  },

  // 处理团课数据
  processGroupCourses(groupCourses) {
    return groupCourses.map(course => {
      // 格式化日期显示
      const date = new Date(course.date);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
      const dateDisplay = `${month}月${day}日 ${weekDay}`;

      // 处理预约状态文本（过滤掉已取消的记录）
      const validBookings = (course.bookings || [])
        .filter(booking => booking.status !== 'cancelled')
        .map(booking => ({
          ...booking,
          statusText: this.getBookingStatusText(booking.status)
        }));

      return {
        ...course,
        dateDisplay,
        bookings: validBookings,
        bookedCount: validBookings.filter(b => b.status === 'booked' || b.status === 'confirmed' || b.status === 'completed').length,
        showDetail: false
      };
    });
  },

  // 获取预约状态文本
  getBookingStatusText(status) {
    const statusMap = {
      'booked': '已预约',
      'confirmed': '已确认',
      'cancelled': '已取消',
      'completed': '已完成'
    };
    return statusMap[status] || status;
  },

  // 切换团课详情展开/收起
  toggleGroupCourseDetail(e) {
    const index = e.currentTarget.dataset.index;
    const groupCourses = [...this.data.groupCourses];
    
    groupCourses[index].showDetail = !groupCourses[index].showDetail;
    
    this.setData({
      groupCourses: groupCourses
    });
    
    console.log('切换团课详情:', {
      index,
      courseName: groupCourses[index].courseName,
      showDetail: groupCourses[index].showDetail
    });
  }
});
