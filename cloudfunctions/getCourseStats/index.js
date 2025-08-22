// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前云环境
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const now = new Date()
    
    console.log('查询参数:', {
      now: now.toISOString()
    })
    

    
    // 从bookings集合开始查询已预约的课程
    const bookingsResult = await db.collection('bookings')
      .where({
        status: 'booked' // 只查询已预约的
      })
      .get()
    
    console.log('status为booked的记录数量:', bookingsResult.data.length)
    console.log('找到的预约记录数量:', bookingsResult.data.length)
    
    // 如果没有booked状态的，尝试其他可能的状态值
    if (bookingsResult.data.length === 0) {
      console.log('没有找到booked状态的记录，尝试其他状态')
      
      // 尝试常见的状态值
      const possibleStatuses = ['confirmed', 'pending', 'active', 'success', 'completed']
      
      for (const status of possibleStatuses) {
        const testResult = await db.collection('bookings')
          .where({
            status: status
          })
          .get()
        console.log(`status为${status}的记录数量:`, testResult.data.length)
        
        if (testResult.data.length > 0) {
          bookingsResult.data = testResult.data
          console.log(`使用${status}状态的记录进行处理`)
          break
        }
      }
      
      // 如果还是没有找到，查询所有记录看看实际的status值
      if (bookingsResult.data.length === 0) {
        console.log('尝试查询所有bookings记录')
        const allResult = await db.collection('bookings').get()
        console.log('bookings集合总记录数:', allResult.data.length)
        if (allResult.data.length > 0) {
          console.log('前5条记录的status值:', allResult.data.slice(0, 5).map(item => item.status))
          // 临时使用所有记录进行测试
          bookingsResult.data = allResult.data
          console.log('使用所有记录进行处理（调试模式）')
        }
      }
    }
    
    // 按courseName分组统计
    const courseMap = new Map()
    
    let processedCount = 0
    let skippedByTime = 0
    let userNotFound = 0
    
    for (const booking of bookingsResult.data) {
      try {
        console.log(`处理预约记录 ${processedCount + 1}:`, {
          id: booking._id,
          courseName: booking.courseName,
          date: booking.date,
          startTime: booking.startTime,
          userID: booking.userID || booking.userId, // 兼容两种字段名
          status: booking.status
        })
        
        // 检查课程是否在未来时间
        // 使用更兼容的日期格式
        const bookingDateTime = new Date(`${booking.date}T${booking.startTime}:00`)
        console.log('课程时间:', bookingDateTime.toISOString(), '当前时间:', now.toISOString())
        
        if (isNaN(bookingDateTime.getTime()) || bookingDateTime <= now) {
          if (isNaN(bookingDateTime.getTime())) {
            console.log('无效的日期时间格式:', booking.date, booking.startTime)
          } else {
            console.log('跳过已发生的课程')
          }
          skippedByTime++
          continue
        }
        
        const courseName = booking.courseName
        
        if (!courseMap.has(courseName)) {
          // 获取用户信息 - 兼容两种字段名
          const userId = booking.userID || booking.userId
          console.log('查询用户信息，userID:', userId)
          
          let userResult = { data: null }
          if (userId) {
            try {
              // 使用openid字段查询用户，而不是_id
              const userQuery = await db.collection('users')
                .where({
                  openid: userId
                })
                .get()
              
              if (userQuery.data && userQuery.data.length > 0) {
                userResult.data = userQuery.data[0]
              }
            } catch (userError) {
              console.error('查询用户信息失败:', userError)
            }
          }
          
          console.log('用户查询结果:', userResult.data)
          
          if (!userResult.data) {
            console.log('用户信息未找到')
            userNotFound++
          }
          
          const userInfo = userResult.data || {}
          console.log('用户手机号:', userInfo.phoneNumber)
          
          courseMap.set(courseName, {
            id: booking._id,
            courseName: courseName,
            teacherName: booking.teacherName || '未指定',
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
            bookings: [{
              id: booking._id,
              userName: userInfo.name || userInfo.nickName || '未知用户',
              userPhone: userInfo.phoneNumber || '未提供',
              status: booking.status,
              bookingTime: booking.bookingTime || booking.createTime || booking.createdAt
            }],
            bookingCount: 1,
            scheduleStatus: 'active'
          })
          
          console.log('创建新课程:', courseName)
        } else {
          // 添加到现有课程
          const courseInfo = courseMap.get(courseName)
          
          // 获取用户信息 - 兼容两种字段名
          const userId = booking.userID || booking.userId
          let userResult = { data: null }
          if (userId) {
            try {
              // 使用openid字段查询用户，而不是_id
              const userQuery = await db.collection('users')
                .where({
                  openid: userId
                })
                .get()
              
              if (userQuery.data && userQuery.data.length > 0) {
                userResult.data = userQuery.data[0]
              }
            } catch (userError) {
              console.error('查询用户信息失败:', userError)
            }
          }
          
          const userInfo = userResult.data || {}
          
          courseInfo.bookings.push({
            id: booking._id,
            userName: userInfo.name || userInfo.nickName || '未知用户',
            userPhone: userInfo.phoneNumber || '未提供',
            status: booking.status,
            bookingTime: booking.bookingTime || booking.createTime || booking.createdAt
          })
          
          courseInfo.bookingCount = courseInfo.bookings.length
          
          console.log('添加到现有课程:', courseName, '预约总数:', courseInfo.bookingCount)
        }
        
        processedCount++
        
      } catch (error) {
        console.error('处理单个预约记录失败:', error, booking)
      }
    }
    
    console.log('处理统计:', {
      总预约记录: bookingsResult.data.length,
      成功处理: processedCount,
      时间过滤跳过: skippedByTime,
      用户未找到: userNotFound,
      最终课程数: courseMap.size
    })
    
    // 转换为数组并按时间排序（最近的在前）
    let courses = Array.from(courseMap.values())
    
    courses.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.startTime}`)
      const dateB = new Date(`${b.date} ${b.startTime}`)
      return dateA - dateB // 升序排序，最近的在前
    })
    
    // 为每个课程的预约列表按时间排序
    courses.forEach(course => {
      course.bookings.sort((a, b) => new Date(a.bookingTime) - new Date(b.bookingTime))
    })
    
    console.log('最终处理的课程数量:', courses.length)
    
    return {
      success: true,
      courses: courses,
      total: courses.length,
      debug: {
        totalBookings: bookingsResult.data.length,
        processedCount: processedCount,
        skippedByTime: skippedByTime,
        userNotFound: userNotFound,
        finalProcessed: courses.length,
        queryTime: now.toISOString()
      }
    }

  } catch (error) {
    console.error('获取课程统计失败:', error)
    return {
      success: false,
      error: error.message,
      courses: []
    }
  }
}