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
        
        // 检查私教数据的学员信息
        if (privateCourses && privateCourses.length > 0) {
          console.log('已结私教课程详细信息检查:', privateCourses.map(course => ({
            _id: course._id,
            studentName: course.studentName,
            studentPhone: course.studentPhone,
            date: course.date,
            timeRange: course.timeRange,
            completedAt: course.completedAt,
            studentOpenid: course.studentOpenid,
            userId: course.userId,
            userID: course.userID
          })));
        }
        
        const processedGroupCourses = this.processGroupCourses(groupCourses || []);
        console.log('处理后的团课数据:', processedGroupCourses);
        
        // 处理私教课程数据
        const processedPrivateCourses = (privateCourses || []).map(course => {
          // 处理状态显示
          let displayStatus = course.status;
          let statusText = '';
          let statusClass = '';
          
          if (course.status === 'completed') {
            displayStatus = 'completed';
            statusText = '已完成';
            statusClass = 'completed';
          } else if (course.status === 'cancelled') {
            displayStatus = 'cancelled';
            statusText = '已取消';
            statusClass = 'cancelled';
          } else {
            // 其他状态（理论上已结课程应该只有completed和cancelled）
            displayStatus = course.status;
            statusText = course.status;
            statusClass = 'other';
          }
          
          // 格式化取消时间（仅对已取消的课程）
          let formattedCancelTime = null;
          if (course.status === 'cancelled' && course.cancelProcessTime) {
            formattedCancelTime = this.formatCompleteTime(course.cancelProcessTime);
          }
          
          return {
            ...course,
            completedAtDisplay: this.formatCompleteTime(course.completedAt),
            isCompleted: course.status === 'completed',
            displayStatus,
            statusText,
            statusClass,
            formattedCancelTime
          };
        });

        this.setData({
          privateCourses: processedPrivateCourses,
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

      // 处理预约状态文本
      const processedBookings = (course.bookings || []).map(booking => ({
        ...booking,
        statusText: this.getBookingStatusText(booking.status),
        cancelTimeDisplay: booking.cancelTime ? this.formatCancelTime(booking.cancelTime) : null
      }));

      return {
        ...course,
        dateDisplay,
        bookings: processedBookings,
        showDetail: course.showDetail || false
      };
    });
  },

  // 获取预约状态文本
  getBookingStatusText(status) {
    const statusMap = {
      'booked': '已预约',
      'confirmed': '已确认',
      'cancelled': '已取消',
      'completed': '已完成',
      'done': '已完成',
      'fail': '等位失败',
      'waitlist': '等位中'
    };
    return statusMap[status] || status;
  },

  // 格式化取消时间（与admin页面格式一致）
  formatCancelTime(cancelTime) {
    if (!cancelTime) return null;
    
    try {
      const date = new Date(cancelTime);
      if (isNaN(date.getTime())) {
        return cancelTime; // 如果无法解析，返回原字符串
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    } catch (error) {
      console.error('格式化取消时间失败:', error);
      return cancelTime;
    }
  },

  // 格式化完成时间
  formatCompleteTime(completeTime) {
    if (!completeTime || completeTime === '未记录') return '未记录';
    const date = new Date(completeTime);
    if (isNaN(date.getTime())) return '未记录';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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
