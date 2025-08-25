// 取消预约云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { bookingId, promoteWaitlist = false } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  console.log('取消预约，bookingId:', bookingId, 'openid:', openid, 'promoteWaitlist:', promoteWaitlist);
  
  try {
    let promotedUser = null; // 声明递补用户变量
    
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
    
    // 检查是否在开课前1小时内（只有在不需要递补等位时才检查）
    if (!promoteWaitlist) {
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
    } else {
      console.log('允许递补等位，跳过时间限制检查');
    }
    
    // 取消预约
    await db.collection('bookings').doc(bookingId).update({
      data: {
        status: 'cancelled',
        cancelTime: new Date()
      }
    });
    
    // 退还次卡（无论是正式预约还是等位，都需要退还）
    await db.collection('users').where({ openid }).update({
      data: {
        groupCredits: _.inc(booking.creditsUsed || 1),
        updateTime: new Date()
      }
    });
    
    console.log('退还次卡:', booking.creditsUsed || 1, '原状态:', booking.status);
    
    // 如果是正式预约，需要更新课程安排并处理递补
    if (booking.status === 'booked') {
      
      // 从课程安排的bookings数组中移除此预约
      let updatedBookings = [];
      if (schedule.bookings && schedule.bookings.length > 0) {
        updatedBookings = schedule.bookings.filter(b => b.userId !== openid);
      }
      
      // 检查是否有等位的人需要递补
      const waitlistBookings = updatedBookings.filter(b => b.status === 'waitlist')
        .sort((a, b) => new Date(a.createTime) - new Date(b.createTime)); // 按创建时间排序，最早的优先
      
      let newCurrentBookings = Math.max(0, (schedule.currentBookings || 0) - 1);
      
      if (waitlistBookings.length > 0) {
        // 有等位的人，递补第一个
        const firstWaitlist = waitlistBookings[0];
        console.log('找到等位用户，准备递补:', firstWaitlist);
        
        // 更新等位用户状态为已预约
        const waitlistIndex = updatedBookings.findIndex(b => b.userId === firstWaitlist.userId);
        if (waitlistIndex !== -1) {
          updatedBookings[waitlistIndex].status = 'booked';
          updatedBookings[waitlistIndex].position = null;
          updatedBookings[waitlistIndex].promotedTime = new Date();
          
          // 更新其他等位用户的位置
          const remainingWaitlist = updatedBookings.filter(b => b.status === 'waitlist')
            .sort((a, b) => new Date(a.createTime) - new Date(b.createTime));
          remainingWaitlist.forEach((booking, index) => {
            const bookingIndex = updatedBookings.findIndex(b => b.userId === booking.userId);
            if (bookingIndex !== -1) {
              updatedBookings[bookingIndex].position = index + 1;
            }
          });
          
          newCurrentBookings = schedule.currentBookings || 0; // 保持原有预约人数，因为有人递补
          promotedUser = firstWaitlist;
          
          // 递补用户在等位时已经扣除了次数，这里不需要再次扣除
          // 直接更新bookings集合中的记录
          try {
            const promotedBookingResult = await db.collection('bookings')
              .where({
                userId: firstWaitlist.userId,
                scheduleId: booking.scheduleId,
                status: 'waitlist'
              })
              .get();
            
            if (promotedBookingResult.data.length > 0) {
              await db.collection('bookings').doc(promotedBookingResult.data[0]._id).update({
                data: {
                  status: 'booked',
                  position: null,
                  promotedTime: new Date()
                }
              });
              console.log('更新bookings集合中的递补记录成功');
            }
          } catch (error) {
            console.error('更新递补用户记录失败:', error);
          }
        }
      }
      
      // 更新课程安排
      await db.collection('courseSchedule').doc(booking.scheduleId).update({
        data: {
          bookings: updatedBookings,
          currentBookings: newCurrentBookings
        }
      });
      
      console.log('更新课程安排成功，当前预约人数:', newCurrentBookings);
      if (promotedUser) {
        console.log('递补成功，递补用户:', promotedUser.userId);
      }
    } else if (booking.status === 'waitlist') {
      // 如果取消的是等位，需要更新其他等位用户的位置
      if (schedule.bookings && schedule.bookings.length > 0) {
        const updatedBookings = schedule.bookings.filter(b => b.userId !== openid);
        
        // 重新计算等位位置
        const waitlistBookings = updatedBookings.filter(b => b.status === 'waitlist')
          .sort((a, b) => new Date(a.createTime) - new Date(b.createTime));
        
        waitlistBookings.forEach((booking, index) => {
          const bookingIndex = updatedBookings.findIndex(b => b.userId === booking.userId);
          if (bookingIndex !== -1) {
            updatedBookings[bookingIndex].position = index + 1;
          }
        });
        
        await db.collection('courseSchedule').doc(booking.scheduleId).update({
          data: {
            bookings: updatedBookings
          }
        });
        
        console.log('更新等位队列位置成功');
      }
    }
    
    return {
      success: true,
      message: '取消预约成功',
      refunded: true, // 现在无论什么状态都会退还次卡
      refundedCredits: booking.creditsUsed || 1,
      promotedUser: promotedUser, // 返回递补用户信息
      promoted: promotedUser ? {
        userId: promotedUser.userId,
        message: '已自动递补等位用户'
      } : null
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
