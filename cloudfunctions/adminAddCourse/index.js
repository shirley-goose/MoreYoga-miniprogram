// 管理员添加课程云函数
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
      title, 
      type, 
      teacherId, 
      teacherName, 
      description, 
      maxStudents, 
      minStudents, 
      price, 
      duration 
    } = event;
    
    // 验证必填字段
    if (!title || !type || !teacherId || !teacherName) {
      return {
        success: false,
        message: '缺少必填字段'
      };
    }
    
    // 创建课程
    const courseData = {
      title,
      type, // private|group|camp
      teacherId,
      teacherName,
      description: description || '',
      maxStudents: maxStudents || 8,
      minStudents: minStudents || 2,
      price: price || 1,
      duration: duration || 60,
      status: 'active',
      createTime: new Date(),
      updateTime: new Date(),
      createdBy: openid
    };
    
    const result = await db.collection('courses').add({
      data: courseData
    });
    
    return {
      success: true,
      message: '课程创建成功',
      courseId: result._id,
      course: courseData
    };
    
  } catch (error) {
    console.error('创建课程失败:', error);
    return {
      success: false,
      message: '创建课程失败',
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
