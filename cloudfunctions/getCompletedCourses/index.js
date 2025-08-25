// 获取已完成课程云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const now = new Date();
    
    console.log('查询已完成课程，当前时间:', now.toISOString());
    
    // 查询所有预约记录（包括已完成、已取消等状态）
    const bookingsResult = await db.collection('bookings')
      .where({
        status: db.command.in(['done', 'cancelled', 'fail', 'booked', 'waitlist'])
      })
      .get();
    
    console.log('找到的预约记录数量:', bookingsResult.data.length);
    
    // 按课程安排分组
    const courseMap = new Map();
    
    let processedCount = 0;
    let completedCourseCount = 0;
    
    for (const booking of bookingsResult.data) {
      try {
        // 获取课程安排信息
        const scheduleResult = await db.collection('courseSchedule')
          .doc(booking.scheduleId)
          .get();
        
        if (!scheduleResult.data) {
          console.log('课程安排不存在:', booking.scheduleId);
          continue;
        }
        
        const schedule = scheduleResult.data;
        const classStartTime = new Date(`${schedule.date}T${schedule.startTime}:00`);
        
        // 只处理已开始的课程
        if (classStartTime >= now) {
          continue;
        }
        
        const courseKey = `${schedule.date}_${schedule.startTime}_${schedule.courseName}`;
        
        // 获取用户信息
        let userInfo = { name: '未知用户', phoneNumber: '未提供' };
        if (booking.userId) {
          try {
            const userResult = await db.collection('users')
              .where({ openid: booking.userId })
              .get();
            
            if (userResult.data && userResult.data.length > 0) {
              const user = userResult.data[0];
              userInfo = {
                name: user.name || user.nickName || '未知用户',
                phoneNumber: user.phoneNumber || '未提供'
              };
            }
          } catch (userError) {
            console.error('查询用户信息失败:', userError);
          }
        }
        
        // 确定最终状态
        let finalStatus = booking.status;
        if (booking.status === 'booked') {
          finalStatus = 'done'; // 已开始的booked课程应该是done
        } else if (booking.status === 'waitlist') {
          finalStatus = 'fail'; // 已开始的waitlist课程应该是fail
        }
        
        if (!courseMap.has(courseKey)) {
          courseMap.set(courseKey, {
            id: schedule._id,
            courseName: schedule.courseName,
            teacherName: schedule.teacherName || '未指定',
            date: schedule.date,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            bookings: [],
            totalBookings: 0, // 总预约人次（包含所有状态）
            completedBookings: 0, // 实际完成人数（只计算done状态）
            cancelledBookings: 0,
            failedBookings: 0
          });
          completedCourseCount++;
        }
        
        const courseInfo = courseMap.get(courseKey);
        
        courseInfo.bookings.push({
          id: booking._id,
          userName: userInfo.name,
          userPhone: userInfo.phoneNumber,
          status: finalStatus,
          originalStatus: booking.status,
          bookingTime: booking.createTime || booking.bookingTime,
          cancelTime: booking.cancelTime
        });
        
        courseInfo.totalBookings++;
        
        // 统计各种状态
        if (finalStatus === 'done') {
          courseInfo.completedBookings++;
        } else if (finalStatus === 'cancelled') {
          courseInfo.cancelledBookings++;
        } else if (finalStatus === 'fail') {
          courseInfo.failedBookings++;
        }
        
        processedCount++;
        
      } catch (error) {
        console.error('处理单个预约记录失败:', error, booking);
      }
    }
    
    // 转换为数组并按时间排序（最近的在前）
    let courses = Array.from(courseMap.values());
    
    courses.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}:00`);
      const dateB = new Date(`${b.date}T${b.startTime}:00`);
      return dateB - dateA; // 降序排序，最近的在前
    });
    
    // 为每个课程的预约列表按预约时间排序
    courses.forEach(course => {
      course.bookings.sort((a, b) => new Date(a.bookingTime) - new Date(b.bookingTime));
    });
    
    console.log('处理统计:', {
      总预约记录: bookingsResult.data.length,
      成功处理: processedCount,
      已完成课程数: completedCourseCount,
      最终课程数: courses.length
    });
    
    return {
      success: true,
      courses: courses,
      total: courses.length,
      stats: {
        totalBookings: bookingsResult.data.length,
        processedCount: processedCount,
        completedCourseCount: completedCourseCount,
        queryTime: now.toISOString()
      }
    };
    
  } catch (error) {
    console.error('获取已完成课程失败:', error);
    return {
      success: false,
      error: error.message,
      courses: []
    };
  }
};
