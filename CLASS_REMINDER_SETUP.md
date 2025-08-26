# 开课前4小时提醒功能设置指南

## 功能概述

本系统实现了开课前4小时自动提醒功能，当用户预约课程时会获取订阅授权，在开课前4小时自动发送微信订阅消息提醒用户按时上课。

## 涉及的云函数

### 1. sendClassReminder
- **功能**: 核心提醒功能，查找4小时后开始的课程并发送提醒
- **位置**: `cloudfunctions/sendClassReminder/`
- **调用方式**: 手动调用或由定时任务调用

### 2. scheduleClassReminders  
- **功能**: 定时任务云函数，定期调用sendClassReminder
- **位置**: `cloudfunctions/scheduleClassReminders/`
- **需要配置**: 定时触发器

### 3. testClassReminder
- **功能**: 测试云函数，用于验证提醒功能是否正常
- **位置**: `cloudfunctions/testClassReminder/`
- **调用方式**: 手动测试

## 微信订阅消息模板

**模板ID**: `r79vVscc3dDWZA7x98g-5eDEmwaAkFTbknr5x6v_2iY`

**模板内容**:
```
标题: 上课提醒

课程名称: {{thing1.DATA}}
上课时间: {{time2.DATA}}  
瑜伽老师: {{thing4.DATA}}
温馨提示: {{thing5.DATA}}
```

**参数说明**:
- `thing1`: 课程名称（如"哈他瑜伽基础课"）
- `time2`: 上课时间（格式：2024年01月15日 19:00）
- `thing4`: 瑜伽老师姓名
- `thing5`: 固定内容"请准时到达"

## 设置步骤

### 1. 部署云函数

```bash
# 在微信开发者工具中，右键各云函数文件夹选择"上传并部署"
# 或使用命令行
npx tcb functions:deploy sendClassReminder
npx tcb functions:deploy scheduleClassReminders  
npx tcb functions:deploy testClassReminder
```

### 2. 配置定时触发器

在微信小程序云开发控制台：

1. 进入【云开发】-【云函数】
2. 找到 `scheduleClassReminders` 云函数
3. 点击【触发器】标签页
4. 添加触发器：
   - 触发器名称: `class-reminder-trigger`
   - 触发方式: `定时触发`
   - 触发周期: `Cron表达式`
   - Cron表达式: `0 */1 * * * * *` (每小时触发一次)
   - 或者: `0 0 6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23 * * *` (每天6-23点每小时触发)

**推荐Cron表达式**: `0 0 6-23 * * *` (每天6点到23点，每小时执行一次)

### 3. 测试功能

#### 手动测试
```javascript
// 在微信开发者工具的云函数控制台调用
wx.cloud.callFunction({
  name: 'testClassReminder',
  data: {
    testMode: 'manual',
    userId: 'ozHc8164opfwil_GBgadEQ0dr3rsd', // 替换为实际的用户openid
    courseName: '测试瑜伽课程',
    teacherName: '测试老师'
  }
})
```

#### 自动测试
```javascript
wx.cloud.callFunction({
  name: 'testClassReminder',
  data: {
    testMode: 'auto'
  }
})
```

#### 直接测试提醒功能
```javascript
wx.cloud.callFunction({
  name: 'sendClassReminder'
})
```

## 工作流程

1. **用户预约课程**: 在course.js中的bookCourse函数会请求用户订阅开课提醒
2. **定时检查**: scheduleClassReminders定时触发，调用sendClassReminder
3. **查找课程**: sendClassReminder查找4小时后开始的课程
4. **发送提醒**: 为每个已预约用户发送订阅消息提醒
5. **记录日志**: 执行结果记录到reminderLogs集合

## 数据库集合

### courseSchedule (课程安排)
需要包含以下字段：
- `date`: 课程日期 (YYYY-MM-DD格式)
- `startTime`: 开始时间 (HH:MM格式)
- `courseName`: 课程名称
- `teacherName`: 老师姓名
- `status`: 课程状态 ('active')
- `bookings`: 预约记录数组
  - `userId`: 用户openid
  - `status`: 预约状态 ('booked')

### reminderLogs (提醒日志)
自动创建，记录执行情况：
- `timestamp`: 执行时间
- `type`: 日志类型 ('class_reminder_4h')
- `success`: 是否成功
- `processedCount`: 处理数量
- `successCount`: 成功数量
- `failureCount`: 失败数量

## 注意事项

1. **订阅消息限制**: 微信订阅消息是一次性的，用户每次预约都需要重新授权
2. **时区处理**: 系统自动处理中国时区(UTC+8)
3. **错误处理**: 发送失败不会影响其他用户的提醒
4. **频率控制**: 建议每小时检查一次，避免过于频繁
5. **模板ID**: 确保使用正确的模板ID，模板需要在微信公众平台申请审核通过

## 监控和维护

1. **查看日志**: 检查reminderLogs集合了解执行情况
2. **监控失败**: 关注failureCount，及时处理异常
3. **模板维护**: 定期检查订阅消息模板是否正常
4. **测试验证**: 定期使用testClassReminder进行功能验证

## 故障排除

1. **提醒不发送**:
   - 检查定时触发器是否正常运行
   - 确认课程数据格式正确
   - 验证模板ID和参数格式

2. **订阅失败**:
   - 检查用户是否已授权
   - 确认模板内容符合微信规范
   - 验证用户openid有效性

3. **时间不准确**:
   - 确认服务器时区设置
   - 检查时间计算逻辑
   - 验证课程时间格式
