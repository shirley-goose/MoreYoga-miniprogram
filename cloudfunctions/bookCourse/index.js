// 预约课程云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { scheduleId, courseName, date, startTime, endTime, teacherName, creditsRequired } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  console.log('预约课程，参数:', event);
  console.log('用户openid:', openid);
  
  try {
    // 查询课程安排信息
    const scheduleResult = await db.collection('courseSchedule').doc(scheduleId).get();
    if (!scheduleResult.data) {
      return { success: false, message: '课程不存在' };
    }
    
    const schedule = scheduleResult.data;
    console.log('课程安排信息:', schedule);
    
    // 检查课程是否在开始前1小时内
    const now = new Date();
    const classDateTime = new Date(`${schedule.date}T${schedule.startTime}:00`);
    const timeDiff = classDateTime.getTime() - now.getTime();
    const oneHour = 60 * 60 * 1000;
    
    if (timeDiff <= oneHour && timeDiff > 0) {
      return { success: false, message: '开课前1小时内不能预约' };
    }
    
    // 检查是否已预约（从schedule.bookings数组中查找）
    const userBooking = schedule.bookings && schedule.bookings.find(booking => booking.userId === openid);
    if (userBooking) {
      return { success: false, message: '您已预约此课程' };
    }
    
    // 检查用户次卡余额
    const userResult = await db.collection('users').where({ openid }).get();
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在，请先注册' };
    }
    
    const user = userResult.data[0];
    const requiredCredits = creditsRequired || 1;
    
    console.log('用户信息:', user);
    console.log('需要次卡:', requiredCredits);
    
    if (user.groupCredits < requiredCredits) {
      return { 
        success: false, 
        message: `团课次卡余额不足，需要${requiredCredits}次，当前余额${user.groupCredits}次` 
      };
    }
    
    // 检查课程是否已满
    const currentBookings = schedule.currentBookings || 0;
    const maxCapacity = schedule.maxCapacity || 20;
    const isWaitlist = currentBookings >= maxCapacity;
    
    console.log('当前预约人数:', currentBookings);
    console.log('最大容量:', maxCapacity);
    console.log('是否需要等位:', isWaitlist);
    
    // 创建预约记录
    const bookingData = {
      userId: openid,
      scheduleId: scheduleId,
      courseName: courseName,
      teacherName: teacherName,
      date: date,
      startTime: startTime,
      endTime: endTime,
      status: isWaitlist ? 'waitlist' : 'booked',
      creditsUsed: requiredCredits,
      createTime: new Date(),
      position: isWaitlist ? (schedule.bookings ? schedule.bookings.filter(b => b.status === 'waitlist').length + 1 : 1) : null
    };
    
    console.log('预约记录:', bookingData);
    
    // 更新课程安排的预约信息
    const newBookings = schedule.bookings || [];
    newBookings.push(bookingData);
    
    const updateData = {
      bookings: newBookings,
      currentBookings: isWaitlist ? currentBookings : currentBookings + 1
    };
    
    // 扣除用户次卡（预约即扣除，无论是直接成功还是等位）
    const newGroupCredits = user.groupCredits - requiredCredits;
    
    // 更新用户次卡余额
    await db.collection('users').doc(user._id).update({
      data: {
        groupCredits: newGroupCredits
      }
    });
    
    console.log('扣除次卡成功，剩余:', newGroupCredits, '状态:', isWaitlist ? '等位' : '已预约');
    
    // 更新课程安排
    await db.collection('courseSchedule').doc(scheduleId).update({
      data: updateData
    });
    
    console.log('更新课程安排成功');
    
    // 创建预约记录到bookings集合（用于历史记录查询）
    await db.collection('bookings').add({
      data: bookingData
    });
    
    console.log('创建预约记录成功');
    
    return {
      success: true,
      message: isWaitlist ? '已加入等位队列' : '预约成功',
      status: bookingData.status,
      position: bookingData.position,
      creditsUsed: requiredCredits,
      remainingCredits: newGroupCredits
    };
    
  } catch (error) {
    console.error('预约课程失败:', error);
    return {
      success: false,
      message: '预约失败，请重试',
      error: error.message
    };
  }
};