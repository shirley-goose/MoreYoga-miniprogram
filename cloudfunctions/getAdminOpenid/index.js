// 临时云函数：获取管理员OpenID
// 使用完毕后可以删除此云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  
  console.log('管理员OpenID获取请求');
  console.log('OpenID:', wxContext.OPENID);
  
  return {
    success: true,
    message: '请查看云函数日志或返回结果中的openid',
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID || null,
    timestamp: new Date().toISOString()
  };
};
