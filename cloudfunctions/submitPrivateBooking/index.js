// 提交私教预约云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { 
      teacherId, 
      teacherName, 
      studentOpenid, 
      date, 
      startTime, 
      endTime,
      timeRange,
      content,
      price 
    } = event

    console.log('收到私教预约请求:', event)

    // 验证必要参数
    if (!teacherId || !teacherName || !studentOpenid || !date || !startTime) {
      return {
        success: false,
        message: '缺少必要的预约信息'
      }
    }

    // 获取学生信息
    const userResult = await db.collection('users')
      .where({ openid: studentOpenid })
      .get()

    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户信息不存在'
      }
    }

    const user = userResult.data[0]

    // 检查用户私教课时
    const currentTermCredits = user.termCredits || 0
    console.log('用户当前私教课时:', currentTermCredits)
    
    if (currentTermCredits < 1) {
      return {
        success: false,
        message: '私教课时不足，请先购买课时'
      }
    }

    // 扣除私教课时
    await db.collection('users').doc(user._id).update({
      data: {
        termCredits: currentTermCredits - 1
      }
    })
    
    console.log('扣除私教课时成功，剩余课时:', currentTermCredits - 1)

    // 创建预约记录
    const bookingData = {
      teacherId: teacherId,
      teacherName: teacherName,
      studentOpenid: studentOpenid,
      studentName: user.userName || user.userPhone,
      studentPhone: user.phoneNumber,
      date: date,
      startTime: startTime,
      endTime: endTime,
      timeRange: timeRange,
      content: content || '',
      price: price,
      status: 'pending', // 等待老师确认
      createTime: new Date(),
      type: 'private' // 私教类型
    }

    console.log('准备保存预约数据:', bookingData)

    // 保存到数据库
    const result = await db.collection('privateBookings').add({
      data: bookingData
    })

    console.log('预约保存成功:', result)

    return {
      success: true,
      message: '预约申请已提交，等待老师确认',
      bookingId: result._id,
      bookingData: bookingData
    }

  } catch (error) {
    console.error('提交私教预约失败:', error)
    return {
      success: false,
      message: '提交预约失败，请重试',
      error: error.message
    }
  }
}
