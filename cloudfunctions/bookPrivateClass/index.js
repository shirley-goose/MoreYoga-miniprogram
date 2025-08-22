// 私教预约云函数
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  console.log('=== 私教预约云函数开始执行 ===')
  console.log('请求参数:', event)
  console.log('用户openid:', wxContext.OPENID)
  
  const { teacherId, teacherName, date, timeSlot, course, price, status } = event
  
  try {
    // 参数验证
    if (!teacherId || !teacherName || !date || !timeSlot || !course) {
      return {
        success: false,
        message: '缺少必填参数'
      }
    }

    // 检查用户是否存在
    const userResult = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()

    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在，请先注册'
      }
    }

    const user = userResult.data[0]
    
    // 检查私教课时
    console.log('用户数据:', user);
    console.log('用户私教课时:', user.termCredits);
    
    if (!user.termCredits || user.termCredits <= 0) {
      return {
        success: false,
        message: '无剩余私教课时，请联系客服购买'
      }
    }

    // 创建预约时间（支持iOS格式）
    const [startTime] = timeSlot.split('-');
    const bookingTime = new Date(`${date}T${startTime}:00`)
    const createTime = new Date()

    // 添加私教预约申请记录
    const bookingData = {
      openid: wxContext.OPENID,
      teacherId: teacherId,
      teacherName: teacherName,
      date: date,
      timeSlot: timeSlot,
      course: course,
      price: price || 0,
      bookingTime: bookingTime,
      createTime: createTime,
      status: status || 'pending', // pending: 等待确认, approved: 已确认, rejected: 已拒绝, cancelled: 已取消
      type: 'private', // 私教类型
      studentName: user.nickName || '瑜伽爱好者',
      studentPhone: user.phone || ''
    }

    // 插入预约申请记录
    const bookingResult = await db.collection('privateBookingRequests').add({
      data: bookingData
    })

    console.log('私教预约申请记录插入结果:', bookingResult)

    // 注意：暂时不扣除课时，等老师确认后再扣除
    // 记录操作到待处理列表供老师查看

    const result = {
      success: true,
      message: '私教预约申请已提交，等待老师确认',
      data: {
        requestId: bookingResult._id,
        status: 'pending'
      }
    }
    
    console.log('=== 私教预约申请提交成功，返回结果 ===')
    console.log('返回结果:', result)
    return result

  } catch (error) {
    console.error('=== 私教预约申请失败 ===')
    console.error('错误详情:', error)
    const errorResult = {
      success: false,
      message: '预约申请提交失败，请稍后重试',
      error: error.message
    }
    console.log('返回错误结果:', errorResult)
    return errorResult
  }
}
