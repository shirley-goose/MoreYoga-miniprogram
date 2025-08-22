// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { teacherId, date } = event

    if (!teacherId || !date) {
      return {
        success: false,
        error: '缺少必要参数'
      }
    }

    // 查询老师在指定日期的时间设置
    const result = await db.collection('teacherSchedules')
      .where({
        teacherId: teacherId,
        date: date
      })
      .get()

    let schedule = {}
    if (result.data.length > 0) {
      schedule = result.data[0].schedule || {}
    }

    return {
      success: true,
      schedule: schedule
    }

  } catch (error) {
    console.error('获取老师时间表失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
