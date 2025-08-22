Page({
  data: {
    isBooking: false,
    courseData: {
      id: '',
      courseName: '',
      teacherName: '',
      teacherAvatar: '',
      date: '',
      dateText: '',
      weekDay: '',
      startTime: '',
      endTime: '',
      description: '',
      creditsRequired: 1,
      maxCapacity: 20,
      minCapacity: 1,
      waitlistCount: 0,
      currentBookings: 0
    },
    userCredits: {
      group: 0,
      term: 0
    }
  },

  onLoad(options) {
    // 从参数中获取课程信息
    if (options.courseData) {
      try {
        const courseData = JSON.parse(decodeURIComponent(options.courseData));
        this.setData({
          courseData: this.formatCourseData(courseData)
        });
      } catch (error) {
        console.error('解析课程数据失败:', error);
        wx.showToast({
          title: '课程信息有误',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
        return;
      }
    }
    
    // 加载用户课时余额
    this.loadUserCredits();
  },

  // 格式化课程数据
  formatCourseData(courseData) {
    // 格式化日期
    const date = new Date(courseData.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateText = `${year}年 ${month}月 ${day}日`;
    
    // 获取星期
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[date.getDay()];
    
    return {
      ...courseData,
      dateText,
      weekDay
    };
  },

  // 加载用户课时余额
  async loadUserCredits() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getUserCredits'
      });
      
      if (result.result && result.result.success) {
        this.setData({
          userCredits: result.result.credits
        });
        console.log('用户课时余额:', result.result.credits);
      }
    } catch (error) {
      console.error('获取用户课时余额失败:', error);
    }
  },

  // 检查课时余额
  checkCreditsBalance() {
    const { courseData, userCredits } = this.data;
    const requiredCredits = courseData.creditsRequired || 1;
    
    // 检查团课次卡余额
    if (userCredits.group < requiredCredits) {
      const shortage = requiredCredits - userCredits.group;
      wx.showModal({
        title: '课时不足',
        content: `您的团课次卡余额为${userCredits.group}次，本课程需要${requiredCredits}次，还需要${shortage}次。请先购买课时。`,
        confirmText: '去购买',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 跳转到购买页面或联系客服
            wx.showToast({
              title: '请联系客服购买',
              icon: 'none'
            });
          }
        }
      });
      return false;
    }
    
    return true;
  },

  // 确认预约
  async confirmBooking() {
    if (this.data.isBooking) return;
    
    // 检查课时余额
    if (!this.checkCreditsBalance()) {
      return;
    }
    
    const { courseData } = this.data;
    
    // 显示确认对话框
    wx.showModal({
      title: '确认预约',
      content: `确定要预约${courseData.courseName}吗？\n将消耗${courseData.creditsRequired}次团课次卡`,
      success: async (res) => {
        if (res.confirm) {
          await this.processBooking();
        }
      }
    });
  },

  // 处理预约
  async processBooking() {
    this.setData({ isBooking: true });
    
    try {
      wx.showLoading({ title: '预约中...' });
      
      const { courseData } = this.data;
      
      // 调用预约云函数
      const result = await wx.cloud.callFunction({
        name: 'bookCourse',
        data: {
          scheduleId: courseData.id,
          courseName: courseData.courseName,
          date: courseData.date,
          startTime: courseData.startTime,
          endTime: courseData.endTime,
          teacherName: courseData.teacherName,
          creditsRequired: courseData.creditsRequired
        }
      });
      
      if (result.result && result.result.success) {
        wx.hideLoading();
        
        // 预约成功
        if (result.result.status === 'booked') {
          // 设置全局刷新标记
          const app = getApp();
          app.globalData.needRefreshCourses = true;
          
          // 预约成功后，提示用户订阅课程提醒
          this.showSubscribeMessageDialog(courseData);
          
        } else if (result.result.status === 'waitlist') {
          // 设置全局刷新标记
          const app = getApp();
          app.globalData.needRefreshCourses = true;
          
          wx.showModal({
            title: '加入等位成功',
            content: `课程已满，您已加入等位队列。\n当前排队位置：第${result.result.position}位`,
            showCancel: false,
            confirmText: '确定',
            success: () => {
              // 返回到课程列表页面
              wx.navigateBack({
                delta: 1
              });
            }
          });
        }
      } else {
        wx.hideLoading();
        wx.showModal({
          title: '预约失败',
          content: result.result.message || '预约失败，请重试',
          showCancel: false
        });
      }
    } catch (error) {
      console.error('预约失败:', error);
      wx.hideLoading();
      wx.showModal({
        title: '预约失败',
        content: '网络错误，请重试',
        showCancel: false
      });
    } finally {
      this.setData({ isBooking: false });
    }
  },

  // 显示订阅消息对话框
  showSubscribeMessageDialog(courseData) {
    wx.showModal({
      title: '预约成功',
      content: `${courseData.courseName}预约成功！\n已消耗${courseData.creditsRequired}次团课次卡\n\n是否开启课程4小时提前提醒？`,
      confirmText: '开启提醒',
      cancelText: '暂不开启',
      success: async (res) => {
        if (res.confirm) {
          // 用户选择开启提醒，请求订阅消息权限
          await this.requestSubscribeMessage(courseData);
        } else {
          // 用户选择不开启提醒，直接返回
          this.navigateBackAfterBooking();
        }
      }
    });
  },

  // 请求订阅消息权限
  async requestSubscribeMessage(courseData) {
    try {
      // 只请求4小时提醒模板权限
      const templateIds = [
        'r79vVscc3dDWZA7x98g-5eDEmwaAkFTbknr5x6v_2iY'  // 4小时提醒模板ID
      ];
      
      console.log('请求订阅消息权限...');
      
      const subscribeResult = await wx.requestSubscribeMessage({
        tmplIds: templateIds
      });
      
      console.log('订阅消息授权结果:', subscribeResult);
      
      // 处理授权结果
      let subscribedCount = 0;
      let subscribeMessages = [];
      
      templateIds.forEach((templateId) => {
        const status = subscribeResult[templateId];
        const reminderType = '4小时提醒';
        
        if (status === 'accept') {
          subscribedCount++;
          subscribeMessages.push(`✅ ${reminderType}`);
        } else if (status === 'acceptWithAudio') {
          subscribedCount++;
          subscribeMessages.push(`✅ ${reminderType}（含语音）`);
        } else if (status === 'acceptWithAlert') {
          subscribedCount++;
          subscribeMessages.push(`✅ ${reminderType}（含横幅）`);
        } else {
          subscribeMessages.push(`❌ ${reminderType}已拒绝`);
        }
      });
      
      // 显示授权结果
      if (subscribedCount > 0) {
        wx.showModal({
          title: '提醒设置成功',
          content: `已开启课程提醒：\n\n${subscribeMessages.join('\n')}\n\n我们会在课程开始前4小时提醒您！`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            this.navigateBackAfterBooking();
          }
        });
      } else {
        wx.showModal({
          title: '提醒设置',
          content: '您已拒绝接收课程提醒，可在"我的"-"设置"-"通知管理"中重新开启',
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            this.navigateBackAfterBooking();
          }
        });
      }
      
    } catch (error) {
      console.error('请求订阅消息失败:', error);
      
      // 订阅消息请求失败，仍然显示预约成功信息
      wx.showModal({
        title: '预约成功',
        content: `${courseData.courseName}预约成功！\n已消耗${courseData.creditsRequired}次团课次卡`,
        showCancel: false,
        confirmText: '确定',
        success: () => {
          this.navigateBackAfterBooking();
        }
      });
    }
  },

  // 预约完成后返回
  navigateBackAfterBooking() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 返回
  navigateBack() {
    wx.navigateBack();
  }
});