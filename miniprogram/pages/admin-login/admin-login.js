Page({
  data: {
    loginType: 'admin', // 'admin' 或 'teacher'
    username: '',
    password: '',
    showPassword: false,
    rememberPassword: false,
    logging: false
  },

  onLoad() {
    // 检查是否有记住的密码
    this.loadRememberedPassword();
  },

  // 切换登录类型
  switchLoginType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      loginType: type,
      username: '',
      password: '',
      showPassword: false
    });
    
    // 加载对应类型的记住密码
    this.loadRememberedPassword();
  },

  // 加载记住的密码
  loadRememberedPassword() {
    try {
      const { loginType } = this.data;
      const remembered = wx.getStorageSync(`${loginType}_remember`);
      if (remembered) {
        this.setData({
          username: remembered.username || '',
          password: remembered.password || '',
          rememberPassword: true
        });
      }
    } catch (error) {
      console.log('加载记住密码失败:', error);
    }
  },

  // 账号输入
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value.trim()
    });
  },

  // 密码输入
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 切换密码显示
  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
    });
  },

  // 切换记住密码
  toggleRemember() {
    this.setData({
      rememberPassword: !this.data.rememberPassword
    });
  },

  // 处理登录
  handleLogin() {
    const { loginType, username, password, rememberPassword } = this.data;
    
    if (!username || !password) {
      wx.showToast({
        title: '请输入账号和密码',
        icon: 'none'
      });
      return;
    }
  
    this.setData({ logging: true });

    if (loginType === 'admin') {
      this.handleAdminLogin(username, password, rememberPassword);
    } else {
      this.handleTeacherLogin(username, password, rememberPassword);
    }
  },

  // 处理管理员登录
  handleAdminLogin(username, password, rememberPassword) {
    // 预设的管理员账号
    const adminAccounts = [
      { username: 'admin', password: 'yoga123456', name: '系统管理员' },
      { username: 'manager', password: 'manager888', name: '管理员' }
    ];
    
    // 验证账号密码
    const validAdmin = adminAccounts.find(admin => 
      admin.username === username && admin.password === password
    );
    
    if (validAdmin) {
      // 登录成功
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      // 保存登录状态
      wx.setStorageSync('admin_logged_in', true);
      wx.setStorageSync('admin_info', {
        username: validAdmin.username,
        name: validAdmin.name
      });

      // 记住密码
      if (rememberPassword) {
        wx.setStorageSync('admin_remember', {
          username: username,
          password: password
        });
      } else {
        wx.removeStorageSync('admin_remember');
      }

      // 跳转到管理后台
      setTimeout(() => {
        wx.redirectTo({
          url: '../admin/admin'
        });
      }, 1000);

    } else {
      this.showLoginError();
    }
    
    this.setData({ logging: false });
  },

  // 处理老师登录
  handleTeacherLogin(username, password, rememberPassword) {
    // 预设的老师账号
    const teacherAccounts = [
      { username: 'ZhouZhou', password: 'moreyoga', name: '周周老师', id: 'zhouzhou', specialties: '流瑜伽 | 正位瑜伽' },
      { username: 'YingEr', password: 'moreyoga', name: '莹儿老师', id: 'yinger', specialties: '产后修复 | 体态调整' },
      { username: 'QiQi', password: 'moreyoga', name: '岐岐老师', id: 'qiqi', specialties: '空中瑜伽 | 力量瑜伽' },
      { username: 'YaQin', password: 'moreyoga', name: '雅琴老师', id: 'yaqin', specialties: '阴瑜伽 | 冥想瑜伽' },
      { username: 'ChengMin', password: 'moreyoga', name: '程敏老师', id: 'chengmin', specialties: '体式精进 | 后弯专项' }
    ];
    
    // 验证账号密码
    const validTeacher = teacherAccounts.find(teacher => 
      teacher.username === username && teacher.password === password
    );
    
    if (validTeacher) {
      // 登录成功
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      // 保存登录状态
      wx.setStorageSync('teacher_info', {
        id: validTeacher.id,
        name: validTeacher.name,
        username: validTeacher.username,
        specialties: validTeacher.specialties
      });

      // 记住密码
      if (rememberPassword) {
        wx.setStorageSync('teacher_remember', {
          username: username,
          password: password
        });
      } else {
        wx.removeStorageSync('teacher_remember');
      }

      // 跳转到老师工作台
      setTimeout(() => {
        wx.redirectTo({
          url: '../teacher-dashboard/teacher-dashboard'
        });
      }, 1000);

    } else {
      this.showLoginError();
    }
    
    this.setData({ logging: false });
  },

  // 显示登录错误
  showLoginError() {
    wx.showModal({
      title: '登录失败',
      content: '账号或密码错误',
      showCancel: false
    });
  },
  
  // 返回
  navigateBack() {
    wx.navigateBack();
  }
});
