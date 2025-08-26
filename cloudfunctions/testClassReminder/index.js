// 测试开课前4小时提醒功能的云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { testMode = 'manual' } = event // manual: 手动测试, auto: 自动测试
  
  try {
    console.log('=== 测试开课前4小时提醒功能 ===')
    console.log('测试模式:', testMode)
    
    if (testMode === 'manual') {
      return await manualTest(event)
    } else if (testMode === 'auto') {
      return await autoTest()
    } else {
      return {
        success: false,
        message: '未知的测试模式'
      }
    }
    
  } catch (error) {
    console.error('测试开课前提醒功能失败:', error)
    return {
      success: false,
      message: '测试失败',
      error: error.message
    }
  }
}

// 手动测试：发送指定用户的测试通知
async function manualTest(event) {
  const { userId, courseName = '测试瑜伽课程', teacherName = '测试老师' } = event
  
  if (!userId) {
    return {
      success: false,
      message: '测试需要提供用户ID (userId)'
    }
  }
  
  try {
    console.log('手动测试发送开课提醒给用户:', userId)
    
    // 构造测试时间（当前时间+4小时）
    const now = new Date()
    const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    const testTime = new Date(chinaTime.getTime() + 4 * 60 * 60 * 1000)
    
    const year = testTime.getFullYear()
    const month = String(testTime.getMonth() + 1).padStart(2, '0')
    const day = String(testTime.getDate()).padStart(2, '0')
    const hours = String(testTime.getHours()).padStart(2, '0')
    const minutes = String(testTime.getMinutes()).padStart(2, '0')
    const formattedTime = `${year}年${month}月${day}日 ${hours}:${minutes}`
    
    // 发送测试通知
    const result = await cloud.callFunction({
      name: 'sendSubscribeMessage',
      data: {
        openid: userId,
        templateId: 'r79vVscc3dDWZA7x98g-5eDEmwaAkFTbknr5x6v_2iY',
        messageType: 'class_reminder_test',
        data: {
          thing1: { value: courseName }, // 课程名称
          time2: { value: formattedTime }, // 上课时间
          thing4: { value: teacherName }, // 瑜伽老师
          thing5: { value: '请准时到达' } // 温馨提示
        },
        miniprogram: {
          state: 'formal'
        }
      }
    })
    
    console.log('测试通知发送结果:', result.result)
    
    return {
      success: true,
      message: '测试通知发送完成',
      userId: userId,
      testTime: formattedTime,
      result: result.result
    }
    
  } catch (error) {
    console.error('手动测试失败:', error)
    return {
      success: false,
      message: '手动测试失败',
      error: error.message
    }
  }
}

// 自动测试：检查系统当前的课程和提醒功能
async function autoTest() {
  try {
    console.log('自动测试开课前提醒系统')
    
    // 1. 检查是否有今天的课程
    const today = new Date()
    const chinaTime = new Date(today.getTime() + 8 * 60 * 60 * 1000)
    const todayStr = chinaTime.toISOString().split('T')[0]
    
    const todaySchedules = await db.collection('courseSchedule')
      .where({
        date: todayStr,
        status: 'active'
      })
      .get()
    
    console.log('今天的课程数量:', todaySchedules.data.length)
    
    // 2. 调用提醒功能进行测试
    const reminderResult = await cloud.callFunction({
      name: 'sendClassReminder'
    })
    
    console.log('提醒功能测试结果:', reminderResult.result)
    
    // 3. 检查提醒日志
    const logs = await db.collection('reminderLogs')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get()
    
    console.log('最近的提醒日志:', logs.data)
    
    return {
      success: true,
      message: '自动测试完成',
      todayCoursesCount: todaySchedules.data.length,
      reminderResult: reminderResult.result,
      recentLogs: logs.data
    }
    
  } catch (error) {
    console.error('自动测试失败:', error)
    return {
      success: false,
      message: '自动测试失败',
      error: error.message
    }
  }
}
