/**
 * 获取管理员OpenID工具
 * 
 * 使用方法：
 * 1. 在微信开发者工具的控制台中运行以下代码
 * 2. 复制得到的openid
 * 3. 将openid添加到云函数的defaultAdminOpenids数组中
 */

// 步骤1：在小程序页面中添加临时按钮来获取openid
console.log('=== 获取管理员OpenID指南 ===');
console.log('');
console.log('方法一：通过云函数获取（推荐）');
console.log('1. 创建一个临时云函数获取openid：');
console.log('');
console.log('// 在 cloudfunctions 目录下创建 getAdminOpenid 文件夹');
console.log('// index.js 内容：');
console.log(`
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
};
`);
console.log('');
console.log('2. 上传并部署该云函数');
console.log('3. 在小程序中调用：');
console.log(`
wx.cloud.callFunction({
  name: 'getAdminOpenid',
  success: res => {
    console.log('你的OpenID是：', res.result.openid);
    // 复制这个openid，用于设置管理员权限
  }
});
`);
console.log('');
console.log('方法二：通过现有云函数获取');
console.log('1. 登录小程序，进入个人中心');
console.log('2. 在开发者工具的控制台查看网络请求');
console.log('3. 找到任意云函数调用，查看请求中的openid字段');
console.log('');
console.log('获取到openid后，请按以下步骤设置管理员权限：');
console.log('');
console.log('1. 编辑以下云函数文件：');
console.log('   - cloudfunctions/adminAddCourse/index.js');
console.log('   - cloudfunctions/adminAddSchedule/index.js');
console.log('   - cloudfunctions/adminUpdateCredits/index.js');
console.log('   - cloudfunctions/getAllUsers/index.js');
console.log('');
console.log('2. 在每个文件中找到 defaultAdminOpenids 数组，添加你的openid：');
console.log(`
const defaultAdminOpenids = [
  'your-actual-openid-here', // 替换为你的真实openid
  // 'another-admin-openid-here' // 可以添加多个管理员
];
`);
console.log('');
console.log('3. 重新上传这些云函数');
console.log('4. 测试管理员功能是否正常');
