// 处理私教预约申请云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { requestId, action, teacherId } = event

    if (!requestId || !action || !teacherId) {
      return {
        success: false,
        message: '缺少必要参数'
      }
    }

    if (!['confirm', 'reject'].includes(action)) {
      return {
        success: false,
        message: '无效的操作类型'
      }
    }

    console.log('处理预约申请:', { requestId, action, teacherId })

    // 获取预约申请详情
    const requestResult = await db.collection('privateBookings')
      .doc(requestId)
      .get()

    if (!requestResult.data) {
      return {
        success: false,
        message: '预约申请不存在'
      }
    }

    const request = requestResult.data

    // 验证老师权限
    if (request.teacherId !== teacherId) {
      return {
        success: false,
        message: '无权限处理此预约'
      }
    }

    // 检查当前状态
    if (request.status !== 'pending') {
      return {
        success: false,
        message: '该申请已处理过'
      }
    }

    // 更新预约状态  
    const newStatus = action === 'confirm' ? 'confirmed' : 'rejected'
    const updateData = {
      status: newStatus,
      processTime: new Date(),
      processedBy: teacherId
    }

    await db.collection('privateBookings')
      .doc(requestId)
      .update({
        data: updateData
      })

    console.log('预约申请处理成功:', newStatus)

    // 根据操作类型处理后续逻辑
    if (action === 'confirm') {
      try {
        // 更新老师时间表
        await updateTeacherSchedule(request)
        console.log('更新老师时间表成功')
      } catch (error) {
        console.error('确认预约后续操作失败:', error)
        // 错误不影响主流程，继续执行
      }
    } else if (action === 'reject') {
      try {
        // 拒绝预约时返还用户课时
        await refundUserPrivateCredits(request.studentOpenid)
        console.log('返还用户私教课时成功')
      } catch (error) {
        console.error('返还课时失败:', error)
        // 错误不影响主流程，继续执行
      }
    }

    return {
      success: true,
      message: action === 'confirm' ? '确认预约成功' : '拒绝预约成功',
      newStatus: newStatus
    }

  } catch (error) {
    console.error('处理预约申请失败:', error)
    return {
      success: false,
      message: '处理预约申请失败',
      error: error.message
    }
  }
}

// 返还用户私教课时
async function refundUserPrivateCredits(studentOpenid) {
  try {
    console.log('开始返还用户私教课时，用户openid:', studentOpenid)
    
    // 查询用户信息
    const userResult = await db.collection('users').where({
      openid: studentOpenid
    }).get()

    if (userResult.data.length === 0) {
      throw new Error('用户不存在')
    }

    const user = userResult.data[0]
    const currentTermCredits = user.termCredits || 0

    console.log('用户当前私教课时:', currentTermCredits)

    // 返还1个私教课时
    await db.collection('users').doc(user._id).update({
      data: {
        termCredits: currentTermCredits + 1
      }
    })

    console.log('返还私教课时成功，当前课时:', currentTermCredits + 1)

  } catch (error) {
    console.error('返还用户私教课时失败:', error)
    throw error
  }
}

// 更新老师时间表（标记为已预约）
async function updateTeacherSchedule(request) {
  try {
    const { teacherId, date, startTime } = request
    
    // 查找对应的老师时间设置
    const scheduleResult = await db.collection('teacherSchedules')
      .where({
        teacherId: teacherId,
        date: date
      })
      .get()

    if (scheduleResult.data.length > 0) {
      const schedule = scheduleResult.data[0]
      const scheduleData = schedule.schedule || {}
      
      // 标记时间段为已预约
      if (scheduleData[startTime]) {
        scheduleData[startTime].booked = true
      }

      // 更新数据库
      await db.collection('teacherSchedules')
        .doc(schedule._id)
        .update({
          data: {
            schedule: scheduleData
          }
        })

      console.log('老师时间表更新成功')
    }
  } catch (error) {
    console.error('更新老师时间表失败:', error)
    throw error
  }
}
