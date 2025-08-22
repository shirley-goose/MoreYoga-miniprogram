// 验证管理员access权限的云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const currentOpenid = wxContext.OPENID;
  
  console.log('=== 验证管理员权限 ===');
  console.log('当前用户OPENID:', currentOpenid);
  
  try {
    // 检查用户是否是管理员
    const adminResult = await db.collection('admins')
      .where({ 
        openid: currentOpenid,
        status: 'active'
      })
      .get();
    
    console.log('查询管理员结果:', adminResult);
    
    if (adminResult.data.length > 0) {
      const adminInfo = adminResult.data[0];
      console.log('找到管理员信息:', adminInfo);
      
      return {
        success: true,
        isAdmin: true,
        adminInfo: {
          openid: adminInfo.openid,
          name: adminInfo.name,
          role: adminInfo.role || 'admin',
          permissions: adminInfo.permissions || []
        },
        message: '管理员验证成功'
      };
    } else {
      console.log('未找到管理员权限');
      return {
        success: true,
        isAdmin: false,
        message: '非管理员用户'
      };
    }
  } catch (error) {
    console.error('验证管理员权限失败:', error);
    return {
      success: false,
      message: '验证失败',
      error: error.message
    };
  }
};
