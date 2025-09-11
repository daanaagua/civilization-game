'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameEvent, EventType, EventPriority, EventChoice } from '@/components/features/EventsPanel';

// 事件管理Hook
export function useEvents() {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [eventIdCounter, setEventIdCounter] = useState(1);

  // 添加新事件
  const addEvent = useCallback((eventData: Omit<GameEvent, 'id' | 'timestamp'>) => {
    const newEvent: GameEvent = {
      ...eventData,
      id: `event_${eventIdCounter}`,
      timestamp: Date.now(),
      isRead: false,
      isResolved: eventData.type === EventType.NOTIFICATION // 提示事件自动标记为已处理
    };

    setEvents(prev => [newEvent, ...prev]);
    setEventIdCounter(prev => prev + 1);
    
    return newEvent.id;
  }, [eventIdCounter]);

  // 标记事件为已读
  const markAsRead = useCallback((eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, isRead: true }
        : event
    ));
  }, []);

  // 处理选择事件
  const handleChoice = useCallback((eventId: string, choiceId: string) => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId && event.type === EventType.CHOICE) {
        const selectedChoice = event.choices?.find(choice => choice.id === choiceId);
        return {
          ...event,
          isRead: true,
          isResolved: true,
          consequences: selectedChoice?.consequences || []
        };
      }
      return event;
    }));
    
    // 这里可以添加选择后果的处理逻辑
    const event = events.find(e => e.id === eventId);
    const choice = event?.choices?.find(c => c.id === choiceId);
    
    if (choice?.consequences) {
      // 可以触发相应的游戏状态变化
      console.log(`事件选择结果:`, choice.consequences);
    }
  }, [events]);

  // 移除事件
  const removeEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  }, []);

  // 清理过期事件
  const cleanupExpiredEvents = useCallback(() => {
    const now = Date.now();
    setEvents(prev => prev.filter(event => {
      if (event.duration && event.timestamp + event.duration < now) {
        return false;
      }
      return true;
    }));
  }, []);

  // 获取未读事件
  const getUnreadEvents = useCallback(() => {
    return events.filter(event => !event.isRead);
  }, [events]);

  // 获取未处理的选择事件
  const getUnresolvedChoiceEvents = useCallback(() => {
    return events.filter(event => 
      event.type === EventType.CHOICE && !event.isResolved
    );
  }, [events]);

  // 获取特定类型的事件
  const getEventsByType = useCallback((type: EventType) => {
    return events.filter(event => event.type === type);
  }, [events]);

  // 获取特定优先级的事件
  const getEventsByPriority = useCallback((priority: EventPriority) => {
    return events.filter(event => event.priority === priority);
  }, [events]);

  // 定期清理过期事件
  useEffect(() => {
    const interval = setInterval(cleanupExpiredEvents, 60000); // 每分钟检查一次
    return () => clearInterval(interval);
  }, [cleanupExpiredEvents]);

  // 初始化示例事件
  useEffect(() => {
    const initializeEvents = () => {
      // 添加一些示例事件
      const sampleEvents: Omit<GameEvent, 'id' | 'timestamp'>[] = [
        {
          title: '贸易商队到达',
          description: '一支来自远方的贸易商队抵达了你的城市，他们带来了珍贵的货物和消息。',
          type: EventType.CHOICE,
          priority: EventPriority.MEDIUM,
          icon: '🚛',
          category: '贸易',
          choices: [
            {
              id: 'trade',
              text: '与他们进行贸易',
              description: '用你的资源换取他们的货物',
              consequences: ['获得稀有资源', '增加贸易关系', '消耗金币']
            },
            {
              id: 'tax',
              text: '征收过路税',
              description: '要求商队缴纳税金才能通过',
              consequences: ['获得金币', '降低贸易关系', '可能引发冲突']
            },
            {
              id: 'ignore',
              text: '让他们自由通过',
              description: '不干涉商队的活动',
              consequences: ['维持中立关系', '无直接收益']
            }
          ]
        },
        {
          title: '丰收季节',
          description: '今年的天气格外适宜农作物生长，你的农田获得了大丰收！',
          type: EventType.NOTIFICATION,
          priority: EventPriority.LOW,
          icon: '🌾',
          category: '农业',
          consequences: ['食物产量 +50%', '人口增长速度 +25%', '稳定度 +10']
        },
        {
          title: '神秘学者求见',
          description: '一位神秘的学者来到你的宫廷，声称掌握着古老的知识，愿意为你效力。',
          type: EventType.CHOICE,
          priority: EventPriority.HIGH,
          icon: '🧙‍♂️',
          category: '科技',
          choices: [
            {
              id: 'accept',
              text: '接受他的效力',
              description: '让学者加入你的顾问团',
              consequences: ['获得科技加成', '解锁新研究', '增加维护成本']
            },
            {
              id: 'test',
              text: '先测试他的能力',
              description: '要求学者证明自己的价值',
              consequences: ['可能获得科技突破', '可能浪费时间', '学者可能离开']
            },
            {
              id: 'refuse',
              text: '礼貌地拒绝',
              description: '感谢学者的好意但婉拒合作',
              consequences: ['维持现状', '错失机会', '学者可能投靠敌人']
            }
          ]
        }
      ];

      // 添加事件，但延迟一些时间以模拟真实游戏体验
      sampleEvents.forEach((eventData, index) => {
        setTimeout(() => {
          addEvent(eventData);
        }, index * 2000); // 每2秒添加一个事件
      });
    };

    // 延迟初始化，避免在组件挂载时立即触发
    const timer = setTimeout(initializeEvents, 1000);
    return () => clearTimeout(timer);
  }, [addEvent]);

  return {
    events,
    addEvent,
    markAsRead,
    handleChoice,
    removeEvent,
    cleanupExpiredEvents,
    getUnreadEvents,
    getUnresolvedChoiceEvents,
    getEventsByType,
    getEventsByPriority
  };
}

// 事件生成器工具函数
export const EventGenerator = {
  // 创建随机事件
  createRandomEvent: (): Omit<GameEvent, 'id' | 'timestamp'> => {
    const eventTemplates = [
      {
        title: '野兽袭击',
        description: '一群野兽袭击了边境村庄，村民们请求援助。',
        type: EventType.CHOICE,
        priority: EventPriority.HIGH,
        icon: '🐺',
        choices: [
          {
            id: 'send_army',
            text: '派遣军队',
            consequences: ['保护村民', '消耗军事资源']
          },
          {
            id: 'fortify',
            text: '加强防御',
            consequences: ['建造防御工事', '消耗建筑资源']
          }
        ]
      },
      {
        title: '发现矿脉',
        description: '探险队在山区发现了一处丰富的矿脉！',
        type: EventType.NOTIFICATION,
        priority: EventPriority.MEDIUM,
        icon: '⛏️',
        consequences: ['解锁新矿场', '增加资源产出']
      },
      {
        title: '瘟疫爆发',
        description: '城市中爆发了一场瘟疫，需要立即采取行动。',
        type: EventType.CHOICE,
        priority: EventPriority.URGENT,
        icon: '🦠',
        choices: [
          {
            id: 'quarantine',
            text: '实施隔离',
            consequences: ['控制疫情', '降低经济活动']
          },
          {
            id: 'medicine',
            text: '研发药物',
            consequences: ['治愈疾病', '消耗科研资源']
          }
        ]
      }
    ];

    return eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
  },

  // 创建季节性事件
  createSeasonalEvent: (season: 'spring' | 'summer' | 'autumn' | 'winter'): Omit<GameEvent, 'id' | 'timestamp'> => {
    const seasonalEvents = {
      spring: {
        title: '春季播种',
        description: '春天到了，是播种的好时节。',
        type: EventType.NOTIFICATION,
        priority: EventPriority.LOW,
        icon: '🌱',
        consequences: ['农业产出增加']
      },
      summer: {
        title: '夏季节庆',
        description: '夏至节庆让人民心情愉悦。',
        type: EventType.NOTIFICATION,
        priority: EventPriority.LOW,
        icon: '☀️',
        consequences: ['稳定度提升']
      },
      autumn: {
        title: '秋收时节',
        description: '秋天的收获让粮仓充实。',
        type: EventType.NOTIFICATION,
        priority: EventPriority.MEDIUM,
        icon: '🍂',
        consequences: ['食物储备增加']
      },
      winter: {
        title: '严冬考验',
        description: '严寒的冬天考验着文明的韧性。',
        type: EventType.CHOICE,
        priority: EventPriority.HIGH,
        icon: '❄️',
        choices: [
          {
            id: 'stockpile',
            text: '消耗储备',
            consequences: ['度过严冬', '消耗资源']
          },
          {
            id: 'trade',
            text: '寻求贸易',
            consequences: ['获得资源', '增加贸易依赖']
          }
        ]
      }
    };

    return seasonalEvents[season];
  },

  // 创建基于游戏状态的事件
  createStateBasedEvent: (gameState: any): Omit<GameEvent, 'id' | 'timestamp'> => {
    // 这里可以根据游戏状态生成相应的事件
    // 例如：人口过多时触发住房危机，资源不足时触发贸易机会等
    
    if (gameState?.population > 1000) {
      return {
        title: '人口增长压力',
        description: '快速增长的人口给城市基础设施带来了压力。',
        type: EventType.CHOICE,
        priority: EventPriority.MEDIUM,
        icon: '🏘️',
        choices: [
          {
            id: 'expand',
            text: '扩建城市',
            consequences: ['增加住房', '消耗建筑资源']
          },
          {
            id: 'control',
            text: '控制人口',
            consequences: ['稳定人口', '可能降低稳定度']
          }
        ]
      };
    }

    // 默认返回一个通用事件
    return EventGenerator.createRandomEvent();
  }
};

// 事件效果处理器
export const EventEffectHandler = {
  // 应用事件效果到游戏状态
  applyEventEffects: (consequences: string[], gameState: any) => {
    // 这里实现事件后果对游戏状态的影响
    // 例如：增加资源、改变稳定度、解锁新建筑等
    
    const effects: any = {};
    
    consequences.forEach(consequence => {
      if (consequence.includes('食物产量')) {
        const match = consequence.match(/([+-]?\d+)%/);
        if (match) {
          effects.foodProductionBonus = parseInt(match[1]);
        }
      }
      
      if (consequence.includes('稳定度')) {
        const match = consequence.match(/([+-]?\d+)/);
        if (match) {
          effects.stabilityChange = parseInt(match[1]);
        }
      }
      
      if (consequence.includes('金币')) {
        effects.goldChange = consequence.includes('获得') ? 100 : -50;
      }
    });
    
    return effects;
  },

  // 检查事件触发条件
  checkEventTriggerConditions: (gameState: any): boolean => {
    // 检查是否满足触发新事件的条件
    // 例如：时间间隔、游戏状态、随机概率等
    
    const lastEventTime = gameState?.lastEventTime || 0;
    const now = Date.now();
    const timeSinceLastEvent = now - lastEventTime;
    
    // 至少间隔5分钟才能触发新的随机事件
    if (timeSinceLastEvent < 5 * 60 * 1000) {
      return false;
    }
    
    // 10%的概率触发新事件
    return Math.random() < 0.1;
  }
};