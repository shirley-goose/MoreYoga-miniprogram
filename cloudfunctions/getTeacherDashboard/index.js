// 获取老师工作台数据云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { teacherId } = event;

  try {
    console.log('获取老师工作台数据请求:', {
      teacherId,
      openid: wxContext.OPENID,
      timestamp: new Date().toISOString()
    });

    // 验证参数
    if (!teacherId) {
      return {
        success: false,
        message: '缺少老师ID'
      };
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 获取待处理的预约申请数量
    const pendingRequestsResult = await db.collection('privateBookingRequests')
      .where({
        teacherId: teacherId,
        status: 'pending'
      })
      .count();

    // 获取今日已确认的课程数量
    const todayClassesResult = await db.collection('privateBookings')
      .where({
        teacherId: teacherId,
        date: todayStr,
        status: 'confirmed'
      })
      .count();

    // 获取今日可用时间段数量（这里使用模拟数据，实际应该从teacherSchedule集合获取）
    const availableSlots = 5; // 模拟数据

    console.log('工作台数据统计结果:', {
      pendingCount: pendingRequestsResult.total,
      todayClasses: todayClassesResult.total,
      availableSlots
    });

    return {
      success: true,
      pendingCount: pendingRequestsResult.total,
      todayStats: {
        pendingRequests: pendingRequestsResult.total,
        confirmedClasses: todayClassesResult.total,
        availableSlots: availableSlots
      }
    };

  } catch (error) {
    console.error('获取老师工作台数据失败:', error);
    return {
      success: false,
      message: '获取工作台数据失败',
      error: error.message
    };
  }
};
