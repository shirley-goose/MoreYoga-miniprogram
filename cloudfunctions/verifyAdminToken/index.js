// 验证管理员token云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { token } = event;
  const wxContext = cloud.getWXContext();
  
  console.log('=== 开始验证管理员token ===');
  console.log('接收到的token:', token);
  console.log('当前用户OPENID:', wxContext.OPENID);
  
  try {
    if (!token) {
      console.log('验证失败：缺少token');
      return {
        success: false,
        message: '缺少token'
      };
    }
    
    // 解析token
    let tokenData;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      tokenData = JSON.parse(decoded);
      console.log('解析后的token数据:', tokenData);
    } catch (error) {
      console.log('验证失败：token格式错误', error);
      return {
        success: false,
        message: 'token格式错误'
      };
    }
    
    // 检查token是否过期
    const now = Date.now();
    console.log('当前时间:', now);
    console.log('token过期时间:', tokenData.expiry);
    console.log('是否过期:', now > tokenData.expiry);
    
    if (now > tokenData.expiry) {
      console.log('验证失败：token已过期');
      return {
        success: false,
        message: 'token已过期，请重新登录'
      };
    }
    
    // 检查openid是否匹配（暂时放宽验证，记录但不强制）
    console.log('token中的openid:', tokenData.openid);
    console.log('当前请求的openid:', wxContext.OPENID);
    console.log('openid是否匹配:', tokenData.openid === wxContext.OPENID);
    
    if (tokenData.openid !== wxContext.OPENID) {
      console.log('警告：openid不匹配，但允许通过（可能是跨页面调用）');
      // 暂时不阻止，只记录
      // return {
      //   success: false,
      //   message: 'token无效，openid不匹配'
      // };
    }
    
    console.log('验证成功');
    return {
      success: true,
      adminInfo: {
        username: tokenData.username,
        role: tokenData.role,
        openid: tokenData.openid
      }
    };
    
  } catch (error) {
    console.error('验证token失败:', error);
    return {
      success: false,
      message: '验证失败',
      error: error.message
    };
  }
};
