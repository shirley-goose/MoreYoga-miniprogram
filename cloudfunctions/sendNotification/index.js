// 发送通知云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, type, title, content, scheduleId, teacherName, classTime, extraData } = event;
  
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
      'waitlist_to_booked': 'template_waitlist_to_booked',
      'private_booking_confirmed': 'Gh4le1pvgOkdxcgo0rlZYgeJH15oT6N8GMN9vbnkLVg'
    };
    
    const templateId = templateMapping[type] || 'template_default';
    
    // 发送订阅消息（需要用户订阅后才能发送）
    try {
      let messageData = {};
      let pagePath = 'pages/profile/profile';
      
      // 根据通知类型设置不同的数据格式
      if (type === 'private_booking_confirmed') {
        // 私教预约成功通知
        messageData = {
          thing1: { value: '墨瑜伽私教' },
          thing2: { value: teacherName || '老师' },
          time3: { value: classTime || formatWechatTime(new Date()) },
          thing4: { value: '请准时到达' }
        };
        pagePath = 'pages/private-history/private-history';
      } else {
        // 其他类型通知使用默认格式
        messageData = {
          thing1: { value: title.substring(0, 20) },
          thing2: { value: content.substring(0, 20) },
          time3: { value: formatWechatTime(new Date()) }
        };
      }
      
      await cloud.openapi.subscribeMessage.send({
        touser: userId,
        templateId: templateId,
        page: pagePath,
        data: messageData
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
