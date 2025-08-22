// 管理员登录云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { username, password } = event;
  const wxContext = cloud.getWXContext();
  
  try {
    // 预设的管理员账号（可以在数据库中配置）
    const defaultAdmins = [
      {
        username: 'admin',
        password: 'yoga123456',
        name: '系统管理员',
        role: 'super_admin',
        permissions: ['all']
      },
      {
        username: 'manager',
        password: 'manager888',
        name: '馆主',
        role: 'manager',
        permissions: ['course_manage', 'user_manage', 'schedule_manage']
      }
    ];
    
    // 验证账号密码
    let adminInfo = null;
    
    // 首先检查预设账号
    const defaultAdmin = defaultAdmins.find(admin => 
      admin.username === username && admin.password === password
    );
    
    if (defaultAdmin) {
      adminInfo = defaultAdmin;
    } else {
      // 如果预设账号没找到，检查数据库中的自定义管理员
      const customAdminResult = await db.collection('admins')
        .where({
          username: username,
          password: password,
          status: 'active'
        })
        .get();
        
      if (customAdminResult.data.length > 0) {
        const customAdmin = customAdminResult.data[0];
        adminInfo = {
          username: customAdmin.username,
          name: customAdmin.name,
          role: customAdmin.role,
          permissions: customAdmin.permissions || ['course_manage', 'user_manage']
        };
      }
    }
    
    if (!adminInfo) {
      return {
        success: false,
        message: '账号或密码错误'
      };
    }
    
    // 生成简单的token（生产环境建议使用JWT）
    const token = generateToken(adminInfo, wxContext.OPENID);
    
    // 记录登录日志
    await db.collection('adminLogs').add({
      data: {
        adminUsername: adminInfo.username,
        adminName: adminInfo.name,
        action: 'login',
        openid: wxContext.OPENID,
        timestamp: new Date(),
        ip: context.WX_HTTP_REQUEST_IP || '',
        userAgent: context.WX_HTTP_REQUEST_USER_AGENT || ''
      }
    });
    
    return {
      success: true,
      message: '登录成功',
      token: token,
      adminInfo: {
        username: adminInfo.username,
        name: adminInfo.name,
        role: adminInfo.role,
        permissions: adminInfo.permissions
      }
    };
    
  } catch (error) {
    console.error('管理员登录失败:', error);
    return {
      success: false,
      message: '登录失败，请重试',
      error: error.message
    };
  }
};

// 生成简单token
function generateToken(adminInfo, openid) {
  const timestamp = Date.now();
  const data = {
    username: adminInfo.username,
    role: adminInfo.role,
    openid: openid,
    timestamp: timestamp,
    expiry: timestamp + 7 * 24 * 60 * 60 * 1000 // 7天过期
  };
  
  // 简单的base64编码（生产环境建议使用加密）
  return Buffer.from(JSON.stringify(data)).toString('base64');
}
