// 获取老师课程云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 获取私教课程
async function getPrivateCourses(teacherId, teacherName) {
  try {
    console.log('获取私教课程，teacherId:', teacherId, 'teacherName:', teacherName)
    
    // 获取status为'confirmed'且时间还未发生的私教课程
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD格式
    
    const result = await db.collection('privateBookings')
      .where({
        teacherName: teacherName,
        status: 'confirmed',
        date: db.command.gte(currentDate) // 大于等于今天的日期
      })
      .orderBy('date', 'asc')
      .orderBy('startTime', 'asc')
      .get()

    console.log('私教课程数量:', result.data.length)
    return result.data

  } catch (error) {
    console.error('获取私教课程失败:', error)
    return []
  }
}

// 获取团课
async function getGroupCourses(teacherId, teacherName, teacherNameShort) {
  try {
    console.log('获取团课，teacherId:', teacherId, 'teacherName:', teacherName, 'teacherNameShort:', teacherNameShort)
    
    // 获取当前时间，只查询未发生的课程
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD格式
    console.log('查询团课，当前日期:', currentDate)
    
    // 先尝试用完整名称查询
    let scheduleResult = await db.collection('courseSchedule')
      .where({
        teacherName: teacherName,
        date: db.command.gte(currentDate) // 大于等于今天的日期
      })
      .orderBy('date', 'asc')
      .orderBy('startTime', 'asc')
      .get()
    
    console.log('用完整名称查询结果:', scheduleResult.data.length)
    
    // 如果没有结果，尝试用简称查询
    if (scheduleResult.data.length === 0 && teacherNameShort !== teacherName) {
      console.log('尝试用简称查询:', teacherNameShort)
      scheduleResult = await db.collection('courseSchedule')
        .where({
          teacherName: teacherNameShort,
          date: db.command.gte(currentDate)
        })
        .orderBy('date', 'asc')
        .orderBy('startTime', 'asc')
        .get()
      
      console.log('用简称查询结果:', scheduleResult.data.length)
    }

    const schedules = scheduleResult.data
    console.log('最终团课安排数量:', schedules.length)
    console.log('最终团课安排详情:', schedules)

    if (schedules.length === 0) {
      console.log('没有找到团课安排，进行详细调试')
      
      // 调试：查看数据库中所有的courseSchedule记录
      const allSchedulesResult = await db.collection('courseSchedule').get()
      console.log('数据库中所有courseSchedule记录数量:', allSchedulesResult.data.length)
      console.log('数据库中所有courseSchedule记录:', allSchedulesResult.data)
      
      // 检查所有老师名称
      const allTeacherNames = [...new Set(allSchedulesResult.data.map(item => item.teacherName))]
      console.log('数据库中所有老师名称:', allTeacherNames)
      
      // 检查日期条件
      const allFutureSchedules = await db.collection('courseSchedule')
        .where({
          date: db.command.gte(currentDate)
        })
        .get()
      console.log('所有未来课程数量:', allFutureSchedules.data.length)
      
      return []
    }

    // 为每个课程获取预约信息
    const coursesWithBookings = await Promise.all(
      schedules.map(async (schedule) => {
        try {
          console.log('为课程获取预约信息:', schedule._id, schedule.courseName)
          
          // 获取该课程的预约记录（排除已取消的）
          const bookingsResult = await db.collection('bookings')
            .where({
              scheduleId: schedule._id,
              status: db.command.neq('cancelled') // 排除已取消的预约
            })
            .get()

          console.log(`课程 ${schedule.courseName} 的有效预约记录数量:`, bookingsResult.data.length)

          // 获取用户信息
          const bookingsWithUsers = await Promise.all(
            bookingsResult.data.map(async (booking) => {
              try {
                const userResult = await db.collection('users')
                  .where({
                    openid: booking.userId || booking.userID
                  })
                  .get()

                const user = userResult.data[0]
                return {
                  ...booking,
                  userPhone: user ? user.phoneNumber : '未知',
                  userName: user ? user.userName : '未知用户'
                }
              } catch (userError) {
                console.warn('获取用户信息失败:', userError)
                return {
                  ...booking,
                  userPhone: '未知',
                  userName: '未知用户'
                }
              }
            })
          )

          return {
            ...schedule,
            bookings: bookingsWithUsers
          }

        } catch (bookingError) {
          console.warn('获取课程预约失败:', bookingError)
          return {
            ...schedule,
            bookings: []
          }
        }
      })
    )

    console.log('最终团课数据:', coursesWithBookings)
    return coursesWithBookings

  } catch (error) {
    console.error('获取团课失败:', error)
    return []
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { teacherId } = event

    if (!teacherId) {
      return {
        success: false,
        message: '缺少老师ID'
      }
    }

    console.log('获取老师课程，teacherId:', teacherId)

    // 根据teacherId获取老师姓名 - 支持多种格式
    const teacherNames = {
      'zhouzhou': '周周老师',
      'yinger': '莹儿老师', 
      'qiqi': '岐岐老师',
      'yaqin': '雅琴老师',
      'chengmin': '程敏老师'
    }
    
    // 同时支持不带"老师"后缀的格式
    const teacherNamesShort = {
      'zhouzhou': '周周',
      'yinger': '莹儿',
      'qiqi': '岐岐', 
      'yaqin': '雅琴',
      'chengmin': '程敏'
    }
    const teacherName = teacherNames[teacherId] || teacherId
    const teacherNameShort = teacherNamesShort[teacherId] || teacherId
    console.log('老师姓名:', teacherName, '简称:', teacherNameShort)

    // 并行获取私教课程和团课
    const [privateResult, groupResult] = await Promise.all([
      getPrivateCourses(teacherId, teacherName),
      getGroupCourses(teacherId, teacherName, teacherNameShort)
    ])

    console.log('获取课程结果:', {
      private: privateResult.length,
      group: groupResult.length
    })

    return {
      success: true,
      privateCourses: privateResult,
      groupCourses: groupResult
    }

  } catch (error) {
    console.error('获取老师课程失败:', error)
    return {
      success: false,
      message: '获取课程失败',
      error: error.message
    }
  }
}