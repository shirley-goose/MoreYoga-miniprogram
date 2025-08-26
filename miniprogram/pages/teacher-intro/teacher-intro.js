// 师资介绍页面
Page({
  data: {
    teacherInfo: {
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
        photo: '../../images/yinger.jpg',
        intro: '深耕瑜伽教学十年，传统古典瑜伽，吠陀瑜伽以及孕期产后瑜伽研习者，瑜伽培训导师，两位孩子母亲，教学有爱有生命力且有方法。',
        specialties: [
          {
            category: '古典瑜伽',
            description: '课程融合解剖学，从内脏位置功能与骨骼排列、神经系统的关系出发，遵循身体的客观规律，去感受身体本身的智慧。'
          },
          {
            category: '女性瑜伽',
            description: '针对盆底肌群、子宫卵巢、甲状腺等女性核心宝藏，青少年、生理周期、孕产、更年期不同女性时期，建立呼吸-筋膜-能量三重唤醒。'
          },
          {
            category: '五大元素流动课程—动态冥想力',
            description: '将唱诵与传统功法相结合，用震动频率疏通气血通道。在土、水、火、风、空五种不同的意识状态中感受身体的流动。不同的动作是不同的能量流动形式。'
          }
        ],
        words: '十年前刚接触瑜伽时，我和很多人一样，会对着镜子反复调整自己的身体，不乏“暴力”的追求身材和体式。后来成为母亲、经历身体的变化，才慢慢懂得：那些藏在骨盆深处的生命力，那些随着呼吸起伏的内脏韵律，远比外在的线条更值得倾听。现在的我，更喜欢在清晨第一缕阳光，安安静静的调息练习，  感受身体本身的智慧，致力于用最符合人体科学的方式，让瑜伽成为滋养生命的土壤。',
      },
        'zhouzhou': {
        id: 'zhouzhou',
        name: '周周老师',
        photo: '../../images/zhouzhou.jpg',
        intro: '教学七年，喜欢探索身心联结，擅长感知情绪有一定的通感力，深入学习和练习古典瑜伽，以及深入学习瑜伽哲学，中医养生，五行针灸（调理情志类的疗愈针法）以及冥想打坐等课程。',
        specialties: [
          {
            category: '肩颈/腰椎疼痛/体态疗愈',
            description: ''
          },
          {
            category: '情绪心身私教（情绪躯体化）',
            description: ''
          },
          {
            category: '体式放松，冥想放松解压',
            description: ''
          }
        ],
        words:'瑜伽哲学是我行于生活的哲学，瑜伽体式是我探索身心的工具，瑜伽修习是我净化心身通道触心身的镜子，喜欢探索心身一体，也相信身心一体且具有能量。'
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
        photo: '../../images/qiqi.jpg', 
        intro: '喜欢瑜伽，享受瑜伽，教学三年热爱思考教学。喜欢在流动的练习里探索瑜伽。擅长课程流瑜伽.',
        specialties: [
          {
            category: '流瑜伽',
            description: '节奏舒缓温和有力量'
          },
          {
            category: '正位瑜伽',
            description: ''
          },
          {
            category: '塑形瑜伽',
            description: ''
          }
        ],
        words:'延习以传统正位，精准为练习原则上的流动。在课程里我愿细致耐心的辅助练习者，注重的练习者感受。与练习者一起体验身心灵回归当下，与身体在一起的美好。',
        },
      'chengmin': {
        id: 'chengmin',
        name: '程敏老师',
        photo: '../../images/chengmin.jpg', 
        intro:'教学十余年，教学经验丰富，技术深厚。多次参加李欣普拉提，维密塑形，以及其他塑形工作坊，如：苏蕾私人订制/一字肩美背美臀等工作坊。',        specialties: [
          {
            category: '肩颈理疗',
            description: ''
          },
          {
            category: '开髋开肩',
            description: ''
          },
          {
            category: '臀腿/肩背线条塑造',
            description: ''
          },
          {
            category: '流瑜伽',
            description: ''
          },
          {
            category: '高难体式挑战',
            description: ''
          }
        ],
        words:'练习的过程里，时刻安放注意力在自己的身体上，让自己更好成为自己。',
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