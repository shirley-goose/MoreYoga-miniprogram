// 老师课程页面
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
    console.log('我的课程页面加载');
    this.loadTeacherInfo();
    this.loadCourses();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadCourses();
  },

  // 返回上一页
  goBack() {
    console.log('点击返回按钮');
    // 获取页面栈信息
    const pages = getCurrentPages();
    console.log('当前页面栈长度:', pages.length);
    
    if (pages.length > 1) {
      // 有上一页，正常返回
      wx.navigateBack({
        fail: (err) => {
          console.error('返回失败:', err);
          // 返回失败时跳转到老师工作台
          wx.redirectTo({
            url: '/pages/teacher-dashboard/teacher-dashboard'
          });
        }
      });
    } else {
      // 没有上一页，直接跳转到老师工作台
      console.log('没有上一页，跳转到老师工作台');
      wx.redirectTo({
        url: '/pages/teacher-dashboard/teacher-dashboard'
      });
    }
  },

  // 加载老师信息
  loadTeacherInfo() {
    try {
      console.log('开始加载老师信息...');
      
      // 检查本地存储的老师信息
      const teacherInfo = wx.getStorageSync('teacher_info');
      console.log('从本地存储获取的老师信息:', teacherInfo);
      
      if (teacherInfo && teacherInfo.id) {
        this.setData({ teacherInfo });
        console.log('加载老师信息成功:', teacherInfo);
      } else {
        console.error('未找到老师信息或信息不完整');
        
        // 调试：显示本地存储中的所有相关数据
        try {
          const allKeys = wx.getStorageInfoSync();
          console.log('本地存储的所有key:', allKeys.keys);
          
          // 检查其他可能的老师信息存储key
          const adminInfo = wx.getStorageSync('admin_info');
          console.log('admin_info:', adminInfo);
          
          const adminToken = wx.getStorageSync('admin_token');
          console.log('admin_token:', adminToken);
          
        } catch (e) {
          console.error('获取存储信息失败:', e);
        }
        
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

  // 加载课程
  async loadCourses() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const { teacherInfo } = this.data;
      console.log('开始加载课程，老师信息:', teacherInfo);
      
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

      // 调用云函数获取未来课程
      const result = await wx.cloud.callFunction({
        name: 'getTeacherCourses',
        data: {
          teacherId: teacherInfo.id,
          type: 'upcoming' // 只获取未来的课程
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
          console.log('私教课程详细信息检查:', privateCourses.map(course => ({
            _id: course._id,
            studentName: course.studentName,
            studentPhone: course.studentPhone,
            date: course.date,
            timeRange: course.timeRange,
            studentOpenid: course.studentOpenid,
            userId: course.userId,
            userID: course.userID
          })));
        }
        
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
        console.error('获取课程失败:', result.result?.message);
        console.error('完整错误信息:', result);
        wx.showModal({
          title: '加载失败',
          content: result.result?.message || '未知错误',
          showCancel: false
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('加载课程失败:', error);
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
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      
      let dateDisplay;
      if (date.toDateString() === today.toDateString()) {
        dateDisplay = '今天';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        dateDisplay = '明天';
      } else {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
        dateDisplay = `${month}月${day}日 ${weekDay}`;
      }

      // 处理预约状态文本（过滤掉已取消的记录）
      const validBookings = (course.bookings || [])
        .filter(booking => booking.status !== 'cancelled') // 过滤掉已取消的
        .map(booking => ({
          ...booking,
          statusText: this.getBookingStatusText(booking.status)
        }));

      return {
        ...course,
        dateDisplay,
        bookings: validBookings,
        bookedCount: validBookings.filter(b => b.status === 'booked' || b.status === 'confirmed').length,
        showDetail: false // 用于控制展开/收起状态
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
    
    // 切换当前课程的展开状态
    groupCourses[index].showDetail = !groupCourses[index].showDetail;
    
    this.setData({
      groupCourses: groupCourses
    });
    
    console.log('切换团课详情:', {
      index,
      courseName: groupCourses[index].courseName,
      showDetail: groupCourses[index].showDetail
    });
  },

  // 标记私教课程为完成
  async markAsCompleted(e) {
    const courseId = e.currentTarget.dataset.id;
    
    console.log('标记私教课程完成:', { courseId });

    wx.showModal({
      title: '确认操作',
      content: '确定要标记这节私教课程为已完成吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中...' });

            const result = await wx.cloud.callFunction({
              name: 'markPrivateCompleted',
              data: {
                bookingId: courseId
              }
            });

            console.log('标记完成结果:', result);
            wx.hideLoading();

            if (result.result && result.result.success) {
              wx.showToast({
                title: '标记完成成功',
                icon: 'success'
              });

              // 重新加载课程数据
              await this.loadCourses();
            } else {
              wx.showModal({
                title: '操作失败',
                content: result.result?.message || '标记失败',
                showCancel: false
              });
            }
          } catch (error) {
            console.error('标记私教课程完成失败:', error);
            wx.hideLoading();
            wx.showModal({
              title: '网络错误',
              content: '请检查网络连接后重试',
              showCancel: false
            });
          }
        }
      }
    });
  },

  // 更新课程状态
  async updateCourseStatus(courseId, status) {
    try {
      wx.showLoading({ title: '处理中...' });

      const result = await wx.cloud.callFunction({
        name: 'updatePrivateCourseStatus',
        data: {
          courseId: courseId,
          status: status
        }
      });

      wx.hideLoading();

      if (result.result && result.result.success) {
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
        
        // 刷新列表
        this.loadCourses();
      } else {
        wx.showModal({
          title: '更新失败',
          content: result.result?.message || '操作失败，请重试',
          showCancel: false
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('更新课程状态失败:', error);
      wx.showModal({
        title: '更新失败',
        content: '网络错误，请重试',
        showCancel: false
      });
    }
  },


});
