// 发送通知云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, type, title, content, scheduleId } = event;
  
  try {
    // 保存通知记录
    await db.collection('notifications').add({
      data: {
        userId,
        type,
        title,
        content,
        scheduleId,
        isRead: false,
        sendTime: new Date()
      }
    });
    
    // 根据通知类型选择相应的模板ID
    const templateMapping = {
      'booking_success': 'template_booking_success',
      'class_confirmed': 'template_class_confirmed', 
      'class_reminder': 'template_class_reminder',
      'class_cancelled': 'template_class_cancelled',
      'waitlist_to_booked': 'template_waitlist_to_booked'
    };
    
    const templateId = templateMapping[type] || 'template_default';
    
    // 发送订阅消息（需要用户订阅后才能发送）
    try {
      await cloud.openapi.subscribeMessage.send({
        touser: userId,
        templateId: templateId,
        page: 'pages/profile/profile',
        data: {
          thing1: { value: title.substring(0, 20) },
          thing2: { value: content.substring(0, 20) },
          time3: { value: new Date().toLocaleString() }
        }
      });
      
      console.log('订阅消息发送成功');
    } catch (subscribeError) {
      console.log('订阅消息发送失败，可能用户未订阅:', subscribeError);
      // 不影响主流程，继续执行
    }
    
    return { success: true };
  } catch (error) {
    console.error('发送通知失败:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};
