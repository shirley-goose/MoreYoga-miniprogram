// 获取老师的预约申请云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    console.log('getTeacherRequests云函数开始执行')
    console.log('接收到的参数:', event)
    
    const { teacherId } = event

    if (!teacherId) {
      console.log('缺少teacherId参数')
      return {
        success: false,
        message: '缺少老师ID'
      }
    }

    console.log('获取老师预约申请，teacherId:', teacherId)

    // 根据teacherId获取老师姓名
    const teacherNames = {
      'zhouzhou': '周周老师',
      'yinger': '莹儿老师',
      'qiqi': '岐岐老师',
      'yaqin': '雅琴老师',
      'chengmin': '程敏老师'
    }
    const teacherName = teacherNames[teacherId] || teacherId
    console.log('老师姓名:', teacherName)
    
    // 获取该老师的所有预约申请
    console.log('开始查询privateBookings集合，条件:', { teacherName })
    
    const allRequestsResult = await db.collection('privateBookings')
      .where({
        teacherName: teacherName
      })
      .orderBy('createTime', 'desc')
      .get()

    const allRequests = allRequestsResult.data
    console.log('找到预约申请数量:', allRequests.length)

    // 获取所有用户的openid，用于查询用户名称
    const userOpenids = [...new Set(allRequests.map(req => req.studentOpenid).filter(Boolean))];
    console.log('需要查询的用户openid列表:', userOpenids);

    // 批量查询用户信息
    const userInfoMap = {};
    if (userOpenids.length > 0) {
      const userResult = await db.collection('users')
        .where({
          openid: db.command.in(userOpenids)
        })
        .get();
      
      userResult.data.forEach(user => {
        userInfoMap[user.openid] = {
          nickName: user.nickName || user.name || '未知用户',
          phone: user.phone || ''
        };
      });
      console.log('查询到的用户信息:', userInfoMap);
    }

    // 时间格式化函数（转换为中国时区）
    function formatChineseTime(dateStr) {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        // 加8小时转换为中国时区
        const chinaTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
        return `${chinaTime.getMonth() + 1}月${chinaTime.getDate()}日 ${chinaTime.getHours().toString().padStart(2, '0')}:${chinaTime.getMinutes().toString().padStart(2, '0')}`;
      } catch (error) {
        console.error('时间格式化错误:', error);
        return '';
      }
    }

    // 处理每个预约申请，添加申请类型和显示信息
    const processedData = allRequests.map(req => {
      // 获取用户信息
      const userInfo = userInfoMap[req.studentOpenid] || {};
      const studentName = userInfo.nickName || req.studentName || '未知用户';
      const studentPhone = userInfo.phone || req.studentPhone || '';

      // 判断申请类型
      let requestType = 'booking'; // 默认为新课预约
      if (req.cancelRequestStatus) {
        requestType = 'cancel'; // 取消申请
      }

      // 格式化不同类型的时间
      let timeDisplay = '';
      if (requestType === 'booking') {
        // 新课申请：显示申请时间createTime
        timeDisplay = formatChineseTime(req.createTime);
      } else if (requestType === 'cancel') {
        // 取消申请：显示取消申请时间cancelRequestTime
        timeDisplay = formatChineseTime(req.cancelRequestTime);
      }

      // 格式化处理时间（用于已处理列表）
      let processTimeDisplay = '';
      if (requestType === 'booking') {
        processTimeDisplay = formatChineseTime(req.processTime);
      } else if (requestType === 'cancel') {
        processTimeDisplay = formatChineseTime(req.cancelProcessTime);
      }
      
      return {
        ...req,
        requestType: requestType,
        studentName: studentName,
        studentPhone: studentPhone,
        timeDisplay: timeDisplay,
        processTimeDisplay: processTimeDisplay,
        // 保持向后兼容
        createTimeDisplay: timeDisplay
      };
    });

    // 分类处理：待处理和已处理
    const pendingRequests = processedData.filter(req => {
      if (req.requestType === 'booking') {
        // 新课预约：status为pending
        return req.status === 'pending';
      } else if (req.requestType === 'cancel') {
        // 取消申请：cancelRequestStatus为pending
        return req.cancelRequestStatus === 'pending';
      }
      return false;
    });

    const processedRequests = processedData.filter(req => {
      if (req.requestType === 'booking') {
        // 新课预约：status不为pending
        return req.status !== 'pending';
      } else if (req.requestType === 'cancel') {
        // 取消申请：cancelRequestStatus不为pending
        return req.cancelRequestStatus && req.cancelRequestStatus !== 'pending';
      }
      return false;
    });

    console.log('待处理申请:', pendingRequests.length, '已处理申请:', processedRequests.length)

    const result = {
      success: true,
      pendingRequests: pendingRequests,
      processedRequests: processedRequests,
      total: allRequests.length
    }
    
    console.log('最终返回结果:', result)
    return result

  } catch (error) {
    console.error('获取预约申请失败:', error)
    return {
      success: false,
      message: '获取预约申请失败',
      error: error.message
    }
  }
}