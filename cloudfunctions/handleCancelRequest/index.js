const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    console.log('handleCancelRequest云函数开始执行')
    console.log('接收到的参数:', event)
    
    const { requestId, action } = event

    if (!requestId || !action) {
      return {
        success: false,
        message: '缺少必要参数'
      }
    }

    if (!['approve', 'reject'].includes(action)) {
      return {
        success: false,
        message: '无效的操作类型'
      }
    }

    console.log('处理取消申请:', { requestId, action })

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

    // 检查当前状态
    if (request.cancelRequestStatus !== 'pending') {
      return {
        success: false,
        message: '该取消申请已处理过'
      }
    }

    // 更新取消申请状态
    const newCancelStatus = action === 'approve' ? 'approved' : 'rejected'
    const updateData = {
      cancelRequestStatus: newCancelStatus,
      cancelProcessTime: new Date()
    }

    // 如果同意取消，还需要更新预约状态并返还课时
    if (action === 'approve') {
      updateData.status = 'cancelled'
      
      // 返还用户私教课时
      try {
        await refundUserPrivateCredits(request.studentOpenid)
        console.log('返还用户私教课时成功')
      } catch (error) {
        console.error('返还课时失败:', error)
        // 不影响主流程，继续执行
      }
    }

    await db.collection('privateBookings')
      .doc(requestId)
      .update({
        data: updateData
      })

    console.log('取消申请处理成功:', newCancelStatus)

    return {
      success: true,
      message: action === 'approve' ? '同意取消成功' : '拒绝取消成功',
      newStatus: newCancelStatus
    }

  } catch (error) {
    console.error('处理取消申请失败:', error)
    return {
      success: false,
      message: '处理取消申请失败',
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
