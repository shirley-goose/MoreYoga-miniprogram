// 取消预约云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { bookingId } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  console.log('取消预约，bookingId:', bookingId, 'openid:', openid);
  
  try {
    // 查询预约信息
    const bookingResult = await db.collection('bookings').doc(bookingId).get();
    if (!bookingResult.data) {
      return { success: false, message: '预约记录不存在' };
    }
    
    const booking = bookingResult.data;
    console.log('预约信息:', booking);
    
    // 验证是否为本人的预约
    if (booking.userId !== openid) {
      return { success: false, message: '无权取消此预约' };
    }
    
    // 检查预约状态
    if (booking.status === 'cancelled') {
      return { success: false, message: '预约已取消' };
    }
    
    // 获取课程安排信息
    const scheduleResult = await db.collection('courseSchedule').doc(booking.scheduleId).get();
    const schedule = scheduleResult.data;
    console.log('课程安排信息:', schedule);
    
    if (!schedule) {
      return { success: false, message: '课程安排不存在' };
    }
    
    // 检查是否在开课前1小时内
    const now = new Date();
    const classDateTime = new Date(`${schedule.date}T${schedule.startTime}:00`);
    const timeDiff = classDateTime.getTime() - now.getTime();
    const oneHour = 60 * 60 * 1000;
    
    console.log('时间检查:', {
      now: now.toISOString(),
      classDateTime: classDateTime.toISOString(),
      timeDiff: timeDiff / (1000 * 60), // 分钟
      canCancel: timeDiff > oneHour
    });
    
    if (timeDiff <= oneHour && timeDiff > 0) {
      return { success: false, message: '开课前1小时内不能取消预约' };
    }
    
    // 取消预约
    await db.collection('bookings').doc(bookingId).update({
      data: {
        status: 'cancelled',
        cancelTime: new Date()
      }
    });
    
    // 如果是正式预约（非等位），需要退还次卡并更新课程安排
    if (booking.status === 'booked') {
      // 退还次卡
      await db.collection('users').where({ openid }).update({
        data: {
          groupCredits: _.inc(booking.creditsUsed || 1),
          updateTime: new Date()
        }
      });
      
      console.log('退还次卡:', booking.creditsUsed || 1);
      
      // 更新课程安排的当前预约人数
      const newCurrentBookings = Math.max(0, (schedule.currentBookings || 0) - 1);
      await db.collection('courseSchedule').doc(booking.scheduleId).update({
        data: {
          currentBookings: newCurrentBookings
        }
      });
      
      console.log('更新课程当前预约人数:', newCurrentBookings);
      
      // 从课程安排的bookings数组中移除此预约
      if (schedule.bookings && schedule.bookings.length > 0) {
        const updatedBookings = schedule.bookings.filter(b => b.userId !== openid);
        await db.collection('courseSchedule').doc(booking.scheduleId).update({
          data: {
            bookings: updatedBookings
          }
        });
        console.log('从课程安排中移除预约记录');
      }
    }
    
    return {
      success: true,
      message: '取消预约成功',
      refunded: booking.status === 'booked' // 是否退还了次卡
    };
    
  } catch (error) {
    console.error('取消预约失败:', error);
    return {
      success: false,
      message: '取消预约失败，请重试',
      error: error.message
    };
  }
};
