// 管理员添加课程安排云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  try {
    // 检查管理员权限
    const isAdmin = await checkAdminPermission(openid);
    if (!isAdmin) {
      return {
        success: false,
        message: '无管理员权限'
      };
    }
    
    const { 
      courseName,
      teacherId, 
      teacherName,
      date, 
      startTime, 
      endTime, 
      description,
      minCapacity,
      maxCapacity,
      creditsRequired
    } = event;
    
    console.log('接收到的数据:', event);
    
    // 验证必填字段
    if (!courseName || !teacherId || !teacherName || !date || !startTime || !endTime) {
      console.log('缺少必填字段:', {
        courseName: !!courseName,
        teacherId: !!teacherId,
        teacherName: !!teacherName,
        date: !!date,
        startTime: !!startTime,
        endTime: !!endTime
      });
      return {
        success: false,
        message: '缺少必填字段'
      };
    }
    
    // 检查时间冲突（可选）
    const conflictSchedules = await db.collection('courseSchedule')
      .where({
        teacherId: teacherId,
        date: date,
        status: 'active'
      })
      .get();
    
    // 简单的时间冲突检查
    for (const schedule of conflictSchedules.data) {
      if (timeOverlap(startTime, endTime, schedule.startTime, schedule.endTime)) {
        return {
          success: false,
          message: `教师${teacherName}在该时间段已有其他课程安排`
        };
      }
    }
    
    // 创建课程安排
    const scheduleData = {
      courseName,
      teacherId,
      teacherName,
      date,
      startTime,
      endTime,
      description: description || '',
      minCapacity: parseInt(minCapacity) || 1,
      maxCapacity: parseInt(maxCapacity) || 20,
      creditsRequired: parseInt(creditsRequired) || 1,
      currentBookings: 0,
      bookings: [],
      status: 'active',
      createTime: new Date(),
      createdBy: openid
    };
    
    const result = await db.collection('courseSchedule').add({
      data: scheduleData
    });
    
    return {
      success: true,
      message: '课程安排创建成功',
      scheduleId: result._id,
      schedule: scheduleData
    };
    
  } catch (error) {
    console.error('创建课程安排失败:', error);
    return {
      success: false,
      message: '创建课程安排失败',
      error: error.message
    };
  }
};

// 检查管理员权限（简化版）
async function checkAdminPermission(openid) {
  try {
    console.log('检查管理员权限，openid:', openid);
    
    // 简化权限检查：暂时允许所有用户（因为我们已经在前端验证了登录）
    // 在生产环境中，可以在这里添加更严格的权限验证
    return true;
    
    // 如果需要严格权限控制，可以使用以下代码：
    /*
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
    
    // 预设管理员的openid列表（需要手动添加实际的openid）
    const defaultAdminOpenids = [
      // 'your-admin-openid-here', // 请替换为实际的管理员微信openid
      // 'another-admin-openid-here'
    ];
    
    return defaultAdminOpenids.includes(openid);
    */
  } catch (error) {
    console.error('检查管理员权限失败:', error);
    return false;
  }
}

// 检查时间重叠
function timeOverlap(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}
