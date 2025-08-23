// 获取每日课程安排云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { date } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  try {
    console.log('查询日期:', date);
    
    // 先查询所有课程安排，看看数据库中有什么
    const allSchedules = await db.collection('courseSchedule')
      .limit(10)
      .get();
    
    console.log('数据库中所有课程安排:', allSchedules.data);
    
    // 查询指定日期的课程安排
    const schedules = await db.collection('courseSchedule')
      .where({
        date: date,
        status: 'active'  // 改为 'active'，因为我们的新数据结构使用这个状态
      })
      .orderBy('startTime', 'asc')
      .get();
    
    console.log('查询到的课程安排:', schedules.data);
    
    // 为每个课程添加详细信息
    const enrichedSchedules = await Promise.all(
      schedules.data.map(async (schedule) => {
        // 获取预约信息（使用新的预约结构）
        let bookedCount = schedule.currentBookings || 0;
        let waitlistCount = 0;
        let userBookingStatus = null;
        
        // 检查当前用户是否已预约（从schedule.bookings数组中查找）
        if (schedule.bookings && schedule.bookings.length > 0) {
          const userBooking = schedule.bookings.find(b => b.userId === openid);
          if (userBooking) {
            userBookingStatus = userBooking.status;
          }
          
          // 计算等位人数
          waitlistCount = schedule.bookings.filter(b => b.status === 'waitlist').length;
        }
        
        return {
          ...schedule,
          currentStudents: bookedCount,
          waitlistCount: waitlistCount,
          availableSlots: Math.max(0, schedule.maxCapacity - bookedCount),
          userBookingStatus: userBookingStatus,
          maxStudents: schedule.maxCapacity,  // 兼容旧字段名
          minStudents: schedule.minCapacity   // 兼容旧字段名
        };
      })
    );
    
    return {
      success: true,
      schedules: enrichedSchedules  // 改为schedules，与前端期望的字段名匹配
    };
  } catch (error) {
    console.error('获取课程安排失败:', error);
    return {
      success: false,
      message: '获取课程安排失败',
      error: error.message
    };
  }
};
