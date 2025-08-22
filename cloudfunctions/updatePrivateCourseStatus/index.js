// 更新私教课程状态云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { courseId, status } = event

    if (!courseId || !status) {
      return {
        success: false,
        message: '缺少必要参数'
      }
    }

    console.log('更新私教课程状态:', { courseId, status })

    // 更新课程状态
    await db.collection('privateBookings')
      .doc(courseId)
      .update({
        data: {
          status: status,
          updateTime: new Date()
        }
      })

    console.log('私教课程状态更新成功')

    return {
      success: true,
      message: '状态更新成功'
    }

  } catch (error) {
    console.error('更新私教课程状态失败:', error)
    return {
      success: false,
      message: '更新状态失败',
      error: error.message
    }
  }
}
