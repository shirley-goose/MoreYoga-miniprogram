// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { teacherId, teacherName, date, schedule } = event

    if (!teacherId || !date || !schedule) {
      return {
        success: false,
        error: '缺少必要参数'
      }
    }

    // 查询是否已存在该日期的设置
    const existResult = await db.collection('teacherSchedules')
      .where({
        teacherId: teacherId,
        date: date
      })
      .get()

    const scheduleData = {
      teacherId: teacherId,
      teacherName: teacherName,
      date: date,
      schedule: schedule,
      updateTime: new Date()
    }

    let result
    if (existResult.data.length > 0) {
      // 更新现有记录
      result = await db.collection('teacherSchedules')
        .doc(existResult.data[0]._id)
        .update({
          data: scheduleData
        })
    } else {
      // 创建新记录
      scheduleData.createTime = new Date()
      result = await db.collection('teacherSchedules')
        .add({
          data: scheduleData
        })
    }

    return {
      success: true,
      id: result._id || existResult.data[0]._id
    }

  } catch (error) {
    console.error('保存老师时间表失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
