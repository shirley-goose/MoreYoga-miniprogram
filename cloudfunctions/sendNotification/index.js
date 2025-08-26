// 发送通知云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  console.log('🔍 云函数环境信息:', {
    ENV: process.env.TENCENTCLOUD_RUNENV,
    WX_APPID: wxContext.APPID,
    WX_OPENID: wxContext.OPENID,
    WX_UNIONID: wxContext.UNIONID
  })

  console.log('云函数当前环境:', process.env.TCB_ENV) 

  const {
    userId,
    title,
    teacherName,
    classTime,
    scheduleId
  } = event

  try {
    // 调用 openapi 发送订阅消息
    const result = await cloud.openapi.subscribeMessage.send({
      touser: userId,
      templateId: 'Gh4le1pvgOkdxcgo0rlZYgeJH15oT6N8GMN9vbnkLVg', // 你的模板 ID
      page: 'pages/private-history/private-history',
      data: {
        thing1: { value: '墨瑜伽私教' },
        thing2: { value: teacherName },
        time3: { value: classTime },
        thing4: { value: '请准时到达' }
      }
    })

    console.log('✅ 订阅消息发送成功:', result)
    return { success: true, result }
  } catch (err) {
    console.error('❌ 订阅消息发送失败:', {
      errCode: err.errCode,
      errMsg: err.errMsg,
      stack: err.stack
    })
    return { success: false, errCode: err.errCode, errMsg: err.errMsg }
  }
}

// 格式化时间为微信订阅消息支持的格式（转换为中国时区）
function formatWechatTime(date) {
  try {
    // 转换为中国时区（+8小时）
    const chinaTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    
    const year = chinaTime.getFullYear();
    const month = String(chinaTime.getMonth() + 1).padStart(2, '0');
    const day = String(chinaTime.getDate()).padStart(2, '0');
    const hours = String(chinaTime.getHours()).padStart(2, '0');
    const minutes = String(chinaTime.getMinutes()).padStart(2, '0');
    
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  } catch (error) {
    console.error('格式化微信时间失败:', error);
    return '时间格式错误';
  }
}
