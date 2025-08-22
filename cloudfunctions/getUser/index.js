// 获取用户信息云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 查询用户信息
    const userResult = await db.collection('users')
      .where({ openid })
      .get();

    if (userResult.data.length > 0) {
      return {
        success: true,
        data: userResult.data[0]
      };
    } else {
      return {
        success: false,
        message: '用户不存在'
      };
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return {
      success: false,
      message: '获取用户信息失败',
      error: error.message
    };
  }
};
