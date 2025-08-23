// 私教往期记录页面
Page({
  data: {
    privateHistory: []
  },

  onLoad() {
    console.log('私教往期记录页面加载');
    this.loadPrivateHistory();
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      fail: () => {
        // 如果返回失败，跳转到个人中心
        wx.switchTab({
          url: '/pages/profile/profile'
        });
      }
    });
  },

  // 加载私教往期记录
  async loadPrivateHistory() {
    try {
      console.log('开始加载私教往期记录...');
      
      wx.showLoading({ title: '加载中...' });
      
      const result = await wx.cloud.callFunction({
        name: 'getUserPrivateBookings'
      });
      
      console.log('getUserPrivateBookings 返回结果:', result);
      
      if (result.result && result.result.success) {
        const now = new Date();
        const allPrivateBookings = result.result.data.map(booking => {
          // 解析课程时间
          const classStartTime = new Date(`${booking.date}T${booking.startTime}:00`);
          const isEnded = classStartTime < now; // 从现在的时间往前都归入往期
          
          // 处理状态显示
          let displayStatus = booking.status;
          let statusText = '';
          
          // 处理取消申请状态
          if (booking.cancelRequestStatus === 'pending') {
            displayStatus = 'cancel-pending';
            statusText = '申请取消中';
          } else if (booking.cancelRequestStatus === 'approved') {
            displayStatus = 'cancelled';
            statusText = '已取消';
          } else if (booking.cancelRequestStatus === 'rejected') {
            displayStatus = 'confirmed';
            statusText = '已确认';
          }
          
          // 根据原始状态设置显示状态和文本
          if (booking.status === 'cancelled') {
            displayStatus = 'cancelled';
            statusText = '已取消';
          } else if (booking.status === 'completed') {
            displayStatus = 'completed';
            statusText = '已完成';
          } else if (booking.status === 'confirmed') {
            // 如果课程已结束且状态为confirmed，标记为completed
            if (isEnded) {
              displayStatus = 'completed';
              statusText = '已完成';
            } else {
              displayStatus = 'confirmed';
              statusText = '已确认';
            }
          } else if (booking.status === 'pending') {
            displayStatus = 'pending';
            statusText = '待确认';
          } else if (booking.status === 'rejected') {
            displayStatus = 'rejected';
            statusText = '已拒绝';
          }
          
          return {
            ...booking,
            isEnded,
            displayStatus,
            statusText
          };
        });
        
        // 只保留已结束的课程（从现在的时间往前）
        const historyBookings = allPrivateBookings.filter(booking => booking.isEnded);
        
        // 按时间倒序排列（最近的在前）
        historyBookings.sort((a, b) => {
          const timeA = new Date(`${a.date}T${a.startTime}:00`);
          const timeB = new Date(`${b.date}T${b.startTime}:00`);
          return timeB - timeA;
        });
        
        console.log('私教往期记录:', historyBookings);
        console.log('往期记录数量:', historyBookings.length);
        this.setData({ privateHistory: historyBookings });
      } else {
        console.log('getUserPrivateBookings 返回失败或无数据');
        this.setData({ privateHistory: [] });
      }
      
      wx.hideLoading();
    } catch (error) {
      console.error('获取私教往期记录失败:', error);
      wx.hideLoading();
      this.setData({ privateHistory: [] });
      
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  }
});
