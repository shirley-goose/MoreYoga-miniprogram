// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { date } = event

    if (!date) {
      return {
        success: false,
        error: '缺少日期参数'
      }
    }

    // 预设的老师列表
    const teachers = [
      { id: 'zhouzhou', name: '周周老师' },
      { id: 'yinger', name: '莹儿老师' },
      { id: 'qiqi', name: '岐岐老师' },
      { id: 'yaqin', name: '雅琴老师'},
      { id: 'chengmin', name: '程敏老师' }
    ]

    // 获取所有老师在指定日期的可用时间
    const availableTeachers = []

    for (const teacher of teachers) {
      try {
        // 查询老师的时间设置
        const scheduleResult = await db.collection('teacherSchedules')
          .where({
            teacherId: teacher.id,
            date: date
          })
          .get()

        let availableSlots = []
        if (scheduleResult.data.length > 0) {
          const schedule = scheduleResult.data[0].schedule || {}
          
          // 提取可用且未被预约的时间段
          availableSlots = Object.keys(schedule)
            .filter(time => schedule[time].available && !schedule[time].booked)
            .sort()
        }

        // 如果老师有可用时间，添加到结果中
        if (availableSlots.length > 0) {
          availableTeachers.push({
            ...teacher,
            availableSlots: availableSlots,
            slotCount: availableSlots.length
          })
        }

      } catch (teacherError) {
        console.error(`获取老师${teacher.name}时间失败:`, teacherError)
      }
    }

    return {
      success: true,
      teachers: availableTeachers,
      date: date
    }

  } catch (error) {
    console.error('获取可用老师失败:', error)
    return {
      success: false,
      error: error.message,
      teachers: []
    }
  }
}
