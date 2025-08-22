const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    console.log('submitCancelRequest云函数开始执行')
    console.log('接收到的参数:', event)
    
    const { bookingId } = event
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    if (!bookingId) {
      return {
        success: false,
        message: '缺少预约ID'
      }
    }

    if (!openid) {
      return {
        success: false,
        message: '用户身份验证失败'
      }
    }

    console.log('提交取消申请，预约ID:', bookingId, '用户openid:', openid)

    // 查询预约记录
    const bookingResult = await db.collection('privateBookings').doc(bookingId).get()
    
    if (!bookingResult.data) {
      return {
        success: false,
        message: '预约记录不存在'
      }
    }

    const booking = bookingResult.data

    // 验证是否为当前用户的预约
    if (booking.studentOpenid !== openid) {
      return {
        success: false,
        message: '无权取消此预约'
      }
    }

    // 检查预约状态
    if (booking.status !== 'confirmed') {
      return {
        success: false,
        message: '只能取消已确认的预约'
      }
    }

    // 检查是否已经有取消申请
    if (booking.cancelRequestStatus) {
      return {
        success: false,
        message: '已经提交过取消申请，请等待老师处理'
      }
    }

    // 添加取消申请状态到预约记录
    await db.collection('privateBookings').doc(bookingId).update({
      data: {
        cancelRequestStatus: 'pending', // 取消申请状态：pending, approved, rejected
        cancelRequestTime: new Date()
      }
    })

    console.log('取消申请提交成功')

    return {
      success: true,
      message: '取消申请已提交，等待老师确认'
    }

  } catch (error) {
    console.error('提交取消申请失败:', error)
    return {
      success: false,
      message: '提交取消申请失败',
      error: error.message
    }
  }
}
