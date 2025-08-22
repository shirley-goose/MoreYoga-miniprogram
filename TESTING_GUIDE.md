# 墨瑜伽约课系统 - 测试指南

## 🧪 测试概述

本指南将帮助您全面测试墨瑜伽约课系统的各项功能，确保系统稳定运行。

## 📋 测试准备

### 1. 环境检查清单

- [ ] 云开发环境已开通并配置
- [ ] 所有云函数已部署成功
- [ ] 数据库集合已创建
- [ ] 权限规则已设置
- [ ] 管理员账户已创建

### 2. 测试账号准备

#### 管理员账号
- 在 `admins` 集合中添加您的 openid
- 更新 `app.js` 中的 `adminList`

#### 测试用户账号
- 准备 2-3 个微信账号用于测试
- 确保能够正常登录小程序

## 🎯 功能测试用例

### 用例1：用户注册登录

#### 测试步骤：
1. 使用测试账号进入小程序
2. 进入"个人中心"页面
3. 点击"获取用户信息"按钮
4. 授权获取用户信息

#### 预期结果：
- 用户信息成功获取
- `users` 集合中新增用户记录
- 显示初始次卡余额（0次）

#### 验证方法：
```javascript
// 在云开发控制台数据库中查询
db.collection('users').where({
  openid: 'user-openid'
}).get()
```

### 用例2：管理员添加课程

#### 测试步骤：
1. 使用管理员账号登录
2. 在个人中心长按或特殊手势进入管理后台
3. 点击"课程管理"
4. 在"添加课程"标签下填写课程信息：
   - 课程名称：流瑜伽
   - 课程类型：团课
   - 授课老师：莹儿
   - 课程描述：呼吸，流动，体式
   - 最大人数：8
   - 最少人数：2
   - 消耗次卡：1
   - 课程时长：60分钟
5. 点击"创建课程"

#### 预期结果：
- 显示"课程创建成功"
- `courses` 集合中新增课程记录
- 表单自动重置

### 用例3：管理员安排课程日程

#### 测试步骤：
1. 在课程管理页面切换到"安排日程"标签
2. 填写日程信息：
   - 选择课程：流瑜伽
   - 授课老师：莹儿
   - 课程日期：明天
   - 开始时间：19:15
   - 结束时间：20:15
   - 最大人数：8
   - 最少人数：2
3. 点击"安排课程"

#### 预期结果：
- 显示"课程安排成功"
- `courseSchedule` 集合中新增日程记录

### 用例4：管理员充值用户次卡

#### 测试步骤：
1. 进入"用户管理"页面
2. 搜索或找到测试用户
3. 点击用户，打开编辑弹窗
4. 设置操作类型为"增加"
5. 团课次卡：10
6. 操作说明：测试充值
7. 点击"确认修改"

#### 预期结果：
- 显示"修改成功"
- 用户次卡余额更新为10次
- `adminLogs` 集合中记录操作日志

### 用例5：用户预约课程

#### 测试步骤：
1. 切换到普通用户账号
2. 进入"课程"页面
3. 查看今日课程列表
4. 点击"立即预约"按钮

#### 预期结果：
- 显示"预约成功"
- 用户次卡余额减少1次
- `bookings` 集合中新增预约记录
- 课程显示状态更新

### 用例6：等位功能测试

#### 测试步骤：
1. 使用多个账号预约同一课程
2. 当预约人数达到上限时
3. 继续使用新账号预约

#### 预期结果：
- 前8个用户状态为"已预约"
- 第9个用户状态为"等位中 第1位"
- 课程显示"已满｜1人等位"

### 用例7：取消预约测试

#### 测试步骤：
1. 已预约用户点击"取消预约"
2. 确认取消操作

#### 预期结果：
- 显示"取消预约成功"
- 次卡退还到账户
- 等位用户自动转为正式预约
- 发送通知给转正用户

### 用例8：课程提醒测试

#### 测试步骤：
1. 创建1小时后开始的课程
2. 等待定时器触发（可手动调用云函数）

#### 预期结果：
- 已预约用户收到课程提醒通知
- `notifications` 集合中新增通知记录

## 📊 示例测试数据

### 1. 创建测试课程

```javascript
// 在云开发控制台执行
const testCourses = [
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
    maxStudents: 6,
    minStudents: 2,
    price: 1,
    duration: 75,
    status: "active",
    createTime: new Date(),
    updateTime: new Date()
  }
];

// 批量插入课程
testCourses.forEach(async (course) => {
  await db.collection('courses').add({ data: course });
});
```

### 2. 创建测试日程

```javascript
// 获取明天的日期
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const dateStr = tomorrow.toISOString().split('T')[0];

const testSchedules = [
  {
    courseId: "你的课程ID", // 替换为实际课程ID
    teacherId: "teacher1",
    teacherName: "莹儿",
    date: dateStr,
    startTime: "09:00",
    endTime: "10:00",
    maxStudents: 8,
    minStudents: 2,
    currentStudents: 0,
    status: "published",
    createTime: new Date()
  },
  {
    courseId: "你的课程ID", // 替换为实际课程ID
    teacherId: "teacher1", 
    teacherName: "莹儿",
    date: dateStr,
    startTime: "19:15",
    endTime: "20:15",
    maxStudents: 8,
    minStudents: 2,
    currentStudents: 0,
    status: "published",
    createTime: new Date()
  }
];

// 批量插入日程
testSchedules.forEach(async (schedule) => {
  await db.collection('courseSchedule').add({ data: schedule });
});
```

### 3. 创建测试用户

```javascript
const testUsers = [
  {
    openid: "test-user-1",
    nickName: "测试用户1",
    avatarUrl: "",
    phone: "13800138001",
    groupCredits: 10,
    termCredits: 5,
    totalClasses: 0,
    createTime: new Date(),
    updateTime: new Date()
  },
  {
    openid: "test-user-2", 
    nickName: "测试用户2",
    avatarUrl: "",
    phone: "13800138002",
    groupCredits: 5,
    termCredits: 3,
    totalClasses: 0,
    createTime: new Date(),
    updateTime: new Date()
  }
];

// 批量插入用户
testUsers.forEach(async (user) => {
  await db.collection('users').add({ data: user });
});
```

## 🔍 测试验证方法

### 1. 数据库查询验证

```javascript
// 检查用户是否正确创建
db.collection('users').where({
  nickName: '测试用户1'
}).get().then(res => {
  console.log('用户数据:', res.data);
});

// 检查预约记录
db.collection('bookings').where({
  userId: 'user-openid'
}).get().then(res => {
  console.log('预约记录:', res.data);
});

// 检查课程安排
db.collection('courseSchedule').where({
  date: '2025-07-08'
}).get().then(res => {
  console.log('课程安排:', res.data);
});
```

### 2. 云函数调试

在微信开发者工具控制台中测试云函数：

```javascript
// 测试获取课程安排
wx.cloud.callFunction({
  name: 'getDaySchedule',
  data: {
    date: '2025-07-08'
  }
}).then(res => {
  console.log('课程安排结果:', res.result);
});

// 测试预约课程
wx.cloud.callFunction({
  name: 'bookCourse',
  data: {
    scheduleId: 'your-schedule-id'
  }
}).then(res => {
  console.log('预约结果:', res.result);
});
```

## ⚠️ 常见问题及解决方案

### 问题1：云函数调用失败

**症状**：云函数返回错误或超时

**解决方案**：
1. 检查云环境ID是否正确
2. 确认云函数部署成功
3. 查看云函数执行日志
4. 检查网络连接

### 问题2：数据库权限错误

**症状**：数据库操作被拒绝

**解决方案**：
1. 检查数据库权限设置
2. 确认用户已正确登录
3. 验证 openid 获取是否正常

### 问题3：用户信息获取失败

**症状**：无法获取用户昵称和头像

**解决方案**：
1. 检查 `wx.getUserProfile` 调用
2. 确认用户已授权
3. 检查云函数中的用户注册逻辑

### 问题4：预约状态不正确

**症状**：预约后状态显示异常

**解决方案**：
1. 检查事务处理逻辑
2. 验证数据库更新操作
3. 确认前端页面刷新机制

### 问题5：管理员功能无法访问

**症状**：管理员页面显示无权限

**解决方案**：
1. 检查管理员 openid 配置
2. 确认 `admins` 集合中的记录
3. 验证权限检查逻辑

## 📈 性能测试

### 1. 并发预约测试

模拟多用户同时预约同一课程：

```javascript
// 创建并发测试脚本
const concurrentBooking = async () => {
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      wx.cloud.callFunction({
        name: 'bookCourse',
        data: { scheduleId: 'test-schedule-id' }
      })
    );
  }
  
  const results = await Promise.all(promises);
  console.log('并发预约结果:', results);
};
```

### 2. 大数据量测试

测试系统在大量数据下的性能：

```javascript
// 批量创建测试数据
const createBulkData = async () => {
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < batchSize; i++) {
    batches.push({
      // 测试数据结构
    });
  }
  
  // 分批插入
  for (let i = 0; i < batches.length; i += 20) {
    const batch = batches.slice(i, i + 20);
    await db.collection('testCollection').add({ data: batch });
  }
};
```

## ✅ 测试完成清单

- [ ] 用户注册登录功能正常
- [ ] 管理员权限验证正确
- [ ] 课程创建功能正常
- [ ] 课程日程安排功能正常
- [ ] 用户次卡管理功能正常
- [ ] 课程预约功能正常
- [ ] 等位功能正常
- [ ] 取消预约功能正常
- [ ] 通知系统正常
- [ ] 定时提醒功能正常
- [ ] 数据一致性保证
- [ ] 权限控制有效
- [ ] 性能表现良好

## 📝 测试报告模板

### 测试环境
- 云环境ID：
- 测试时间：
- 测试人员：

### 测试结果
| 功能模块 | 测试状态 | 问题描述 | 解决方案 |
|---------|---------|---------|---------|
| 用户登录 | ✅ 通过 | - | - |
| 课程管理 | ✅ 通过 | - | - |
| 预约系统 | ⚠️ 部分通过 | 并发问题 | 已修复 |

### 性能指标
- 页面加载时间：< 2秒
- 云函数响应时间：< 500ms
- 数据库查询时间：< 100ms

---

*完成所有测试后，您的约课系统就可以正式上线使用了！*
