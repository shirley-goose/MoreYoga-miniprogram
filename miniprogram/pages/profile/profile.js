Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    practiceYears: 1, // 待补充
    classCredits: {
      group: 0,
      term: 0
    },
    footprints: [],
    schedule: [],
    bookingHistory: [], // 预约历史
    privateBookings: [], // 私教预约
    loading: false,
    // 简化登录流程 - 只获取手机号和头像
    loginStep: '', // 当前登录步骤：'login'
    defaultAvatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0', // 默认头像
    avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0', // 当前头像
    tempAvatarUrl: '', // 临时头像
    phoneNumber: '' // 手机号
  },

  async onLoad() {
    this.generateFootprints();
    await this.checkLoginStatus();
  },
  
  // 检查用户登录状态
  async checkLoginStatus() {
    try {
      console.log('检查用户登录状态...');
      
      // 调用 login 云函数获取当前用户的 openid
      const loginResult = await wx.cloud.callFunction({
        name: 'login'
      });
      
      console.log('login 云函数返回:', loginResult.result);
      
      if (loginResult.result && loginResult.result.openid) {
        console.log('用户已登录，openid:', loginResult.result.openid);
        // 用户已登录，加载用户数据
        await this.loadUserData();
      } else {
        console.log('用户未登录');
        // 用户未登录，显示登录界面
        this.setData({
          hasUserInfo: false
        });
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      this.setData({
        hasUserInfo: false
      });
    }
  },

  // 加载用户数据
  async loadUserData() {
    this.setData({ loading: true });
    
    try {
      // 并行加载用户信息
      await Promise.all([
        this.loadUserCredits(),
        this.loadUserBookings(),
        this.loadUpcomingSchedule(),
        this.loadPrivateBookings()
      ]);
    } catch (error) {
      console.error('加载用户数据失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载用户次卡余额
  async loadUserCredits() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getUserCredits'
      });
      
      if (result.result && result.result.success) {
        // 合并用户信息，保持已有的phoneNumber和avatarUrl
        const currentUserInfo = this.data.userInfo;
        const newUserInfo = result.result.user;
        
        this.setData({ 
          classCredits: result.result.credits,
          userInfo: {
            ...newUserInfo,
            // 统一使用phoneNumber字段，兼容旧的phone字段
            phoneNumber: currentUserInfo.phoneNumber || newUserInfo.phoneNumber,
            avatarUrl: currentUserInfo.avatarUrl || newUserInfo.avatarUrl
          },
          hasUserInfo: true
        });
        
        console.log('loadUserCredits 更新后的 userInfo:', this.data.userInfo);
      }
    } catch (error) {
      console.error('获取用户次卡余额失败:', error);
    }
  },

  // 加载用户预约记录
  async loadUserBookings() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getUserBookings',
        data: { limit: 10 }
      });
      
      if (result.result && result.result.success) {
        this.setData({ 
          bookingHistory: result.result.data 
        });
      }
    } catch (error) {
      console.error('获取用户预约记录失败:', error);
    }
  },

  // 加载即将到来的课程安排
  async loadUpcomingSchedule() {
    try {
      console.log('开始加载用户预约记录...');
      
      const result = await wx.cloud.callFunction({
        name: 'getUserBookings',
        data: { 
          limit: 10 // 增加查询数量以确保有足够的未来课程
        }
      });
      
      console.log('getUserBookings 返回结果:', result);
      
      if (result.result && result.result.success) {
        console.log('原始预约数据:', result.result.data);
        
        const now = new Date();
        const upcomingClasses = result.result.data
          .filter(booking => {
            // 显示已预约的和等位的课程
            if (booking.status !== 'booked' && booking.status !== 'waitlist') return false;
            
            if (!booking.schedule) {
              console.log('预约记录缺少schedule信息:', booking);
              return false;
            }
            
            // 只显示未开始的课程
            const classStartTime = new Date(`${booking.schedule.date}T${booking.schedule.startTime}:00`);
            const isFuture = classStartTime > now;
            
            console.log('课程时间检查:', {
              date: booking.schedule.date,
              startTime: booking.schedule.startTime,
              classStartTime: classStartTime.toISOString(),
              now: now.toISOString(),
              isFuture
            });
            
            return isFuture;
          })
          .map(booking => {
            const classDateTime = new Date(`${booking.schedule.date}T${booking.schedule.startTime}:00`);
            const classEndTime = new Date(`${booking.schedule.date}T${booking.schedule.endTime}:00`);
            const hoursDiff = (classDateTime - now) / (1000 * 60 * 60);
            
            // 判断课程是否已结束
            const isEnded = classEndTime < now;
            
            const courseItem = {
              id: booking._id,
              courseName: booking.courseName || booking.schedule.courseName || '瑜伽课程',
              teacherName: booking.teacherName || booking.schedule.teacherName || '老师',
              date: booking.schedule.date,
              time: `${booking.schedule.startTime}-${booking.schedule.endTime}`,
              courseImage: '../../images/background.png', // 使用默认背景图
              canCancel: !isEnded && (booking.status === 'waitlist' || hoursDiff > 1), // 等位可以随时取消，已预约的需要距离开始时间超过1小时
              isEnded: isEnded,
              bookingId: booking._id,
              scheduleId: booking.scheduleId,
              status: booking.status, // 添加预约状态
              position: booking.position || null, // 等位位置
              waitingAhead: booking.waitingAhead || 0, // 前面等位人数
              isWaitlist: booking.status === 'waitlist' // 是否为等位
            };
            
            console.log('处理后的课程项:', courseItem);
            return courseItem;
          })
          .sort((a, b) => {
            // 按日期和时间排序
            const dateA = new Date(`${a.date}T${a.time.split('-')[0]}:00`);
            const dateB = new Date(`${b.date}T${b.time.split('-')[0]}:00`);
            return dateA - dateB;
          });
          
        console.log('最终的即将到来的课程:', upcomingClasses);
        this.setData({ schedule: upcomingClasses });
      } else {
        console.log('getUserBookings 返回失败或无数据');
        this.setData({ schedule: [] });
      }
    } catch (error) {
      console.error('获取即将到来的课程失败:', error);
      this.setData({ schedule: [] });
    }
  },

  // 计算练龄
  calculatePracticeYears() {
    // 这里可以根据用户注册时间或首次上课时间计算
    // 暂时使用模拟数据
    const registrationDate = this.data.userInfo.registrationDate;
    if (registrationDate) {
      const years = Math.floor((new Date() - new Date(registrationDate)) / (365 * 24 * 60 * 60 * 1000));
      this.setData({ practiceYears: Math.max(1, years) });
    }
  },

  // 加载私教预约
  async loadPrivateBookings() {
    try {
      console.log('开始加载私教预约记录...');
      
      const result = await wx.cloud.callFunction({
        name: 'getUserPrivateBookings'
      });
      
      console.log('getUserPrivateBookings 返回结果:', result);
      
      if (result.result && result.result.success) {
        const now = new Date();
        const privateBookings = result.result.data.map(booking => {
          // 解析课程时间
          const classStartTime = new Date(`${booking.date}T${booking.startTime}:00`);
          const isEnded = classStartTime < now;
          
          // 计算是否可以取消 (距开始时间1小时以上)
          const oneHourFromNow = new Date(now.getTime() + 1 * 60 * 60 * 1000);
          const canCancel = classStartTime > oneHourFromNow && booking.status !== 'cancelled';
          
          // 处理取消申请状态显示
          let displayStatus = booking.status;
          if (booking.cancelRequestStatus === 'pending') {
            displayStatus = 'cancel-pending'; // 取消申请中
          } else if (booking.cancelRequestStatus === 'approved') {
            displayStatus = 'cancelled'; // 已取消
          } else if (booking.cancelRequestStatus === 'rejected') {
            displayStatus = 'confirmed'; // 拒绝取消，恢复为已确认
          }
          
          return {
            ...booking,
            isEnded,
            canCancel,
            displayStatus
          };
        });
        
        // 按时间排序，最近的在前
        privateBookings.sort((a, b) => {
          const timeA = new Date(`${a.date}T${a.startTime}:00`);
          const timeB = new Date(`${b.date}T${b.startTime}:00`);
          return timeA - timeB;
        });
        
        // 过滤掉已结束的课程，只显示未来和当天的课程
        const upcomingPrivateBookings = privateBookings.filter(booking => !booking.isEnded);
        
        console.log('处理后的私教预约:', privateBookings);
        console.log('即将到来的私教预约:', upcomingPrivateBookings);
        this.setData({ privateBookings: upcomingPrivateBookings });
      } else {
        console.log('getUserPrivateBookings 返回失败或无数据');
        this.setData({ privateBookings: [] });
      }
    } catch (error) {
      console.error('获取私教预约失败:', error);
      this.setData({ privateBookings: [] });
    }
  },
  // ========== 登录流程控制 ==========
  


  // 取消登录
  cancelLogin() {
    this.setData({
      loginStep: '',
      tempAvatarUrl: '',
      phoneNumber: '',
      avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
    });
  },

  // 头像选择回调 - 仅更新头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    console.log('头像选择成功:', avatarUrl);
    
    this.setData({
      avatarUrl,
      tempAvatarUrl: avatarUrl
    });
    
    // 头像选择成功后，如果有手机号就完成登录
    if (this.data.phoneNumber) {
      this.completeWechatLogin();
    } else {
      wx.showToast({
        title: '头像选择成功',
        icon: 'success'
      });
    }
  },

  // 完整的微信登录流程
  async completeWechatLogin() {
    if (!this.data.avatarUrl || !this.data.phoneNumber) {
      wx.showToast({
        title: '请完成头像选择和手机号验证',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '登录中...' });

    try {
      console.log('=== 开始微信登录流程 ===');
      console.log('当前头像URL:', this.data.avatarUrl);
      console.log('当前手机号:', this.data.phoneNumber);
      
      // 第一步：调用 wx.login() 获取临时登录凭证 code
      console.log('1. 获取微信登录凭证...');
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });
      
      console.log('微信登录凭证获取成功:', loginRes.code);
      
      // 第二步：上传头像到云存储
      let avatarCloudPath = this.data.avatarUrl;
      try {
        console.log('2. 开始上传头像...');
        avatarCloudPath = await this.uploadAvatar(this.data.avatarUrl);
        console.log('头像上传成功，云端路径:', avatarCloudPath);
      } catch (uploadError) {
        console.warn('头像上传失败，使用临时路径:', uploadError);
        console.log('使用临时头像路径:', avatarCloudPath);
      }
      
      // 第三步：调用云函数完成用户注册/登录
      const registerData = {
        code: loginRes.code, // 传递微信登录凭证
        nickName: '', // 不使用昵称
        avatarUrl: avatarCloudPath,
        phoneNumber: this.data.phoneNumber
      };
      
      console.log('3. 发送到registerUser云函数的数据:', registerData);
      
      const registerResult = await wx.cloud.callFunction({
        name: 'registerUser',
        data: registerData
      });
      
      console.log('registerUser 云函数完整返回结果:', JSON.stringify(registerResult, null, 2));
      
      if (registerResult.result && registerResult.result.success) {
        console.log('云函数执行成功，处理结果...');
        console.log('返回的用户数据:', registerResult.result.user);
        
        // 使用云函数返回的用户数据
        const cloudUserData = registerResult.result.user;
        
        this.setData({
          userInfo: {
            nickName: cloudUserData.nickName || '',
            avatarUrl: cloudUserData.avatarUrl || avatarCloudPath,
            phoneNumber: cloudUserData.phoneNumber || this.data.phoneNumber,
            openid: cloudUserData.openid
          },
          hasUserInfo: true,
          loginStep: '',
          tempAvatarUrl: ''
          // 保持phoneNumber不变，这样界面可以继续显示
        });
        
        console.log('界面数据更新完成:', this.data.userInfo);
        
        wx.hideLoading();
        wx.showToast({
          title: registerResult.result.message || '登录成功',
          icon: 'success'
        });
        
        // 重新加载用户数据
        console.log('开始重新加载用户数据...');
        await this.loadUserData();
        
      } else {
        console.error('云函数执行失败:', registerResult.result);
        wx.hideLoading();
        wx.showToast({
          title: registerResult.result.message || '登录失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('登录失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'error'
      });
    }
  },

  // 手机号验证回调
  async onGetPhoneNumber(e) {
    console.log('手机号授权回调:', e.detail);
    
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      try {
        wx.showLoading({ title: '验证中...' });
        
        // 准备参数
        const params = {};
        if (e.detail.cloudID) {
          params.cloudID = e.detail.cloudID;
        }
        if (e.detail.code) {
          params.code = e.detail.code;
        }
        if (e.detail.encryptedData) {
          params.encryptedData = e.detail.encryptedData;
        }
        if (e.detail.iv) {
          params.iv = e.detail.iv;
        }
        
        console.log('发送到云函数的参数:', params);
        
        // 调用云函数解析手机号
        const result = await wx.cloud.callFunction({
          name: 'getPhoneNumber',
          data: params
        });

        console.log('云函数返回结果:', result);
        console.log('云函数详细结果:', JSON.stringify(result.result, null, 2));
        wx.hideLoading();

        if (result.result && result.result.success) {
          this.setData({
            phoneNumber: result.result.phoneNumber
          });
          
          wx.showToast({
            title: '手机号验证成功',
            icon: 'success'
          });
          
          // 手机号验证成功后，如果有头像就完成登录
          if (this.data.avatarUrl && this.data.avatarUrl !== this.data.defaultAvatarUrl) {
            this.completeWechatLogin();
          } else {
            wx.showToast({
              title: '手机号验证成功，请选择头像',
              icon: 'success'
            });
          }
        } else {
          console.error('手机号验证失败:', result.result);
          wx.showModal({
            title: '手机号验证失败',
            content: result.result.message || '请检查网络连接或联系客服',
            showCancel: false
          });
        }
      } catch (error) {
        console.error('获取手机号失败:', error);
        wx.hideLoading();
        wx.showModal({
          title: '获取手机号失败',
          content: '网络错误，请重试',
          showCancel: false
        });
      }
    } else if (e.detail.errMsg === 'getPhoneNumber:fail user deny') {
      wx.showToast({
        title: '需要验证手机号才能继续',
        icon: 'none'
      });
    } else {
      console.error('手机号授权失败:', e.detail.errMsg);
      wx.showToast({
        title: '手机号授权失败',
        icon: 'none'
      });
    }
  },



  // 完成登录流程
  async completeLogin() {
    console.log('completeLogin 开始执行');
    console.log('注册数据检查:', {
      tempNickname: this.data.tempNickname,
      phoneNumber: this.data.phoneNumber,
      avatarUrl: this.data.avatarUrl
    });
    
    if (!this.data.tempNickname.trim() || !this.data.phoneNumber || !this.data.avatarUrl) {
      console.log('数据验证失败');
      wx.showToast({
        title: '请完善所有信息',
        icon: 'none'
      });
      return;
    }

    console.log('开始注册流程');
    wx.showLoading({ title: '注册中...' });

    try {
      // 上传头像到云存储（如果失败，会自动使用默认头像）
      let avatarCloudPath = this.data.avatarUrl;
      try {
        avatarCloudPath = await this.uploadAvatar(this.data.avatarUrl);
      } catch (uploadError) {
        console.warn('头像上传失败，使用默认头像:', uploadError);
        avatarCloudPath = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';
      }
      
      // 注册用户
      console.log('调用 registerUser 云函数，参数:', {
        nickName: this.data.tempNickname.trim(),
        avatarUrl: avatarCloudPath,
        phoneNumber: this.data.phoneNumber
      });
      
      const registerResult = await wx.cloud.callFunction({
        name: 'registerUser',
        data: {
          nickName: this.data.tempNickname.trim(),
          avatarUrl: avatarCloudPath,
          phoneNumber: this.data.phoneNumber
        }
      });
      
      console.log('registerUser 云函数返回结果:', registerResult);
      
      if (registerResult.result && registerResult.result.success) {
        console.log('注册成功，更新界面状态');
        this.setData({
          userInfo: {
            nickName: this.data.tempNickname.trim(),
            avatarUrl: avatarCloudPath,
            phoneNumber: this.data.phoneNumber
          },
          hasUserInfo: true,
          loginStep: '',
          editMode: false
        });
        
        wx.hideLoading();
        wx.showToast({
          title: '注册成功',
          icon: 'success'
        });
        
        // 重新加载用户数据
        await this.loadUserData();
        this.calculatePracticeYears();
        
      } else {
        wx.hideLoading();
        // 如果是用户已存在，尝试更新用户信息
        if (registerResult.result.message === '用户已存在') {
          await this.loadExistingUser();
        } else {
          wx.showToast({
            title: registerResult.result.message || '注册失败',
            icon: 'error'
          });
        }
      }
    } catch (error) {
      console.error('注册失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '注册失败，请重试',
        icon: 'error'
      });
    }
  },

  // 完成用户资料填写（保留兼容性）
  async completeProfile() {
    if (!this.data.canComplete) {
      wx.showToast({
        title: '请完善所有信息',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '注册中...' });

    try {
      // 上传头像到云存储（如果失败，会自动使用默认头像）
      let avatarCloudPath = this.data.avatarUrl;
      try {
        avatarCloudPath = await this.uploadAvatar(this.data.avatarUrl);
      } catch (uploadError) {
        console.warn('头像上传失败，使用默认头像:', uploadError);
        avatarCloudPath = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';
      }
      
      // 注册用户
      const registerResult = await wx.cloud.callFunction({
        name: 'registerUser',
        data: {
          nickName: this.data.tempNickname.trim(),
          avatarUrl: avatarCloudPath,
          phoneNumber: this.data.phoneNumber
        }
      });
      
      if (registerResult.result && registerResult.result.success) {
        this.setData({
          userInfo: {
            nickName: this.data.tempNickname.trim(),
            avatarUrl: avatarCloudPath,
            phoneNumber: this.data.phoneNumber
          },
          hasUserInfo: true,
          editMode: false
        });
        
        wx.hideLoading();
        wx.showToast({
          title: '注册成功',
          icon: 'success'
        });
        
        // 重新加载用户数据
        await this.loadUserData();
        this.calculatePracticeYears();
        
      } else {
        wx.hideLoading();
        // 如果是用户已存在，尝试更新用户信息
        if (registerResult.result.message === '用户已存在') {
          await this.loadExistingUser();
        } else {
          wx.showToast({
            title: registerResult.result.message || '注册失败',
            icon: 'error'
          });
        }
      }
    } catch (error) {
      console.error('注册失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '注册失败，请重试',
        icon: 'error'
      });
    }
  },

  // 加载已存在的用户信息
  async loadExistingUser() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getUser'
      });
      
      if (result.result && result.result.success) {
        this.setData({
          userInfo: result.result.data,
          hasUserInfo: true,
          loginStep: '',
          editMode: false,
          tempAvatarUrl: ''
          // 保持phoneNumber不变
        });
        
        wx.showToast({
          title: '欢迎回来',
          icon: 'success'
        });
        
        await this.loadUserData();
        this.calculatePracticeYears();
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  // 上传头像到云存储 - 按照官方文档简化版本
  async uploadAvatar(tempFilePath) {
    try {
      // 如果是网络地址，直接返回
      if (tempFilePath.startsWith('http') || tempFilePath.startsWith('cloud://')) {
        return tempFilePath;
      }
      
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const cloudPath = `avatars/${timestamp}_${random}.jpg`;
      
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath,
        filePath: tempFilePath
      });
      
      return uploadResult.fileID;
    } catch (error) {
      console.error('头像上传失败:', error);
      // 返回临时路径，让前端显示
      return tempFilePath;
    }
  },



  // 保存用户资料
  async saveProfile() {
    if (!this.data.tempNickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    try {
      let avatarUrl = this.data.userInfo.avatarUrl;
      
      // 如果头像有变化，上传新头像
      if (this.data.tempAvatarUrl && this.data.tempAvatarUrl !== this.data.userInfo.avatarUrl) {
        try {
          avatarUrl = await this.uploadAvatar(this.data.tempAvatarUrl);
        } catch (uploadError) {
          console.warn('头像上传失败，保持原头像:', uploadError);
          wx.showToast({
            title: '头像上传失败，保持原头像',
            icon: 'none',
            duration: 2000
          });
        }
      }

      // 更新用户信息
      const updateResult = await wx.cloud.callFunction({
        name: 'updateUserProfile',
        data: {
          nickName: this.data.tempNickname.trim(),
          avatarUrl: avatarUrl,
          phoneNumber: this.data.phoneNumber || this.data.userInfo.phoneNumber
        }
      });

      if (updateResult.result && updateResult.result.success) {
        this.setData({
          userInfo: {
            ...this.data.userInfo,
            nickName: this.data.tempNickname.trim(),
            avatarUrl: avatarUrl,
            phoneNumber: this.data.phoneNumber || this.data.userInfo.phoneNumber
          },
          editMode: false
        });

        wx.hideLoading();
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '保存失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('保存失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    }
  },


  generateFootprints() {
    const colors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
    const footprints = Array.from({ length: 98 }, () => {
      const randomLevel = Math.floor(Math.random() * 5);
      return { color: colors[randomLevel] };
    });
    this.setData({ footprints });
  },

  // 管理员入口 - 验证openid
  async checkAdminAccess() {
    try {
      wx.showLoading({ title: '验证中...' });
      
      const result = await wx.cloud.callFunction({
        name: 'checkAdminAccess'
      });
      
      wx.hideLoading();
      
      console.log('管理员权限验证结果:', result);
      
      if (result.result && result.result.success) {
        if (result.result.isAdmin) {
          // 是管理员，直接进入管理页面
          wx.showToast({
            title: `欢迎，${result.result.adminInfo.name}`,
            icon: 'success'
          });
          
          // 保存管理员信息到本地存储
          wx.setStorageSync('admin_info', result.result.adminInfo);
          wx.setStorageSync('admin_logged_in', true);
          
          setTimeout(() => {
            wx.navigateTo({
              url: '../admin/admin'
            });
          }, 1500);
        } else {
          // 不是管理员
          wx.showModal({
            title: '权限不足',
            content: '您没有管理员权限',
            showCancel: false,
            confirmText: '知道了'
          });
        }
      } else {
        wx.showToast({
          title: '验证失败，请重试',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('验证管理员权限失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '验证失败',
        icon: 'error'
      });
    }
  },

  // 老师入口 - 跳转到原有的登录页面
  checkTeacherAccess() {
    // 检查是否已有有效的老师token
    const adminToken = wx.getStorageSync('admin_token');
    if (adminToken) {
      // 验证token是否有效
      this.verifyTeacherToken(adminToken);
    } else {
      // 跳转到老师登录页面（原管理员登录页面）
      wx.navigateTo({
        url: '../admin-login/admin-login'
      });
    }
  },

  // 验证老师token
  async verifyTeacherToken(token) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'verifyAdminToken',
        data: { token }
      });

      if (result.result && result.result.success) {
        // token有效，进入老师后台
        wx.navigateTo({
          url: '../admin/admin'
        });
      } else {
        // token无效，清除本地存储并跳转登录页
        wx.removeStorageSync('admin_token');
        wx.removeStorageSync('admin_info');
        wx.navigateTo({
          url: '../admin-login/admin-login'
        });
      }
    } catch (error) {
      console.error('验证token失败:', error);
      // 出错时跳转到登录页
      wx.navigateTo({
        url: '../admin-login/admin-login'
      });
    }
  },

  // 取消课程预约
  async cancelCourse(e) {
    const courseId = e.currentTarget.dataset.id;
    console.log('取消预约，课程ID:', courseId);
    
    // 从当前schedule数据中找到对应的课程
    const courseItem = this.data.schedule.find(item => item.id === courseId);
    
    if (!courseItem) {
      wx.showToast({
        title: '课程信息错误',
        icon: 'none'
      });
      return;
    }
    
    // 检查是否可以取消
    if (!courseItem.canCancel) {
      wx.showModal({
        title: '无法取消',
        content: '距团课开始时间1h内不可取消',
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }
    
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这次课程预约吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '取消中...' });
            
            const result = await wx.cloud.callFunction({
              name: 'cancelBooking',
              data: { bookingId: courseId }
            });

            console.log('取消预约结果:', result);

            if (result.result && result.result.success) {
              // 设置全局刷新标记，通知course页面刷新
              const app = getApp();
              app.globalData.needRefreshCourses = true;
              
              wx.hideLoading();
              wx.showToast({
                title: '取消成功',
                icon: 'success'
              });
              // 重新加载数据
              await this.loadUpcomingSchedule();
              await this.loadUserCredits(); // 重新加载次卡余额
            } else {
              wx.hideLoading();
              wx.showToast({
                title: result.result.message || '取消失败',
                icon: 'none'
              });
            }
          } catch (error) {
            console.error('取消预约失败:', error);
            wx.hideLoading();
            wx.showToast({
              title: '取消失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 取消私教预约
  async cancelPrivateBooking(e) {
    const { id: bookingId, status, date, startTime } = e.currentTarget.dataset;
    console.log('取消私教预约，预约ID:', bookingId, '状态:', status);
    
    // 如果是待确认状态，直接取消
    if (status === 'pending') {
      wx.showModal({
        title: '确认取消',
        content: '确定要取消这次私教预约吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              wx.showLoading({ title: '取消中...' });
              
              const result = await wx.cloud.callFunction({
                name: 'cancelPrivateBooking',
                data: { bookingId: bookingId }
              });

              console.log('取消私教预约结果:', result);

              if (result.result && result.result.success) {
                // 设置全局刷新标记，通知其他页面更新私教预约状态
                const app = getApp();
                app.globalData.needRefreshPrivateBookings = true;
                
                wx.hideLoading();
                wx.showToast({
                  title: '取消成功',
                  icon: 'success'
                });
                // 重新加载数据
                await this.loadPrivateBookings();
                await this.loadUserCredits(); // 重新加载次卡余额
              } else {
                wx.hideLoading();
                wx.showToast({
                  title: result.result.message || '取消失败',
                  icon: 'none'
                });
              }
            } catch (error) {
              console.error('取消私教预约失败:', error);
              wx.hideLoading();
              wx.showToast({
                title: '取消失败',
                icon: 'error'
              });
            }
          }
        }
      });
    } 
    // 如果是已确认状态，检查时间限制
    else if (status === 'confirmed') {
      // 检查时间限制
      const now = new Date();
      const classStartTime = new Date(`${date}T${startTime}:00`);
      const oneHourFromNow = new Date(now.getTime() + 1 * 60 * 60 * 1000);
      
      if (classStartTime <= oneHourFromNow) {
        // 不满足时间要求
        wx.showModal({
          title: '无法取消',
          content: '距开课不足1h，无法取消。',
          showCancel: false,
          confirmText: '知道了'
        });
      } else {
        // 满足时间要求，发送取消申请给老师
        wx.showModal({
          title: '申请取消',
          content: '取消预约需要老师通过，已发送申请给老师',
          showCancel: false,
          confirmText: '知道了',
          success: async () => {
            try {
              wx.showLoading({ title: '提交申请中...' });
              
              const result = await wx.cloud.callFunction({
                name: 'submitCancelRequest',
                data: { bookingId: bookingId }
              });

              console.log('提交取消申请结果:', result);

              if (result.result && result.result.success) {
                // 设置全局刷新标记，通知其他页面更新私教预约状态
                const app = getApp();
                app.globalData.needRefreshPrivateBookings = true;
                
                wx.hideLoading();
                wx.showToast({
                  title: '申请已提交',
                  icon: 'success'
                });
                // 重新加载数据
                await this.loadPrivateBookings();
              } else {
                wx.hideLoading();
                wx.showToast({
                  title: result.result.message || '申请失败',
                  icon: 'none'
                });
              }
            } catch (error) {
              console.error('提交取消申请失败:', error);
              wx.hideLoading();
              wx.showToast({
                title: '申请失败',
                icon: 'error'
              });
            }
          }
        });
      }
    }
  },

  // 测试按钮函数
  testButton(e) {
    console.log('测试按钮被点击', e);
    wx.showToast({
      title: '测试按钮正常',
      icon: 'success'
    });
  },

  // 查看私教往期记录
  viewPrivateHistory() {
    wx.navigateTo({
      url: '../private-history/private-history'
    });
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '请添加客服微信：zzayj999',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 加入社群
  joinCommunity() {
    wx.showModal({
      title: '加入社群',
      content: '请添加客服微信：zzayj999，将您拉入墨瑜伽课程交流群',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 提出建议
  giveFeedback() {
    wx.showModal({
      title: '提出建议',
      content: '感谢您的建议！请联系客服反馈',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 购买课程
  buyCourse() {
    wx.showModal({
      title: '购买课程',
      content: '微信支付功能待开发中，请添加客服微信：zzayj999实现课时充值购买',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 查看往期记录
  viewBookingHistory() {
    wx.navigateTo({
      url: '../booking-history/booking-history'
    });
  },

  onShow() {
    // 更新自定义TabBar状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
      });
    }
    
    // 重新加载用户数据
    if (this.data.hasUserInfo) {
      this.loadUserData();
    }
  }
}); 