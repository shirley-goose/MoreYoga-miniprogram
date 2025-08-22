// 用户注册云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  let openid = wxContext.OPENID;
  const { code, nickName, avatarUrl, phoneNumber } = event;

  console.log('registerUser 云函数收到参数:', { openid, code, nickName, avatarUrl, phoneNumber });
  
  // 如果传入了 code，说明是新的登录流程，需要验证登录凭证
  if (code) {
    console.log('检测到登录凭证，验证微信登录...');
    // 这里微信云开发会自动处理 code 验证，openid 已经是正确的
    console.log('微信登录验证成功，用户 openid:', openid);
  }

  try {
    // 检查用户是否已存在
    console.log('检查用户是否已存在, openid:', openid);
    const existingUser = await db.collection('users')
      .where({ openid })
      .get();

    console.log('查询已存在用户结果:', existingUser.data);

    if (existingUser.data.length > 0) {
      console.log('用户已存在，尝试更新信息');
      // 用户已存在，更新用户信息
      const updateData = {};
      if (nickName) updateData.nickName = nickName;
      if (avatarUrl) updateData.avatarUrl = avatarUrl;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;
      updateData.updateTime = new Date();

      if (Object.keys(updateData).length > 1) { // 除了updateTime外还有其他字段
        console.log('更新用户数据:', updateData);
        const updateResult = await db.collection('users')
          .where({ openid })
          .update({
            data: updateData
          });
        console.log('更新结果:', updateResult);
      }

      return {
        success: true,
        message: '用户信息已更新',
        user: {
          ...existingUser.data[0],
          ...updateData
        }
      };
    }

    // 创建新用户
    const userData = {
      openid,
      nickName: nickName || '瑜伽爱好者',
      avatarUrl: avatarUrl || '',
      phoneNumber: phoneNumber || '',
      groupCredits: 0, // 团课次卡
      termCredits: 0,  // 私教次卡
      totalClasses: 0, // 总上课次数
      registrationDate: new Date(), // 注册时间
      createTime: new Date(),
      updateTime: new Date(),
      status: 'active' // 用户状态
    };

    console.log('创建新用户数据:', userData);
    
    const result = await db.collection('users').add({
      data: userData
    });

    console.log('数据库插入结果:', result);

    return {
      success: true,
      message: '注册成功',
      userId: result._id,
      user: userData
    };
  } catch (error) {
    console.error('用户注册失败:', error);
    return {
      success: false,
      message: '注册失败',
      error: error.message
    };
  }
};
