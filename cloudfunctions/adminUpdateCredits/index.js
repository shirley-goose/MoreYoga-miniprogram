// 管理员更新用户课时云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const adminOpenid = wxContext.OPENID;
  
  try {
    // 检查管理员权限
    const isAdmin = await checkAdminPermission(adminOpenid);
    if (!isAdmin) {
      return {
        success: false,
        message: '无管理员权限'
      };
    }
    
    const { 
      userOpenid, 
      groupCreditsChange, 
      termCreditsChange, 
      operation, // 'add' | 'set' | 'deduct'
      reason 
    } = event;
    
    // 验证必填字段
    if (!userOpenid || !operation) {
      return {
        success: false,
        message: '缺少必填字段'
      };
    }
    
    // 查询用户信息
    const userResult = await db.collection('users')
      .where({ openid: userOpenid })
      .get();
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      };
    }
    
    const user = userResult.data[0];
    let updateData = {
      updateTime: new Date()
    };
    
    // 根据操作类型更新课时
    switch (operation) {
      case 'add':
        if (groupCreditsChange) {
          updateData.groupCredits = _.inc(groupCreditsChange);
        }
        if (termCreditsChange) {
          updateData.termCredits = _.inc(termCreditsChange);
        }
        break;
        
      case 'set':
        if (groupCreditsChange !== undefined) {
          updateData.groupCredits = groupCreditsChange;
        }
        if (termCreditsChange !== undefined) {
          updateData.termCredits = termCreditsChange;
        }
        break;
        
      case 'deduct':
        if (groupCreditsChange) {
          updateData.groupCredits = _.inc(-Math.abs(groupCreditsChange));
        }
        if (termCreditsChange) {
          updateData.termCredits = _.inc(-Math.abs(termCreditsChange));
        }
        break;
        
      default:
        return {
          success: false,
          message: '无效的操作类型'
        };
    }
    
    // 更新用户课时
    await db.collection('users')
      .where({ openid: userOpenid })
      .update({ data: updateData });
    
    // 记录操作日志
    await db.collection('adminLogs').add({
      data: {
        adminOpenid,
        targetUserOpenid: userOpenid,
        action: 'update_credits',
        operation,
        groupCreditsChange: groupCreditsChange || 0,
        termCreditsChange: termCreditsChange || 0,
        reason: reason || '',
        originalGroupCredits: user.groupCredits,
        originalTermCredits: user.termCredits,
        timestamp: new Date()
      }
    });
    
    // 获取更新后的用户信息
    const updatedUserResult = await db.collection('users')
      .where({ openid: userOpenid })
      .get();
    
    return {
      success: true,
      message: '课时更新成功',
      user: updatedUserResult.data[0]
    };
    
  } catch (error) {
    console.error('更新用户课时失败:', error);
    return {
      success: false,
      message: '更新用户课时失败',
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
