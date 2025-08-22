Page({
  data: {
    currentType: 'group', // 'private', 'group', 'camp'
    selectedDate: '',
    
    // 周日历数据
    weekDays: [],
    
    // 当日课程列表
    dailyCourses: [],
    
    // 私教预约相关数据
    privateWeekDays: [],
    selectedPrivateDate: '',
    selectedPrivateDateDisplay: '',
    availablePrivateTeachers: [],
    selectedPrivateTeacher: null,
    selectedPrivateTimeSlot: '',

    
    // 私教老师列表
    teacherList: [
      {
        id: 'yinger',
        name: '莹儿老师',
        avatar: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/images/teacher_yinger-6c1741.png',
        specialty: '产后修复 | 体态调整',
        price: 300
      },
      {
        id: 'zhouzhou',
        name: '周周老师',
        avatar: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/logo.png', // 照片待补充
        specialty: '流瑜伽 | 正位瑜伽',
        price: 280
      },
      {
        id: 'yaqin',
        name: '雅琴老师',
        avatar: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/logo.png', // 照片待补充
        specialty: '阴瑜伽 | 冥想瑜伽',
        price: 320
      },
      {
        id: 'qiqi',
        name: '岐岐老师',
        avatar: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/logo.png', // 照片待补充
        specialty: '空中瑜伽 | 力量瑜伽',
        price: 350
      },
      {
        id: 'chengmin',
        name: '程敏老师',
        avatar: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/logo.png', // 照片待补充
        specialty: '体式精进 | 后弯专项',
        price: 280
      }
    ],
    
    // 训练营列表
    campList: [
      {
        id: 'camp1',
        name: '待开发',
        description: '从零基础到进阶，全面提升身心状态',
        duration: '4周',
        price: '1299',
        image: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/background.png'
      },
      {
        id: 'camp2',
        name: '待开发',
        description: '你想练什么～',
        duration: '6周',
        price: '1899',
        image: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/background.png'
      }
    ]
  },

  onLoad() {
    this.initWeekCalendar();
    this.loadDailyCourses();
    // 私教数据初始化

    this.initPrivateWeekCalendar();
    console.log('私教数据初始化完成');
  },

  onShow() {
    // 更新自定义TabBar状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1 // 练页面的索引
      });
    }
    
    // 检查是否需要更新周日历
    this.checkAndUpdateWeekCalendar();
    
    // 检查是否需要刷新团课数据
    this.checkAndRefreshCourses();
  },

  // 初始化周日历（以今天为起点的7天）
  initWeekCalendar() {
    const today = new Date();
    const weekDays = [];
    const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    // 获取从今天开始的7天日期
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i); // 从今天开始往后数7天
      
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${date.getFullYear()}-${month}-${day}`;
      
      // 获取星期几
      const weekIndex = date.getDay();
      const weekName = weekNames[weekIndex];
      
      // 设置特殊标识
      let displayName = weekName;
      if (i === 0) {
        displayName = '今天';
      } else if (i === 1) {
        displayName = '明天';
      } else {
        // 保持星期几的显示
        displayName = weekName;
      }
      
      weekDays.push({
        date: dateStr,
        weekName: displayName,
        dateText: `${month}/${day}`
      });
    }
    
    // 默认选择今天
    const todayStr = this.formatDate(today);
    
    this.setData({
      weekDays,
      selectedDate: todayStr
    });
  },

  // 检查并更新周日历
  checkAndUpdateWeekCalendar() {
    const today = new Date();
    const todayStr = this.formatDate(today);
    
    // 检查第一个日期是否是今天
    const weekDays = this.data.weekDays;
    const isFirstDayToday = weekDays && weekDays.length > 0 && weekDays[0].date === todayStr;
    
    if (!isFirstDayToday) {
      console.log('检测到日期变化，更新日历以今天为起点');
      // 重新初始化周日历
      this.initWeekCalendar();
      // 重新加载当日课程
      this.loadDailyCourses();
    }
  },

  // 检查并刷新团课数据
  checkAndRefreshCourses() {
    // 检查全局数据中是否有刷新标记
    const app = getApp();
    if (app.globalData.needRefreshCourses) {
      console.log('检测到需要刷新团课数据');
      // 重置标记
      app.globalData.needRefreshCourses = false;
      
      // 如果当前是团课模式，刷新数据
      if (this.data.currentType === 'group') {
        this.loadDailyCourses();
      }
    }
    
    // 检查是否需要刷新私教数据
    if (app.globalData.needRefreshPrivateBookings) {
      console.log('检测到需要刷新私教数据');
      // 重置标记
      app.globalData.needRefreshPrivateBookings = false;
      
      // 如果当前是私教模式，刷新数据
      if (this.data.currentType === 'private' && this.data.selectedPrivateDate) {
        this.loadPrivateAvailableTeachers(this.data.selectedPrivateDate);
      }
    }
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 课程类型切换
  onTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      currentType: type
    });
    
    if (type === 'group') {
      this.loadDailyCourses();
    } else if (type === 'private') {
      console.log('切换到私教模式');
      console.log('当前私教日历数据长度:', this.data.privateWeekDays.length);
      
      // 重置私教预约状态
      this.setData({
        selectedPrivateTeacher: null,
        selectedPrivateTimeSlot: ''
      });
      
      // 如果私教日历数据为空，重新初始化
      if (this.data.privateWeekDays.length === 0) {
        console.log('私教日历数据为空，重新初始化');
        this.initPrivateWeekCalendar();
      } else {
        console.log('使用现有私教日历数据');
        this.loadPrivateAvailableTeachers(this.data.selectedPrivateDate);
      }
    }
  },

  // 日期选择
  onDateSelect(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({
      selectedDate: date
    });
    this.loadDailyCourses();
  },

  // 加载当日课程
  async loadDailyCourses() {
    if (this.data.currentType !== 'group') return;
    
    try {
      wx.showLoading({ title: '加载中...' });
      
      console.log('开始加载当日课程，日期:', this.data.selectedDate);
      
      const result = await wx.cloud.callFunction({
        name: 'getDaySchedule',
        data: {
          date: this.data.selectedDate
        }
      });
      
      console.log('getDaySchedule 云函数返回结果:', result);
      
      if (result.result && result.result.success) {
        // 兼容两种返回格式：schedules 或 data
        const schedulesData = result.result.schedules || result.result.data || [];
        console.log('获取到的课程数据:', schedulesData);
        
        const courses = schedulesData.map(schedule => ({
          id: schedule._id,
          courseName: schedule.courseName,
          teacherName: schedule.teacherName,
          teacherAvatar: this.getTeacherAvatar(schedule.teacherName),
          description: schedule.description || '呼吸，流动，体式\n课程内容概述......',
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          maxCapacity: schedule.maxCapacity,
          minCapacity: schedule.minCapacity,
          currentBookings: schedule.currentStudents || schedule.currentBookings || 0,
          remainingSlots: Math.max(0, schedule.maxCapacity - (schedule.currentStudents || schedule.currentBookings || 0)),
          status: this.getCourseStatus(schedule),
          creditsRequired: schedule.creditsRequired || 1,
          userBookingStatus: schedule.userBookingStatus
        }));
        
        console.log('处理后的课程列表:', courses);
        
        this.setData({
          dailyCourses: courses
        });
        
        if (courses.length === 0) {
          console.log('当日没有课程安排');
        }
      } else {
        console.log('云函数返回失败或success为false');
        this.setData({
          dailyCourses: []
        });
      }
    } catch (error) {
      console.error('加载当日课程失败:', error);
      this.setData({
        dailyCourses: []
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 获取老师头像
  getTeacherAvatar(teacherName) {
    const teacher = this.data.teacherList.find(t => t.name === teacherName);
    return teacher ? teacher.avatar : 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/logo.png';
  },

  // 获取课程状态
  getCourseStatus(schedule) {
    // 首先检查课程是否已结束
    const now = new Date();
    const courseEndTime = new Date(`${schedule.date}T${schedule.endTime}:00`);
    
    if (courseEndTime < now) {
      return 'ended';
    }
    
    // 检查用户是否已预约
    if (schedule.userBookingStatus === 'booked') {
      return 'booked';
    }
    
    const currentBookings = schedule.currentStudents || schedule.currentBookings || 0;
    const remaining = schedule.maxCapacity - currentBookings;
    
    if (remaining > 0) {
      return 'available';
    } else {
      return 'full';
    }
  },

  // 课程预约操作
  onBookingAction(e) {
    const dataset = e.currentTarget.dataset;
    const course = dataset.course;
    
    console.log('点击预约按钮，课程信息:', course);
    
    if (!course) {
      wx.showToast({
        title: '课程信息有误',
        icon: 'none'
      });
      return;
    }
    
    if (course.status === 'ended') {
      wx.showToast({
        title: '课程已结束',
        icon: 'none'
      });
      return;
    }
    
    if (course.status === 'booked') {
      wx.showToast({
        title: '您已预约此课程',
        icon: 'none'
      });
      return;
    }
    
    // 跳转到预约确认页面
    this.navigateToBookingConfirm(course);
  },

  // 跳转到预约确认页面
  navigateToBookingConfirm(course) {
    const courseData = {
      id: course.id,
      courseName: course.courseName,
      teacherName: course.teacherName,
      teacherAvatar: course.teacherAvatar,
      date: this.data.selectedDate,
      startTime: course.startTime,
      endTime: course.endTime,
      description: course.description,
      creditsRequired: course.creditsRequired,
      maxCapacity: course.maxCapacity,
      minCapacity: course.minCapacity,
      remainingSlots: course.remainingSlots,
      waitlistCount: course.status === 'full' ? 3 : 0, // 模拟等位人数
      currentBookings: course.currentBookings
    };
    
    const courseDataStr = encodeURIComponent(JSON.stringify(courseData));
    
    wx.navigateTo({
      url: `../booking-confirm/booking-confirm?courseData=${courseDataStr}`
    });
  },

  // 预约课程
  async bookCourse(course) {
    try {
      wx.showLoading({ title: '预约中...' });
      
      const result = await wx.cloud.callFunction({
        name: 'bookCourse',
        data: {
          scheduleId: course.id,
          courseName: course.courseName,
          date: this.data.selectedDate,
          startTime: course.startTime,
          endTime: course.endTime,
          teacherName: course.teacherName,
          creditsRequired: course.creditsRequired
        }
      });
      
      if (result.result && result.result.success) {
        wx.showToast({
          title: '预约成功',
          icon: 'success'
        });
        
        // 重新加载课程列表
        this.loadDailyCourses();
      } else {
        wx.showModal({
          title: '预约失败',
          content: result.result.message || '预约失败，请重试',
          showCancel: false
        });
      }
    } catch (error) {
      console.error('预约课程失败:', error);
      wx.showModal({
        title: '预约失败',
        content: '网络错误，请重试',
        showCancel: false
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 加入等位
  async joinWaitlist(course) {
    wx.showModal({
      title: '加入等位',
      content: `课程已满，是否加入等位队列？有空位时会通知您`,
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '加入等位中...' });
            
            // 这里可以调用加入等位的云函数
            // const result = await wx.cloud.callFunction({
            //   name: 'joinWaitlist',
            //   data: { scheduleId: course.id }
            // });
            
            wx.showToast({
              title: '已加入等位',
              icon: 'success'
            });
          } catch (error) {
            console.error('加入等位失败:', error);
            wx.showToast({
              title: '加入等位失败',
              icon: 'none'
            });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  // ====== 私教预约相关方法 ======
  
  // 初始化私教老师可用时间段数据


  // 初始化私教周日历
  initPrivateWeekCalendar() {
    console.log('开始初始化私教周日历');
    const today = new Date();
    const weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date();
      currentDate.setDate(today.getDate() + i);
      
      const dateStr = this.formatDate(currentDate);
      const weekName = this.getPrivateWeekName(currentDate, i);
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
    
    console.log('私教周日历数据:', weekDays);
    console.log('选择的日期:', todayStr);
    
    this.setData({
      privateWeekDays: weekDays,
      selectedPrivateDate: todayStr,
      selectedPrivateDateDisplay: this.getPrivateDateDisplay(today)
    });
    
    // 加载今天的可用老师
    this.loadPrivateAvailableTeachers(todayStr);
  },

  // 获取私教星期名称
  getPrivateWeekName(date, index) {
    const weekNames = ['日', '一', '二', '三', '四', '五', '六'];
    
    if (index === 0) {
      return '今天';
    } else if (index === 1) {
      return '明天';
    } else {
      return weekNames[date.getDay()];
    }
  },

  // 获取私教日期显示文本
  getPrivateDateDisplay(date) {
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

  // 私教日期选择
  onPrivateDateSelect(e) {
    const date = e.currentTarget.dataset.date;
    const selectedDate = new Date(date);
    
    this.setData({
      selectedPrivateDate: date,
      selectedPrivateDateDisplay: this.getPrivateDateDisplay(selectedDate),
      selectedPrivateTeacher: null,
      selectedPrivateTimeSlot: ''
    });
    
    // 加载选中日期的可用老师
    this.loadPrivateAvailableTeachers(date);
  },

  // 加载指定日期的私教可用老师
  async loadPrivateAvailableTeachers(date) {
    console.log('加载私教日期的可用老师:', date);
    
    if (!date) {
      console.log('缺少日期参数');
      this.setData({
        availablePrivateTeachers: []
      });
      return;
    }
    
    try {
      wx.showLoading({ title: '加载中...' });
      
      // 并行获取可用老师和用户私教预约
      const [teachersResult, userBookingsResult] = await Promise.all([
        wx.cloud.callFunction({
          name: 'getAvailableTeachers',
          data: { date: date }
        }),
        wx.cloud.callFunction({
          name: 'getUserPrivateBookings'
        })
      ]);
      
      if (teachersResult.result && teachersResult.result.success) {
        const availableTeachers = teachersResult.result.teachers || [];
        console.log('从云端获取的可用私教老师:', availableTeachers);
        
        // 获取用户的私教预约（包括pending和confirmed状态）
        let userBookings = [];
        if (userBookingsResult.result && userBookingsResult.result.success) {
          userBookings = userBookingsResult.result.data.filter(booking => 
            (booking.status === 'confirmed' || booking.status === 'pending') && 
            booking.date === date &&
            // 排除已取消的预约
            booking.status !== 'cancelled'
          );
          console.log('用户在该日期的私教预约（pending+confirmed）:', userBookings);
        }
        
        // 处理每个老师的时间段状态
        const processedTeachers = availableTeachers.map(teacher => {
          const processedSlots = this.processTimeSlots(teacher.availableSlots || [], date, userBookings);
          return {
            ...teacher,
            availableSlots: processedSlots.slots,
            slotCount: processedSlots.availableCount
          };
        });
        
        this.setData({
          availablePrivateTeachers: processedTeachers
        });
      } else {
        console.error('获取可用老师失败:', teachersResult.result?.message);
        this.setData({
          availablePrivateTeachers: []
        });
      }
    } catch (error) {
      console.error('调用getAvailableTeachers云函数失败:', error);
      this.setData({
        availablePrivateTeachers: []
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 处理时间段状态
  processTimeSlots(slots, date, userBookings) {
    const now = new Date();
    let availableCount = 0;
    
    const processedSlots = slots.map(slot => {
      // 检查是否已过期
      const slotDateTime = new Date(`${date}T${slot}:00`);
      const isExpired = slotDateTime < now;
      
      // 检查是否与已预约时间冲突
      const isBooked = this.isTimeSlotConflicted(slot, userBookings);
      
      // 确定时间段状态
      let status = 'available';
      let statusText = '';
      
      if (isExpired) {
        status = 'expired';
        statusText = '已结束';
      } else if (isBooked) {
        status = 'booked';
        statusText = '已预约';
      } else {
        availableCount++;
      }
      
      return {
        time: slot,
        status: status,
        statusText: statusText,
        disabled: status !== 'available'
      };
    });
    
    return {
      slots: processedSlots,
      availableCount: availableCount
    };
  },

  // 检查时间段是否与已预约时间冲突
  isTimeSlotConflicted(selectedTime, userBookings) {
    // 将时间转换为分钟数便于计算
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const selectedMinutes = timeToMinutes(selectedTime);
    
    for (const booking of userBookings) {
      const bookedStartMinutes = timeToMinutes(booking.startTime);
      
             // 私教课程1小时，从预约开始时间占用5个15分钟时间段（考虑可能的拖堂情况）
       // 检查选择的时间段是否在已预约的5个时间段范围内
       const occupiedSlots = [];
       for (let i = 0; i < 5; i++) {
         occupiedSlots.push(bookedStartMinutes + (i * 15));
       }
      
      // 如果选择的时间段正好是被占用的时间段之一，则冲突
      if (occupiedSlots.includes(selectedMinutes)) {
        console.log(`时间冲突: 选择${selectedTime}(${selectedMinutes}), 已预约${booking.startTime}，占用时间段: ${occupiedSlots}`);
        return true;
      }
    }
    
    return false;
  },

  // 选择私教老师
  async onPrivateTeacherSelect(e) {
    const teacher = e.currentTarget.dataset.teacher;
    const date = e.currentTarget.dataset.date;
    
    console.log('选择私教老师:', teacher);
    console.log('选择日期:', date);
    
    // 设置选中的老师，先显示加载状态
    this.setData({
      selectedPrivateTeacher: {
        ...teacher,
        availableSlots: teacher.availableSlots // 保持原有时间段，避免闪烁
      },
      selectedPrivateTimeSlot: ''
    });
    
    // 异步刷新该老师的时间段状态
    try {
      console.log('刷新老师时间段状态...');
      
      // 重新获取用户预约数据和最新时间段状态
      const userBookingsResult = await wx.cloud.callFunction({
        name: 'getUserPrivateBookings'
      });
      
      if (userBookingsResult.result && userBookingsResult.result.success) {
        // 获取用户的私教预约（包括pending和confirmed状态）
        const userBookings = userBookingsResult.result.data.filter(booking => 
          (booking.status === 'confirmed' || booking.status === 'pending') && 
          booking.date === date &&
          // 排除已取消的预约
          booking.status !== 'cancelled'
        );
        
        // 重新处理时间段状态
        const processedSlots = this.processTimeSlots(teacher.availableSlots || [], date, userBookings);
        
        // 更新老师的时间段状态
        this.setData({
          selectedPrivateTeacher: {
            ...teacher,
            availableSlots: processedSlots.slots
          }
        });
        
        console.log('老师时间段状态刷新完成');
      }
    } catch (error) {
      console.error('刷新老师时间段状态失败:', error);
      // 失败时保持原有状态，不影响用户操作
    }
  },

  // 私教时间段选择
  onPrivateTimeSlotSelect(e) {
    const slotData = e.currentTarget.dataset.slot;
    
    // 检查时间段是否可用
    if (slotData.disabled) {
      let message = '该时间段不可选择';
      if (slotData.status === 'expired') {
        message = '该时间段已过期';
      } else if (slotData.status === 'booked') {
        message = '该时间段与您已预约的私教课程冲突';
      }
      
      wx.showToast({
        title: message,
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    this.setData({
      selectedPrivateTimeSlot: slotData.time
    });
  },

  // 返回老师选择页面
  backToPrivateTeachers() {
    this.setData({
      selectedPrivateTeacher: null,
      selectedPrivateTimeSlot: ''
    });
  },

  // 确认私教预约
  async confirmPrivateBooking() {
    const { selectedPrivateTeacher, selectedPrivateDate, selectedPrivateTimeSlot } = this.data;
    
    if (!selectedPrivateTeacher || !selectedPrivateDate || !selectedPrivateTimeSlot) {
      wx.showToast({
        title: '请完善预约信息',
        icon: 'none'
      });
      return;
    }

    // 跳转到私教预约确认页面，传递完整信息
    wx.navigateTo({
      url: `/pages/private-booking-confirm/private-booking-confirm?teacherId=${selectedPrivateTeacher.id}&teacherName=${selectedPrivateTeacher.name}&price=${selectedPrivateTeacher.price}&date=${selectedPrivateDate}&availableSlots=${JSON.stringify([selectedPrivateTimeSlot])}`
    });
  },

  // 选择训练营
  onCampSelect(e) {
    const camp = e.currentTarget.dataset.camp;
    
    wx.showModal({
      title: `报名${camp.name}`,
      content: `课程周期：${camp.duration}\n价格：￥${camp.price}\n\n${camp.description}`,
      confirmText: '立即报名',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '请联系客服报名',
            icon: 'none'
          });
        }
      }
    });
  },

  // 通用课程点击事件（防止事件处理错误）
  onCourseAction(e) {
    console.log('课程卡片被点击');
    // 可以在这里添加课程详情查看等功能
  }
});