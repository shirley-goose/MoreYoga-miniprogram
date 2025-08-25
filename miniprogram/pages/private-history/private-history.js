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
            displayStatus = 'confirmed';
            statusText = '已确认';
          } else if (booking.status === 'pending') {
            displayStatus = 'pending';
            statusText = '待确认';
          } else if (booking.status === 'rejected') {
            displayStatus = 'rejected';
            statusText = '已拒绝';
          }
          
          // 判断是否为往期课程：根据状态而非时间
          const isHistoryCourse = (displayStatus === 'cancelled' || displayStatus === 'completed');
          
          // 格式化取消时间（仅对已取消的课程）
          let formattedCancelTime = null;
          if (displayStatus === 'cancelled' && booking.cancelProcessTime) {
            formattedCancelTime = this.formatDateTime(booking.cancelProcessTime);
          }
          
          return {
            ...booking,
            displayStatus,
            statusText,
            isHistoryCourse,
            formattedCancelTime
          };
        });
        
        // 筛选往期课程：只保留 cancelled 和 completed 状态的课程
        const historyBookings = allPrivateBookings.filter(booking => booking.isHistoryCourse);
        
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
  },

  // 格式化日期时间
  formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    
    try {
      const date = new Date(dateTimeStr);
      if (isNaN(date.getTime())) {
        return dateTimeStr; // 如果无法解析，返回原字符串
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    } catch (error) {
      console.error('格式化日期时间失败:', error);
      return dateTimeStr;
    }
  }
});
