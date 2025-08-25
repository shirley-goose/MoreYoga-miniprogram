// 获取老师课程云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 获取私教课程
async function getPrivateCourses(teacherId, teacherName, type = 'upcoming') {
  try {
    console.log('获取私教课程，teacherId:', teacherId, 'teacherName:', teacherName, 'type:', type)
    
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD格式
    
    let whereCondition = {
      teacherName: teacherName
    }
    
    if (type === 'upcoming') {
      // 获取未来的课程（已确认状态）
      whereCondition.status = db.command.in(['confirmed', 'completed'])
      whereCondition.date = db.command.gte(currentDate)
    } else if (type === 'archived') {
      // 获取已结课程（已完成或过去的已确认课程）
      whereCondition.date = db.command.lt(currentDate)
      whereCondition.status = db.command.in(['confirmed', 'completed'])
    }
    
    const result = await db.collection('privateBookings')
      .where(whereCondition)
      .orderBy('date', type === 'upcoming' ? 'asc' : 'desc')
      .orderBy('startTime', type === 'upcoming' ? 'asc' : 'desc')
      .get()

    console.log('私教课程数量:', result.data.length)
    
    // 打印前几条记录的详细信息用于调试
    if (result.data.length > 0) {
      console.log('私教课程样本数据 (前3条):', result.data.slice(0, 3).map(booking => ({
        _id: booking._id,
        teacherName: booking.teacherName,
        v: booking.studentOpenid,
        userId: booking.userId,
        userID: booking.userID,
        date: booking.date,
        startTime: booking.startTime,
        status: booking.status
      })));
    }

    // 为每个私教课程添加学员信息
    const coursesWithStudentInfo = await Promise.all(
      result.data.map(async (booking) => {
        try {
                      // 获取学员信息 - 私教预约中学员openid存储在studentOpenid字段
            const studentOpenid = booking.studentOpenid || booking.userId || booking.userID;
            console.log('查询学员信息:', {
              bookingId: booking._id,
              studentOpenid: booking.studentOpenid,
              userId: booking.userId,
              userID: booking.userID,
              finalOpenid: studentOpenid
            });

            const userResult = await db.collection('users')
              .where({
                openid: studentOpenid
              })
              .get()

          const user = userResult.data[0]
          
          console.log('学员信息查询结果:', {
            bookingId: booking._id,
            studentOpenid: studentOpenid,
            userFound: !!user,
            userCount: userResult.data.length,
            userData: user ? {
              name: user.name,
              nickName: user.nickName,
              phoneNumber: user.phoneNumber,
              openid: user.openid
            } : null
          });
          
          return {
              ...booking,
              studentName: user ? (user.name || user.nickName || '未知学员') : '未知学员',
              studentPhone: user ? (user.phoneNumber || '未提供') : '未知',
              timeRange: `${booking.startTime}-${booking.endTime || '未设置'}`,
              completedAt: booking.completeTime || booking.completedAt || booking.updateTime || '未记录',
              completeTime: booking.completeTime || null
            }
        } catch (userError) {
          console.error('获取私教学员信息失败:', {
            error: userError,
            bookingId: booking._id,
            studentOpenid: booking.studentOpenid,
            userId: booking.userId,
            userID: booking.userID
          });
          return {
            ...booking,
            studentName: '未知学员',
            studentPhone: '未知',
            timeRange: `${booking.startTime}-${booking.endTime || '未设置'}`,
            completedAt: booking.completeTime || booking.completedAt || booking.updateTime || '未记录',
            completeTime: booking.completeTime || null
          }
        }
      })
    )

    return coursesWithStudentInfo

  } catch (error) {
    console.error('获取私教课程失败:', error)
    return []
  }
}

// 获取团课
async function getGroupCourses(teacherId, teacherName, teacherNameShort, type = 'upcoming') {
  try {
    console.log('获取团课，teacherId:', teacherId, 'teacherName:', teacherName, 'teacherNameShort:', teacherNameShort, 'type:', type)
    
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD格式
    console.log('查询团课，当前日期:', currentDate)
    
    // 根据类型设置日期条件
    let dateCondition
    let orderDirection
    
    if (type === 'upcoming') {
      dateCondition = db.command.gte(currentDate) // 大于等于今天的日期
      orderDirection = 'asc'
    } else if (type === 'archived') {
      dateCondition = db.command.lt(currentDate) // 小于今天的日期
      orderDirection = 'desc'
    }
    
    // 先尝试用完整名称查询
    let scheduleResult = await db.collection('courseSchedule')
      .where({
        teacherName: teacherName,
        date: dateCondition
      })
      .orderBy('date', orderDirection)
      .orderBy('startTime', orderDirection)
      .get()
    
    console.log('用完整名称查询结果:', scheduleResult.data.length)
    
    // 如果没有结果，尝试用简称查询
    if (scheduleResult.data.length === 0 && teacherNameShort !== teacherName) {
      console.log('尝试用简称查询:', teacherNameShort)
      scheduleResult = await db.collection('courseSchedule')
        .where({
          teacherName: teacherNameShort,
          date: dateCondition
        })
        .orderBy('date', orderDirection)
        .orderBy('startTime', orderDirection)
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
          
          // 获取该课程的所有预约记录（包含所有状态）
          const bookingsResult = await db.collection('bookings')
            .where({
              scheduleId: schedule._id
            })
            .get()

          console.log(`课程 ${schedule.courseName} 的所有预约记录数量:`, bookingsResult.data.length)

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
                
                // 确定最终状态（对于已开始的课程）
                let finalStatus = booking.status;
                if (type === 'archived') {
                  if (booking.status === 'booked') {
                    finalStatus = 'done'; // 已开始的booked课程应该是done
                  } else if (booking.status === 'waitlist') {
                    finalStatus = 'fail'; // 已开始的waitlist课程应该是fail
                  }
                }
                
                return {
                  ...booking,
                  status: finalStatus,
                  originalStatus: booking.status,
                  userPhone: user ? (user.phoneNumber || '未提供') : '未知',
                  userName: user ? (user.name || user.nickName || '未知用户') : '未知用户',
                  cancelTime: booking.cancelTime
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

          // 计算统计信息
          const totalBookings = bookingsWithUsers.length;
          const completedBookings = bookingsWithUsers.filter(b => b.status === 'done').length;
          const cancelledBookings = bookingsWithUsers.filter(b => b.status === 'cancelled').length;
          const failedBookings = bookingsWithUsers.filter(b => b.status === 'fail').length;

          return {
            ...schedule,
            bookings: bookingsWithUsers,
            totalBookings: totalBookings,
            completedBookings: completedBookings,
            cancelledBookings: cancelledBookings,
            failedBookings: failedBookings,
            showDetail: false
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
    const { teacherId, type = 'upcoming' } = event

    if (!teacherId) {
      return {
        success: false,
        message: '缺少老师ID'
      }
    }

    console.log('获取老师课程，teacherId:', teacherId, 'type:', type)

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
      getPrivateCourses(teacherId, teacherName, type),
      getGroupCourses(teacherId, teacherName, teacherNameShort, type)
    ])

    console.log('获取课程结果:', {
      private: privateResult.length,
      group: groupResult.length,
      type: type
    })

    return {
      success: true,
      privateCourses: privateResult,
      groupCourses: groupResult,
      type: type
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