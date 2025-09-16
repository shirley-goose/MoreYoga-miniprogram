// 定时检查并取消不满足人数的课程的云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数 - 这个函数需要配置为定时触发器
exports.main = async (event, context) => {
  try {
    console.log('=== 定时检查课程取消任务开始 ===')
    console.log('触发时间:', new Date().toISOString())
    
    // 调用检查并取消课程的云函数
    const result = await cloud.callFunction({
      name: 'checkAndCancelCourses'
    })
    
    console.log('调用结果:', result.result)
    
    return {
      success: true,
      message: '定时课程检查任务执行完成',
      result: result.result
    }
    
  } catch (error) {
    console.error('定时课程检查任务执行失败:', error)
    
    
    return {
      success: false,
      message: '定时课程检查任务执行失败',
      error: error.message
    }
  }
}