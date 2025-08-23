// 课程开始时自动返还等位未成功的次数云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  console.log('开始执行等位次数返还任务');
  
  try {
    const now = new Date();
    
    // 查找所有已开始的课程（需要分别处理日期和时间）
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    // 先获取今天及之前的所有活跃课程
    const allCourses = await db.collection('courseSchedule')
      .where({
        status: 'active',
        date: _.lte(today)
      })
      .get();
    
    // 筛选出已开始的课程
    const startedCourses = allCourses.data.filter(course => {
      if (course.date < today) {
        // 之前的日期，肯定已开始
        return true;
      } else if (course.date === today) {
        // 今天的课程，需要比较时间
        return course.startTime <= currentTime;
      }
      return false;
    });
    
    console.log('找到已开始的课程数量:', startedCourses.length);
    
    let totalRefunded = 0;
    let totalUsers = 0;
    
    // 处理每个已开始的课程
    for (const course of startedCourses) {
      console.log('处理课程:', course.courseName, course.date, course.startTime);
      
      // 查找该课程的所有等位预约
      const waitlistBookings = await db.collection('bookings')
        .where({
          scheduleId: course._id,
          status: 'waitlist'
        })
        .get();
      
      console.log('课程', course.courseName, '等位人数:', waitlistBookings.data.length);
      
      // 为每个等位用户返还次数
      for (const booking of waitlistBookings.data) {
        try {
          // 返还次数
          await db.collection('users')
            .where({ openid: booking.userId })
            .update({
              data: {
                groupCredits: _.inc(booking.creditsUsed || 1),
                updateTime: new Date()
              }
            });
          
          // 更新预约状态为已返还
          await db.collection('bookings').doc(booking._id).update({
            data: {
              status: 'refunded', // 新状态：已返还
              refundTime: new Date(),
              refundReason: '课程开始时等位未成功'
            }
          });
          
          // 从课程安排的bookings数组中移除等位记录
          if (course.bookings && course.bookings.length > 0) {
            const updatedBookings = course.bookings.filter(b => b.userId !== booking.userId);
            await db.collection('courseSchedule').doc(course._id).update({
              data: {
                bookings: updatedBookings
              }
            });
          }
          
          console.log('为用户', booking.userId, '返还次数:', booking.creditsUsed || 1);
          totalRefunded += (booking.creditsUsed || 1);
          totalUsers++;
          
        } catch (error) {
          console.error('为用户', booking.userId, '返还次数失败:', error);
        }
      }
    }
    
    console.log('等位次数返还任务完成，共为', totalUsers, '个用户返还', totalRefunded, '次课程');
    
    return {
      success: true,
      message: `成功为${totalUsers}个用户返还${totalRefunded}次课程`,
      processedCourses: startedCourses.length,
      refundedUsers: totalUsers,
      totalCreditsRefunded: totalRefunded
    };
    
  } catch (error) {
    console.error('等位次数返还任务失败:', error);
    return {
      success: false,
      message: '等位次数返还任务失败',
      error: error.message
    };
  }
};
