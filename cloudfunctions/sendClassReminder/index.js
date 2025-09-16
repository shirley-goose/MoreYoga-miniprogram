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
    
    // 计算4小时后的精确时间
    const fourHoursLater = new Date(chinaTime.getTime() + 4 * 60 * 60 * 1000)
    const targetDate = fourHoursLater.toISOString().split('T')[0] // YYYY-MM-DD格式
    const targetHour = fourHoursLater.getHours()
    const targetMinute = fourHoursLater.getMinutes()
    
    console.log('查找目标日期:', targetDate)
    console.log('查找目标时间:', `${targetHour}:${targetMinute.toString().padStart(2, '0')}`)
    
    // 查询当天的活跃课程
    const scheduleResult = await db.collection('courseSchedule')
      .where({
        date: targetDate,
        status: 'active'
      })
      .get()
    
    console.log('查询到的课程安排总数:', scheduleResult.data.length)
    
    // 筛选需要在此时发送提醒的课程
    // 只有当前时间恰好是课程开始前4小时时才发送（允许15分钟误差）
    const targetCourses = scheduleResult.data.filter(schedule => {
      const [courseHour, courseMinute] = schedule.startTime.split(':').map(Number)
      
      // 计算课程开始时间（以分钟为单位）
      const courseTimeInMinutes = courseHour * 60 + courseMinute
      
      // 计算当前时间4小时后的时间（以分钟为单位）
      const targetTimeInMinutes = targetHour * 60 + targetMinute
      
      // 检查是否恰好是4小时前（允许15分钟误差范围）
      const timeDiff = Math.abs(courseTimeInMinutes - targetTimeInMinutes)
      const shouldSendReminder = timeDiff <= 15 // 15分钟误差范围
      
      console.log(`课程${schedule.courseName}: 开始时间${schedule.startTime}, 时间差${timeDiff}分钟, 是否发送提醒:${shouldSendReminder}`)
      
      return shouldSendReminder
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
        
        // // 检查是否已经为这个课程发送过提醒（防重复发送）
        // const reminderKey = `${course._id}_${course.date}_${course.startTime}`
        // const existingReminder = await db.collection('reminderLogs')
        //   .where({
        //     reminderKey: reminderKey,
        //     type: 'class_reminder_4h',
        //     success: true
        //   })
        //   .get()
        
        // if (existingReminder.data.length > 0) {
        //   console.log('该课程已发送过提醒，跳过:', course.courseName)
        //   continue
        // }
        
        // 获取该课程的所有已确认预约用户
        const confirmedBookings = (course.bookings || []).filter(booking => 
          booking.status === 'booked' // 只给已确认预约的用户发送提醒
        )
        
        console.log('该课程已确认预约用户数:', confirmedBookings.length)
        
        if (confirmedBookings.length === 0) {
          console.log('该课程没有已确认的预约用户，跳过')
          continue
        }
        
        let courseSuccessCount = 0
        let courseFailureCount = 0
        
        // 为每个用户发送提醒
        for (const booking of confirmedBookings) {
          try {
            await sendClassReminderNotification({
              userId: booking.userId,
              courseName: course.courseName,
              teacherName: course.teacherName,
              classTime: formatClassTime(course.date, course.startTime),
              scheduleId: String(course._id)
            })
            courseSuccessCount++
            console.log('提醒发送成功:', booking.userId)
          } catch (error) {
            console.error('发送提醒失败:', booking.userId, error)
            courseFailureCount++
          }
        }
        
        // 记录此课程的提醒发送日志（防重复发送）
        await db.collection('reminderLogs').add({
          data: {
            reminderKey: reminderKey,
            courseId: course._id,
            courseName: course.courseName,
            courseDate: course.date,
            courseStartTime: course.startTime,
            type: 'class_reminder_4h',
            success: courseSuccessCount > 0,
            successCount: courseSuccessCount,
            failureCount: courseFailureCount,
            timestamp: new Date()
          }
        })
        
        successCount += courseSuccessCount
        failureCount += courseFailureCount
        
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
