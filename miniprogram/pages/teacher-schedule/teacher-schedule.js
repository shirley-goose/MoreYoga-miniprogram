Page({
  data: {
    teacherInfo: {},
    dateList: [],
    selectedDateIndex: 0,
    timeSlots: [],
    saving: false
  },

  onLoad() {
    this.loadTeacherInfo();
    this.initDateList();
    this.loadTimeSlots();
  },

  // 加载老师信息
  loadTeacherInfo() {
    const teacherInfo = wx.getStorageSync('teacher_info');
    if (!teacherInfo) {
      wx.redirectTo({
        url: '/pages/admin-login/admin-login'
      });
      return;
    }
    this.setData({ teacherInfo });
  },

  // 初始化日期列表（最近7天）
  initDateList() {
    const dateList = [];
    const today = new Date();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      let weekday = weekdays[date.getDay()];
      if (i === 0) weekday = '今天';
      else if (i === 1) weekday = '明天';

      dateList.push({
        date: date.toISOString().split('T')[0], // YYYY-MM-DD格式
        weekday: weekday,
        day: date.getDate()
      });
    }

    this.setData({ dateList });
  },

  // 生成时间段（6:00-22:00，每15分钟一个）
  generateTimeSlots() {
    const slots = [];
    const startHour = 6;
    const endHour = 22;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeStr,
          available: false,
          booked: false
        });
      }
    }

    return slots;
  },

  // 选择日期
  selectDate(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ selectedDateIndex: index });
    this.loadTimeSlots();
  },

  // 加载当前选中日期的时间段
  async loadTimeSlots() {
    try {
      const { dateList, selectedDateIndex, teacherInfo } = this.data;
      const selectedDate = dateList[selectedDateIndex].date;
      
      console.log('加载时间段，日期:', selectedDate, '老师:', teacherInfo);
      
      // 生成基础时间段
      let timeSlots = this.generateTimeSlots();
      console.log('生成的基础时间段数量:', timeSlots.length);

      try {
        // 尝试从云端获取老师的时间设置
        const result = await wx.cloud.callFunction({
          name: 'getTeacherSchedule',
          data: {
            teacherId: teacherInfo.id,
            date: selectedDate
          }
        });

        if (result.result && result.result.success) {
          const savedSlots = result.result.schedule || {};
          console.log('从云端获取的时间设置:', savedSlots);
          
          // 更新时间段状态
          timeSlots = timeSlots.map(slot => ({
            ...slot,
            available: savedSlots[slot.time]?.available || false,
            booked: savedSlots[slot.time]?.booked || false
          }));
        }
      } catch (cloudError) {
        console.warn('云函数调用失败，使用默认时间段:', cloudError);
        // 云函数失败时继续使用基础时间段
      }

      console.log('最终设置的时间段数据:', timeSlots.slice(0, 5)); // 显示前5个用于调试
      this.setData({ timeSlots });

    } catch (error) {
      console.error('加载时间段失败:', error);
      // 如果失败，使用默认时间段
      const defaultSlots = this.generateTimeSlots();
      console.log('使用默认时间段:', defaultSlots.slice(0, 5));
      this.setData({
        timeSlots: defaultSlots
      });
    }
  },

  // 切换时间段状态
  toggleTimeSlot(e) {
    const time = e.currentTarget.dataset.time;
    const { timeSlots } = this.data;

    console.log('点击时间段:', time);
    console.log('当前时间段数据:', timeSlots);

    const updatedSlots = timeSlots.map(slot => {
      if (slot.time === time && !slot.booked) {
        console.log('切换时间段状态:', slot.time, '从', slot.available, '到', !slot.available);
        return {
          ...slot,
          available: !slot.available
        };
      }
      return slot;
    });

    console.log('更新后的时间段:', updatedSlots);
    this.setData({ timeSlots: updatedSlots });
  },

  // 保存时间设置
  async saveSchedule() {
    try {
      this.setData({ saving: true });

      const { dateList, selectedDateIndex, timeSlots, teacherInfo } = this.data;
      const selectedDate = dateList[selectedDateIndex].date;

      // 构建要保存的数据
      const scheduleData = {};
      timeSlots.forEach(slot => {
        if (slot.available || slot.booked) {
          scheduleData[slot.time] = {
            available: slot.available,
            booked: slot.booked
          };
        }
      });

      // 调用云函数保存
      const result = await wx.cloud.callFunction({
        name: 'saveTeacherSchedule',
        data: {
          teacherId: teacherInfo.id,
          teacherName: teacherInfo.name,
          date: selectedDate,
          schedule: scheduleData
        }
      });

      if (result.result && result.result.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      } else {
        throw new Error(result.result?.error || '保存失败');
      }

    } catch (error) {
      console.error('保存时间设置失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    } finally {
      this.setData({ saving: false });
    }
  },

  // 清空当天设置
  clearDaySchedule() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空当天的所有时间设置吗？',
      success: (res) => {
        if (res.confirm) {
          const timeSlots = this.generateTimeSlots();
          this.setData({ timeSlots });
        }
      }
    });
  },

  // 返回
  navigateBack() {
    wx.navigateBack();
  }
});
