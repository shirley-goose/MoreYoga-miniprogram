// 检查并取消不满足最低人数的课程云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    console.log('=== 开始检查并取消不满足人数的课程 ===')
    
    // 获取当前时间（中国时区）
    const now = new Date()
    const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    console.log('当前中国时间:', chinaTime.toISOString())
    
    // 计算1小时后的时间
    const oneHourLater = new Date(chinaTime.getTime() + 60 * 60 * 1000)
    const targetDate = oneHourLater.toISOString().split('T')[0] // YYYY-MM-DD格式
    const targetStartHour = oneHourLater.getHours()
    const targetEndHour = targetStartHour + 1 // 检查1小时时间范围
    
    console.log('查找目标日期:', targetDate)
    console.log('查找目标时间范围:', `${targetStartHour}:00 - ${targetEndHour}:00`)
    
    // 查询1小时后开始的活跃课程
    const scheduleResult = await db.collection('courseSchedule')
      .where({
        date: targetDate,
        status: 'active'
      })
      .get()
    
    console.log('查询到的课程安排总数:', scheduleResult.data.length)
    
    // 筛选1小时后开始的课程
    const targetCourses = scheduleResult.data.filter(schedule => {
      const [hours] = schedule.startTime.split(':').map(Number)
      return hours >= targetStartHour && hours < targetEndHour
    })
    
    console.log('需要检查的课程数量:', targetCourses.length)
    
    if (targetCourses.length === 0) {
      return {
        success: true,
        message: '当前时间段没有需要检查的课程',
        processedCount: 0
      }
    }
    
    let cancelledCount = 0
    let checkedCount = 0
    
    // 检查每个课程是否满足最低人数要求
    for (const course of targetCourses) {
      try {
        console.log('检查课程:', course.courseName, course.date, course.startTime)
        checkedCount++
        
        const minCapacity = course.minCapacity || 3 // 默认最少3人开课
        const currentBookings = course.currentBookings || 0
        const confirmedBookings = (course.bookings || []).filter(booking => 
          booking.status === 'booked' // 只计算已确认的预约
        ).length
        
        console.log('课程最低人数要求:', minCapacity)
        console.log('当前预约人数:', currentBookings)
        console.log('已确认预约人数:', confirmedBookings)
        
        // 如果不满足最低人数要求，取消课程
        if (confirmedBookings < minCapacity) {
          console.log('课程不满足最低人数要求，准备取消')
          
          // 更新课程状态为已取消
          await db.collection('courseSchedule')
            .doc(course._id)
            .update({
              data: {
                status: 'cancelled',
                cancelTime: new Date(),
                cancelReason: '不足开课人数，课程取消'
              }
            })
          
          // 更新所有预约记录状态为已取消
          if (course.bookings && course.bookings.length > 0) {
            // 更新课程安排中的预约记录
            const updatedBookings = course.bookings.map(booking => ({
              ...booking,
              status: 'cancelled',
              cancelTime: new Date(),
              cancelReason: '不足开课人数，课程取消'
            }))
            
            await db.collection('courseSchedule')
              .doc(course._id)
              .update({
                data: {
                  bookings: updatedBookings
                }
              })
            
            // 同时更新bookings集合中的记录
            for (const booking of course.bookings) {
              if (booking.status === 'booked') {
                try {
                  await db.collection('bookings')
                    .where({
                      userId: booking.userId,
                      scheduleId: course._id
                    })
                    .update({
                      data: {
                        status: 'cancelled',
                        cancelTime: new Date(),
                        cancelReason: '不足开课人数，课程取消'
                      }
                    })
                } catch (error) {
                  console.error('更新bookings集合失败:', error)
                }
              }
            }
          }
          
          // 返还用户课时
          await refundUserCredits(course)
          
          // 发送课程取消通知
          await sendCourseCancelNotification(course)
          
          cancelledCount++
          console.log('课程取消完成:', course.courseName)
        } else {
          console.log('课程满足人数要求，继续进行')
        }
        
      } catch (error) {
        console.error('处理课程失败:', course._id, error)
      }
    }
    
    console.log('=== 课程取消检查完成 ===')
    console.log('检查课程数:', checkedCount, '取消课程数:', cancelledCount)
    
    return {
      success: true,
      message: `检查完成，共检查${checkedCount}节课程，取消${cancelledCount}节课程`,
      checkedCount: checkedCount,
      cancelledCount: cancelledCount
    }
    
  } catch (error) {
    console.error('课程取消检查任务失败:', error)
    return {
      success: false,
      message: '课程取消检查任务失败',
      error: error.message
    }
  }
}

// 返还用户课时
async function refundUserCredits(course) {
  try {
    console.log('开始返还用户课时')
    
    if (!course.bookings || course.bookings.length === 0) {
      console.log('课程没有预约记录，无需返还课时')
      return
    }
    
    // 为每个已预约用户返还课时
    for (const booking of course.bookings) {
      if (booking.status === 'booked') {
        try {
          console.log('返还用户课时:', booking.userId)
          
          // 查询用户信息
          const userResult = await db.collection('users').where({
            openid: booking.userId
          }).get()
          
          if (userResult.data.length > 0) {
            const user = userResult.data[0]
            const currentCredits = user.groupCredits || 0
            const creditsToRefund = booking.creditsUsed || 1
            
            // 返还课时
            await db.collection('users').doc(user._id).update({
              data: {
                groupCredits: currentCredits + creditsToRefund
              }
            })
            
            console.log('课时返还成功:', booking.userId, '返还课时:', creditsToRefund)
          } else {
            console.error('用户不存在:', booking.userId)
          }
        } catch (error) {
          console.error('返还用户课时失败:', booking.userId, error)
        }
      }
    }
    
  } catch (error) {
    console.error('返还课时过程失败:', error)
  }
}

// 发送课程取消通知
async function sendCourseCancelNotification(course) {
  try {
    console.log('开始发送课程取消通知')
    
    if (!course.bookings || course.bookings.length === 0) {
      console.log('课程没有预约记录，无需发送通知')
      return
    }
    
    // 格式化课程时间
    const classTime = formatCourseTime(course)
    
    // 为每个已预约用户发送取消通知
    for (const booking of course.bookings) {
      if (booking.userId) {
        try {
          console.log('发送取消通知给用户:', booking.userId)
          
          // 调用发送订阅消息云函数
          await cloud.callFunction({
            name: 'sendSubscribeMessage',
            data: {
              openid: booking.userId,
              templateId: 'j2K0O4boiXqmfuO49SPOtyEqVa3_dh6uxM6_NW5wDz0', // 课程取消通知模板ID
              messageType: 'course_cancellation',
              data: {
                thing1: { value: course.courseName }, // 课程名称
                thing3: { value: course.teacherName || '瑜伽老师' }, // 上课老师
                time4: { value: classTime }, // 开课时间
                thing5: { value: '不足开课人数，课程取消' } // 取消原因
              },
              miniprogram: {
                state: 'formal'
              }
            }
          })
          
          console.log('取消通知发送成功:', booking.userId)
          
        } catch (error) {
          console.error('发送取消通知失败:', booking.userId, error)
        }
      }
    }
    
  } catch (error) {
    console.error('发送课程取消通知失败:', error)
  }
}

// 格式化课程时间
function formatCourseTime(course) {
  try {
    // 解析日期和时间
    const dateObj = new Date(course.date + 'T00:00:00.000Z')
    // 转换为中国时区（+8小时）
    const chinaDate = new Date(dateObj.getTime() + 8 * 60 * 60 * 1000)
    
    const year = chinaDate.getFullYear()
    const month = String(chinaDate.getMonth() + 1).padStart(2, '0')
    const day = String(chinaDate.getDate()).padStart(2, '0')
    
    // 处理时间格式
    const [hours, minutes] = course.startTime.split(':')
    const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
    
    const result = `${year}年${month}月${day}日 ${formattedTime}`
    console.log('格式化课程时间结果:', result)
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
