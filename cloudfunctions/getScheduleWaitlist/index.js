// 获取课程等位信息云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { scheduleId } = event;

  console.log('=== 获取课程等位信息 ===');
  console.log('课程安排ID:', scheduleId);

  try {
    // 查询该课程的所有等位预约
    const waitlistResult = await db.collection('bookings')
      .where({
        scheduleId: scheduleId,
        status: 'waitlist'
      })
      .orderBy('createTime', 'asc') // 按创建时间排序，先到先得
      .get();

    const waitlistCount = waitlistResult.data.length;
    const waitlistBookings = waitlistResult.data;

    console.log('等位人数:', waitlistCount);
    console.log('等位列表:', waitlistBookings.map(b => ({ userId: b.userId, createTime: b.createTime })));

    return {
      success: true,
      waitlistCount: waitlistCount,
      waitlistBookings: waitlistBookings,
      hasWaitlist: waitlistCount > 0
    };

  } catch (error) {
    console.error('获取等位信息失败:', error);
    return {
      success: false,
      message: '获取等位信息失败',
      error: error.message,
      waitlistCount: 0,
      hasWaitlist: false
    };
  }
};
