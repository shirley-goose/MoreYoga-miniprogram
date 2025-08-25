// 标记私教课程完成云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { bookingId } = event;

  console.log('=== 标记私教课程完成 ===');
  console.log('预约ID:', bookingId);
  console.log('操作者OPENID:', wxContext.OPENID);

  if (!bookingId) {
    return {
      success: false,
      message: '缺少预约ID'
    };
  }

  try {
    // 1. 查询预约记录
    const bookingResult = await db.collection('privateBookings')
      .doc(bookingId)
      .get();

    if (!bookingResult.data) {
      return {
        success: false,
        message: '预约记录不存在'
      };
    }

    const booking = bookingResult.data;
    console.log('找到预约记录:', booking);

    // 2. 验证状态
    if (booking.status === 'completed') {
      return {
        success: false,
        message: '该课程已经标记为完成'
      };
    }

    if (booking.status !== 'confirmed') {
      return {
        success: false,
        message: '只能标记已确认的课程为完成'
      };
    }

    // 3. 更新预约状态
    const now = new Date();
    const completeTime = now.toISOString();

    await db.collection('privateBookings')
      .doc(bookingId)
      .update({
        data: {
          status: 'completed',
          completeTime: completeTime,
          updateTime: completeTime
        }
      });

    console.log('私教课程标记完成成功:', {
      bookingId,
      completeTime,
      teacherName: booking.teacherName,
      studentId: booking.userId
    });

    return {
      success: true,
      message: '私教课程标记完成成功',
      completeTime: completeTime,
      data: {
        bookingId,
        status: 'completed',
        completeTime
      }
    };

  } catch (error) {
    console.error('标记私教课程完成失败:', error);
    return {
      success: false,
      message: '标记失败，请重试',
      error: error.message
    };
  }
};
