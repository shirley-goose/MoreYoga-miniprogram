// 云函数入口文件
const cloud = require('wx-server-sdk');

// 使用当前云函数所在环境
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

console.log('📌 process.env.TCB_ENV:', process.env.TCB_ENV);
console.log('📌 Node版本:', process.version);

exports.main = async (event, context) => {
  const {
    userId,
    templateId,
    pagePath = 'pages/index/index',
    messageData
  } = event;

  console.log('📌 云函数初始化环境:', process.env.TCB_ENV);
  console.log('📌 event 参数:', JSON.stringify(event, null, 2));

  // 参数检查
  if (!userId) {
    console.error('❌ 缺少用户 openid');
    return { success: false, error: '缺少用户 openid' };
  }
  if (!templateId) {
    console.error('❌ 缺少模板 ID');
    return { success: false, error: '缺少模板 ID' };
  }
  if (!messageData) {
    console.error('❌ 缺少消息数据 messageData');
    return { success: false, error: '缺少消息数据' };
  }

  try {
    console.log('🔥 调用订阅消息 API:', { userId, templateId, pagePath, messageData });

    const result = await cloud.openapi.subscribeMessage.send({
      touser: userId,
      templateId,
      page: pagePath,
      data: messageData
    });

    console.log('✅ 订阅消息发送成功:', result);
    return { success: true, result };

  } catch (err) {
    console.error('❌ 订阅消息发送失败:', {
      errCode: err.errCode,
      errMsg: err.errMsg,
      stack: err.stack
    });
    return {
      success: false,
      errCode: err.errCode,
      errMsg: err.errMsg,
      stack: err.stack
    };
  }
};
