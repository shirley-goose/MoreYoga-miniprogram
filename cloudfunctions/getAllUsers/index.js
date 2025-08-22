// 获取所有用户列表云函数（仅管理员可用）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const adminOpenid = wxContext.OPENID;
  const { keyword = '', limit = 50, skip = 0 } = event;

  try {
    // 检查管理员权限
    const isAdmin = await checkAdminPermission(adminOpenid);
    if (!isAdmin) {
      return {
        success: false,
        message: '无管理员权限'
      };
    }

    // 构建查询条件
    let whereCondition = {};
    
    if (keyword.trim()) {
      // 简单的关键词搜索（昵称或手机号）
      whereCondition = db.command.or([
        {
          nickName: db.command.eq(keyword.trim())
        },
        {
          phoneNumber: db.command.eq(keyword.trim())
        }
      ]);
    }

    // 查询用户列表
    const users = await db.collection('users')
      .where(whereCondition)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(limit)
      .get();

    return {
      success: true,
      data: users.data,
      total: users.data.length
    };
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return {
      success: false,
      message: '获取用户列表失败',
      error: error.message
    };
  }
};

// 检查管理员权限
async function checkAdminPermission(openid) {
  try {
    // 首先检查数据库中的管理员
    const adminResult = await db.collection('admins')
      .where({ 
        openid: openid,
        status: 'active'
      })
      .get();
    
    if (adminResult.data.length > 0) {
      return true;
    }
    
    // 如果数据库中没有找到，检查是否是预设的管理员openid
    // 预设管理员的openid列表（需要手动添加实际的openid）
    const defaultAdminOpenids = [
      // 'ozHc8164opfwil_GBgadEQ0dr3rs', // 请替换为实际的管理员微信openid
      // 'another-admin-openid-here'
    ];
    
    return defaultAdminOpenids.includes(openid);
  } catch (error) {
    console.error('检查管理员权限失败:', error);
    return false;
  }
}
