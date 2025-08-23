// 自动更新课程状态云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  console.log('开始执行课程状态更新任务');
  
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    // 获取所有需要更新状态的预约记录
    const allBookings = await db.collection('bookings')
      .where({
        status: _.in(['booked', 'waitlist']) // 只处理已预约和等位中的记录
      })
      .get();
    
    console.log('找到需要检查的预约记录数量:', allBookings.data.length);
    
    let updatedBookings = 0;
    let completedCount = 0;
    let failedCount = 0;
    
    // 处理每个预约记录
    for (const booking of allBookings.data) {
      try {
        // 获取对应的课程安排信息
        const scheduleResult = await db.collection('courseSchedule')
          .doc(booking.scheduleId)
          .get();
        
        if (!scheduleResult.data) {
          console.log('课程安排不存在，跳过:', booking.scheduleId);
          continue;
        }
        
        const schedule = scheduleResult.data;
        const courseDate = schedule.date;
        const courseEndTime = schedule.endTime;
        
        // 判断课程是否已结束
        let courseEnded = false;
        if (courseDate < today) {
          // 之前的日期，肯定已结束
          courseEnded = true;
        } else if (courseDate === today) {
          // 今天的课程，需要比较结束时间
          courseEnded = courseEndTime <= currentTime;
        }
        
        if (courseEnded) {
          let newStatus = '';
          let updateReason = '';
          
          if (booking.status === 'booked') {
            // 已预约的课程结束后标记为已完成
            newStatus = 'done';
            updateReason = '课程已完成';
            completedCount++;
          } else if (booking.status === 'waitlist') {
            // 等位中的课程结束后标记为等位失败，并返还次数
            newStatus = 'fail';
            updateReason = '等位失败，课程已开始';
            failedCount++;
            
            // 返还次数
            try {
              await db.collection('users')
                .where({ openid: booking.userId })
                .update({
                  data: {
                    groupCredits: _.inc(booking.creditsUsed || 1),
                    updateTime: new Date()
                  }
                });
              console.log('为等位失败用户返还次数:', booking.userId, booking.creditsUsed || 1);
            } catch (error) {
              console.error('返还次数失败:', error);
            }
          }
          
          // 更新预约记录状态
          await db.collection('bookings').doc(booking._id).update({
            data: {
              status: newStatus,
              statusUpdateTime: new Date(),
              statusUpdateReason: updateReason
            }
          });
          
          // 如果是等位失败，还需要从课程安排中移除
          if (newStatus === 'fail' && schedule.bookings) {
            const updatedScheduleBookings = schedule.bookings.filter(b => b.userId !== booking.userId);
            await db.collection('courseSchedule').doc(booking.scheduleId).update({
              data: {
                bookings: updatedScheduleBookings
              }
            });
          }
          
          updatedBookings++;
          console.log('更新预约状态:', booking._id, '从', booking.status, '到', newStatus);
        }
      } catch (error) {
        console.error('处理预约记录失败:', booking._id, error);
      }
    }
    
    console.log('课程状态更新任务完成');
    console.log('总处理记录数:', updatedBookings);
    console.log('已完成课程数:', completedCount);
    console.log('等位失败数:', failedCount);
    
    return {
      success: true,
      message: `成功更新${updatedBookings}条记录`,
      totalProcessed: updatedBookings,
      completedCourses: completedCount,
      failedWaitlist: failedCount
    };
    
  } catch (error) {
    console.error('课程状态更新任务失败:', error);
    return {
      success: false,
      message: '课程状态更新任务失败',
      error: error.message
    };
  }
};
