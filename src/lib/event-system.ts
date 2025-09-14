'use client';

import { GameState } from '@/types/game';
import { GameEvent, EventType, EventPriority } from '@/components/features/EventsPanel';

// 事件触发状态接口
interface EventTriggerState {
  lastDomesticEventTime: number;
  lastCharacterEventTime: Record<string, number>; // 每个人物的上次事件时间
  lastAdventureTime: number;
  discoveredDungeons: string[];
  scoutingPoints: number; // 当前侦察点数
}

// 境内随机事件定义（严格按照events.md）
const DOMESTIC_EVENTS = {
  // 丰收
  harvest: {
    id: 'harvest',
    title: '丰收',
    description: '农田产出增加',
    type: EventType.CHOICE,
    priority: EventPriority.MEDIUM,
    category: 'natural',
    choices: [
      {
        id: 'sell_surplus',
        text: '出售多余粮食',
        description: '获得200货币',
        consequences: ['currency:+200']
      },
      {
        id: 'store_food',
        text: '储存粮食',
        description: '未来三个月食物产出增加20%',
        consequences: ['food_production:+20%', 'duration:3_months']
      }
    ]
  },

  // 干旱
  drought: {
    id: 'drought',
    title: '干旱',
    description: '连续数月降雨稀少',
    type: EventType.CHOICE,
    priority: EventPriority.HIGH,
    category: 'disaster',
    choices: [
      {
        id: 'use_treasury',
        text: '动用国库安抚民心',
        description: '支出300货币',
        consequences: ['currency:-300']
      },
      {
        id: 'rationing',
        text: '实行配给制',
        description: '民众不满导致稳定度-5',
        consequences: ['stability:-5']
      }
    ]
  },

  // 春季溪流充沛
  spring_stream: {
    id: 'spring_stream',
    title: '春季溪流充沛',
    description: '融雪带来充足水源',
    type: EventType.CHOICE,
    priority: EventPriority.MEDIUM,
    category: 'natural',
    choices: [
      {
        id: 'irrigation',
        text: '疏浚河道灌溉农田',
        description: '食物产量+15%持续四个月',
        consequences: ['food_production:+15%', 'duration:4_months']
      },
      {
        id: 'water_mill',
        text: '利用急流驱动原始水磨',
        description: '工具制作速度+10%持续六个月',
        consequences: ['tool_production:+10%', 'duration:6_months']
      }
    ]
  },

  // 蝗灾肆虐
  locust_plague: {
    id: 'locust_plague',
    title: '蝗灾肆虐',
    description: '大量蝗虫吞噬农作物',
    type: EventType.CHOICE,
    priority: EventPriority.HIGH,
    category: 'disaster',
    choices: [
      {
        id: 'organize_extermination',
        text: '组织灭蝗',
        description: '消耗1空闲人力，挽回损失',
        consequences: ['idle_population:-1', 'crop_loss:prevented']
      },
      {
        id: 'herbal_smoke',
        text: '使用草药烟熏驱赶',
        description: '花费200木材',
        consequences: ['wood:-200']
      },
      {
        id: 'ignore',
        text: '不予理睬',
        description: '一年内稳定度-5',
        consequences: ['stability:-5', 'duration:1_year']
      }
    ]
  },

  // 寒潮预警
  cold_wave: {
    id: 'cold_wave',
    title: '寒潮预警',
    description: '极端低温即将来临',
    type: EventType.CHOICE,
    priority: EventPriority.HIGH,
    category: 'disaster',
    choices: [
      {
        id: 'distribute_fur',
        text: '分发兽皮御寒',
        description: '花费120布革',
        consequences: ['leather:-120']
      },
      {
        id: 'increase_fires',
        text: '增加火堆取暖',
        description: '三个月内木材生产-30%',
        consequences: ['wood_production:-30%', 'duration:3_months']
      }
    ]
  },

  // 暴雨成灾
  heavy_rain: {
    id: 'heavy_rain',
    title: '暴雨成灾',
    description: '连续强降雨引发内涝',
    type: EventType.CHOICE,
    priority: EventPriority.HIGH,
    category: 'disaster',
    choices: [
      {
        id: 'reinforce_dikes',
        text: '加固堤坝排水',
        description: '投入2人口空闲劳动力',
        consequences: ['idle_population:-2']
      },
      {
        id: 'ignore',
        text: '不予理睬',
        description: '一年内稳定度-5',
        consequences: ['stability:-5', 'duration:1_year']
      }
    ]
  },

  // 暖冬现象
  warm_winter: {
    id: 'warm_winter',
    title: '暖冬现象',
    description: '冬季气温异常偏高',
    type: EventType.CHOICE,
    priority: EventPriority.MEDIUM,
    category: 'natural',
    choices: [
      {
        id: 'expand_winter_crops',
        text: '扩大冬种面积',
        description: '食物增加{目前储存量的20%}',
        consequences: ['food:+20%_of_current']
      },
      {
        id: 'fallow_land',
        text: '休耕恢复地力',
        description: '三个月内食物产出+25%',
        consequences: ['food_production:+25%', 'duration:3_months']
      }
    ]
  },

  // 沙尘暴频发
  sandstorm: {
    id: 'sandstorm',
    title: '沙尘暴频发',
    description: '干旱地区扬尘严重',
    type: EventType.CHOICE,
    priority: EventPriority.MEDIUM,
    category: 'disaster',
    choices: [
      {
        id: 'weave_mats',
        text: '编织草席遮挡',
        description: '耗费100木材，保护作物',
        consequences: ['wood:-100', 'crop_protection:true']
      },
      {
        id: 'distribute_masks',
        text: '发放面罩',
        description: '每人消耗1单位布革',
        consequences: ['leather:-{population}']
      },
      {
        id: 'ignore',
        text: '不予理睬',
        description: '一年内稳定度-5',
        consequences: ['stability:-5', 'duration:1_year']
      }
    ]
  },

  // 渔获大增
  abundant_fish: {
    id: 'abundant_fish',
    title: '渔获大增',
    description: '水域生态良好鱼类丰富',
    type: EventType.CHOICE,
    priority: EventPriority.MEDIUM,
    category: 'natural',
    choices: [
      {
        id: 'large_scale_fishing',
        text: '大规模捕捞销售',
        description: '一次性获得250货币，但三个月内食物减产10%',
        consequences: ['currency:+250', 'food_production:-10%', 'duration:3_months']
      },
      {
        id: 'fishing_ban',
        text: '设立禁渔期养护',
        description: '三个月内食物+15%',
        consequences: ['food_production:+15%', 'duration:3_months']
      }
    ]
  },

  // 野火蔓延
  wildfire: {
    id: 'wildfire',
    title: '野火蔓延',
    description: '干燥天气引发森林火灾',
    type: EventType.CHOICE,
    priority: EventPriority.URGENT,
    category: 'disaster',
    choices: [
      {
        id: 'organize_firefighting',
        text: '组织灭火队伍',
        description: '投入1空闲人力，木材储量减少10%',
        consequences: ['idle_population:-1', 'wood:-10%']
      },
      {
        id: 'control_burn',
        text: '控制燃烧范围',
        description: '牺牲边缘林区，木材储量减少30%',
        consequences: ['wood:-30%']
      }
    ]
  },

  // 地下温泉涌现
  hot_spring: {
    id: 'hot_spring',
    title: '地下温泉涌现',
    description: '发现新的地热资源',
    type: EventType.CHOICE,
    priority: EventPriority.MEDIUM,
    category: 'discovery',
    choices: [
      {
        id: 'develop_bathing',
        text: '开发温泉沐浴',
        description: '半年内每月+40货币收入，吸引游客',
        consequences: ['currency_income:+40', 'duration:6_months']
      },
      {
        id: 'pottery_firing',
        text: '用于陶器烧制',
        description: '三个月内工具生产速度+20%',
        consequences: ['tool_production:+20%', 'duration:3_months']
      }
    ]
  },

  // 冰雹灾害
  hailstorm: {
    id: 'hailstorm',
    title: '冰雹灾害',
    description: '突发强对流天气',
    type: EventType.CHOICE,
    priority: EventPriority.HIGH,
    category: 'disaster',
    choices: [
      {
        id: 'pay_compensation',
        text: '花钱弭平灾祸',
        description: '花费200货币',
        consequences: ['currency:-200']
      },
      {
        id: 'pray',
        text: '祈祷',
        description: '祈求神明保佑，-50信仰',
        consequences: ['faith:-50']
      },
      {
        id: 'ignore',
        text: '不予理睬',
        description: '一年内稳定度-5',
        consequences: ['stability:-5', 'duration:1_year']
      }
    ]
  },

  // 候鸟迁徙路线改变
  bird_migration: {
    id: 'bird_migration',
    title: '候鸟迁徙路线改变',
    description: '候鸟迁徙路线发生变化',
    type: EventType.CHOICE,
    priority: EventPriority.LOW,
    category: 'natural',
    choices: [
      {
        id: 'build_reed_marsh',
        text: '建造人工芦苇荡吸引',
        description: '投资100木材，一年内稳定度+5',
        consequences: ['wood:-100', 'stability:+5', 'duration:1_year']
      },
      {
        id: 'hunting_opportunity',
        text: '利用机会狩猎采集',
        description: '一次性获得120食物',
        consequences: ['food:+120']
      }
    ]
  },

  // 井水干涸
  well_dry: {
    id: 'well_dry',
    title: '井水干涸',
    description: '水井干涸，面临缺水危机',
    type: EventType.CHOICE,
    priority: EventPriority.HIGH,
    category: 'disaster',
    choices: [
      {
        id: 'dig_deep_well',
        text: '集体挖掘深井',
        description: '一次性花费2空闲人口解决供水',
        consequences: ['idle_population:-2', 'water_supply:restored']
      },
      {
        id: 'water_rationing',
        text: '实施节水措施',
        description: '民众用水受限，稳定度-5',
        consequences: ['stability:-5']
      }
    ]
  }
};

// 人物相关随机事件定义（严格按照events.md）
const CHARACTER_EVENTS = {
  // 大法官遭遇夜袭
  judge_night_attack: {
    id: 'judge_night_attack',
    title: '大法官遭遇夜袭',
    description: '大法官深夜归家途中遭遇劫匪',
    type: EventType.CHOICE,
    priority: EventPriority.HIGH,
    category: 'character',
    characterRequired: 'judge',
    choices: [
      {
        id: 'fight_back',
        text: '反抗并大声呼救',
        description: '大法官武力值 + 1D6 vs 目标武力值8',
        consequences: ['dice_check:martial+1d6_vs_8']
      },
      {
        id: 'clever_escape',
        text: '智取逃离',
        description: '大法官智力值 + 1D10 vs 目标智力值7',
        consequences: ['dice_check:intelligence+1d10_vs_7']
      }
    ]
  },

  // 科研领袖发现古籍残卷
  scholar_ancient_book: {
    id: 'scholar_ancient_book',
    title: '科研领袖发现古籍残卷',
    description: '科研领袖在旧书堆中发现一本破损的古代科技手稿',
    type: EventType.CHOICE,
    priority: EventPriority.MEDIUM,
    category: 'character',
    characterRequired: 'scholar',
    choices: [
      {
        id: 'research_restore',
        text: '全力研究修复',
        description: '智力值 + 1D6 vs 修复难度9',
        consequences: ['dice_check:intelligence+1d6_vs_9']
      },
      {
        id: 'seek_help',
        text: '寻求他人帮助',
        description: '花费100货币聘请专家',
        consequences: ['currency:-100', 'guaranteed_success:true']
      }
    ]
  }
  // 注意：这里只实现了前两个人物事件作为示例，完整实现需要添加所有30个人物事件
};

// 冒险相关随机事件定义（严格按照events.md）
const ADVENTURE_EVENTS = {
  // 侦察兵失踪
  scout_missing: {
    id: 'scout_missing',
    title: '侦察兵失踪',
    description: '派出的侦察兵在边境巡逻时失去联系',
    type: EventType.NOTIFICATION,
    priority: EventPriority.HIGH,
    category: 'exploration',
    effects: {
      scouts: '-1'
    },
    requirements: {
      scouts: { min: 1 }
    }
  },

  // 发现哥布林踪迹
  goblin_tracks: {
    id: 'goblin_tracks',
    title: '发现哥布林踪迹',
    description: '侦察队在森林边缘发现新鲜的哥布林脚印',
    type: EventType.NOTIFICATION,
    priority: EventPriority.MEDIUM,
    category: 'exploration',
    effects: {
      dungeon_discovered: 'D001'
    }
  },

  // 矿工求救信号
  miner_distress: {
    id: 'miner_distress',
    title: '矿工求救信号',
    description: '收到废弃矿区方向传来的微弱求救信号',
    type: EventType.NOTIFICATION,
    priority: EventPriority.MEDIUM,
    category: 'exploration',
    effects: {
      dungeon_discovered: 'D002'
    }
  },

  // 资源发现事件
  mysterious_ore: {
    id: 'mysterious_ore',
    title: '神秘矿脉',
    description: '勘探队发现异常的矿石样本',
    type: EventType.NOTIFICATION,
    priority: EventPriority.MEDIUM,
    category: 'exploration',
    effects: {
      iron: '+50'
    }
  },

  ancient_orchard: {
    id: 'ancient_orchard',
    title: '古老果园',
    description: '废弃果园中发现仍在结果的树木',
    type: EventType.NOTIFICATION,
    priority: EventPriority.LOW,
    category: 'exploration',
    effects: {
      food: '+60'
    }
  },

  // 意外事故事件
  accidental_trap: {
    id: 'accidental_trap',
    title: '意外陷阱',
    description: '侦察队在探索时触发古老机关',
    type: EventType.NOTIFICATION,
    priority: EventPriority.HIGH,
    category: 'exploration',
    effects: {
      scouts: '-1'
    },
    requirements: {
      scouts: { min: 1 }
    }
  },

  accidental_fall: {
    id: 'accidental_fall',
    title: '意外坠落',
    description: '探险队在悬崖失足',
    type: EventType.NOTIFICATION,
    priority: EventPriority.HIGH,
    category: 'exploration',
    effects: {
      scouts: '-2'
    },
    requirements: {
      scouts: { min: 2 }
    }
  },

  poison_gas: {
    id: 'poison_gas',
    title: '毒气泄漏',
    description: '地下洞穴发现有毒气体',
    type: EventType.NOTIFICATION,
    priority: EventPriority.HIGH,
    category: 'exploration',
    effects: {
      adventurers: '-2'
    },
    requirements: {
      adventurers: { min: 2 }
    }
  },

  beast_attack: {
    id: 'beast_attack',
    title: '野兽突袭',
    description: '探险队遭遇隐藏的掠食者',
    type: EventType.NOTIFICATION,
    priority: EventPriority.HIGH,
    category: 'exploration',
    effects: {
      adventurers: '-1'
    },
    requirements: {
      adventurers: { min: 1 }
    }
  }
};

export class EventSystemManager {
  private triggerState: EventTriggerState;
  private gameState: GameState;

  constructor(gameState: GameState) {
    this.gameState = gameState;
    this.triggerState = {
      lastDomesticEventTime: 0,
      lastCharacterEventTime: {},
      lastAdventureTime: 0,
      discoveredDungeons: [],
      scoutingPoints: 0
    };
  }

  updateGameState(gameState: GameState): void {
    this.gameState = gameState;
  }

  shouldTriggerDomesticEvent(currentTime: number): boolean {
    const timeSinceLastEvent = currentTime - this.triggerState.lastDomesticEventTime;
    const minInterval = 5 * 60 * 1000; // 最少5分钟间隔
    const maxInterval = 15 * 60 * 1000; // 最多15分钟间隔
    
    if (timeSinceLastEvent < minInterval) return false;
    
    // 随机概率，时间越长概率越高
    const probability = Math.min((timeSinceLastEvent - minInterval) / (maxInterval - minInterval), 1) * 0.3;
    return Math.random() < probability;
  }

  shouldTriggerCharacterEvent(characterId: string, currentTime: number): boolean {
    const lastEventTime = this.triggerState.lastCharacterEventTime[characterId] || 0;
    const timeSinceLastEvent = currentTime - lastEventTime;
    const minInterval = 10 * 60 * 1000; // 最少10分钟间隔
    
    if (timeSinceLastEvent < minInterval) return false;
    
    // 人物事件概率较低
    return Math.random() < 0.1;
  }

  shouldTriggerAdventureEvent(currentTime: number): boolean {
    // 只有在有侦察兵或冒险家进行冒险时才可能触发
    const hasActiveAdventure = this.gameState.characters?.some(char => 
      (char.type === 'scout' || char.type === 'adventurer') && char.isActive
    );
    
    if (!hasActiveAdventure) return false;
    
    const timeSinceLastEvent = currentTime - this.triggerState.lastAdventureTime;
    const minInterval = 3 * 60 * 1000; // 最少3分钟间隔
    
    if (timeSinceLastEvent < minInterval) return false;
    
    return Math.random() < 0.2;
  }

  generateDomesticEvent(): GameEvent | null {
    const availableEvents = Object.values(DOMESTIC_EVENTS);
    const randomEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    
    if (this.checkEventRequirements(randomEvent.requirements)) {
      this.triggerState.lastDomesticEventTime = Date.now();
      return {
        ...randomEvent,
        id: `${randomEvent.id}_${Date.now()}`,
        timestamp: Date.now(),
        isRead: false,
        isResolved: false
      };
    }
    
    return null;
  }

  generateCharacterEvent(characterId: string): GameEvent | null {
    const availableEvents = Object.values(CHARACTER_EVENTS).filter(event => 
      !event.characterRequired || event.characterRequired === characterId
    );
    
    if (availableEvents.length === 0) return null;
    
    const randomEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    
    if (this.checkEventRequirements(randomEvent.requirements)) {
      this.triggerState.lastCharacterEventTime[characterId] = Date.now();
      return {
        ...randomEvent,
        id: `${randomEvent.id}_${Date.now()}`,
        timestamp: Date.now(),
        isRead: false,
        isResolved: false
      };
    }
    
    return null;
  }

  generateAdventureEvent(): GameEvent | null {
    const availableEvents = Object.values(ADVENTURE_EVENTS);
    const randomEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    
    if (this.checkEventRequirements(randomEvent.requirements)) {
      this.triggerState.lastAdventureTime = Date.now();
      return {
        ...randomEvent,
        id: `${randomEvent.id}_${Date.now()}`,
        timestamp: Date.now(),
        isRead: false,
        isResolved: randomEvent.type === EventType.NOTIFICATION
      };
    }
    
    return null;
  }

  private checkEventRequirements(requirements?: any): boolean {
    if (!requirements) return true;
    
    // 检查人口要求
    if (requirements.population) {
      const population = this.gameState.resources.population;
      if (requirements.population.min && population < requirements.population.min) return false;
      if (requirements.population.max && population > requirements.population.max) return false;
    }
    
    // 检查资源要求
    if (requirements.resources) {
      for (const [resource, requirement] of Object.entries(requirements.resources)) {
        const amount = this.gameState.resources[resource as keyof typeof this.gameState.resources];
        if (typeof amount === 'number') {
          if (requirement.min && amount < requirement.min) return false;
          if (requirement.max && amount > requirement.max) return false;
        }
      }
    }
    
    // 检查侦察兵/冒险家要求
    if (requirements.scouts) {
      const scouts = this.gameState.characters?.filter(char => char.type === 'scout').length || 0;
      if (requirements.scouts.min && scouts < requirements.scouts.min) return false;
    }
    
    if (requirements.adventurers) {
      const adventurers = this.gameState.characters?.filter(char => char.type === 'adventurer').length || 0;
      if (requirements.adventurers.min && adventurers < requirements.adventurers.min) return false;
    }
    
    return true;
  }

  checkAndGenerateEvents(): GameEvent[] {
    const currentTime = Date.now();
    const newEvents: GameEvent[] = [];
    
    // 检查境内事件
    if (this.shouldTriggerDomesticEvent(currentTime)) {
      const event = this.generateDomesticEvent();
      if (event) newEvents.push(event);
    }
    
    // 检查人物事件
    if (this.gameState.characters) {
      for (const character of this.gameState.characters) {
        if (this.shouldTriggerCharacterEvent(character.id, currentTime)) {
          const event = this.generateCharacterEvent(character.type);
          if (event) newEvents.push(event);
        }
      }
    }
    
    // 检查冒险事件
    if (this.shouldTriggerAdventureEvent(currentTime)) {
      const event = this.generateAdventureEvent();
      if (event) newEvents.push(event);
    }
    
    return newEvents;
  }

  getTriggerState(): EventTriggerState {
    return { ...this.triggerState };
  }

  setTriggerState(state: Partial<EventTriggerState>): void {
    this.triggerState = { ...this.triggerState, ...state };
  }
}

export function createEventSystem(gameState: GameState): EventSystemManager {
  return new EventSystemManager(gameState);
}