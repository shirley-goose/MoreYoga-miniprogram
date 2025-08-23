// 更新预约状态云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  console.log('=== 更新预约状态 ===');
  console.log('用户openid:', openid);

  try {
    const now = new Date();
    const currentDateTime = now.toISOString();
    
    console.log('当前时间:', currentDateTime);

    let updatedCount = 0;

    // 1. 将开始时间在现在时间之前的booked课程变为done
    console.log('开始更新已开始的booked课程...');
    
    // 先查询需要更新的booked课程
    const bookedBookings = await db.collection('bookings')
      .where({
        userId: openid,
        status: 'booked'
      })
      .get();

    console.log('找到booked预约数量:', bookedBookings.data.length);

    for (const booking of bookedBookings.data) {
      try {
        // 获取课程安排信息
        const scheduleResult = await db.collection('courseSchedule')
          .doc(booking.scheduleId)
          .get();

        if (scheduleResult.data) {
          const schedule = scheduleResult.data;
          const classStartTime = new Date(`${schedule.date}T${schedule.startTime}:00`);
          
          console.log('检查课程:', {
            bookingId: booking._id,
            courseDate: schedule.date,
            startTime: schedule.startTime,
            classStartTime: classStartTime.toISOString(),
            shouldUpdate: classStartTime < now
          });

          // 如果课程已开始，更新状态为done
          if (classStartTime < now) {
            await db.collection('bookings')
              .doc(booking._id)
              .update({
                data: {
                  status: 'done',
                  updateTime: currentDateTime
                }
              });
            
            updatedCount++;
            console.log('已更新booked -> done:', booking._id);
          }
        }
      } catch (error) {
        console.error('更新单个booked预约失败:', booking._id, error);
      }
    }

    // 2. 将开始时间在现在时间之前仍为waitlist的课程变为fail
    console.log('开始更新已开始的waitlist课程...');
    
    const waitlistBookings = await db.collection('bookings')
      .where({
        userId: openid,
        status: 'waitlist'
      })
      .get();

    console.log('找到waitlist预约数量:', waitlistBookings.data.length);

    for (const booking of waitlistBookings.data) {
      try {
        // 获取课程安排信息
        const scheduleResult = await db.collection('courseSchedule')
          .doc(booking.scheduleId)
          .get();

        if (scheduleResult.data) {
          const schedule = scheduleResult.data;
          const classStartTime = new Date(`${schedule.date}T${schedule.startTime}:00`);
          
          console.log('检查等位课程:', {
            bookingId: booking._id,
            courseDate: schedule.date,
            startTime: schedule.startTime,
            classStartTime: classStartTime.toISOString(),
            shouldUpdate: classStartTime < now
          });

          // 如果课程已开始，更新状态为fail
          if (classStartTime < now) {
            await db.collection('bookings')
              .doc(booking._id)
              .update({
                data: {
                  status: 'fail',
                  updateTime: currentDateTime
                }
              });
            
            updatedCount++;
            console.log('已更新waitlist -> fail:', booking._id);
          }
        }
      } catch (error) {
        console.error('更新单个waitlist预约失败:', booking._id, error);
      }
    }

    console.log('状态更新完成，总更新数量:', updatedCount);

    return {
      success: true,
      updatedCount: updatedCount,
      message: `成功更新${updatedCount}条预约状态`
    };

  } catch (error) {
    console.error('更新预约状态失败:', error);
    return {
      success: false,
      message: '更新预约状态失败',
      error: error.message
    };
  }
};
