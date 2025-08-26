// 私教预约确认页面
Page({
  data: {
    teacherInfo: {
      id: '',
      name: '',
      avatar: '',
      price: 0
    },
    selectedDate: '',
    selectedDateDisplay: '',
    selectedTimeSlot: '',
    timeRange: '',
    bookingForm: {
      content: ''
    }
  },

  onLoad(options) {
    console.log('私教预约确认页面加载', options);
    
    // 获取传入的老师信息
    const teacherInfo = {
      id: options.teacherId || '',
      name: options.teacherName || '',
      avatar: this.getTeacherAvatar(options.teacherId),
      price: parseInt(options.price) || 0
    };

    // 获取传入的日期和选中的时间段
    const selectedDate = options.date || '';
    const availableSlots = options.availableSlots ? JSON.parse(options.availableSlots) : [];
    const selectedTimeSlot = availableSlots[0] || ''; // 取第一个时间段作为选中的时间段
    
    // 计算时间范围（开始时间+1小时）
    const timeRange = this.calculateTimeRange(selectedTimeSlot);
    
    this.setData({
      teacherInfo: teacherInfo,
      selectedDate: selectedDate,
      selectedDateDisplay: this.getDateDisplay(new Date(selectedDate)),
      selectedTimeSlot: selectedTimeSlot,
      timeRange: timeRange
    });
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

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 获取老师头像
  getTeacherAvatar(teacherId) {
    const avatarMap = {
      'yinger': '../../images/yinger.jpg',
      'zhouzhou': '',
      'yaqin': '',
      'qiqi': '',
      'chengmin': ''
    };
    return avatarMap[teacherId] || '';
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
      const weekNames = ['日', '一', '二', '三', '四', '五', '六'];
      const weekName = weekNames[date.getDay()];
      return `${month}月${day}日 (${weekName})`;
    }
  },

  // 时间段选择


  // 日期选择
  onDateChange(e) {
    this.setData({
      'bookingForm.date': e.detail.value
    });
  },

  // 时间选择
  onTimeChange(e) {
    this.setData({
      'bookingForm.time': e.detail.value
    });
  },

  // 课程选择
  // 内容输入
  onContentInput(e) {
    this.setData({
      'bookingForm.content': e.detail.value
    });
  },

  // 计算时间范围（开始时间+1小时）
  calculateTimeRange(startTime) {
    if (!startTime) return '';
    
    try {
      // 解析开始时间 (格式: HH:MM)
      const [hours, minutes] = startTime.split(':').map(num => parseInt(num));
      
      // 计算结束时间
      let endHours = hours + 1;
      let endMinutes = minutes;
      
      // 处理跨日情况
      if (endHours >= 24) {
        endHours = endHours - 24;
      }
      
      // 格式化时间
      const formatTime = (h, m) => {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      };
      
      const startTimeFormatted = formatTime(hours, minutes);
      const endTimeFormatted = formatTime(endHours, endMinutes);
      
      return `${startTimeFormatted}-${endTimeFormatted}`;
    } catch (error) {
      console.error('时间计算错误:', error);
      return startTime;
    }
  },

  // 确认预约
  async onConfirmBooking() {
    const { teacherInfo, selectedDate, selectedTimeSlot, bookingForm, timeRange } = this.data;
    
    // 验证表单
    if (!selectedDate) {
      wx.showToast({
        title: '缺少上课日期',
        icon: 'none'
      });
      return;
    }

    if (!selectedTimeSlot) {
      wx.showToast({
        title: '请选择上课时间段',
        icon: 'none'
      });
      return;
    }

    // 首先请求用户订阅消息（每次提交都需要订阅，因为是一次性消息）
    try {
      console.log('请求用户订阅私教预约成功通知...');
      
      // 显示订阅说明
      const confirmResult = await new Promise((resolve) => {
        wx.showModal({
          title: '预约成功通知',
          content: '为了及时通知您预约结果，请允许接收"预约成功通知"。\n\n注：由于微信政策限制，每次预约都需要重新授权。',
          showCancel: true,
          cancelText: '跳过',
          confirmText: '允许通知',
          success: (res) => {
            resolve(res.confirm);
          },
          fail: () => {
            resolve(false);
          }
        });
      });

      if (confirmResult) {
        // const subscribeResult = await wx.requestSubscribeMessage({
        //   tmplIds: ['Gh4le1pvgOkdxcgo0rlZYgeJH15oT6N8GMN9vbnkLVg'], // 私教预约成功通知模板ID
        // });
        
        // console.log('订阅消息请求结果:', subscribeResult);
        
        // // 检查订阅结果
        // const templateId = 'Gh4le1pvgOkdxcgo0rlZYgeJH15oT6N8GMN9vbnkLVg';
        // if (subscribeResult[templateId] === 'accept') {
        //   console.log('用户同意接收通知');
        //   wx.showToast({
        //     title: '通知设置成功',
        //     icon: 'success',
        //     duration: 1500
        //   });
        // } else {
        //   console.log('用户拒绝接收通知');
        // }
        wx.requestSubscribeMessage({
          tmplIds: ['Gh4le1pvgOkdxcgo0rlZYgeJH15oT6N8GMN9vbnkLVg'],
          success(res) {
            console.log("订阅返回结果:", res)
            /*
              例如：
              {
                "模板ID": "accept"    // 用户同意
                "模板ID": "reject"    // 用户拒绝
                "模板ID": "ban"       // 用户被后台封禁
              }
            */
            if (res['Gh4le1pvgOkdxcgo0rlZYgeJH15oT6N8GMN9vbnkLVg'] === 'accept') {
              console.log("✅ 用户同意订阅，可以发一次消息")
              // 这里再去调用云函数，触发发送
              wx.cloud.callFunction({
                name: 'sendSubscribeMsg',
                data: { tmplId: 'Gh4le1pvgOkdxcgo0rlZYgeJH15oT6N8GMN9vbnkLVg' }
              })
            } else {
              console.log("❌ 用户没有订阅，不能发送")
            }
          },
          fail(err) {
            console.error("订阅请求失败:", err)
          }
        })
      } else {
        console.log('用户选择跳过通知订阅');
      }
    } catch (subscribeError) {
      console.log('订阅请求失败:', subscribeError);
      // 不阻止预约流程，继续执行
    }

    wx.showLoading({
      title: '提交预约中...'
    });

    try {
      // 计算结束时间
      const [startHours, startMinutes] = selectedTimeSlot.split(':').map(num => parseInt(num));
      let endHours = startHours + 1;
      let endMinutes = startMinutes;
      
      // 处理跨日情况
      if (endHours >= 24) {
        endHours = endHours - 24;
      }
      
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
      
      // 获取用户openid
      const app = getApp();
      const openid = app.globalData.openid;
      const userInfo = app.globalData.userInfo;
      
      console.log('用户信息调试:', {
        openid: openid,
        userInfo: userInfo,
        globalData: app.globalData
      });
      
      if (!openid) {
        console.log('从全局数据中获取openid失败，尝试重新登录...');
        
        try {
          // 备用方案：重新调用login云函数获取openid
          const loginResult = await wx.cloud.callFunction({
            name: 'login'
          });
          
          if (loginResult.result && loginResult.result.openid) {
            console.log('重新获取openid成功:', loginResult.result.openid);
            app.globalData.openid = loginResult.result.openid;
            // 使用新获取的openid继续流程
            const newOpenid = loginResult.result.openid;
            
            // 继续执行预约流程
            await this.submitBookingWithOpenid(newOpenid, teacherInfo, selectedDate, selectedTimeSlot, endTime, timeRange, bookingForm);
            return;
          } else {
            throw new Error('登录失败');
          }
        } catch (loginError) {
          console.error('重新登录失败:', loginError);
          wx.hideLoading();
          wx.showModal({
            title: '用户信息错误',
            content: '请重新登录后再试',
            showCancel: false
          });
          return;
        }
      }

      // 调用提交预约方法
      await this.submitBookingWithOpenid(openid, teacherInfo, selectedDate, selectedTimeSlot, endTime, timeRange, bookingForm);

    } catch (error) {
      wx.hideLoading();
      console.error('预约流程出错:', error);
      wx.showModal({
        title: '预约失败',
        content: '系统错误，请重试',
        showCancel: false
      });
    }
  },

  // 获取用户课时信息
  async getUserCredits() {
    console.log('开始获取用户课时信息...');
    
    console.log('调用 getUserCredits 云函数...');
    const result = await wx.cloud.callFunction({
      name: 'getUserCredits'
    });
    
    console.log('云函数返回结果:', JSON.stringify(result, null, 2));
    
    if (result && result.result && result.result.success && result.result.credits) {
      const creditsData = result.result.credits;
      console.log('从云函数获取到课时数据:', creditsData);
      
      // 根据实际返回的数据结构进行转换
      const validatedData = {
        groupCredits: Number(creditsData.group) || 0,
        termCredits: Number(creditsData.term) || 0
      };
      console.log('验证后的课时数据:', validatedData);
      return validatedData;
    } else {
      console.error('云函数返回结构异常:', result);
      throw new Error('云函数返回数据结构不正确');
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: `预约${this.data.teacherInfo.name}的私教课程 - 墨瑜伽`,
      path: '/pages/private-booking/private-booking',
      imageUrl: this.data.teacherInfo.avatar || '../../images/logo.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: `预约${this.data.teacherInfo.name}的私教课程 - 墨瑜伽`,
      query: '',
      imageUrl: this.data.teacherInfo.avatar || '../../images/logo.png'
    };
  },

  // 使用指定openid提交预约
  async submitBookingWithOpenid(openid, teacherInfo, selectedDate, selectedTimeSlot, endTime, timeRange, bookingForm) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'submitPrivateBooking',
        data: {
          teacherId: teacherInfo.id,
          teacherName: teacherInfo.name,
          studentOpenid: openid,
          date: selectedDate,
          startTime: selectedTimeSlot,
          endTime: endTime,
          timeRange: timeRange,
          content: bookingForm.content,
          price: teacherInfo.price
        }
      });

      console.log('提交私教预约结果:', result);
      wx.hideLoading();

      if (result.result && result.result.success) {
        // 设置全局刷新标记，通知其他页面更新私教预约状态
        const app = getApp();
        app.globalData.needRefreshPrivateBookings = true;
        
        wx.showModal({
          title: '预约申请已提交',
          content: result.result.message,
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
      } else {
        wx.showModal({
          title: '预约失败',
          content: result.result?.message || '提交预约失败，请重试',
          showCancel: false
        });
      }
    } catch (error) {
      console.error('提交预约失败:', error);
      wx.hideLoading();
      wx.showModal({
        title: '预约失败',
        content: '网络错误，请重试',
        showCancel: false
      });
    }
  }
});
