// 获取课程列表云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { status = 'active', limit = 50, skip = 0 } = event;

  try {
    // 查询课程列表
    const courses = await db.collection('courses')
      .where({
        status: status
      })
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(limit)
      .get();

    return {
      success: true,
      data: courses.data,
      total: courses.data.length
    };
  } catch (error) {
    console.error('获取课程列表失败:', error);
    return {
      success: false,
      message: '获取课程列表失败',
      error: error.message
    };
  }
};
