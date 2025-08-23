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

  // 更新预约状态函数
  async updateBookingStatus() {
    try {
      console.log('开始更新预约状态...');
      
      const result = await wx.cloud.callFunction({
        name: 'updateBookingStatus'
      });
      
      console.log('状态更新结果:', result);
      
      if (result.result && result.result.success) {
        console.log('状态更新成功，更新数量:', result.result.updatedCount);
      }
    } catch (error) {
      console.error('更新预约状态失败:', error);
      // 不影响主流程，继续加载历史记录
    }
  },

  // 加载预约历史记录
  async loadBookingHistory(reset = true) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      const skip = reset ? 0 : this.data.currentPage * this.data.pageSize;
      
      console.log('加载预约历史，skip:', skip, 'limit:', this.data.pageSize);
      
      // 先调用状态更新函数
      await this.updateBookingStatus();
      
      const result = await wx.cloud.callFunction({
        name: 'getUserBookings',
        data: {
          limit: 50, // 增加查询数量以获取更多历史记录
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
          let cancelTime = null;
          
          // 根据数据库中的状态显示
          switch (booking.status) {
            case 'done':
              statusText = '已完成';
              statusClass = 'completed';
              break;
            case 'cancelled':
              statusText = '已取消';
              statusClass = 'cancelled';
              // 格式化取消时间
              if (booking.cancelTime) {
                const cancelDate = new Date(booking.cancelTime);
                cancelTime = `${cancelDate.getFullYear()}-${String(cancelDate.getMonth() + 1).padStart(2, '0')}-${String(cancelDate.getDate()).padStart(2, '0')} ${String(cancelDate.getHours()).padStart(2, '0')}:${String(cancelDate.getMinutes()).padStart(2, '0')}`;
              }
              break;
            case 'fail':
              statusText = '等位失败';
              statusClass = 'failed';
              break;
            case 'refunded':
              statusText = '已返还';
              statusClass = 'refunded';
              break;
            case 'booked':
              // 检查是否已过期但状态未更新 - 使用开始时间判断
              if (booking.schedule) {
                const classStartTime = new Date(`${booking.schedule.date}T${booking.schedule.startTime}:00`);
                if (classStartTime < now) {
                  statusText = '已完成';
                  statusClass = 'completed';
                } else {
                  statusText = '已预约';
                  statusClass = 'booked';
                }
              } else {
                statusText = '已预约';
                statusClass = 'booked';
              }
              break;
            case 'waitlist':
              // 检查是否已过期但状态未更新 - 使用开始时间判断
              if (booking.schedule) {
                const classStartTime = new Date(`${booking.schedule.date}T${booking.schedule.startTime}:00`);
                if (classStartTime < now) {
                  statusText = '等位失败';
                  statusClass = 'failed';
                } else {
                  statusText = '等位中';
                  statusClass = 'waitlist';
                }
              } else {
                statusText = '等位中';
                statusClass = 'waitlist';
              }
              break;
            default:
              statusText = '状态未知';
              statusClass = 'unknown';
          }
          
          return {
            id: booking._id,
            courseName: booking.courseName || booking.schedule?.courseName || '瑜伽课程',
            teacherName: booking.teacherName || booking.schedule?.teacherName || '老师',
            date: booking.schedule?.date || '',
            time: booking.schedule ? `${booking.schedule.startTime}-${booking.schedule.endTime}` : '',
            courseImage: '../../images/background.png',
            statusText: statusText,
            statusClass: statusClass,
            creditsUsed: booking.creditsUsed || 1,
            createTime: booking.createTime,
            cancelTime: cancelTime, // 添加取消时间
            courseDateTime: booking.schedule ? new Date(`${booking.schedule.date}T${booking.schedule.startTime}:00`) : new Date(booking.createTime),
            // 用于排序的绝对时间 - 取消的课程使用课程时间，其他使用课程时间
            absoluteDateTime: booking.schedule ? new Date(`${booking.schedule.date}T${booking.schedule.startTime}:00`) : new Date(booking.createTime)
          };
        });
        
        // 按课程的绝对时间排序，最近的在前（包括取消的课程）
        processedHistory.sort((a, b) => b.absoluteDateTime - a.absoluteDateTime);
        
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
