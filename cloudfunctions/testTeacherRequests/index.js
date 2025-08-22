// 测试云函数 - 获取老师预约申请
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    console.log('testTeacherRequests云函数执行开始')
    console.log('接收参数:', event)
    
    // 返回测试数据
    const testData = {
      success: true,
      pendingRequests: [
        {
          _id: 'test123',
          studentName: '测试学员',
          studentPhone: '13800000000',
          date: '2025-08-21',
          timeRange: '06:15-07:15',
          content: '测试内容需求',
          price: 350,
          createTimeDisplay: '刚刚'
        }
      ],
      processedRequests: [],
      total: 1
    }
    
    console.log('返回测试数据:', testData)
    return testData
    
  } catch (error) {
    console.error('测试云函数失败:', error)
    return {
      success: false,
      message: '测试云函数失败',
      error: error.message
    }
  }
}
