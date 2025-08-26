// 发送开课前4小时提醒云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    console.log('=== 开课前4小时提醒任务开始 ===')
    
    // 获取当前时间（中国时区）
    const now = new Date()
    const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    console.log('当前中国时间:', chinaTime.toISOString())
    
    // 计算4小时后的时间
    const fourHoursLater = new Date(chinaTime.getTime() + 4 * 60 * 60 * 1000)
    const targetDate = fourHoursLater.toISOString().split('T')[0] // YYYY-MM-DD格式
    const targetStartHour = fourHoursLater.getHours()
    const targetEndHour = targetStartHour + 1 // 检查1小时时间范围
    
    console.log('查找目标日期:', targetDate)
    console.log('查找目标时间范围:', `${targetStartHour}:00 - ${targetEndHour}:00`)
    
    // 查询需要发送提醒的课程（4小时后开始的课程）
    const scheduleResult = await db.collection('courseSchedule')
      .where({
        date: targetDate,
        status: 'active'
      })
      .get()
    
    console.log('查询到的课程安排总数:', scheduleResult.data.length)
    
    // 筛选4小时后开始的课程
    const targetCourses = scheduleResult.data.filter(schedule => {
      const [hours] = schedule.startTime.split(':').map(Number)
      return hours >= targetStartHour && hours < targetEndHour
    })
    
    console.log('需要发送提醒的课程数量:', targetCourses.length)
    
    if (targetCourses.length === 0) {
      return {
        success: true,
        message: '当前时间段没有需要发送提醒的课程',
        processedCount: 0
      }
    }
    
    let successCount = 0
    let failureCount = 0
    
    // 为每个课程发送提醒
    for (const course of targetCourses) {
      try {
        console.log('处理课程:', course.courseName, course.date, course.startTime)
        
        // 获取该课程的所有已确认预约用户
        const confirmedBookings = (course.bookings || []).filter(booking => 
          booking.status === 'booked' // 只给已确认预约的用户发送提醒
        )
        
        console.log('该课程已确认预约用户数:', confirmedBookings.length)
        
        if (confirmedBookings.length === 0) {
          console.log('该课程没有已确认的预约用户，跳过')
          continue
        }
        
        // 为每个用户发送提醒
        for (const booking of confirmedBookings) {
          try {
            await sendClassReminderNotification({
              userId: booking.userId,
              courseName: course.courseName,
              teacherName: course.teacherName,
              classTime: formatClassTime(course.date, course.startTime),
              scheduleId: course._id
            })
            successCount++
            console.log('提醒发送成功:', booking.userId)
          } catch (error) {
            console.error('发送提醒失败:', booking.userId, error)
            failureCount++
          }
        }
        
      } catch (error) {
        console.error('处理课程失败:', course._id, error)
        failureCount++
      }
    }
    
    console.log('=== 开课前4小时提醒任务完成 ===')
    console.log('成功发送:', successCount, '失败:', failureCount)
    
    return {
      success: true,
      message: `提醒任务完成，成功发送${successCount}条，失败${failureCount}条`,
      processedCount: successCount + failureCount,
      successCount: successCount,
      failureCount: failureCount
    }
    
  } catch (error) {
    console.error('开课前提醒任务失败:', error)
    return {
      success: false,
      message: '开课前提醒任务失败',
      error: error.message
    }
  }
}

// 发送开课前提醒通知
async function sendClassReminderNotification(params) {
  const { userId, courseName, teacherName, classTime, scheduleId } = params
  
  try {
    console.log('发送开课前提醒:', {
      userId: userId,
      courseName: courseName,
      teacherName: teacherName,
      classTime: classTime
    })
    
    // 调用订阅消息发送云函数
    const result = await cloud.callFunction({
      name: 'sendSubscribeMessage',
      data: {
        openid: userId,
        templateId: 'r79vVscc3dDWZA7x98g-5eDEmwaAkFTbknr5x6v_2iY', // 上课提醒模板ID
        messageType: 'class_reminder',
        data: {
          thing1: { value: courseName }, // 课程名称
          time2: { value: classTime }, // 上课时间
          thing4: { value: teacherName }, // 瑜伽老师
          thing5: { value: '请准时到达' } // 温馨提示
        },
        miniprogram: {
          state: 'formal' // 正式版小程序
        }
      }
    })
    
    if (!result.result || !result.result.success) {
      throw new Error('发送通知失败: ' + (result.result?.error || 'Unknown error'))
    }
    
    console.log('开课前提醒发送成功:', userId)
    
  } catch (error) {
    console.error('发送开课前提醒失败:', error)
    throw error
  }
}

// 格式化上课时间（符合微信订阅消息格式要求）
function formatClassTime(date, startTime) {
  try {
    // 解析日期和时间
    const dateObj = new Date(date + 'T00:00:00.000Z')
    // 转换为中国时区（+8小时）
    const chinaDate = new Date(dateObj.getTime() + 8 * 60 * 60 * 1000)
    
    const year = chinaDate.getFullYear()
    const month = String(chinaDate.getMonth() + 1).padStart(2, '0')
    const day = String(chinaDate.getDate()).padStart(2, '0')
    
    // 处理时间格式
    const [hours, minutes] = startTime.split(':')
    const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
    
    const result = `${year}年${month}月${day}日 ${formattedTime}`
    console.log('格式化上课时间结果:', result)
    return result
    
  } catch (error) {
    console.error('格式化时间失败:', error)
    // 返回中国时区当前时间作为备用
    const now = new Date()
    const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    const year = chinaTime.getFullYear()
    const month = String(chinaTime.getMonth() + 1).padStart(2, '0')
    const day = String(chinaTime.getDate()).padStart(2, '0')
    const hours = String(chinaTime.getHours()).padStart(2, '0')
    const minutes = String(chinaTime.getMinutes()).padStart(2, '0')
    return `${year}年${month}月${day}日 ${hours}:${minutes}`
  }
}
