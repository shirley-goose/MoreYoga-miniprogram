# 墨瑜伽微信小程序

## 项目简介

墨瑜伽是一个专业的瑜伽馆微信小程序，提供完整的课程预约管理系统。系统包括用户约课、课时管理、课程日历发布、智能通知提醒等功能，并配备完善的管理员后台。本小程序基于微信云开发，确保数据安全可靠，用户体验流畅。

## ✨ 核心功能

### 🧘‍♀️ 用户功能
- **智能约课系统**：支持团课、私教、训练营三种类型
- **等位排队机制**：课程满员时自动加入等位队列
- **次卡管理**：团课次卡、期限卡余额管理
- **课程提醒**：开课前1小时自动提醒
- **预约管理**：查看预约历史、即将到来的课程
- **取消保护**：开课前1小时内禁止取消预约

### 👨‍💼 管理员功能
- **双重入口设计**：管理员入口（openid验证）+ 老师入口（密码验证）
- **课程管理**：创建课程、设置课程属性
- **课程导入**：批量导入常见瑜伽课程模板（哈他瑜伽、流瑜伽、阴瑜伽等）
- **日程安排**：灵活安排课程时间和教师
- **用户管理**：查看用户信息、管理用户次卡
- **数据统计**：课程预约统计、用户活跃度分析
- **权限分级**：管理员和老师权限分离管理

### 🔔 智能通知
- **预约成功通知**：即时预约确认
- **成课通知**：满足最少人数时自动通知
- **开课前提醒**：开课前4小时自动提醒，确保用户不错过课程
- **私教预约通知**：老师确认私教预约时自动通知用户
- **等位转正通知**：有空位时自动转为正式预约

## 项目结构

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
│       ├── index/           # 首页（知）
│       ├── course/          # 课程页（练）- 支持在线预约
│       ├── activity/        # 活动页（聚）
│       ├── profile/         # 个人中心（我）- 次卡管理
│       ├── booking-confirm/ # 预约确认页
│       ├── private-booking/ # 私教预约页
│       ├── admin/           # 管理员主页
│       ├── admin-course/    # 课程管理页（支持添加课程、安排日程、批量导入）
│       ├── admin-users/     # 用户管理页
│       ├── venue-intro/     # 场馆介绍
│       ├── teacher-intro/   # 师资简介
│       ├── course-theme/    # 课程主题
│       └── yoga-theory/     # 瑜伽理论
├── cloudfunctions/            # 云函数代码
│   ├── login/               # 用户登录
│   ├── getUser/             # 获取用户信息
│   ├── registerUser/        # 用户注册
│   ├── getUserCredits/      # 获取用户次卡余额
│   ├── getDaySchedule/      # 获取每日课程安排
│   ├── bookCourse/          # 预约课程
│   ├── cancelBooking/       # 取消预约
│   ├── getUserBookings/     # 获取用户预约记录
│   ├── sendNotification/    # 发送通知（私教预约确认）
│   ├── sendSubscribeMessage/# 发送订阅消息通用接口
│   ├── sendClassReminder/   # 开课前4小时提醒
│   ├── scheduleClassReminders/ # 定时任务：检查并发送开课提醒
│   ├── testClassReminder/   # 测试开课前提醒功能
│   ├── adminAddCourse/      # 管理员添加课程
│   ├── adminAddSchedule/    # 管理员添加日程
│   ├── adminUpdateCredits/  # 管理员更新用户次卡
│   ├── getCourses/          # 获取课程列表
│   └── getAllUsers/         # 获取所有用户（管理员专用）
├── CLOUD_DEPLOYMENT_GUIDE.md # 云开发部署指南
├── DATABASE_SETUP.md        # 数据库设置指南
├── TESTING_GUIDE.md         # 测试指南
└── README.md                # 项目说明
```

## 导航栏设计规范

### 统一样式特点

所有页面的顶部导航栏已统一为相同的设计风格：

- **背景色**: `#202632` (深灰色)
- **文字颜色**: 白色
- **高度**: `185rpx` (包含状态栏适配)
- **标题**: 居中显示，字体大小 `32rpx`，字重 `600`
- **返回按钮**: 左侧显示，使用 `‹` 符号

### 样式定义位置

导航栏的统一样式定义在 `app.wxss` 中，包括以下类：

```css
/* 全局背景图样式 */
.global-bg {
  position: fixed;
  left: 0; top: 0;
  width: 110vw; height: 100vh;
  z-index: -1;
  pointer-events: none;
}

/* 统一的导航栏样式 */
.nav-bar {
  height: 100rpx;
  padding-top: 60rpx;
  padding-bottom: 25rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #202632;
  color: #fff;
  position: relative;
  z-index: 100;
}

.nav-left, .nav-right {
  flex: 1;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  align-self: flex-end;
}

.nav-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
  cursor: pointer;
}

.back-icon {
  font-size: 40rpx;
  color: #fff;
  font-weight: bold;
}
```

## 页面配置

### 导航栏配置

所有页面的 `.json` 配置文件都设置了：

```json
{
  "navigationStyle": "custom"
}
```

这允许我们完全自定义导航栏样式。

### HTML结构

每个页面都使用相同的导航栏结构：

```html
<!-- 背景图 -->
<image class="global-bg" src="../../images/background.png" mode="aspectFill"/>

<!-- 自定义导航栏 -->
<view class="nav-bar">
  <view class="nav-left">
    <!-- 对于需要返回按钮的页面 -->
    <view class="nav-back" bindtap="navigateBack">
      <text class="back-icon">‹</text>
    </view>
  </view>
  <view class="nav-title">页面标题</view>
  <view class="nav-right"></view>
</view>
```

## 页面说明

### 1. 首页 (index)
- **功能**: 展示瑜伽馆简介、功能导航
- **特色**: 包含logo展示、slogan展示、功能模块入口
- **导航**: 点击功能图标可进入对应的二级页面

### 2. 课程页 (course)
- **功能**: 课程预约、课程展示
- **类型**: 支持私教、团课、训练营三种类型
- **特色**: 日历选择、课程卡片展示

### 3. 活动页 (activity)
- **功能**: 静修活动展示和参与
- **特色**: 大图卡片式活动展示

### 4. 个人中心 (profile)
- **功能**: 用户信息管理、课程记录、已约日程
- **特色**: 足迹热力图、课程次卡显示
- **管理员入口**: 右上角的管理员设置按钮，仅对管理员可见

### 5. 预约确认页 (booking-confirm)
- **功能**: 团课预约信息确认和支付
- **特色**: 课程详情卡片、价格明细

### 6. 私教预约页 (private-booking)
- **功能**: 私教课程预约
- **特色**: 老师信息展示、时间选择表单

### 7. 场馆介绍页 (venue-intro)
- **功能**: 展示瑜伽馆场馆信息
- **特色**: 场馆图片展示、联系方式、环境介绍

### 8. 师资简介页 (teacher-intro)
- **功能**: 展示瑜伽馆教师团队
- **特色**: 教师头像、姓名展示，为后续详细介绍页面预留接口

### 9. 课程主题页 (course-theme)
- **功能**: 展示瑜伽课程主题分类
- **特色**: 各类瑜伽课程主题卡片展示，可扩展为详细课程介绍

### 10. 瑜伽理论页 (yoga-theory)
- **功能**: 展示瑜伽理论知识分类
- **特色**: 瑜伽理论模块化展示，可扩展为详细理论内容

## 组件说明

### 导航栏组件 (nav-bar)

虽然创建了可复用的导航栏组件，但当前版本直接在各页面中使用HTML结构，以保持代码简洁性。组件位于 `components/nav-bar/` 目录，可在需要时引入使用。

**组件属性**:
- `title`: 导航栏标题，默认为"墨瑜伽"
- `showBack`: 是否显示返回按钮，默认为false

**使用方法**:
```html
<nav-bar title="页面标题" showBack="{{true}}" bind:back="onBackTap"></nav-bar>
```

## 开发注意事项

1. **样式复用**: 导航栏样式已全局定义，各页面无需重复编写
2. **背景图**: 使用全局背景图类 `.global-bg`
3. **返回事件**: 返回按钮需绑定 `navigateBack` 事件处理函数
4. **z-index**: 导航栏 z-index 为 100，确保在其他内容之上
5. **响应式**: 导航栏已适配不同屏幕尺寸

## 🛠️ 技术栈

### 前端技术
- **框架**: 微信小程序原生开发
- **样式**: WXSS + 全局统一设计系统
- **脚本**: JavaScript ES6+
- **配置**: JSON
- **组件**: 自定义组件化开发

### 后端技术
- **云开发**: 微信云开发
- **数据库**: 云数据库（NoSQL）
- **云函数**: Node.js
- **存储**: 云存储
- **消息推送**: 订阅消息

### 开发工具
- 微信开发者工具（必需）
- VSCode（推荐配合微信小程序插件）
- 云开发控制台

## 🚀 快速开始

### 1. 环境准备
```bash
# 确保你有以下环境：
- 微信开发者工具（最新版本）
- 已申请的微信小程序账号
- 开通微信云开发服务
```

### 2. 项目部署
```bash
# 1. 下载项目代码
git clone <your-repo-url>

# 2. 导入微信开发者工具
# 选择 miniprogram 目录作为项目根目录

# 3. 配置云环境ID
# 修改 miniprogram/app.js 中的环境ID

# 4. 部署云函数
# 右键 cloudfunctions 目录 -> 同步云函数列表
# 逐个上传云函数

# 5. 设置数据库
# 按照 DATABASE_SETUP.md 创建集合和权限
```

### 3. 详细部署指南
- 📖 [云开发部署指南](./CLOUD_DEPLOYMENT_GUIDE.md)
- 🗃️ [数据库设置指南](./DATABASE_SETUP.md)
- 🧪 [测试指南](./TESTING_GUIDE.md)

## 📋 功能清单

### ✅ 已完成功能
- [x] 用户注册登录系统
- [x] 智能课程预约系统
- [x] 等位排队机制
- [x] 次卡管理系统
- [x] 管理员后台
- [x] 课程管理（添加课程、安排日程）
- [x] 课程批量导入系统（8种常见瑜伽课程模板）
- [x] 管理员设置入口优化（避免与小程序原生组件冲突）
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

---

*本项目遵循微信小程序设计规范，注重用户体验和界面一致性。*

已完成：done 状态（绿色标签）
已取消：cancelled 状态（红色标签）
等位失败：fail 状态（橙红色标签）
已返还：refunded 状态（灰色标签）
已预约：booked 状态（蓝色标签）
等位中：waitlist 状态（黄色标签）