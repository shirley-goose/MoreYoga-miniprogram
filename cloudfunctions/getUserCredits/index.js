// 获取用户课时余额云函数
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

    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在',
        credits: {
          group: 0,
          term: 0
        }
      };
    }

    const user = userResult.data[0];
    
    return {
      success: true,
      credits: {
        group: user.groupCredits || 0,
        term: user.termCredits || 0
      },
      user: {
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        phoneNumber: user.phoneNumber,
        totalClasses: user.totalClasses || 0,
        openid: user.openid,
        registrationDate: user.registrationDate,
        createTime: user.createTime,
        updateTime: user.updateTime
      }
    };
  } catch (error) {
    console.error('获取用户课时余额失败:', error);
    return {
      success: false,
      message: '获取课时余额失败',
      error: error.message,
      credits: {
        group: 0,
        term: 0
      }
    };
  }
};
