// 更新用户资料云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { nickName, avatarUrl, phoneNumber } = event;
  const wxContext = cloud.getWXContext();
  
  try {
    const updateData = {
      nickName,
      avatarUrl,
      updateTime: new Date()
    };
    
    // 如果提供了手机号，则更新手机号
    if (phoneNumber) {
      updateData.phoneNumber = phoneNumber;
    }
    
    // 更新用户信息
    const result = await db.collection('users')
      .where({
        openid: wxContext.OPENID
      })
      .update({
        data: updateData
      });
    
    if (result.stats.updated > 0) {
      return {
        success: true,
        message: '用户信息更新成功'
      };
    } else {
      return {
        success: false,
        message: '用户不存在'
      };
    }
    
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return {
      success: false,
      message: '更新用户信息失败',
      error: error.message
    };
  }
};
