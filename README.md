# 🧘‍♀️ 墨瑜伽微信小程序

一个功能完整的瑜伽馆预约管理系统，基于微信小程序原生开发，使用微信云开发作为后端服务。

## ✨ 项目特色

- 🎯 **完整的约课系统**：支持团课、私教、训练营三种课程类型
- 🔄 **智能等位机制**：课程满员时自动加入等位队列，有空位时自动转正
- 💳 **次卡管理系统**：团课次卡、期限卡余额管理
- 🔔 **智能通知提醒**：开课前自动提醒，预约成功即时通知
- 👨‍💼 **完善的管理后台**：课程管理、用户管理、数据统计
- 🛡️ **安全权限控制**：基于微信openid的管理员权限验证

## 🚀 快速开始

### 环境要求

- 微信开发者工具（最新版本）
- 微信小程序账号（已认证）
- 微信云开发服务

### 安装部署

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd yoga
   ```

2. **配置云环境**
   - 在微信开发者工具中创建云开发环境
   - 修改 `miniprogram/app.js` 中的环境ID：
   ```javascript
   env: 'your-cloud-env-id' // 替换为你的云环境ID
   ```

3. **部署云函数**
   - 右键 `cloudfunctions` 目录 → 同步云函数列表
   - 逐个上传所有云函数

4. **设置数据库**
   - 按照 [数据库设置指南](#数据库设置) 创建集合和权限
   - 配置管理员权限（见下方管理员配置）

5. **配置订阅消息**
   - 在微信公众平台申请订阅消息模板
   - 更新相关云函数中的模板ID

## 📊 数据库设置

### 创建集合

在微信云开发控制台创建以下集合：

| 集合名 | 用途 | 权限设置 |
|--------|------|----------|
| `users` | 用户信息 | 用户本人读写 |
| `courses` | 课程信息 | 所有用户可读 |
| `courseSchedule` | 课程安排 | 所有用户可读 |
| `bookings` | 预约记录 | 用户本人读写 |
| `classRecords` | 课时记录 | 用户本人只读 |
| `notifications` | 通知记录 | 用户本人只读 |
| `admins` | 管理员信息 | 仅云函数访问 |
| `adminLogs` | 操作日志 | 仅云函数访问 |

### 权限配置示例

**users集合权限规则**：
```json
{
  "read": "auth.openid == doc.openid",
  "write": "auth.openid == doc.openid"
}
```

**courses集合权限规则**：
```json
{
  "read": true,
  "write": false
}
```

## 👨‍💼 管理员配置

### 方法一：通过数据库直接配置

1. 在云开发控制台的 `admins` 集合中添加管理员记录：
```json
{
  "openid": "your-wechat-openid",
  "nickName": "管理员姓名",
  "role": "admin",
  "status": "active",
  "createTime": "2024-01-01T00:00:00.000Z"
}
```

2. 获取你的微信openid：
   - 在小程序中调用云函数获取
   - 或使用微信开发者工具调试

### 方法二：通过云函数配置

1. 修改以下云函数中的 `defaultAdminOpenids` 数组：
   - `cloudfunctions/adminAddCourse/index.js`
   - `cloudfunctions/adminAddSchedule/index.js`
   - `cloudfunctions/adminUpdateCredits/index.js`
   - `cloudfunctions/getAllUsers/index.js`

2. 添加你的openid到数组中：
```javascript
const defaultAdminOpenids = [
  'your-actual-openid-here', // 你的openid
  // 可以添加多个管理员
];
```

3. 重新部署修改过的云函数

### 管理员入口

- 在"我的"页面长按右上角设置图标⚙️（约2秒）
- 系统会验证你的openid权限
- 验证通过后直接进入管理后台

## 🎯 核心功能

### 用户功能
- **智能约课**：支持团课、私教、训练营预约
- **等位排队**：课程满员时自动加入等位队列
- **次卡管理**：查看团课次卡、期限卡余额
- **预约管理**：查看预约历史、即将到来的课程
- **取消保护**：开课前1小时内禁止取消预约

### 管理员功能
- **课程管理**：创建课程、设置课程属性、批量导入课程模板
- **日程安排**：灵活安排课程时间和教师
- **用户管理**：查看用户信息、管理用户次卡
- **数据统计**：课程预约统计、用户活跃度分析
- **操作日志**：记录所有管理操作

### 智能通知
- **预约成功通知**：即时预约确认
- **成课通知**：满足最少人数时自动通知
- **开课前提醒**：开课前4小时自动提醒
- **课程取消通知**：开课前1小时不足人数时自动取消并通知
- **等位转正通知**：有空位时自动转为正式预约

## 🛠️ 技术栈

### 前端
- **框架**：微信小程序原生开发
- **样式**：WXSS + 全局统一设计系统
- **脚本**：JavaScript ES6+
- **组件**：自定义组件化开发

### 后端
- **云开发**：微信云开发
- **数据库**：云数据库（NoSQL）
- **云函数**：Node.js
- **存储**：云存储
- **消息推送**：订阅消息

## 📁 项目结构

```
yoga/
├── miniprogram/                # 小程序前端代码
│   ├── app.js                 # 全局逻辑（云开发初始化）
│   ├── app.json              # 全局配置（页面路由）
│   ├── app.wxss              # 全局样式
│   ├── components/           # 自定义组件
│   ├── custom-tab-bar/      # 自定义底部标签栏
│   ├── images/              # 图片资源
│   └── pages/               # 页面文件
│       ├── index/           # 首页
│       ├── course/          # 课程页
│       ├── activity/        # 活动页
│       ├── profile/         # 个人中心
│       ├── booking-confirm/ # 预约确认页
│       ├── private-booking/ # 私教预约页
│       ├── admin/           # 管理员主页
│       ├── admin-course/    # 课程管理页
│       ├── admin-users/     # 用户管理页
│       └── ...              # 其他页面
├── cloudfunctions/            # 云函数代码
│   ├── login/               # 用户登录
│   ├── getUser/             # 获取用户信息
│   ├── registerUser/        # 用户注册
│   ├── getDaySchedule/      # 获取每日课程安排
│   ├── bookCourse/          # 预约课程
│   ├── cancelBooking/       # 取消预约
│   ├── adminAddCourse/      # 管理员添加课程
│   ├── adminAddSchedule/    # 管理员添加日程
│   ├── adminUpdateCredits/  # 管理员更新用户次卡
│   ├── sendNotification/    # 发送通知
│   ├── sendClassReminder/   # 开课前提醒
│   └── ...                  # 其他云函数
└── README.md                # 项目说明
```

## 🧪 测试指南

### 基础功能测试
1. **用户注册登录**：测试用户信息获取和注册流程
2. **课程预约**：测试预约、取消、等位功能
3. **管理员功能**：测试课程管理、用户管理功能
4. **通知系统**：测试各种通知消息发送

### 测试数据准备
```javascript
// 创建测试课程
const testCourse = {
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
};

// 创建测试日程
const testSchedule = {
  courseId: "your-course-id",
  teacherId: "teacher1",
  teacherName: "莹儿",
  date: "2024-01-15",
  startTime: "19:15",
  endTime: "20:15",
  maxStudents: 8,
  minStudents: 2,
  currentStudents: 0,
  status: "published",
  createTime: new Date()
};
```

## 📋 功能清单

### ✅ 已完成功能
- [x] 用户注册登录系统
- [x] 智能课程预约系统
- [x] 等位排队机制
- [x] 次卡管理系统
- [x] 管理员后台
- [x] 课程管理（添加课程、安排日程）
- [x] 课程批量导入系统（8种常见瑜伽课程模板）
- [x] 用户管理
- [x] 智能通知系统
- [x] 开课前提醒
- [x] 取消预约保护机制
- [x] 操作日志记录

### 🔄 开发中功能
- [ ] 数据统计报表
- [ ] 课程评价系统
- [ ] 会员等级系统
- [ ] 优惠券系统

### 💡 未来规划
- [ ] 小程序直播功能
- [ ] 社区论坛
- [ ] 积分系统
- [ ] 第三方支付集成

## ⚠️ 注意事项

### 安全提醒
1. **管理员权限**：确保管理员openid正确且保密
2. **数据库权限**：严格按照最小权限原则设置
3. **云函数安全**：所有管理员操作都要验证权限
4. **用户隐私**：遵守数据保护法规

### 性能建议
1. **数据库索引**：为高频查询字段建立索引
2. **云函数优化**：控制函数执行时间和内存使用
3. **图片优化**：使用适当尺寸的图片资源
4. **缓存策略**：合理使用缓存减少数据库访问

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 技术支持

如有问题或建议，请通过以下方式联系：

- 提交 [Issue](../../issues)
- 发送邮件至：support@example.com

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

**🎉 如果这个项目对你有帮助，请给个Star支持一下！**