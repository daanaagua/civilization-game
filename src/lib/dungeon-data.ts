import { DiscoveredLocation, EnemyUnit, ResourceCost } from '../types/military';

// 地下城数据配置
export interface DungeonData {
  id: string;
  name: string;
  description: string;
  difficulty: number; // 1-10
  enemies: EnemyUnit[];
  rewards: ResourceCost;
  treasure?: {
    name: string;
    effect: string;
    bonus: number; // 百分比加成
  };
  unlockCondition?: string;
}

export const DUNGEONS: Record<string, DungeonData> = {
  D001: {
    id: 'D001',
    name: '哥布林洞穴',
    description: '一个被哥布林占据的小洞穴，适合新手探索',
    difficulty: 1,
    enemies: [
      { name: '哥布林斥候', count: 5, health: 10, attack: 2, morale: 5 },
      { name: '哥布林战士', count: 3, health: 20, attack: 5, morale: 8 }
    ],
    rewards: {
      currency: 50,
      food: 20
    },
    treasure: {
      name: '哥布林图腾',
      effect: '所有资源产出+1%',
      bonus: 1
    }
  },

  D002: {
    id: 'D002',
    name: '废弃矿井',
    description: '曾经繁荣的矿井，现在被不死生物占据',
    difficulty: 2,
    enemies: [
      { name: '矿工僵尸', count: 8, health: 15, attack: 3, morale: 6 },
      { name: '腐烂食尸鬼', count: 2, health: 25, attack: 7, morale: 10 }
    ],
    rewards: {
      iron: 30,
      currency: 40
    },
    treasure: {
      name: '生锈的矿镐',
      effect: '铁矿产出+1%',
      bonus: 1
    }
  },

  D003: {
    id: 'D003',
    name: '蜘蛛巢穴',
    description: '巨型蜘蛛的栖息地，充满了毒液和蛛网',
    difficulty: 2,
    enemies: [
      { name: '小蜘蛛', count: 10, health: 8, attack: 1, morale: 4 },
      { name: '巨型毒蛛', count: 1, health: 50, attack: 10, morale: 15 }
    ],
    rewards: {
      leather: 20,
      currency: 30
    },
    treasure: {
      name: '蜘蛛毒囊',
      effect: '部队伤害+1%',
      bonus: 1
    }
  },

  D004: {
    id: 'D004',
    name: '狼人森林',
    description: '月圆之夜，狼人在此出没',
    difficulty: 3,
    enemies: [
      { name: '幼年狼人', count: 6, health: 18, attack: 4, morale: 7 },
      { name: '成年狼人', count: 4, health: 30, attack: 8, morale: 12 }
    ],
    rewards: {
      leather: 25,
      food: 30
    },
    treasure: {
      name: '狼牙项链',
      effect: '部队士气+1%',
      bonus: 1
    }
  },

  D005: {
    id: 'D005',
    name: '盗匪营地',
    description: '臭名昭著的盗匪团伙的据点',
    difficulty: 3,
    enemies: [
      { name: '盗匪弓箭手', count: 7, health: 22, attack: 6, morale: 9 },
      { name: '盗匪头目', count: 1, health: 60, attack: 12, morale: 20 }
    ],
    rewards: {
      currency: 70,
      tools: 15
    },
    treasure: {
      name: '盗匪的藏宝图',
      effect: '货币产出+1%',
      bonus: 1
    }
  },

  D015: {
    id: 'D015',
    name: '亡灵法师塔',
    description: '强大的亡灵法师居住的高塔，充满了黑暗魔法',
    difficulty: 8,
    enemies: [
      { name: '骷髅兵', count: 15, health: 20, attack: 6, morale: 8 },
      { name: '僵尸', count: 10, health: 25, attack: 7, morale: 9 },
      { name: '亡灵法师', count: 1, health: 90, attack: 20, morale: 35 }
    ],
    rewards: {
      currency: 200,
      iron: 50
    },
    treasure: {
      name: '亡灵之书',
      effect: '所有部队伤害+2%',
      bonus: 2
    },
    unlockCondition: 'advanced_magic'
  },

  D020: {
    id: 'D020',
    name: '龙穴',
    description: '传说中的巨龙栖息地，危险但奖励丰厚',
    difficulty: 9,
    enemies: [
      { name: '幼龙', count: 2, health: 70, attack: 18, morale: 30 },
      { name: '巨龙', count: 1, health: 150, attack: 35, morale: 50 }
    ],
    rewards: {
      currency: 500,
      iron: 100,
      leather: 50
    },
    treasure: {
      name: '龙之心',
      effect: '所有资源产出+5%',
      bonus: 5
    },
    unlockCondition: 'dragon_lore'
  },

  D030: {
    id: 'D030',
    name: '世界之核',
    description: '世界的中心，最终的挑战',
    difficulty: 10,
    enemies: [
      { name: '守护者', count: 25, health: 100, attack: 30, morale: 50 },
      { name: '核心守卫', count: 15, health: 120, attack: 35, morale: 60 },
      { name: '世界意志化身', count: 1, health: 500, attack: 100, morale: 150 }
    ],
    rewards: {
      currency: 1000,
      iron: 200,
      tools: 100
    },
    treasure: {
      name: '创世之石',
      effect: '所有产出+10%',
      bonus: 10
    },
    unlockCondition: 'world_core_access'
  }
};

// 随机事件数据
export interface RandomEvent {
  id: string;
  name: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
  effects: {
    resources?: ResourceCost;
    population?: number;
    morale?: number;
  };
  probability: number; // 0-100
}

export const RANDOM_EVENTS: RandomEvent[] = [
  {
    id: 'merchant_caravan',
    name: '商队到访',
    description: '一支友好的商队经过你的领地，愿意进行贸易',
    type: 'positive',
    effects: {
      resources: { currency: 50, food: 20 }
    },
    probability: 15
  },
  {
    id: 'wild_animals',
    name: '野兽袭击',
    description: '一群野兽袭击了你的探索队伍',
    type: 'negative',
    effects: {
      population: -1,
      morale: -5
    },
    probability: 10
  },
  {
    id: 'ancient_ruins',
    name: '古代遗迹',
    description: '发现了一处古代遗迹，获得了一些有价值的物品',
    type: 'positive',
    effects: {
      resources: { currency: 30, tools: 5 }
    },
    probability: 8
  },
  {
    id: 'friendly_tribe',
    name: '友好部落',
    description: '遇到了一个友好的部落，他们愿意分享资源',
    type: 'positive',
    effects: {
      resources: { food: 40, wood: 20 }
    },
    probability: 12
  },
  {
    id: 'lost_explorer',
    name: '迷路的探索者',
    description: '你的探索者在野外迷路了，花费了额外的时间和资源',
    type: 'negative',
    effects: {
      resources: { food: -10 },
      morale: -3
    },
    probability: 15
  }
];

// 其他国家数据
export interface NationData {
  id: string;
  name: string;
  description: string;
  relationship: 'neutral' | 'friendly' | 'hostile';
  strength: number; // 1-10
  tradeGoods: ResourceCost;
  diplomaticOptions: string[];
}

export const NATIONS: Record<string, NationData> = {
  forest_elves: {
    id: 'forest_elves',
    name: '森林精灵',
    description: '居住在深林中的神秘种族，擅长弓箭和魔法',
    relationship: 'neutral',
    strength: 6,
    tradeGoods: {
      wood: 50,
      leather: 30
    },
    diplomaticOptions: ['贸易协定', '军事同盟', '文化交流']
  },
  mountain_dwarves: {
    id: 'mountain_dwarves',
    name: '山地矮人',
    description: '居住在山脉中的矮人族，精通锻造和采矿',
    relationship: 'friendly',
    strength: 7,
    tradeGoods: {
      iron: 40,
      tools: 25,
      stone: 60
    },
    diplomaticOptions: ['贸易协定', '技术交流', '矿权协议']
  },
  orc_tribes: {
    id: 'orc_tribes',
    name: '兽人部落',
    description: '好战的兽人部落，经常进行掠夺',
    relationship: 'hostile',
    strength: 8,
    tradeGoods: {
      leather: 20,
      food: 30
    },
    diplomaticOptions: ['停战协议', '贡品', '决战']
  }
};

// 获取可用地下城
export const getAvailableDungeons = (unlockedTechs: string[]): DungeonData[] => {
  return Object.values(DUNGEONS).filter(dungeon => {
    if (!dungeon.unlockCondition) return true;
    return unlockedTechs.includes(dungeon.unlockCondition);
  });
};

// 获取随机事件
export const getRandomEvent = (): RandomEvent | null => {
  const roll = Math.random() * 100;
  let cumulativeProbability = 0;
  
  for (const event of RANDOM_EVENTS) {
    cumulativeProbability += event.probability;
    if (roll <= cumulativeProbability) {
      return event;
    }
  }
  
  return null;
};

// 获取地下城信息
export const getDungeon = (id: string): DungeonData | undefined => {
  return DUNGEONS[id];
};

// 获取地下城信息（别名）
export const getDungeonById = (id: string): DungeonData | undefined => {
  return DUNGEONS[id];
};

// 获取国家信息
export const getNation = (id: string): NationData | undefined => {
  return NATIONS[id];
};

// 获取国家信息（别名）
export const getCountryById = (id: string): NationData | undefined => {
  return NATIONS[id];
};