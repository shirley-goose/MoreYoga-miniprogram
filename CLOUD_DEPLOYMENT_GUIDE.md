# 墨瑜伽约课系统 - 云开发部署指南

## 🚀 部署概述

本指南将指导您完成墨瑜伽约课系统的微信云开发环境设置和云函数部署。

## 📋 前置要求

- 微信开发者工具（最新版本）
- 已申请的微信小程序账号
- 开通微信云开发服务

## 🛠️ 部署步骤

### 第一步：开通云开发

1. **打开微信开发者工具**
   - 导入项目：选择 `miniprogram` 目录
   - 填写 AppID（使用您的小程序 AppID）

2. **开通云开发**
   - 点击工具栏中的"云开发"
   - 点击"开通"
   - 选择环境名称：`yoga-booking-system`（或自定义名称）
   - 选择套餐：建议选择"免费套餐"进行测试

3. **获取云环境ID**
   - 开通后，记录您的云环境ID
   - 更新 `miniprogram/app.js` 中的环境ID：
   ```javascript
   wx.cloud.init({
     env: 'your-cloud-env-id', // 替换为您的云环境ID
     traceUser: true
   });
   ```

### 第二步：创建数据库集合

在云开发控制台的数据库中创建以下集合：

#### 2.1 用户集合 (users)
```json
{
  "_id": "文档ID",
  "openid": "用户openid",
  "nickName": "用户昵称",
  "avatarUrl": "头像地址",
  "phone": "手机号",
  "groupCredits": 0,
  "termCredits": 0,
  "totalClasses": 0,
  "createTime": "2025-01-01T00:00:00.000Z",
  "updateTime": "2025-01-01T00:00:00.000Z"
}
```

#### 2.2 课程集合 (courses)
```json
{
  "_id": "课程ID",
  "title": "课程名称",
  "type": "private|group|camp",
  "teacherId": "教师ID",
  "teacherName": "教师姓名",
  "description": "课程描述",
  "maxStudents": 8,
  "minStudents": 2,
  "price": 1,
  "duration": 60,
  "status": "active",
  "createTime": "2025-01-01T00:00:00.000Z",
  "updateTime": "2025-01-01T00:00:00.000Z",
  "createdBy": "创建者openid"
}
```

#### 2.3 课程安排集合 (courseSchedule)
```json
{
  "_id": "日程ID",
  "courseId": "课程ID",
  "teacherId": "教师ID",
  "teacherName": "教师姓名",
  "date": "2025-07-08",
  "startTime": "19:15",
  "endTime": "20:15",
  "maxStudents": 8,
  "minStudents": 2,
  "currentStudents": 0,
  "status": "published",
  "createTime": "2025-01-01T00:00:00.000Z",
  "createdBy": "创建者openid"
}
```

#### 2.4 预约记录集合 (bookings)
```json
{
  "_id": "预约ID",
  "userId": "用户openid",
  "scheduleId": "课程日程ID",
  "courseId": "课程ID",
  "status": "booked|waitlist|cancelled|completed",
  "bookingTime": "2025-01-01T00:00:00.000Z",
  "cancelTime": "取消时间",
  "creditsUsed": 1,
  "refunded": false,
  "position": 1
}
```

#### 2.5 课时记录集合 (classRecords)
```json
{
  "_id": "记录ID",
  "userId": "用户openid",
  "scheduleId": "课程日程ID",
  "courseId": "课程ID",
  "attendanceStatus": "attended|absent",
  "attendanceTime": "2025-01-01T00:00:00.000Z",
  "creditsDeducted": 1,
  "recordTime": "2025-01-01T00:00:00.000Z"
}
```

#### 2.6 通知记录集合 (notifications)
```json
{
  "_id": "通知ID",
  "userId": "用户openid",
  "type": "booking_success|class_confirmed|class_reminder|class_cancelled",
  "title": "通知标题",
  "content": "通知内容",
  "scheduleId": "相关课程日程ID",
  "isRead": false,
  "sendTime": "2025-01-01T00:00:00.000Z"
}
```

#### 2.7 管理员集合 (admins)
```json
{
  "_id": "管理员ID",
  "openid": "管理员openid",
  "nickName": "管理员昵称",
  "role": "admin",
  "status": "active",
  "createTime": "2025-01-01T00:00:00.000Z"
}
```

#### 2.8 操作日志集合 (adminLogs)
```json
{
  "_id": "日志ID",
  "adminOpenid": "管理员openid",
  "targetUserOpenid": "目标用户openid",
  "action": "update_credits",
  "operation": "add|set|deduct",
  "groupCreditsChange": 0,
  "termCreditsChange": 0,
  "reason": "操作原因",
  "originalGroupCredits": 0,
  "originalTermCredits": 0,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 第三步：设置数据库权限

为每个集合设置适当的权限规则：

#### 3.1 users 集合权限
```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```

#### 3.2 courses 集合权限
```json
{
  "read": true,
  "write": false
}
```

#### 3.3 courseSchedule 集合权限
```json
{
  "read": true,
  "write": false
}
```

#### 3.4 bookings 集合权限
```json
{
  "read": "doc.userId == auth.openid",
  "write": "doc.userId == auth.openid"
}
```

#### 3.5 其他集合权限
所有其他集合设置为：
```json
{
  "read": false,
  "write": false
}
```

### 第四步：部署云函数

#### 4.1 云函数列表
需要部署的云函数包括：

**基础云函数：**
- `login` - 用户登录
- `getUser` - 获取用户信息
- `registerUser` - 用户注册
- `getUserCredits` - 获取用户次卡余额

**课程相关云函数：**
- `getDaySchedule` - 获取每日课程安排
- `bookCourse` - 预约课程
- `cancelBooking` - 取消预约
- `getUserBookings` - 获取用户预约记录
- `getCourses` - 获取课程列表

**通知系统云函数：**
- `sendNotification` - 发送通知
- `courseReminder` - 课程提醒（定时器）

**管理员云函数：**
- `adminAddCourse` - 管理员添加课程
- `adminAddSchedule` - 管理员添加课程安排
- `adminUpdateCredits` - 管理员更新用户课时
- `getAllUsers` - 获取所有用户（管理员专用）

#### 4.2 部署步骤

1. **右键点击云函数文件夹**
   - 在微信开发者工具中右键点击 `cloudfunctions` 文件夹
   - 选择"同步云函数列表"

2. **逐个部署云函数**
   - 右键点击每个云函数文件夹（如 `login`）
   - 选择"上传并部署：云端安装依赖"
   - 等待部署完成

3. **验证部署**
   - 在云开发控制台的"云函数"页面查看
   - 确保所有函数状态为"部署成功"

#### 4.3 设置定时器

为 `courseReminder` 云函数设置定时器：

1. 在云开发控制台找到 `courseReminder` 云函数
2. 点击"定时器"标签
3. 添加定时器：
   - 名称：`hourly-reminder`
   - 触发周期：`0 * * * * * *`（每小时触发一次）
   - 参数：`{}`

### 第五步：设置管理员权限

#### 5.1 添加管理员记录

在 `admins` 集合中手动添加管理员记录：

```json
{
  "openid": "your-admin-openid",
  "nickName": "管理员姓名",
  "role": "admin",
  "status": "active",
  "createTime": "2025-01-01T00:00:00.000Z"
}
```

#### 5.2 更新应用配置

在 `miniprogram/app.js` 中更新管理员列表：

```javascript
globalData: {
  userInfo: null,
  openid: null,
  adminList: ['your-admin-openid-here'] // 替换为实际的管理员openid
}
```

### 第六步：申请订阅消息模板

1. **登录微信公众平台**
   - 进入小程序后台
   - 找到"订阅消息"功能

2. **申请消息模板**
   需要申请以下类型的消息模板：
   - 预约成功通知
   - 课程确认通知
   - 课程提醒通知
   - 课程取消通知

3. **更新模板ID**
   在 `sendNotification` 云函数中更新模板ID：
   ```javascript
   const templateMapping = {
     'booking_success': 'your-template-id-1',
     'class_confirmed': 'your-template-id-2',
     'class_reminder': 'your-template-id-3',
     'class_cancelled': 'your-template-id-4'
   };
   ```

## ✅ 验证部署

### 7.1 基础功能测试

1. **用户注册登录**
   - 在个人中心点击"获取用户信息"
   - 确认用户信息正确保存

2. **课程预约**
   - 管理员先添加课程和日程
   - 普通用户尝试预约课程

3. **管理员功能**
   - 使用管理员账号登录
   - 测试课程管理和用户管理功能

### 7.2 常见问题排查

**问题1：云函数调用失败**
- 检查云环境ID是否正确
- 确认云函数部署成功
- 查看云函数日志

**问题2：数据库权限错误**
- 检查数据库权限设置
- 确认用户已正确登录

**问题3：管理员功能无法使用**
- 检查管理员openid是否正确
- 确认 `admins` 集合中有对应记录

## 🔧 性能优化建议

1. **数据库索引**
   - 为常用查询字段添加索引
   - 如：`openid`、`scheduleId`、`date` 等

2. **云函数优化**
   - 合理设置云函数超时时间
   - 使用事务确保数据一致性

3. **缓存策略**
   - 对不经常变化的数据使用本地缓存
   - 如课程列表、教师列表等

## 📚 相关文档

- [微信小程序云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [云数据库使用指南](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database.html)
- [云函数开发指南](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html)

## 💬 技术支持

如果在部署过程中遇到问题，请检查：
1. 微信开发者工具控制台错误信息
2. 云开发控制台的云函数日志
3. 数据库操作日志

---

*部署完成后，您的约课系统就可以正常使用了！*
