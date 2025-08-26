// 定时检查并发送开课前4小时提醒的云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数 - 这个函数需要配置为定时触发器
exports.main = async (event, context) => {
  try {
    console.log('=== 定时检查开课前提醒任务开始 ===')
    console.log('触发时间:', new Date().toISOString())
    
    // 调用发送提醒的云函数
    const result = await cloud.callFunction({
      name: 'sendClassReminder'
    })
    
    console.log('调用结果:', result.result)
    
    // 记录执行日志到数据库（可选）
    await recordReminderLog(result.result)
    
    return {
      success: true,
      message: '定时提醒任务执行完成',
      result: result.result
    }
    
  } catch (error) {
    console.error('定时提醒任务执行失败:', error)
    
    // 记录错误日志
    await recordReminderLog({
      success: false,
      error: error.message,
      timestamp: new Date()
    })
    
    return {
      success: false,
      message: '定时提醒任务执行失败',
      error: error.message
    }
  }
}

// 记录提醒执行日志
async function recordReminderLog(logData) {
  try {
    const db = cloud.database()
    
    await db.collection('reminderLogs').add({
      data: {
        ...logData,
        timestamp: new Date(),
        type: 'class_reminder_4h'
      }
    })
    
    console.log('记录提醒日志成功')
  } catch (error) {
    console.error('记录提醒日志失败:', error)
    // 不抛出错误，避免影响主流程
  }
}
