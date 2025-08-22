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

    // 处理每个预约申请，添加申请类型和显示信息
    const processedData = allRequests.map(req => {
      // 格式化创建时间
      const createTime = req.createTime ? new Date(req.createTime) : new Date();
      const createTimeDisplay = `${createTime.getMonth() + 1}月${createTime.getDate()}日 ${createTime.getHours().toString().padStart(2, '0')}:${createTime.getMinutes().toString().padStart(2, '0')}`;
      
      // 判断申请类型
      let requestType = 'booking'; // 默认为新课预约
      if (req.cancelRequestStatus) {
        requestType = 'cancel'; // 取消申请
      }
      
      return {
        ...req,
        requestType: requestType,
        createTimeDisplay: createTimeDisplay
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