Page({
  data: {
    bookingHistory: [],
    loading: false,
    hasMore: true,
    currentPage: 0,
    pageSize: 10
  },

  onLoad() {
    this.loadBookingHistory();
  },

  // 加载预约历史记录
  async loadBookingHistory(reset = true) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      const skip = reset ? 0 : this.data.currentPage * this.data.pageSize;
      
      console.log('加载预约历史，skip:', skip, 'limit:', this.data.pageSize);
      
      const result = await wx.cloud.callFunction({
        name: 'getUserBookings',
        data: {
          limit: this.data.pageSize,
          skip: skip
        }
      });
      
      console.log('getUserBookings 返回结果:', result);
      
      if (result.result && result.result.success) {
        const historyData = result.result.data || [];
        
        // 处理历史记录数据
        const processedHistory = historyData.map(booking => {
          const now = new Date();
          let statusText = '';
          let statusClass = '';
          
          if (booking.status === 'cancelled') {
            statusText = '已取消';
            statusClass = 'cancelled';
          } else if (booking.schedule) {
            const classEndTime = new Date(`${booking.schedule.date}T${booking.schedule.endTime}:00`);
            if (classEndTime < now) {
              statusText = '已完成';
              statusClass = 'completed';
            } else {
              statusText = '已预约';
              statusClass = 'completed';
            }
          } else {
            statusText = '状态未知';
            statusClass = 'missed';
          }
          
          return {
            id: booking._id,
            courseName: booking.courseName || booking.schedule?.courseName || '瑜伽课程',
            teacherName: booking.teacherName || booking.schedule?.teacherName || '老师',
            date: booking.schedule?.date || '',
            time: booking.schedule ? `${booking.schedule.startTime}-${booking.schedule.endTime}` : '',
            courseImage: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/background.png',
            statusText: statusText,
            statusClass: statusClass,
            creditsUsed: booking.creditsUsed || 1,
            createTime: booking.createTime
          };
        });
        
        console.log('处理后的历史记录:', processedHistory);
        
        if (reset) {
          this.setData({
            bookingHistory: processedHistory,
            currentPage: 1,
            hasMore: processedHistory.length >= this.data.pageSize
          });
        } else {
          this.setData({
            bookingHistory: [...this.data.bookingHistory, ...processedHistory],
            currentPage: this.data.currentPage + 1,
            hasMore: processedHistory.length >= this.data.pageSize
          });
        }
        
        console.log('更新后的状态:', {
          总记录数: this.data.bookingHistory.length,
          当前页: this.data.currentPage,
          是否有更多: this.data.hasMore
        });
      } else {
        console.log('获取预约历史失败:', result.result);
        if (reset) {
          this.setData({ bookingHistory: [] });
        }
      }
    } catch (error) {
      console.error('加载预约历史失败:', error);
      if (reset) {
        this.setData({ bookingHistory: [] });
      }
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载更多历史记录
  loadMoreHistory() {
    if (!this.data.hasMore || this.data.loading) return;
    this.loadBookingHistory(false);
  },

  // 返回上一页
  navigateBack() {
    wx.navigateBack();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadBookingHistory(true);
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  }
});
