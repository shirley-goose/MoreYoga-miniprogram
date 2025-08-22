const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    console.log('cancelPrivateBooking云函数开始执行')
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

    console.log('取消私教预约，预约ID:', bookingId, '用户openid:', openid)

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
    if (booking.status === 'cancelled') {
      return {
        success: false,
        message: '预约已取消'
      }
    }

    if (booking.status === 'completed') {
      return {
        success: false,
        message: '课程已完成，无法取消'
      }
    }

    // 检查取消时间限制（距开始时间3小时以上）
    const now = new Date()
    const classStartTime = new Date(`${booking.date}T${booking.startTime}:00`)
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000)
    
    if (classStartTime <= threeHoursFromNow) {
      return {
        success: false,
        message: '距课程开始时间不足3小时，无法取消'
      }
    }

    // 更新预约状态为已取消
    await db.collection('privateBookings').doc(bookingId).update({
      data: {
        status: 'cancelled',
        cancelTime: new Date()
      }
    })

    // 需要返还私教课时的情况：
    // 1. 状态为 confirmed（已确认）
    // 2. 状态为 pending（待确认但在提交时已扣除课时）
    if (booking.status === 'confirmed' || booking.status === 'pending') {
      // 查询用户信息
      const userResult = await db.collection('users').where({
        openid: openid
      }).get()

      if (userResult.data.length > 0) {
        const user = userResult.data[0]
        const currentTermCredits = user.termCredits || 0

        // 返还1个私教课时
        await db.collection('users').doc(user._id).update({
          data: {
            termCredits: currentTermCredits + 1
          }
        })

        console.log('返还私教课时成功，当前私教课时:', currentTermCredits + 1)
        console.log('返还原因: 预约状态为', booking.status, '在提交预约时已扣除课时，取消时需要返还')
      }
    }

    console.log('取消私教预约成功')

    return {
      success: true,
      message: '取消预约成功'
    }

  } catch (error) {
    console.error('取消私教预约失败:', error)
    return {
      success: false,
      message: '取消预约失败',
      error: error.message
    }
  }
}
