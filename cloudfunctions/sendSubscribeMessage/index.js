// 发送订阅消息云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { openid, templateId, data, miniprogram, messageType } = event;
  
  console.log('=== 发送订阅消息 ===');
  console.log('接收者openid:', openid);
  console.log('模板ID:', templateId);
  console.log('消息类型:', messageType);
  console.log('消息数据:', data);
  
  try {
    // 检查必要参数
    if (!openid || !templateId || !data) {
      throw new Error('缺少必要参数：openid、templateId 或 data');
    }
    
    // 调用微信API发送订阅消息
    const result = await cloud.openapi.subscribeMessage.send({
      touser: openid,
      template_id: templateId,
      miniprogram_state: miniprogram?.state || 'formal', // formal 正式版，trial 体验版，developer 开发版
      lang: 'zh_CN',
      data: data
    });
    
    console.log('订阅消息发送成功:', result);
    
    return {
      success: true,
      msgid: result.msgid,
      message: '订阅消息发送成功',
      messageType: messageType || 'unknown'
    };
    
  } catch (error) {
    console.error('发送订阅消息失败:', error);
    
    // 记录错误详情
    let errorMessage = '发送失败';
    if (error.errCode) {
      switch (error.errCode) {
        case 43101:
          errorMessage = '用户拒绝接受消息';
          break;
        case 43104:
          errorMessage = '模板参数不正确';
          break;
        case 47003:
          errorMessage = '模板参数值长度过长';
          break;
        case 43102:
          errorMessage = '用户未订阅该模板消息';
          break;
        default:
          errorMessage = `发送失败：${error.errMsg || error.message}`;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      errCode: error.errCode,
      messageType: messageType || 'unknown'
    };
  }
};
