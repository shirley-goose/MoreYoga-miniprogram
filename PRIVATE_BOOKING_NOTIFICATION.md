# 私教预约成功通知功能

## 功能概述
当老师确认私教预约成功时，系统会自动给用户发送"私教预约成功通知"的微信订阅消息。

## 实现细节

### 1. 通知模板信息
- **模板ID**: `Gh4le1pvgOkdxcgo0rlZYgeJH15oT6N8GMN9vbnkLVg`
- **通知类型**: `private_booking_confirmed`
- **跳转页面**: `pages/private-history/private-history`

### 2. 通知内容格式
```json
{
  "thing1": { "value": "墨瑜伽私教" },
  "thing2": { "value": "老师名字(teacherName)" },
  "time3": { "value": "YYYY年MM月DD日 HH:MM~HH:MM" },
  "thing4": { "value": "请准时到达" }
}
```

**注意**：时间格式使用 `~` 连接开始和结束时间，符合微信订阅消息要求。所有时间均转换为中国时区（UTC+8）。

### 3. 触发条件
- 在 `privateBookings` 集合中，课程状态从 `pending` 改为 `confirmed`
- 触发时机：老师在系统中确认私教预约申请

### 4. 实现文件

#### 修改的云函数文件：
1. **sendNotification/index.js** - 增加私教预约成功通知的模板ID和数据格式
2. **handlePrivateBooking/index.js** - 在确认预约后调用发送通知功能

#### 关键功能函数：
- `sendPrivateBookingConfirmedNotification()` - 发送私教预约成功通知
- `formatClassTime()` - 格式化上课时间显示

### 5. 数据流程

```
老师确认预约 
    ↓
handlePrivateBooking 云函数
    ↓
更新 privateBookings 状态为 confirmed
    ↓
调用 sendPrivateBookingConfirmedNotification()
    ↓
调用 sendNotification 云函数
    ↓
发送微信订阅消息给用户
```

### 6. 测试验证

运行测试脚本验证数据格式：
```bash
node test_private_notification.js
```

测试结果显示：
- 模板ID格式正确 ✅
- 通知数据格式正确 ✅
- 时间格式化正确 ✅
- 消息内容符合要求 ✅

### 6. 使用示例

当用户"小明"预约了"张老师"在"2025年08月26日 10:00-11:00"的私教课程，老师确认后，用户会收到以下通知：

```
私教课程: 墨瑜伽私教
上课教练: 张老师  
上课时间: 2025年08月26日 10:00~11:00
备注: 请准时到达
```

点击通知会跳转到私教历史页面查看详情。

### 7. 时间字段处理逻辑

系统会按照以下优先级读取时间信息：
1. **优先使用 `timeRange`** - 如存在 "16:15-17:15" 格式
2. **使用 `startTime` + `endTime`** - 如分别存在开始和结束时间
3. **使用 `startTime` + 1小时** - 如只有开始时间，自动计算结束时间
4. **降级为当前时间** - 如完全缺少时间信息

**时区转换**：所有时间都会自动转换为中国时区（UTC+8），确保用户看到的是本地时间。

### 8. 最新修复记录

#### 8.1 时间显示修复 (2025-08-25)

**问题**：通知中的上课时间显示不正确，时区有误

**修复内容**：
1. ✅ **字段读取修复** - 正确读取 `date` + `timeRange` 或 `startTime` + `endTime`
2. ✅ **时区转换修复** - 所有时间转换为中国时区（UTC+8）
3. ✅ **时间格式修复** - 使用 `~` 连接时间段，符合微信规范

**修复文件**：
- `cloudfunctions/handlePrivateBooking/index.js` - 修复 `formatClassTime` 函数
- `cloudfunctions/sendNotification/index.js` - 修复 `formatWechatTime` 函数

#### 8.2 一次性订阅优化 (2025-08-25)

**背景**：微信对于服务提供方的资质有限制，即使用户设置了"总是允许"，订阅消息也只能使用一次。

**问题**：用户第二次预约可能收不到通知，体验不友好

**修复内容**：
1. ✅ **每次都请求订阅** - 在每次提交预约时都调用 `wx.requestSubscribeMessage`
2. ✅ **用户说明弹窗** - 先显示说明，解释为什么需要重新授权
3. ✅ **用户选择权** - 允许用户选择"允许通知"或"跳过"
4. ✅ **反馈优化** - 提供清晰的操作反馈和状态提示
5. ✅ **UI提示完善** - 更新页面提示文案，说明微信政策限制

**修复文件**：
- `miniprogram/pages/private-booking-confirm/private-booking-confirm.js` - 优化订阅流程
- `miniprogram/pages/private-booking-confirm/private-booking-confirm.wxml` - 更新提示文案

### 9. 注意事项

1. **一次性订阅限制**：由于微信政策，每次发送通知后订阅权限会被消费，需要重新授权
2. **用户体验优化**：每次预约都会先询问用户是否允许通知，提供选择权
3. **核心功能保障**：通知发送失败不会影响预约确认的主流程
4. **调试支持**：系统会记录通知发送的详细日志便于调试
5. **错误处理**：如果获取不到用户openid，会抛出错误但不影响主流程

### 10. 部署说明

需要部署以下云函数：
- `sendNotification`
- `handlePrivateBooking`

部署命令（需在微信开发者工具中执行）：
```bash
# 右键云函数文件夹 -> 上传并部署
```
