const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    console.log('getUserPrivateBookings云函数开始执行')
    
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    if (!openid) {
      console.log('缺少openid')
      return {
        success: false,
        message: '用户身份验证失败'
      }
    }

    console.log('查询私教预约，用户openid:', openid)

    // 查询用户的私教预约记录
    const result = await db.collection('privateBookings')
      .where({
        studentOpenid: openid,
        status: db.command.in(['pending', 'confirmed', 'completed', 'cancelled']) // 排除已取消的
      })
      .orderBy('createTime', 'desc')
      .get()

    console.log('查询到的私教预约数量:', result.data.length)

    return {
      success: true,
      data: result.data
    }

  } catch (error) {
    console.error('获取私教预约失败:', error)
    return {
      success: false,
      message: '获取私教预约失败',
      error: error.message
    }
  }
}
