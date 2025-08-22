Page({
  data: {
    submitting: false,
    
    // 老师列表
    teacherList: [
      { id: 'teacher1', name: '莹儿' },
      { id: 'teacher2', name: '周周' },
      { id: 'teacher3', name: '岐岐' },
      { id: 'teacher4', name: '雅琴' },
      { id: 'teacher5', name: '程敏' }
    ],
    
    // 今日日期（用于日期选择器的最小值）
    todayDate: '',
    
    // 课程安排表单
    scheduleForm: {
      courseName: '',
      teacher: '',
      teacherIndex: -1,
      date: '',
      startTime: '',
      endTime: '',
      description: '',
      minCapacity: 1,
      maxCapacity: 20,
      creditsRequired: 1
    }
  },

  onLoad() {
    // 设置今日日期
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.setData({
      todayDate: `${year}-${month}-${day}`
    });
  },

  // 表单输入处理
  onFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`scheduleForm.${field}`]: value
    });
  },

  // 老师选择
  onTeacherChange(e) {
    const index = parseInt(e.detail.value);
    const teacher = this.data.teacherList[index];
    
    this.setData({
      'scheduleForm.teacherIndex': index,
      'scheduleForm.teacher': teacher ? teacher.name : ''
    });
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      'scheduleForm.date': e.detail.value
    });
  },

  // 开始时间选择
  onStartTimeChange(e) {
    this.setData({
      'scheduleForm.startTime': e.detail.value
    });
  },

  // 结束时间选择
  onEndTimeChange(e) {
    this.setData({
      'scheduleForm.endTime': e.detail.value
    });
  },

  // 验证表单
  validateForm() {
    const form = this.data.scheduleForm;
    
    if (!form.courseName.trim()) {
      wx.showToast({ title: '请输入课程名称', icon: 'none' });
      return false;
    }
    
    if (!form.teacher) {
      wx.showToast({ title: '请选择授课老师', icon: 'none' });
      return false;
    }
    
    if (!form.date) {
      wx.showToast({ title: '请选择授课日期', icon: 'none' });
      return false;
    }
    
    if (!form.startTime) {
      wx.showToast({ title: '请选择开始时间', icon: 'none' });
      return false;
    }
    
    if (!form.endTime) {
      wx.showToast({ title: '请选择结束时间', icon: 'none' });
      return false;
    }
    
    // 验证时间顺序
    if (form.startTime >= form.endTime) {
      wx.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' });
      return false;
    }
    
    // 验证人数设置
    const minCapacity = parseInt(form.minCapacity) || 1;
    const maxCapacity = parseInt(form.maxCapacity) || 1;
    
    if (minCapacity < 1) {
      wx.showToast({ title: '最少人数不能少于1人', icon: 'none' });
      return false;
    }
    
    if (maxCapacity < minCapacity) {
      wx.showToast({ title: '最多人数不能少于最少人数', icon: 'none' });
      return false;
    }
    
    // 验证次卡设置
    const creditsRequired = parseInt(form.creditsRequired) || 1;
    if (creditsRequired < 1) {
      wx.showToast({ title: '消耗次卡不能少于1次', icon: 'none' });
      return false;
    }
    
    return true;
  },

  // 提交课程安排
  async submitSchedule() {
    if (!this.validateForm()) {
      return;
    }

    this.setData({ submitting: true });

    try {
      const form = this.data.scheduleForm;
      const teacher = this.data.teacherList[form.teacherIndex];
      
      // 准备提交数据
      const scheduleData = {
        courseName: form.courseName.trim(),
        teacherId: teacher.id,
        teacherName: teacher.name,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        description: form.description.trim(),
        minCapacity: parseInt(form.minCapacity) || 1,
        maxCapacity: parseInt(form.maxCapacity) || 20,
        creditsRequired: parseInt(form.creditsRequired) || 1,
        status: 'active',
        bookings: [],
        currentBookings: 0
      };

      console.log('提交课程安排数据:', scheduleData);

      // 调用云函数创建课程安排
      const result = await wx.cloud.callFunction({
        name: 'adminAddSchedule',
        data: scheduleData
      });

      if (result.result && result.result.success) {
        wx.showToast({
          title: '课程安排创建成功',
          icon: 'success'
        });

        // 重置表单
        this.resetForm();
      } else {
        wx.showModal({
          title: '创建失败',
          content: result.result.message || '课程安排创建失败，请重试',
          showCancel: false
        });
      }
    } catch (error) {
      console.error('创建课程安排失败:', error);
      wx.showModal({
        title: '创建失败',
        content: '网络错误，请重试',
        showCancel: false
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 重置表单
  resetForm() {
    this.setData({
      scheduleForm: {
        courseName: '',
        teacher: '',
        teacherIndex: -1,
        date: '',
        startTime: '',
        endTime: '',
        description: '',
        minCapacity: 1,
        maxCapacity: 20,
        creditsRequired: 1
      }
    });
  },

  // 返回
  navigateBack() {
    wx.navigateBack();
  }
});