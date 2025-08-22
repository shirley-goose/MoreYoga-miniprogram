// 清除登录数据的工具脚本
// 在微信开发者工具的控制台中运行此脚本来清除所有登录相关数据

console.log('=== 开始清除登录数据 ===');

// 使用微信官方API快速清除所有存储
function quickClearStorage() {
  try {
    console.log('使用微信官方API清除所有本地存储...');
    
    // 使用官方API一次性清除所有本地存储
    wx.clearStorageSync();
    
    console.log('✅ wx.clearStorageSync() 执行成功');
    console.log('📱 所有本地缓存已清除');
    
    wx.showToast({
      title: '存储已清除',
      icon: 'success'
    });
    
    return {
      success: true,
      message: '官方API清除成功'
    };
    
  } catch (error) {
    console.error('❌ wx.clearStorageSync() 失败:', error);
    
    wx.showToast({
      title: '清除失败',
      icon: 'error'
    });
    
    return {
      success: false,
      message: '官方API清除失败: ' + error.message
    };
  }
}

// 清除登录数据的函数
function clearAllLoginData() {
  try {
    console.log('1. 清除本地存储数据...');
    
    // 方法1：使用微信官方API清除所有本地存储（推荐）
    try {
      wx.clearStorageSync();
      console.log('✅ 使用 wx.clearStorageSync() 清除所有本地存储成功');
    } catch (error) {
      console.warn('⚠️ wx.clearStorageSync() 失败，尝试逐个清除:', error);
      
      // 方法2：逐个清除（备用方案）
      const keysToRemove = [
        'userInfo',
        'hasUserInfo', 
        'openid',
        'phoneNumber',
        'avatarUrl',
        'tempAvatarUrl',
        'loginStep',
        'classCredits',
        'schedule',
        'footprints'
      ];
      
      keysToRemove.forEach(key => {
        try {
          wx.removeStorageSync(key);
          console.log(`- 已清除: ${key}`);
        } catch (error) {
          console.warn(`- 清除失败: ${key}`, error);
        }
      });
    }
    
    console.log('2. 重置页面数据状态...');
    
    // 如果当前在 profile 页面，重置页面数据
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    if (currentPage && currentPage.route === 'pages/profile/profile') {
      console.log('检测到当前在 profile 页面，重置页面数据...');
      
      currentPage.setData({
        userInfo: {},
        hasUserInfo: false,
        practiceYears: 1,
        classCredits: {
          group: 0,
          term: 0
        },
        footprints: [],
        schedule: [],
        bookingHistory: [],
        loading: false,
        loginStep: '',
        defaultAvatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
        avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
        tempAvatarUrl: '',
        phoneNumber: ''
      });
      
      console.log('页面数据已重置');
    }
    
    console.log('3. 清除应用全局数据...');
    
    // 清除应用全局数据
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.userInfo = null;
      app.globalData.openid = null;
      console.log('应用全局数据已清除');
    }
    
    console.log('✅ 所有登录数据清除完成！');
    console.log('现在可以重新测试登录流程');
    
    return {
      success: true,
      message: '登录数据清除成功'
    };
    
  } catch (error) {
    console.error('❌ 清除登录数据失败:', error);
    return {
      success: false,
      message: '清除失败: ' + error.message
    };
  }
}

// 阻止自动加载用户数据
function disableAutoLoad() {
  try {
    console.log('阻止页面自动加载用户数据...');
    
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    if (currentPage && currentPage.route === 'pages/profile/profile') {
      // 临时禁用自动加载函数
      currentPage._originalCheckLoginStatus = currentPage.checkLoginStatus;
      currentPage._originalLoadUserData = currentPage.loadUserData;
      
      currentPage.checkLoginStatus = function() {
        console.log('🚫 checkLoginStatus 已被临时禁用');
        this.setData({ hasUserInfo: false });
      };
      
      currentPage.loadUserData = function() {
        console.log('🚫 loadUserData 已被临时禁用');
      };
      
      console.log('✅ 自动加载已禁用');
    }
    
    return { success: true, message: '自动加载已禁用' };
    
  } catch (error) {
    console.error('禁用自动加载失败:', error);
    return { success: false, message: '禁用失败: ' + error.message };
  }
}

// 恢复自动加载用户数据
function enableAutoLoad() {
  try {
    console.log('恢复页面自动加载用户数据...');
    
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    if (currentPage && currentPage.route === 'pages/profile/profile') {
      // 恢复原始函数
      if (currentPage._originalCheckLoginStatus) {
        currentPage.checkLoginStatus = currentPage._originalCheckLoginStatus;
        delete currentPage._originalCheckLoginStatus;
      }
      
      if (currentPage._originalLoadUserData) {
        currentPage.loadUserData = currentPage._originalLoadUserData;
        delete currentPage._originalLoadUserData;
      }
      
      console.log('✅ 自动加载已恢复');
    }
    
    return { success: true, message: '自动加载已恢复' };
    
  } catch (error) {
    console.error('恢复自动加载失败:', error);
    return { success: false, message: '恢复失败: ' + error.message };
  }
}

// 强制刷新页面的函数（不触发自动加载）
function forceRefreshPage() {
  try {
    console.log('强制刷新页面（不自动加载数据）...');
    
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    if (currentPage && currentPage.route === 'pages/profile/profile') {
      // 先禁用自动加载
      disableAutoLoad();
      
      // 重新生成足迹数据
      if (typeof currentPage.generateFootprints === 'function') {
        currentPage.generateFootprints();
      }
      
      console.log('页面已刷新（未自动加载用户数据）');
    }
    
    return {
      success: true,
      message: '页面刷新成功'
    };
    
  } catch (error) {
    console.error('页面刷新失败:', error);
    return {
      success: false,
      message: '刷新失败: ' + error.message
    };
  }
}

// 删除云端数据库中的用户相关所有数据
async function deleteAllUserData() {
  try {
    console.log('🗑️ 正在删除用户的所有相关云端数据...');
    
    // 首先获取当前用户的 openid
    const loginResult = await wx.cloud.callFunction({
      name: 'login'
    });
    
    if (!loginResult.result || !loginResult.result.openid) {
      console.warn('⚠️ 无法获取用户 openid，跳过云端数据删除');
      return { success: false, message: '无法获取用户标识' };
    }
    
    const openid = loginResult.result.openid;
    console.log('当前用户 openid:', openid);
    
    const db = wx.cloud.database();
    let totalDeleted = 0;
    const results = {};
    
    // 1. 删除用户基本信息
    console.log('1️⃣ 删除用户基本信息...');
    try {
      const userResult = await db.collection('users').where({ openid }).remove();
      const userDeleted = userResult.stats?.removed || 0;
      results.users = userDeleted;
      totalDeleted += userDeleted;
      console.log(`   ✅ 删除用户记录: ${userDeleted} 条`);
    } catch (error) {
      console.warn('   ⚠️ 删除用户记录失败:', error.message);
      results.users = 0;
    }
    
    // 2. 删除团课预约记录
    console.log('2️⃣ 删除团课预约记录...');
    try {
      const bookingResult = await db.collection('bookings').where({ openid }).remove();
      const bookingDeleted = bookingResult.stats?.removed || 0;
      results.bookings = bookingDeleted;
      totalDeleted += bookingDeleted;
      console.log(`   ✅ 删除团课预约: ${bookingDeleted} 条`);
    } catch (error) {
      console.warn('   ⚠️ 删除团课预约失败:', error.message);
      results.bookings = 0;
    }
    
    // 3. 删除私教预约记录
    console.log('3️⃣ 删除私教预约记录...');
    try {
      const privateBookingResult = await db.collection('privateBookings').where({ openid }).remove();
      const privateDeleted = privateBookingResult.stats?.removed || 0;
      results.privateBookings = privateDeleted;
      totalDeleted += privateDeleted;
      console.log(`   ✅ 删除私教预约: ${privateDeleted} 条`);
    } catch (error) {
      console.warn('   ⚠️ 删除私教预约失败:', error.message);
      results.privateBookings = 0;
    }
    
    // 4. 删除通知记录
    console.log('4️⃣ 删除通知记录...');
    try {
      const notificationResult = await db.collection('notifications').where({ openid }).remove();
      const notificationDeleted = notificationResult.stats?.removed || 0;
      results.notifications = notificationDeleted;
      totalDeleted += notificationDeleted;
      console.log(`   ✅ 删除通知记录: ${notificationDeleted} 条`);
    } catch (error) {
      console.warn('   ⚠️ 删除通知记录失败:', error.message);
      results.notifications = 0;
    }
    
    console.log(`✅ 用户数据删除完成！总共删除 ${totalDeleted} 条记录`);
    console.log('详细统计:', results);
    
    return { 
      success: true, 
      message: `删除了 ${totalDeleted} 条用户相关记录`,
      details: results
    };
    
  } catch (error) {
    console.error('❌ 删除用户数据失败:', error);
    return { success: false, message: '删除失败: ' + error.message };
  }
}

// 删除所有课程日历数据
async function deleteAllSchedules() {
  try {
    console.log('🗓️ 正在删除所有课程日历数据...');
    
    const db = wx.cloud.database();
    let totalDeleted = 0;
    const results = {};
    
    // 1. 删除课程安排
    console.log('1️⃣ 删除课程安排数据...');
    try {
      const scheduleResult = await db.collection('courseSchedule').get();
      console.log(`   找到 ${scheduleResult.data.length} 条课程安排记录`);
      
      if (scheduleResult.data.length > 0) {
        const deleteResult = await db.collection('courseSchedule').where({
          _id: db.command.exists(true)
        }).remove();
        const scheduleDeleted = deleteResult.stats?.removed || 0;
        results.courseSchedule = scheduleDeleted;
        totalDeleted += scheduleDeleted;
        console.log(`   ✅ 删除课程安排: ${scheduleDeleted} 条`);
      } else {
        results.courseSchedule = 0;
        console.log('   ℹ️ 没有课程安排需要删除');
      }
    } catch (error) {
      console.warn('   ⚠️ 删除课程安排失败:', error.message);
      results.courseSchedule = 0;
    }
    
    // 2. 删除课程基础信息
    console.log('2️⃣ 删除课程基础信息...');
    try {
      const courseResult = await db.collection('courses').get();
      console.log(`   找到 ${courseResult.data.length} 条课程基础信息`);
      
      if (courseResult.data.length > 0) {
        const deleteResult = await db.collection('courses').where({
          _id: db.command.exists(true)
        }).remove();
        const courseDeleted = deleteResult.stats?.removed || 0;
        results.courses = courseDeleted;
        totalDeleted += courseDeleted;
        console.log(`   ✅ 删除课程信息: ${courseDeleted} 条`);
      } else {
        results.courses = 0;
        console.log('   ℹ️ 没有课程信息需要删除');
      }
    } catch (error) {
      console.warn('   ⚠️ 删除课程信息失败:', error.message);
      results.courses = 0;
    }
    
    // 3. 删除管理员操作日志
    console.log('3️⃣ 删除管理员操作日志...');
    try {
      const logResult = await db.collection('adminLogs').get();
      console.log(`   找到 ${logResult.data.length} 条管理员日志`);
      
      if (logResult.data.length > 0) {
        const deleteResult = await db.collection('adminLogs').where({
          _id: db.command.exists(true)
        }).remove();
        const logDeleted = deleteResult.stats?.removed || 0;
        results.adminLogs = logDeleted;
        totalDeleted += logDeleted;
        console.log(`   ✅ 删除管理员日志: ${logDeleted} 条`);
      } else {
        results.adminLogs = 0;
        console.log('   ℹ️ 没有管理员日志需要删除');
      }
    } catch (error) {
      console.warn('   ⚠️ 删除管理员日志失败:', error.message);
      results.adminLogs = 0;
    }
    
    console.log(`✅ 课程数据删除完成！总共删除 ${totalDeleted} 条记录`);
    console.log('详细统计:', results);
    
    return { 
      success: true, 
      message: `删除了 ${totalDeleted} 条课程相关记录`,
      details: results
    };
    
  } catch (error) {
    console.error('❌ 删除课程数据失败:', error);
    return { success: false, message: '删除失败: ' + error.message };
  }
}

// 保持向后兼容的函数别名
async function deleteCloudUserData() {
  return await deleteAllUserData();
}

// 超级强力重置（删除用户数据 + 清除本地存储）
async function superReset() {
  console.log('=== 执行超级强力重置流程 ===');
  
  try {
    // 1. 先禁用自动加载
    console.log('步骤 1/5: 禁用自动加载');
    disableAutoLoad();
    
    // 2. 删除云端用户数据
    console.log('步骤 2/5: 删除云端用户数据');
    const cloudResult = await deleteAllUserData();
    
    // 3. 使用官方API清除所有本地存储
    console.log('步骤 3/5: 使用官方API清除本地存储');
    const storageResult = quickClearStorage();
    
    // 4. 重置页面数据
    console.log('步骤 4/5: 重置页面数据');
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    if (currentPage && currentPage.route === 'pages/profile/profile') {
      currentPage.setData({
        userInfo: {},
        hasUserInfo: false,
        practiceYears: 1,
        classCredits: { group: 0, term: 0 },
        footprints: [],
        schedule: [],
        bookingHistory: [],
        loading: false,
        loginStep: '',
        defaultAvatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
        avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
        tempAvatarUrl: '',
        phoneNumber: ''
      });
      console.log('✅ 页面数据已重置');
    }
    
    // 5. 清除应用全局数据
    console.log('步骤 5/5: 清除应用全局数据');
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.userInfo = null;
      app.globalData.openid = null;
      console.log('✅ 应用全局数据已清除');
    }
    
    console.log('🎉🎉🎉 超级强力重置完成！🎉🎉🎉');
    console.log('用户数据删除结果:', cloudResult.message);
    console.log('本地存储清除结果:', storageResult.message);
    console.log('现在是完全全新的状态，可以测试首次登录流程！');
    
    wx.showModal({
      title: '重置成功',
      content: '已完成超级强力重置，现在可以测试首次登录流程！',
      showCancel: false
    });
    
  } catch (error) {
    console.error('❌ 超级强力重置失败:', error);
    
    wx.showModal({
      title: '重置失败',
      content: '重置过程中出现错误: ' + error.message,
      showCancel: false
    });
  }
}

// 完全清空数据库（用户数据 + 课程数据）
async function fullDatabaseReset() {
  console.log('=== 执行完全数据库重置流程 ===');
  console.log('⚠️ 这将删除所有用户数据和课程数据！');
  
  try {
    // 1. 先禁用自动加载
    console.log('步骤 1/6: 禁用自动加载');
    disableAutoLoad();
    
    // 2. 删除云端用户数据
    console.log('步骤 2/6: 删除云端用户数据');
    const userResult = await deleteAllUserData();
    
    // 3. 删除课程数据
    console.log('步骤 3/6: 删除所有课程数据');
    const scheduleResult = await deleteAllSchedules();
    
    // 4. 使用官方API清除所有本地存储
    console.log('步骤 4/6: 使用官方API清除本地存储');
    const storageResult = quickClearStorage();
    
    // 5. 重置页面数据
    console.log('步骤 5/6: 重置页面数据');
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    if (currentPage && currentPage.route === 'pages/profile/profile') {
      currentPage.setData({
        userInfo: {},
        hasUserInfo: false,
        practiceYears: 1,
        classCredits: { group: 0, term: 0 },
        footprints: [],
        schedule: [],
        bookingHistory: [],
        loading: false,
        loginStep: '',
        defaultAvatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
        avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
        tempAvatarUrl: '',
        phoneNumber: ''
      });
      console.log('✅ 页面数据已重置');
    }
    
    // 6. 清除应用全局数据
    console.log('步骤 6/6: 清除应用全局数据');
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.userInfo = null;
      app.globalData.openid = null;
      console.log('✅ 应用全局数据已清除');
    }
    
    console.log('🎉🎉🎉 完全数据库重置完成！🎉🎉🎉');
    console.log('用户数据删除结果:', userResult.message);
    console.log('课程数据删除结果:', scheduleResult.message);
    console.log('本地存储清除结果:', storageResult.message);
    console.log('现在是完全全新的状态，可以重新开始测试所有功能！');
    
    wx.showModal({
      title: '完全重置成功',
      content: `数据库已完全清空！\n用户数据: ${userResult.message}\n课程数据: ${scheduleResult.message}`,
      showCancel: false
    });
    
  } catch (error) {
    console.error('❌ 完全数据库重置失败:', error);
    
    wx.showModal({
      title: '重置失败',
      content: '重置过程中出现错误: ' + error.message,
      showCancel: false
    });
  }
}

// 完整重置流程（包含云端数据删除）
async function fullResetWithCloud() {
  console.log('=== 执行完整重置流程（包含云端数据）===');
  
  try {
    // 1. 删除云端数据
    console.log('步骤 1/3: 删除云端用户数据');
    const cloudResult = await deleteCloudUserData();
    
    // 2. 清除本地数据
    console.log('步骤 2/3: 清除本地数据');
    const clearResult = clearAllLoginData();
    
    // 3. 延迟刷新页面
    console.log('步骤 3/3: 刷新页面');
    setTimeout(() => {
      const refreshResult = forceRefreshPage();
      
      if (clearResult.success && refreshResult.success) {
        console.log('🎉 完整重置成功！现在是全新的登录状态');
        console.log('云端删除结果:', cloudResult.message);
        
        wx.showToast({
          title: '完整重置成功',
          icon: 'success',
          duration: 2000
        });
      } else {
        console.error('重置过程中出现问题');
        
        wx.showToast({
          title: '重置失败',
          icon: 'error'
        });
      }
    }, 100);
    
  } catch (error) {
    console.error('❌ 完整重置失败:', error);
    
    wx.showToast({
      title: '重置失败',
      icon: 'error'
    });
  }
}

// 完整重置流程（仅本地，保持向后兼容）
function fullReset() {
  console.log('=== 执行本地重置流程 ===');
  
  // 1. 清除数据
  const clearResult = clearAllLoginData();
  
  // 2. 延迟刷新页面
  setTimeout(() => {
    const refreshResult = forceRefreshPage();
    
    if (clearResult.success && refreshResult.success) {
      console.log('🎉 本地重置成功！');
      console.log('⚠️ 注意：云端用户数据仍然存在，可能会自动登录');
      
      wx.showToast({
        title: '本地重置成功',
        icon: 'success'
      });
    } else {
      console.error('重置过程中出现问题');
      
      wx.showToast({
        title: '重置失败',
        icon: 'error'
      });
    }
  }, 100);
}

// 验证当前状态的函数
function checkCurrentState() {
  console.log('=== 检查当前登录状态 ===');
  
  // 检查本地存储
  console.log('本地存储状态:');
  const storageKeys = ['userInfo', 'hasUserInfo', 'openid', 'phoneNumber'];
  storageKeys.forEach(key => {
    try {
      const value = wx.getStorageSync(key);
      console.log(`- ${key}:`, value || '(空)');
    } catch (error) {
      console.log(`- ${key}: 读取失败`);
    }
  });
  
  // 检查页面状态
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  
  if (currentPage && currentPage.route === 'pages/profile/profile') {
    console.log('页面数据状态:');
    console.log('- hasUserInfo:', currentPage.data.hasUserInfo);
    console.log('- phoneNumber:', currentPage.data.phoneNumber || '(空)');
    console.log('- avatarUrl:', currentPage.data.avatarUrl === currentPage.data.defaultAvatarUrl ? '默认头像' : '已设置');
  }
  
  // 检查应用状态
  const app = getApp();
  if (app && app.globalData) {
    console.log('应用全局状态:');
    console.log('- userInfo:', app.globalData.userInfo || '(空)');
    console.log('- openid:', app.globalData.openid || '(空)');
  }
}

// 导出所有函数
window.clearLoginTools = {
  // 🌟 推荐使用
  superReset,                 // 删除用户数据 + 清除本地存储
  fullDatabaseReset,          // 完全清空数据库（用户 + 课程）
  quickClearStorage,          // 仅清除本地存储
  
  // 单独功能
  deleteAllUserData,          // 仅删除用户相关数据
  deleteAllSchedules,         // 仅删除课程日历数据
  
  // 其他功能
  clearAllLoginData,
  forceRefreshPage,
  fullReset,
  fullResetWithCloud,
  deleteCloudUserData,        // 保持向后兼容
  checkCurrentState,
  disableAutoLoad,
  enableAutoLoad
};

console.log('🗑️ 清除数据工具已加载！');
console.log('');
console.log('🔧 可用命令:');
console.log('');
console.log('🌟🌟🌟 最强推荐 🌟🌟🌟');
console.log('window.clearLoginTools.superReset()          // 删除用户数据 + 清除本地存储');
console.log('window.clearLoginTools.fullDatabaseReset()   // 🚨 完全清空数据库（用户 + 课程）');
console.log('window.clearLoginTools.quickClearStorage()   // 仅清除本地存储');
console.log('');
console.log('🎯 单独功能:');
console.log('window.clearLoginTools.deleteAllUserData()   // 仅删除用户相关数据');
console.log('window.clearLoginTools.deleteAllSchedules()  // 仅删除课程日历数据');
console.log('');
console.log('🔧 其他选项:');
console.log('window.clearLoginTools.fullResetWithCloud()  // 完整重置（包含云端数据）');
console.log('window.clearLoginTools.fullReset()           // 本地重置（云端数据保留）');
console.log('window.clearLoginTools.clearAllLoginData()   // 仅清除本地数据');
console.log('window.clearLoginTools.disableAutoLoad()     // 🛡️ 禁用自动加载用户数据');
console.log('window.clearLoginTools.enableAutoLoad()      // 🔄 恢复自动加载用户数据');
console.log('window.clearLoginTools.checkCurrentState()   // 检查当前状态');
console.log('');
console.log('💡 推荐使用场景:');
console.log('📱 测试用户注册/登录流程:');
console.log('   → window.clearLoginTools.superReset()');
console.log('');
console.log('🗓️ 测试课程管理功能:');
console.log('   → window.clearLoginTools.deleteAllSchedules()');
console.log('');
console.log('🚨 完全重新开始测试:');
console.log('   → window.clearLoginTools.fullDatabaseReset()');
console.log('');
console.log('⚡ 使用了微信官方的 wx.clearStorageSync() API，更彻底更安全！');
