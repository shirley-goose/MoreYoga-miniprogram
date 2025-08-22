# 数据库设置指南

## 📊 数据库集合创建脚本

### 方式一：通过微信开发者工具创建

1. 打开微信开发者工具
2. 点击"云开发" -> "数据库"
3. 点击"添加集合"，按以下顺序创建：

#### 1. users（用户集合）
```javascript
// 示例数据
{
  "openid": "example-openid-123",
  "nickName": "瑜伽爱好者",
  "avatarUrl": "https://example.com/avatar.jpg",
  "phone": "13800138000",
  "groupCredits": 10,
  "termCredits": 5,
  "totalClasses": 0,
  "createTime": new Date(),
  "updateTime": new Date()
}
```

#### 2. courses（课程集合）
```javascript
// 示例数据
{
  "title": "流瑜伽",
  "type": "group",
  "teacherId": "teacher1",
  "teacherName": "莹儿",
  "description": "呼吸，流动，体式。适合所有级别的学员",
  "maxStudents": 8,
  "minStudents": 2,
  "price": 1,
  "duration": 60,
  "status": "active",
  "createTime": new Date(),
  "updateTime": new Date(),
  "createdBy": "admin-openid"
}
```

#### 3. courseSchedule（课程安排集合）
```javascript
// 示例数据
{
  "courseId": "course-id-123",
  "teacherId": "teacher1",
  "teacherName": "莹儿",
  "date": "2025-07-08",
  "startTime": "19:15",
  "endTime": "20:15",
  "maxStudents": 8,
  "minStudents": 2,
  "currentStudents": 0,
  "status": "published",
  "createTime": new Date(),
  "createdBy": "admin-openid"
}
```

#### 4. bookings（预约记录集合）
```javascript
// 示例数据
{
  "userId": "user-openid-123",
  "scheduleId": "schedule-id-123",
  "courseId": "course-id-123",
  "status": "booked",
  "bookingTime": new Date(),
  "creditsUsed": 1,
  "refunded": false,
  "position": 0
}
```

#### 5. classRecords（课时记录集合）
```javascript
// 示例数据
{
  "userId": "user-openid-123",
  "scheduleId": "schedule-id-123",
  "courseId": "course-id-123",
  "attendanceStatus": "attended",
  "attendanceTime": new Date(),
  "creditsDeducted": 1,
  "recordTime": new Date()
}
```

#### 6. notifications（通知记录集合）
```javascript
// 示例数据
{
  "userId": "user-openid-123",
  "type": "booking_success",
  "title": "预约成功",
  "content": "您已成功预约《流瑜伽》课程",
  "scheduleId": "schedule-id-123",
  "isRead": false,
  "sendTime": new Date()
}
```

#### 7. admins（管理员集合）
```javascript
// 示例数据 - 请替换为实际的管理员openid
{
  "openid": "your-admin-openid-here",
  "nickName": "管理员",
  "role": "admin",
  "status": "active",
  "createTime": new Date()
}
```

#### 8. adminLogs（操作日志集合）
```javascript
// 示例数据
{
  "adminOpenid": "admin-openid-123",
  "targetUserOpenid": "user-openid-123",
  "action": "update_credits",
  "operation": "add",
  "groupCreditsChange": 10,
  "termCreditsChange": 0,
  "reason": "购买次卡",
  "originalGroupCredits": 0,
  "originalTermCredits": 0,
  "timestamp": new Date()
}
```

### 方式二：通过云函数批量创建（可选）

创建初始化云函数：

```javascript
// cloudfunctions/initDatabase/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 创建示例课程
    const courses = [
      {
        title: "流瑜伽",
        type: "group",
        teacherId: "teacher1",
        teacherName: "莹儿",
        description: "呼吸，流动，体式。适合所有级别的学员",
        maxStudents: 8,
        minStudents: 2,
        price: 1,
        duration: 60,
        status: "active",
        createTime: new Date(),
        updateTime: new Date()
      },
      {
        title: "女性瑜伽",
        type: "group",
        teacherId: "teacher1",
        teacherName: "莹儿",
        description: "专为女性设计的瑜伽课程",
        maxStudents: 8,
        minStudents: 2,
        price: 1,
        duration: 60,
        status: "active",
        createTime: new Date(),
        updateTime: new Date()
      },
      {
        title: "私人订制",
        type: "private",
        teacherId: "teacher2",
        teacherName: "周周",
        description: "一对一私教课程",
        maxStudents: 1,
        minStudents: 1,
        price: 3,
        duration: 60,
        status: "active",
        createTime: new Date(),
        updateTime: new Date()
      }
    ];

    // 批量添加课程
    for (const course of courses) {
      await db.collection('courses').add({ data: course });
    }

    return { success: true, message: '数据库初始化完成' };
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return { success: false, error: error.message };
  }
};
```

## 📋 微信云开发数据库权限配置指南

### 🔧 操作步骤

1. 打开微信开发者工具
2. 点击"云开发" → "数据库"
3. 点击对应集合名称
4. 选择"权限设置"标签
5. 从下拉菜单中选择对应的权限选项

### 📊 各集合权限配置

#### 1. users（用户集合）
**权限设置**：选择 `自定义安全规则`
**自定义规则内容**：
```json
{
  "read": "auth.openid == doc.openid",
  "write": "auth.openid == doc.openid"
}
```
*解释*：用户只能读写自己的数据

#### 2. courses（课程集合）
**权限设置**：选择 `所有用户可读`
*解释*：所有用户都可以查看课程信息

#### 3. courseSchedule（课程安排集合）
**权限设置**：选择 `所有用户可读`
*解释*：所有用户都可以查看课程安排

#### 4. bookings（预约记录集合）
**权限设置**：选择 `自定义安全规则`
**自定义规则内容**：
```json
{
  "read": "auth.openid == doc.userId",
  "write": "auth.openid == doc.userId"
}
```
*解释*：用户只能查看和修改自己的预约

#### 5. classRecords（课时记录集合）
**权限设置**：选择 `自定义安全规则`
**自定义规则内容**：
```json
{
  "read": "auth.openid == doc.userId",
  "write": false
}
```
*解释*：用户只能查看自己的课时记录，不能修改

#### 6. notifications（通知记录集合）
**权限设置**：选择 `自定义安全规则`
**自定义规则内容**：
```json
{
  "read": "auth.openid == doc.userId",
  "write": false
}
```
*解释*：用户只能查看自己的通知，不能修改

#### 7. admins（管理员集合）
**权限设置**：选择 `所有用户不可读写`
*解释*：完全通过云函数访问

#### 8. adminLogs（操作日志集合）
**权限设置**：选择 `所有用户不可读写`
*解释*：完全通过云函数访问

### 📝 特别说明

对于需要选择 `自定义安全规则` 的集合：
1. 在权限下拉菜单中选择"自定义安全规则"
2. 在弹出的代码编辑框中，粘贴相应的 JSON 规则代码
3. 点击"保存"按钮

这样您就可以正确配置数据库权限了！其他集合直接从下拉菜单选择对应选项即可。

### 索引创建

为提高查询性能，建议创建以下索引：

#### users 集合索引
- `openid` (单字段索引)
- `phone` (单字段索引)

#### bookings 集合索引
- `userId` (单字段索引)
- `scheduleId` (单字段索引)
- `status` (单字段索引)
- `userId + status` (复合索引)

#### courseSchedule 集合索引
- `date` (单字段索引)
- `teacherId` (单字段索引)
- `date + status` (复合索引)

#### notifications 集合索引
- `userId` (单字段索引)
- `userId + isRead` (复合索引)

## 📝 示例数据插入

### 1. 创建管理员账户

```javascript
// 在 admins 集合中插入
{
  "openid": "替换为您的微信openid",
  "nickName": "系统管理员",
  "role": "admin", 
  "status": "active",
  "createTime": new Date()
}
```

### 2. 创建测试用户

```javascript
// 在 users 集合中插入
{
  "openid": "test-user-openid",
  "nickName": "测试用户",
  "avatarUrl": "",
  "phone": "13800138000",
  "groupCredits": 10,
  "termCredits": 5,
  "totalClasses": 0,
  "createTime": new Date(),
  "updateTime": new Date()
}
```

### 3. 创建示例课程安排

```javascript
// 在 courseSchedule 集合中插入
{
  "courseId": "已创建的课程ID",
  "teacherId": "teacher1",
  "teacherName": "莹儿",
  "date": "2025-07-08",
  "startTime": "19:15",
  "endTime": "20:15",
  "maxStudents": 8,
  "minStudents": 2,
  "currentStudents": 0,
  "status": "published",
  "createTime": new Date(),
  "createdBy": "admin-openid"
}
```

## ⚠️ 注意事项

1. **敏感信息保护**
   - 不要在客户端存储敏感的管理员信息
   - 所有管理员操作都要在云函数中验证权限

2. **数据一致性**
   - 使用数据库事务处理关键操作
   - 如预约/取消操作涉及多个集合的更新

3. **性能考虑**
   - 为高频查询字段创建索引
   - 合理设计数据结构，避免深度嵌套

4. **备份策略**
   - 定期备份重要数据
   - 建立数据恢复机制

## 🔧 数据库维护

### 定期清理

```javascript
// 清理过期通知（7天前的已读通知）
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
await db.collection('notifications')
  .where({
    isRead: true,
    sendTime: db.command.lt(sevenDaysAgo)
  })
  .remove();
```

### 数据统计

```javascript
// 获取用户总数
const userCount = await db.collection('users').count();

// 获取本月预约数量
const thisMonth = new Date();
thisMonth.setDate(1);
const bookingCount = await db.collection('bookings')
  .where({
    bookingTime: db.command.gte(thisMonth)
  })
  .count();
```

---

*数据库设置完成后，您的约课系统数据层就搭建完毕了！*
