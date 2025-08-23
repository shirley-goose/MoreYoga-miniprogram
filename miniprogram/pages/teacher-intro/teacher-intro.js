// 师资介绍页面
Page({
  data: {
    teacherInfo: {
      id: 'yinger',
      name: '莹儿老师',
      photo: 'cloud://cloud1-9g5oms9v90aabf59.636c-cloud1-9g5oms9v90aabf59-1374796372/images/teacher_yinger-6c1741.png',
      specialties: [
        {
          category: '产后私教',
          description: '产后体态、盆底内脏修复'
        },
        {
          category: '孕期私教',
          description: '孕期体态、调整'
        },
        {
          category: '体态调整',
          description: '腿型，骨盆，肩颈等'
        },
        {
          category: '体式精进',
          description: '省力倒立人轻松后弯等'
        },
        {
          category: '女性调理',
          description: '调整状态，放松身心'
        }
      ],
      awards: {
        column1: [
          'Kyoga.PTPC多元思维私人教练认证',
          'Kyoga倒立&后弯',
          'Kyoga.PART A10OTTC认证',
          'KFLY空中级别一培训师',
          '第二届国际空中瑜伽大赛团队总冠军',
          '第三届国际空中瑜伽大赛暨交流会授课导师'
        ],
        column2: [
          'Li xin pilates孕产私教认证',
          'Li xin pilates产后恢复团课认证',
          'Li xin pilates大器械'
        ],
        column3: [
          '毕义明功能解剖认证',
          '内观流培训',
          '国际瑜伽联盟2015年年度优秀瑜伽师'
        ]
      }
    }
  },

  onLoad(options) {
    console.log('师资介绍页面加载', options);
    
    // 如果有传入老师ID，则加载对应老师信息
    if (options.teacherId) {
      this.loadTeacherInfo(options.teacherId);
    }
  },

  onShow() {
    // 页面显示时的逻辑
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 加载老师信息
  loadTeacherInfo(teacherId) {
    console.log('加载老师信息:', teacherId);
    
    // 根据老师ID获取对应信息
    const teacherData = this.getTeacherData(teacherId);
    if (teacherData) {
      this.setData({
        teacherInfo: teacherData
      });
    }
  },

  // 获取老师数据（模拟数据，实际可从云函数或本地数据获取）
  getTeacherData(teacherId) {
    const teachersData = {
      'yinger': {
        id: 'yinger',
        name: '莹儿老师',
        photo: '../../images/teacher_yinger-6c1741.png',
        specialties: [
          {
            category: '产后私教',
            description: '产后体态、盆底内脏修复'
          },
          {
            category: '孕期私教',
            description: '孕期体态、调整'
          },
          {
            category: '体态调整',
            description: '腿型，骨盆，肩颈等'
          },
          {
            category: '体式精进',
            description: '省力倒立人轻松后弯等'
          },
          {
            category: '女性调理',
            description: '调整状态，放松身心'
          }
        ],
        awards: {
          column1: [
            'Kyoga.PTPC多元思维私人教练认证',
            'Kyoga倒立&后弯',
            'Kyoga.PART A10OTTC认证',
            'KFLY空中级别一培训师',
            '第二届国际空中瑜伽大赛团队总冠军',
            '第三届国际空中瑜伽大赛暨交流会授课导师'
          ],
          column2: [
            'Li xin pilates孕产私教认证',
            'Li xin pilates产后恢复团课认证',
            'Li xin pilates大器械'
          ],
          column3: [
            '毕义明功能解剖认证',
            '内观流培训',
            '国际瑜伽联盟2015年年度优秀瑜伽师'
          ]
        }
      },
      'zhouzhou': {
        id: 'zhouzhou',
        name: '周周老师',
        photo: '../../images/teacher_zhouzhou.jpg', // 照片待补充
        specialties: [
          {
            category: '流瑜伽',
            description: '优雅流畅的瑜伽序列'
          },
          {
            category: '哈他瑜伽',
            description: '传统瑜伽体式练习'
          },
          {
            category: '正位瑜伽',
            description: '精准体式对位指导'
          }
        ],
        awards: {
          column1: [
            '200小时瑜伽教练认证',
            '流瑜伽专业认证',
            '正位瑜伽导师认证'
          ],
          column2: [
            '国际瑜伽联盟RYT认证',
            '解剖学专业培训'
          ],
          column3: [
            '瑜伽理疗师认证'
          ]
        }
      },
      'yaqin': {
        id: 'yaqin',
        name: '雅琴老师',
        photo: '../../images/teacher_yaqin.jpg', // 照片待补充
        specialties: [
          {
            category: '阴瑜伽',
            description: '深度放松身心修复'
          },
          {
            category: '冥想瑜伽',
            description: '内观静心练习'
          },
          {
            category: '理疗瑜伽',
            description: '康复调理专业指导'
          }
        ],
        awards: {
          column1: [
            '阴瑜伽专业认证',
            '瑜伽理疗师认证',
            '冥想导师认证'
          ],
          column2: [
            '中医理论学习认证',
            '经络瑜伽专业培训'
          ],
          column3: [
            '正念减压MBSR认证'
          ]
        }
      },
      'qiqi': {
        id: 'qiqi',
        name: '岐岐老师',
        photo: '../../images/teacher_qiqi.jpg', // 照片待补充
        specialties: [
          {
            category: '空中瑜伽',
            description: '悬空体式优雅练习'
          },
          {
            category: '力量瑜伽',
            description: '强化核心力量训练'
          },
          {
            category: '倒立专项',
            description: '安全倒立技巧指导'
          }
        ],
        awards: {
          column1: [
            '空中瑜伽专业认证',
            '力量瑜伽导师认证',
            '倒立专项训练认证'
          ],
          column2: [
            '运动解剖学认证',
            '功能性训练认证'
          ],
          column3: [
            '国际空中瑜伽联盟认证'
          ]
        }
      },
      'chengmin': {
        id: 'chengmin',
        name: '程敏老师',
        photo: '../../images/teacher_chengmin.jpg', // 照片待补充
        specialties: [
          {
            category: '体式精进',
            description: '高难度体式技巧指导'
          },
          {
            category: '后弯专项',
            description: '安全后弯开胸练习'
          },
          {
            category: '平衡体式',
            description: '身心平衡协调训练'
          }
        ],
        awards: {
          column1: [
            '高级瑜伽导师认证',
            '体式精进专项认证',
            '后弯专业培训认证'
          ],
          column2: [
            '国际瑜伽大赛获奖者',
            '瑜伽示范导师认证'
          ],
          column3: [
            '瑜伽哲学研修认证'
          ]
        }
      }
    };

    return teachersData[teacherId] || null;
  },

  // 分享功能
  onShareAppMessage() {
    const { teacherInfo } = this.data;
    return {
      title: `${teacherInfo.name} - 墨瑜伽师资介绍`,
      path: `/pages/teacher-intro/teacher-intro?teacherId=${teacherInfo.id}`,
      imageUrl: teacherInfo.photo
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { teacherInfo } = this.data;
    return {
      title: `${teacherInfo.name} - 墨瑜伽师资介绍`,
      query: `teacherId=${teacherInfo.id}`,
      imageUrl: teacherInfo.photo
    };
  }
});