// 云函数测试脚本
// 在微信开发者工具的控制台中运行此脚本来测试云函数

console.log('=== 开始测试云函数 ===');

// 测试完整的登录流程
async function testCompleteLogin() {
  try {
    console.log('测试完整登录流程...');
    
    // 第一步：获取登录凭证
    const loginRes = await new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject
      });
    });
    
    console.log('获取到登录凭证:', loginRes.code);
    
    // 第二步：调用 registerUser 云函数
    const testData = {
      code: loginRes.code,
      nickName: '测试用户',
      avatarUrl: 'https://example.com/test-avatar.jpg',
      phoneNumber: '13800138000'
    };
    
    console.log('发送测试数据:', testData);
    
    const result = await wx.cloud.callFunction({
      name: 'registerUser',
      data: testData
    });
    
    console.log('完整登录流程测试结果:', result);
    return result;
  } catch (error) {
    console.error('完整登录流程测试失败:', error);
    throw error;
  }
}

// 测试 registerUser 云函数 (保持兼容)
async function testRegisterUser() {
  return testCompleteLogin();
}

// 测试 getUser 云函数
async function testGetUser() {
  try {
    console.log('测试 getUser 云函数...');
    
    const result = await wx.cloud.callFunction({
      name: 'getUser',
      data: {}
    });
    
    console.log('getUser 测试结果:', result);
    return result;
  } catch (error) {
    console.error('getUser 测试失败:', error);
    throw error;
  }
}

// 测试数据库连接
async function testDatabaseConnection() {
  try {
    console.log('测试数据库连接...');
    
    const db = wx.cloud.database();
    
    // 方法1：限制查询数量，避免全量查询警告
    const result = await db.collection('users').limit(1).get();
    
    console.log('数据库连接测试结果:', result);
    console.log('数据库连接状态: 成功');
    console.log('返回数据示例:', result.data.length > 0 ? '有数据' : '无数据');
    
    // 方法2：如果确实需要总数统计，可以这样做
    try {
      const countResult = await db.collection('users').count();
      console.log('users 集合文档总数:', countResult.total);
      console.log('注意：上述查询可能触发全量查询警告，这是正常的性能提示');
    } catch (countError) {
      console.log('统计文档数量时出现提示（非错误）:', countError.message);
    }
    
    return result;
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    throw error;
  }
}

// 测试 getUserCredits 云函数
async function testGetUserCredits() {
  try {
    console.log('测试 getUserCredits 云函数...');
    
    const result = await wx.cloud.callFunction({
      name: 'getUserCredits',
      data: {}
    });
    
    console.log('getUserCredits 测试结果:', result);
    console.log('getUserCredits 详细返回:', JSON.stringify(result.result, null, 2));
    return result;
  } catch (error) {
    console.error('getUserCredits 测试失败:', error);
    throw error;
  }
}

// 运行所有测试
async function runAllTests() {
  try {
    // 1. 测试数据库连接
    await testDatabaseConnection();
    
    // 2. 测试用户注册
    await testRegisterUser();
    
    // 3. 测试获取用户信息
    await testGetUser();
    
    // 4. 测试获取用户课时信息
    await testGetUserCredits();
    
    console.log('=== 所有测试完成 ===');
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 导出测试函数供手动调用
window.testCloudFunctions = {
  runAllTests,
  testCompleteLogin,
  testRegisterUser,
  testGetUser,
  testGetUserCredits,
  testDatabaseConnection
};

console.log('测试脚本已加载，在控制台中运行：');
console.log('window.testCloudFunctions.runAllTests() // 运行所有测试');
console.log('window.testCloudFunctions.testRegisterUser() // 测试用户注册');
console.log('window.testCloudFunctions.testGetUser() // 测试获取用户');
console.log('window.testCloudFunctions.testDatabaseConnection() // 测试数据库连接');
