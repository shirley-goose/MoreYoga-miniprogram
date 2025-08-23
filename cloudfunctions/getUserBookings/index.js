// 获取用户团课预约记录云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { status, limit = 20, skip = 0 } = event;

  try {
    // 构建查询条件
    let whereCondition = {
      userId: openid
    };
    
    if (status) {
      whereCondition.status = status;
    }

    console.log('查询用户预约记录，openid:', openid, '条件:', whereCondition);
    
    // 查询用户预约记录
    const bookings = await db.collection('bookings')
      .where(whereCondition)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(limit)
      .get();
      
    console.log('查询到预约记录数量:', bookings.data.length);

    // 为每个预约添加课程和安排详情
    const enrichedBookings = await Promise.all(
      bookings.data.map(async (booking) => {
        try {
          // 获取课程安排信息（新的数据结构中课程信息直接存储在courseSchedule中）
          const scheduleResult = await db.collection('courseSchedule')
            .doc(booking.scheduleId)
            .get();
          
          let schedule = null;
          let course = null;
          
          if (scheduleResult.data) {
            schedule = scheduleResult.data;
            
            // 新的数据结构中，课程信息直接存储在 schedule 中
            course = {
              title: schedule.courseName,
              imageUrl: '../../images/background.png', // 默认课程图片
              description: schedule.description || ''
            };
            
            // 如果是等位状态，计算前面还有多少人
            if (booking.status === 'waitlist' && schedule.bookings) {
              // 获取所有等位的预约，按创建时间排序
              const waitlistBookings = schedule.bookings
                .filter(b => b.status === 'waitlist')
                .sort((a, b) => new Date(a.createTime) - new Date(b.createTime));
              
              // 找到当前用户在等位队列中的位置
              const userIndex = waitlistBookings.findIndex(b => b.userId === openid);
              if (userIndex !== -1) {
                // 前面的人数就是用户的索引
                booking.waitingAhead = userIndex;
                // 更新位置信息
                booking.position = userIndex + 1;
              }
            }
          }
          
          return {
            ...booking,
            schedule,
            course
          };
        } catch (error) {
          console.error('获取预约详情失败:', error);
          return {
            ...booking,
            schedule: null,
            course: null
          };
        }
      })
    );

    return {
      success: true,
      data: enrichedBookings,
      total: bookings.data.length
    };
  } catch (error) {
    console.error('获取用户预约记录失败:', error);
    return {
      success: false,
      message: '获取预约记录失败',
      error: error.message,
      data: []
    };
  }
};
