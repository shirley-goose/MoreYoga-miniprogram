// 课程提醒定时器云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    console.log('=== 开始执行课程提醒任务 ===');
    
    // 只处理4小时提醒
    const result = await processFourHourReminder();
    
    return { 
      success: true, 
      message: `处理了 ${result.processed} 个课程的4小时提醒`,
      fourHourReminder: result
    };
  } catch (error) {
    console.error('发送课程提醒失败:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// 处理4小时提前提醒
async function processFourHourReminder() {
  try {
    console.log('=== 处理4小时提前提醒 ===');
    
    const now = new Date();
    const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    
    // 格式化日期和时间
    const targetDate = formatDate(fourHoursLater);
    const targetTime = formatTime(fourHoursLater);
    
    console.log(`查找开始时间为 ${targetDate} ${targetTime} 的课程（4小时提醒）`);
    
    let processedCount = 0;
    
    // 处理团课提醒
    await processGroupClassReminders(targetDate, targetTime);
    
    // 处理私教课提醒
    await processPrivateClassReminders(targetDate, targetTime);
    
    async function processGroupClassReminders(date, time) {
      // 查询即将开始的团课
      const schedules = await db.collection('courseSchedule')
        .where({
          date: date,
          startTime: time,
          status: 'published'
        })
        .get();
      
      console.log(`找到 ${schedules.data.length} 个需要4小时提醒的团课`);
      
      for (const schedule of schedules.data) {
        // 获取课程信息
        const courseResult = await db.collection('courses').doc(schedule.courseId).get();
        const course = courseResult.data;
        
        // 获取已预约的用户
        const bookings = await db.collection('bookings')
          .where({
            scheduleId: schedule._id,
            status: 'booked'
          })
          .get();
        
        console.log(`团课 ${course.title} 有 ${bookings.data.length} 个预约（4小时提醒）`);
        
        // 发送订阅消息提醒
        for (const booking of bookings.data) {
          await sendReminderMessage(booking, course.title, schedule, false);
          processedCount++;
        }
      }
    }
    
    async function processPrivateClassReminders(date, time) {
      // 查询即将开始的私教课
      const privateBookings = await db.collection('privateBookings')
        .where({
          date: date,
          startTime: time,
          status: 'confirmed'
        })
        .get();
      
      console.log(`找到 ${privateBookings.data.length} 个需要4小时提醒的私教课`);
      
      for (const booking of privateBookings.data) {
        await sendReminderMessage(booking, '私教课程', booking, true);
        processedCount++;
      }
    }
    
    async function sendReminderMessage(booking, courseName, scheduleData, isPrivate) {
      try {
        // 获取用户的openid
        const userResult = await db.collection('users').doc(booking.userId).get();
        const user = userResult.data;
        
        if (user && user.openid) {
          // 发送订阅消息
          await cloud.callFunction({
            name: 'sendSubscribeMessage',
            data: {
              openid: user.openid,
              templateId: 'r79vVscc3dDWZA7x98g-5eDEmwaAkFTbknr5x6v_2iY', // 4小时提醒模板ID
              messageType: '4hour_reminder',
              data: {
                thing1: { value: courseName }, // 课程名称（团课名称或"私教课程"）
                time2: { value: `${scheduleData.date} ${scheduleData.startTime}` }, // 上课时间
                thing4: { value: scheduleData.teacherName || booking.teacherName || '老师' }, // 瑜伽老师
                thing5: { value: '您的课程还有4h开始，请准时到场。' } // 温馨提示
              }
            }
          });
          
          console.log(`已向用户 ${booking.userId} 发送4小时提醒订阅消息（${isPrivate ? '私教' : '团课'}）`);
        }
        
        // 不再发送系统内通知，只使用微信订阅消息
        
      } catch (notifyError) {
        console.error(`向用户 ${booking.userId} 发送4小时提醒失败:`, notifyError);
      }
    }
    
    return {
      type: '4hour_reminder',
      processed: processedCount,
      message: `处理了 ${processedCount} 个课程的4小时提醒`
    };
    
  } catch (error) {
    console.error('处理4小时提醒失败:', error);
    return {
      type: '4hour_reminder',
      processed: 0,
      error: error.message
    };
  }
}



// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 格式化时间为 HH:MM
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
