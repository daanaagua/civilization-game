import { UnitType } from '../types/military';

// 军队单位数据配置
export const UNIT_TYPES: Record<string, UnitType> = {
  // 基础兵种
  tribal_militia: {
    id: 'tribal_militia',
    name: '部落民兵',
    description: '招募快速，成本低廉，战斗力较弱，适合防守',
    unlockCondition: 'militia_training', // 通过“民兵训练”科技解锁
    recruitmentCost: {
      food: 15,
      wood: 8,
      tools: 2
    },
    trainingTime: 10,
    maintenanceCost: {
      food: 2, // 每天
      tools: 0.5 // 每月
    },
    baseStats: {
      health: 100,
      attack: 12,
      defense: 8,
      morale: 40
    },
    combatTraits: ['快速招募', '低成本', '士气易崩'],
    category: 'basic',
    isExplorer: false
  },

  spearman: {
    id: 'spearman',
    name: '长矛手',
    description: '对骑兵有显著优势，防御阵型+3防御',
    unlockCondition: 'spear_crafting',
    recruitmentCost: {
      food: 25,
      wood: 15,
      tools: 5
    },
    trainingTime: 20,
    maintenanceCost: {
      food: 3,
      tools: 1
    },
    baseStats: {
      health: 120,
      attack: 15,
      defense: 12,
      morale: 50
    },
    combatTraits: ['反骑兵', '防御阵型'],
    category: 'basic',
    isExplorer: false
  },

  hunter: {
    id: 'hunter',
    name: '猎人',
    description: '远程攻击优势，机动性强，防御力弱',
    unlockCondition: 'hunting_skills',
    recruitmentCost: {
      food: 20,
      wood: 12,
      tools: 3
    },
    trainingTime: 15,
    maintenanceCost: {
      food: 2,
      tools: 0.8
    },
    baseStats: {
      health: 90,
      attack: 18,
      defense: 6,
      morale: 50,
      speed: 'fast'
    },
    combatTraits: ['远程攻击', '高机动'],
    category: 'basic',
    isExplorer: false
  },

  scout: {
    id: 'scout',
    name: '侦察兵',
    description: '移动速度最快，可以探索敌情，战斗力很弱',
    unlockCondition: 'scouting_tech',
    recruitmentCost: {
      food: 18,
      wood: 8,
      tools: 2
    },
    trainingTime: 12,
    maintenanceCost: {
      food: 2,
      tools: 0.5
    },
    baseStats: {
      health: 80,
      attack: 10,
      defense: 5,
      morale: 55,
      speed: 'fast'
    },
    combatTraits: ['探索', '高速移动'],
    category: 'special',
    isExplorer: true,
    explorationPointValue: 1
  },

  // 进阶兵种
  copper_spearman: {
    id: 'copper_spearman',
    name: '铜矛手',
    description: '攻防平衡，装备精良，训练有素',
    unlockCondition: 'copper_crafting',
    recruitmentCost: {
      food: 40,
      wood: 15,
      copper: 10
    },
    trainingTime: 30,
    maintenanceCost: {
      food: 2
    },
    baseStats: {
      health: 140,
      attack: 16,
      defense: 12,
      morale: 60
    },
    combatTraits: ['精良装备', '训练有素'],
    category: 'advanced',
    isExplorer: false
  },

  archer: {
    id: 'archer',
    name: '弓箭手',
    description: '射程远，精度高，持续输出能力强',
    unlockCondition: 'composite_bow',
    recruitmentCost: {
      food: 35,
      wood: 20,
      leather: 5
    },
    trainingTime: 35,
    maintenanceCost: {
      food: 1.8
    },
    baseStats: {
      health: 85,
      attack: 14,
      defense: 6,
      morale: 50
    },
    combatTraits: ['远程专精', '持续输出'],
    category: 'advanced',
    isExplorer: false
  },

  heavy_warrior: {
    id: 'heavy_warrior',
    name: '重装战士',
    description: '攻防俱佳，士气坚定，移动缓慢',
    unlockCondition: 'heavy_equipment',
    recruitmentCost: {
      food: 50,
      wood: 10,
      copper: 15,
      leather: 10
    },
    trainingTime: 45,
    maintenanceCost: {
      food: 2.5
    },
    baseStats: {
      health: 180,
      attack: 18,
      defense: 16,
      morale: 65,
      speed: 'slow'
    },
    combatTraits: ['重装甲', '坚定士气'],
    category: 'advanced',
    isExplorer: false
  },

  // 精英兵种
  light_cavalry: {
    id: 'light_cavalry',
    name: '轻骑兵',
    description: '高机动性，擅长突袭和骚扰',
    unlockCondition: 'horsemanship',
    recruitmentCost: {
      food: 70,
      iron: 5,
      horses: 1
    },
    trainingTime: 40,
    maintenanceCost: {
      food: 3.5,
      horseFeed: 1.5
    },
    baseStats: {
      health: 110,
      attack: 22,
      defense: 10,
      morale: 75,
      speed: 'fast'
    },
    combatTraits: ['骑兵冲锋', '高机动'],
    category: 'elite',
    isExplorer: false
  },

  adventurer: {
    id: 'adventurer',
    name: '冒险家',
    description: '侦察兵的升级版本，拥有更强的野外生存能力和战斗力',
    unlockCondition: 'explorer_tech',
    recruitmentCost: {
      food: 30,
      wood: 15,
      tools: 5,
      currency: 20
    },
    trainingTime: 20,
    maintenanceCost: {
      food: 3,
      tools: 1
    },
    baseStats: {
      health: 100,
      attack: 15,
      defense: 8,
      morale: 70,
      speed: 'fast'
    },
    combatTraits: ['野外生存', '探索专精', '领导力'],
    category: 'special',
    isExplorer: true,
    explorationPointValue: 2
  },

  iron_warrior: {
    id: 'iron_warrior',
    name: '铁甲勇士',
    description: '精锐部队，装备最好的武器和护甲',
    unlockCondition: 'elite_training',
    recruitmentCost: {
      food: 100,
      wood: 20,
      iron: 30,
      leather: 15
    },
    trainingTime: 90,
    maintenanceCost: {
      food: 5,
      iron: 0.5
    },
    baseStats: {
      health: 200,
      attack: 32,
      defense: 28,
      morale: 80
    },
    combatTraits: ['精锐装备', '钢铁意志', '战场统帅'],
    category: 'elite',
    isExplorer: false
  }
};

// 获取所有基础兵种
export const getBasicUnits = (): UnitType[] => {
  return Object.values(UNIT_TYPES).filter(unit => unit.category === 'basic');
};

// 获取探索单位
export const getExplorerUnits = (): UnitType[] => {
  return Object.values(UNIT_TYPES).filter(unit => unit.isExplorer);
};

// 根据解锁条件获取可用兵种
export const getAvailableUnits = (unlockedTechs: string[]): UnitType[] => {
  return Object.values(UNIT_TYPES).filter(unit => {
    if (unit.unlockCondition === 'none') return true;
    return unlockedTechs.includes(unit.unlockCondition);
  });
};

// 获取兵种信息
export const getUnitType = (id: string): UnitType | undefined => {
  return UNIT_TYPES[id];
};

// 获取可用兵种类型（根据解锁条件）
export const getAvailableUnitTypes = (unlockedTechs: string[] = []): UnitType[] => {
  return Object.values(UNIT_TYPES).filter(unit => {
    if (unit.unlockCondition === 'none') return true;
    return unlockedTechs.includes(unit.unlockCondition);
  });
};