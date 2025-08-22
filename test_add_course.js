// 临时脚本：添加测试课程数据
const cloud = require('wx-server-sdk');
cloud.init({ env: 'cloud1-9g5oms9v90aabf59' }); // 替换为您的环境ID
const db = cloud.database();

async function addTestCourse() {
  try {
    // 获取今天的日期
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    console.log('添加测试课程，日期:', todayStr);
    
    
    const result = await db.collection('courseSchedule').add({
      data: testCourse
    });
    
    console.log('测试课程添加成功:', result);
    
    
    const result2 = await db.collection('courseSchedule').add({
      data: fullCourse
    });
    
    console.log('测试课程2添加成功:', result2);
    
  } catch (error) {
    console.error('添加测试课程失败:', error);
  }
}

addTestCourse();
