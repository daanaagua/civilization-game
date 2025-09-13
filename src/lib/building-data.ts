// 建筑数据配置

import { BuildingDefinition } from '../types/building';

// 建筑数据配置
export const BUILDING_DEFINITIONS: Record<string, BuildingDefinition> = {
  // ===== 居住类建筑 =====
  housing: {
    id: 'housing',
    name: '住房',
    description: '基础住房，提供人口容量',
    category: 'housing',
    cost: { wood: 60, stone: 40, tools: 20 },
    buildTime: 30,
    maxWorkers: 0,
    effects: [
      {
        type: 'population_capacity',
        target: 'population',
        value: 2,
        description: '+2人口上限'
      }
    ]
  },

  large_housing: {
    id: 'large_housing',
    name: '大型住房',
    description: '更大的住房，提供更多人口容量',
    category: 'housing',
    cost: { wood: 120, stone: 80, tools: 50, cloth: 30 },
    buildTime: 50,
    maxWorkers: 0,
    effects: [
      {
        type: 'population_capacity',
        target: 'population',
        value: 4,
        description: '+4人口上限'
      }
    ]
  },

  // ===== 生产类建筑 =====
  farm: {
    id: 'farm',
    name: '农田',
    description: '种植作物，生产食物',
    category: 'production',
    cost: { wood: 50, stone: 30, tools: 10 },
    buildTime: 15,
    requiredTechnology: 'basic_agriculture',
    maxWorkers: 1,
    production: [
      {
        resource: 'food',
        baseRate: 0.1
      }
    ]
  },

  logging_camp: {
    id: 'logging_camp',
    name: '伐木场',
    description: '砍伐树木，生产木材',
    category: 'production',
    cost: { wood: 60, stone: 45, tools: 15 },
    buildTime: 20,
    requiredTechnology: 'logging',
    maxWorkers: 1,
    production: [
      {
        resource: 'wood',
        baseRate: 0.1
      }
    ]
  },

  quarry: {
    id: 'quarry',
    name: '采石场',
    description: '开采石料',
    category: 'production',
    cost: { wood: 90, stone: 75, tools: 25 },
    buildTime: 30,
    requiredTechnology: 'quarrying',
    maxWorkers: 1,
    production: [
      {
        resource: 'stone',
        baseRate: 0.1
      }
    ]
  },

  workshop: {
    id: 'workshop',
    name: '工坊',
    description: '制作工具和器具',
    category: 'production',
    cost: { wood: 120, stone: 90, tools: 30 },
    buildTime: 35,
    requiredTechnology: 'tool_making',
    maxWorkers: 1,
    production: [
      {
        resource: 'tools',
        baseRate: 0.02
      }
    ]
  },

  hunting_camp: {
    id: 'hunting_camp',
    name: '狩猎营地',
    description: '狩猎野生动物，获取食物',
    category: 'production',
    cost: { wood: 18, stone: 8 },
    buildTime: 60,
    requiredTechnology: 'primitive_hunting',
    maxWorkers: 1,
    production: [
      {
        resource: 'food',
        baseRate: 0.08
      }
    ]
  },

  pasture: {
    id: 'pasture',
    name: '牧场',
    description: '饲养家畜',
    category: 'production',
    cost: { wood: 25, stone: 15, food: 5 },
    buildTime: 240,
    requiredTechnology: 'primitive_animal_husbandry',
    maxWorkers: 1,
    production: [
      {
        resource: 'livestock',
        baseRate: 0.05
      }
    ]
  },

  weaving_workshop: {
    id: 'weaving_workshop',
    name: '织布坊',
    description: '生产布料',
    category: 'production',
    cost: { wood: 50, stone: 35, tools: 25, cloth: 15 },
    buildTime: 35,
    maxWorkers: 1,
    production: [
      {
        resource: 'cloth',
        baseRate: 0.8
      }
    ]
  },

  armory: {
    id: 'armory',
    name: '武库',
    description: '制造武器',
    category: 'production',
    cost: { wood: 60, stone: 45, tools: 30, copper: 20 },
    buildTime: 40,
    requiredTechnology: 'primitive_weapons',
    maxWorkers: 1,
    production: [
      {
        resource: 'weapons',
        baseRate: 0.6
      }
    ]
  },

  copper_mine: {
    id: 'copper_mine',
    name: '铜矿场',
    description: '开采铜矿',
    category: 'production',
    cost: { wood: 100, stone: 80, tools: 50 },
    buildTime: 45,
    requiredTechnology: 'bronze_smelting',
    maxWorkers: 1,
    production: [
      {
        resource: 'copper',
        baseRate: 0.6
      }
    ]
  },

  copper_smelter: {
    id: 'copper_smelter',
    name: '铜冶炼厂',
    description: '冶炼铜矿石',
    category: 'production',
    cost: { wood: 120, stone: 100, tools: 60, copper: 40 },
    buildTime: 55,
    requiredTechnology: 'bronze_smelting',
    maxWorkers: 1,
    production: [
      {
        resource: 'copper',
        baseRate: 1.2
      }
    ]
  },

  iron_mine: {
    id: 'iron_mine',
    name: '铁矿场',
    description: '开采铁矿',
    category: 'production',
    cost: { wood: 250, stone: 200, tools: 150, copper: 120 },
    buildTime: 100,
    requiredTechnology: 'iron_smelting',
    maxWorkers: 1,
    production: [
      {
        resource: 'iron',
        baseRate: 0.4
      }
    ]
  },

  iron_smelter: {
    id: 'iron_smelter',
    name: '铁冶炼厂',
    description: '冶炼铁矿石',
    category: 'production',
    cost: { wood: 300, stone: 250, tools: 200, copper: 150, iron: 80 },
    buildTime: 120,
    requiredTechnology: 'iron_smelting',
    maxWorkers: 1,
    production: [
      {
        resource: 'iron',
        baseRate: 1.0
      }
    ]
  },

  stable: {
    id: 'stable',
    name: '马厩',
    description: '驯养马匹',
    category: 'production',
    cost: { wood: 160, stone: 100, tools: 80, cloth: 40 },
    buildTime: 65,
    requiredTechnology: 'horse_taming',
    maxWorkers: 1,
    production: [
      {
        resource: 'horses',
        baseRate: 0.2
      }
    ]
  },

  crystal_mine: {
    id: 'crystal_mine',
    name: '水晶矿场',
    description: '开采神秘水晶',
    category: 'production',
    cost: { wood: 200, stone: 150, tools: 100, crystal: 50 },
    buildTime: 90,
    requiredTechnology: 'crystal_exploration',
    maxWorkers: 1,
    production: [
      {
        resource: 'crystal',
        baseRate: 0.3
      }
    ]
  },

  crystal_workshop: {
    id: 'crystal_workshop',
    name: '水晶工坊',
    description: '加工水晶',
    category: 'production',
    cost: { wood: 250, stone: 200, tools: 150, crystal: 100 },
    buildTime: 100,
    requiredTechnology: 'crystal_processing',
    maxWorkers: 1,
    production: [
      {
        resource: 'crystal',
        baseRate: 0.8
      }
    ]
  },

  // ===== 储存类建筑 =====
  storage_pit: {
    id: 'storage_pit',
    name: '储存点',
    description: '基础资源储存设施',
    category: 'storage',
    cost: { wood: 80, stone: 60, tools: 30 },
    buildTime: 40,
    requiredTechnology: 'storage',
    maxWorkers: 0,
    buildLimit: {
      type: 'population_based',
      populationRatio: 10
    },
    storage: [
      {
        resource: 'all',
        capacity: 50,
        isPercentage: true
      }
    ]
  },

  wood_warehouse: {
    id: 'wood_warehouse',
    name: '木材仓库',
    description: '专门储存木材',
    category: 'storage',
    cost: { wood: 120, stone: 80, tools: 40 },
    buildTime: 50,
    maxWorkers: 0,
    buildLimit: {
      type: 'population_based',
      baseLimit: 1,
      populationRatio: 50
    },
    storage: [
      {
        resource: 'wood',
        capacity: 200
      }
    ]
  },

  stone_warehouse: {
    id: 'stone_warehouse',
    name: '石料仓库',
    description: '专门储存石料',
    category: 'storage',
    cost: { wood: 100, stone: 120, tools: 40 },
    buildTime: 50,
    maxWorkers: 0,
    buildLimit: {
      type: 'population_based',
      baseLimit: 1,
      populationRatio: 50
    },
    storage: [
      {
        resource: 'stone',
        capacity: 200
      }
    ]
  },

  tool_warehouse: {
    id: 'tool_warehouse',
    name: '工具仓库',
    description: '专门储存工具',
    category: 'storage',
    cost: { wood: 150, stone: 100, tools: 60 },
    buildTime: 55,
    maxWorkers: 0,
    buildLimit: {
      type: 'population_based',
      baseLimit: 1,
      populationRatio: 50
    },
    storage: [
      {
        resource: 'tools',
        capacity: 150
      }
    ]
  },

  food_warehouse: {
    id: 'food_warehouse',
    name: '食物仓库',
    description: '专门储存食物',
    category: 'storage',
    cost: { wood: 100, stone: 80, tools: 30 },
    buildTime: 45,
    maxWorkers: 0,
    buildLimit: {
      type: 'population_based',
      baseLimit: 1,
      populationRatio: 50
    },
    storage: [
      {
        resource: 'food',
        capacity: 250
      }
    ]
  },

  cloth_warehouse: {
    id: 'cloth_warehouse',
    name: '布革仓库',
    description: '专门储存布革',
    category: 'storage',
    cost: { wood: 80, stone: 60, tools: 40, cloth: 30 },
    buildTime: 45,
    maxWorkers: 0,
    buildLimit: {
      type: 'population_based',
      baseLimit: 1,
      populationRatio: 50
    },
    storage: [
      {
        resource: 'cloth',
        capacity: 150
      }
    ]
  },

  weapon_warehouse: {
    id: 'weapon_warehouse',
    name: '武器库',
    description: '专门储存武器',
    category: 'storage',
    cost: { wood: 100, stone: 80, tools: 50, weapons: 40 },
    buildTime: 60,
    maxWorkers: 0,
    buildLimit: {
      type: 'population_based',
      baseLimit: 1,
      populationRatio: 50
    },
    storage: [
      {
        resource: 'weapons',
        capacity: 200
      }
    ]
  },

  copper_warehouse: {
    id: 'copper_warehouse',
    name: '铜仓库',
    description: '专门储存铜',
    category: 'storage',
    cost: { wood: 120, stone: 100, tools: 50, copper: 30 },
    buildTime: 50,
    maxWorkers: 0,
    buildLimit: {
      type: 'population_based',
      baseLimit: 1,
      populationRatio: 50
    },
    storage: [
      {
        resource: 'copper',
        capacity: 50
      }
    ]
  },

  iron_warehouse: {
    id: 'iron_warehouse',
    name: '铁仓库',
    description: '专门储存铁',
    category: 'storage',
    cost: { wood: 250, stone: 200, tools: 150, iron: 100 },
    buildTime: 80,
    maxWorkers: 0,
    buildLimit: {
      type: 'population_based',
      baseLimit: 1,
      populationRatio: 50
    },
    storage: [
      {
        resource: 'iron',
        capacity: 50
      }
    ]
  },

  livestock_pen: {
    id: 'livestock_pen',
    name: '畜棚',
    description: '专门储存家畜',
    category: 'storage',
    cost: { wood: 120, stone: 80, tools: 50, livestock: 20 },
    buildTime: 50,
    maxWorkers: 0,
    buildLimit: {
      type: 'population_based',
      baseLimit: 1,
      populationRatio: 50
    },
    storage: [
      {
        resource: 'livestock',
        capacity: 150
      }
    ]
  },

  stable_expansion: {
    id: 'stable_expansion',
    name: '马厩扩建',
    description: '增加马匹储存容量',
    category: 'storage',
    cost: { wood: 200, stone: 150, tools: 100, cloth: 80, horses: 30 },
    buildTime: 70,
    maxWorkers: 0,
    buildLimit: {
      type: 'population_based',
      baseLimit: 1,
      populationRatio: 50
    },
    storage: [
      {
        resource: 'horses',
        capacity: 100
      }
    ]
  },

  crystal_warehouse: {
    id: 'crystal_warehouse',
    name: '水晶仓库',
    description: '专门储存水晶',
    category: 'storage',
    cost: { wood: 300, stone: 250, tools: 200, crystal: 150 },
    buildTime: 110,
    maxWorkers: 0,
    buildLimit: {
      type: 'population_based',
      baseLimit: 1,
      populationRatio: 50
    },
    storage: [
      {
        resource: 'crystal',
        capacity: 200
      }
    ]
  },

  research_warehouse: {
    id: 'research_warehouse',
    name: '研究点仓库',
    description: '专门储存研究点',
    category: 'storage',
    cost: { wood: 200, stone: 150, tools: 100, researchPoints: 500 },
    buildTime: 80,
    maxWorkers: 0,
    buildLimit: {
      type: 'population_based',
      baseLimit: 1,
      populationRatio: 50
    },
    storage: [
      {
        resource: 'researchPoints',
        capacity: 1000
      }
    ]
  },

  treasury: {
    id: 'treasury',
    name: '金库',
    description: '专门储存货币',
    category: 'storage',
    cost: { wood: 200, stone: 150, tools: 100, copper: 80, currency: 50 },
    buildTime: 70,
    maxWorkers: 0,
    buildLimit: {
      type: 'population_based',
      baseLimit: 1,
      populationRatio: 50
    },
    storage: [
      {
        resource: 'currency',
        capacity: 200
      }
    ]
  },

  relic_vault: {
    id: 'relic_vault',
    name: '圣物库',
    description: '专门储存信仰',
    category: 'storage',
    cost: { wood: 150, stone: 200, tools: 80, faith: 60 },
    buildTime: 75,
    maxWorkers: 0,
    buildLimit: {
      type: 'population_based',
      baseLimit: 1,
      populationRatio: 50
    },
    storage: [
      {
        resource: 'faith',
        capacity: 100
      }
    ]
  },

  magic_reservoir: {
    id: 'magic_reservoir',
    name: '魔力储备设施',
    description: '储存和增强魔力',
    category: 'storage',
    cost: { wood: 400, stone: 350, tools: 250, magic: 100 },
    buildTime: 120,
    maxWorkers: 0,
    buildLimit: {
      type: 'population_based',
      baseLimit: 1,
      populationRatio: 50
    },
    storage: [
      {
        resource: 'magic',
        capacity: 150
      }
    ],
    specialEffects: [
      {
        type: 'research_speed',
        value: 10,
        description: '+10%魔力上限'
      }
    ]
  },

  // ===== 功能建筑 =====
  council_hall: {
    id: 'council_hall',
    name: '议事厅',
    description: '提升稳定度',
    category: 'functional',
    cost: { wood: 80, stone: 60, tools: 40, copper: 25 },
    buildTime: 50,
    maxWorkers: 0,
    buildLimit: {
      type: 'fixed',
      baseLimit: 1
    },
    specialEffects: [
      {
        type: 'stability',
        value: 3,
        description: '+3稳定度/天'
      }
    ]
  },

  administration: {
    id: 'administration',
    name: '行政部门',
    description: '管理文明事务',
    category: 'functional',
    cost: { wood: 150, stone: 120, tools: 80, copper: 60 },
    buildTime: 60,
    maxWorkers: 1,
    production: [
      {
        resource: 'currency',
        baseRate: 1
      }
    ],
    specialEffects: [
      {
        type: 'stability',
        value: 1,
        description: '+1稳定度/天（每官吏）'
      }
    ]
  },

  library: {
    id: 'library',
    name: '图书馆',
    description: '提升研究速度',
    category: 'functional',
    cost: { wood: 180, stone: 120, tools: 100, copper: 80 },
    buildTime: 75,
    maxWorkers: 1,
    production: [
      {
        resource: 'researchPoints',
        baseRate: 1
      }
    ],
    specialEffects: [
      {
        type: 'research_speed',
        value: 50,
        description: '+50%科技研发速度'
      }
    ]
  },

  // ===== 军事建筑 =====
  stone_wall: {
    id: 'stone_wall',
    name: '石墙',
    description: '提供防御',
    category: 'military',
    cost: { stone: 200, tools: 100, copper: 50 },
    buildTime: 80,
    maxWorkers: 0,
    buildLimit: {
      type: 'fixed',
      baseLimit: 4
    },
    specialEffects: [
      {
        type: 'stability',
        value: 5,
        description: '+5稳定度'
      },
      {
        type: 'defense',
        value: 2,
        description: '+2防御力'
      }
    ]
  },

  barracks: {
    id: 'barracks',
    name: '军营',
    description: '训练军队',
    category: 'military',
    cost: { wood: 200, stone: 150, tools: 120, weapons: 100 },
    buildTime: 70,
    maxWorkers: 1,
    buildLimit: {
      type: 'fixed',
      baseLimit: 2
    },
    specialEffects: [
      {
        type: 'stability',
        value: 3,
        description: '+3稳定度'
      }
    ]
  },

  fortress: {
    id: 'fortress',
    name: '要塞',
    description: '强大的防御工事',
    category: 'military',
    cost: { stone: 400, tools: 200, copper: 100, iron: 50 },
    buildTime: 100,
    maxWorkers: 0,
    buildLimit: {
      type: 'fixed',
      baseLimit: 1
    },
    specialEffects: [
      {
        type: 'stability',
        value: 10,
        description: '+10稳定度'
      },
      {
        type: 'defense',
        value: 5,
        description: '+5防御力'
      }
    ]
  },

  // ===== 文化建筑 =====
  primitive_temple: {
    id: 'primitive_temple',
    name: '原始神庙',
    description: '提供信仰和稳定度',
    category: 'cultural',
    cost: { wood: 150, stone: 200, tools: 80, copper: 60 },
    buildTime: 90,
    maxWorkers: 1,
    production: [
      {
        resource: 'faith',
        baseRate: 1
      }
    ],
    specialEffects: [
      {
        type: 'stability',
        value: 2,
        description: '+2稳定度/天'
      }
    ]
  },

  palace: {
    id: 'palace',
    name: '宫殿',
    description: '君主制的权力中心',
    category: 'cultural',
    cost: { wood: 500, stone: 400, tools: 200, copper: 100, iron: 50 },
    buildTime: 150,
    maxWorkers: 0,
    buildLimit: {
      type: 'fixed',
      baseLimit: 1
    },
    specialEffects: [
      {
        type: 'stability',
        value: 25,
        description: '+25稳定度'
      }
    ]
  }
};

// 建筑分类配置
export const BUILDING_CATEGORIES = {
  housing: {
    name: '居住建筑',
    description: '提供人口容量',
    color: 'bg-blue-500'
  },
  production: {
    name: '生产建筑',
    description: '生产各种资源',
    color: 'bg-green-500'
  },
  storage: {
    name: '储存建筑',
    description: '增加资源储存容量',
    color: 'bg-yellow-500'
  },
  functional: {
    name: '功能建筑',
    description: '提供特殊功能',
    color: 'bg-purple-500'
  },
  military: {
    name: '军事建筑',
    description: '提供防御和军事功能',
    color: 'bg-red-500'
  },
  cultural: {
    name: '文化建筑',
    description: '提供文化和信仰功能',
    color: 'bg-indigo-500'
  }
};

// 获取建筑定义
export function getBuildingDefinition(buildingId: string): BuildingDefinition | undefined {
  return BUILDING_DEFINITIONS[buildingId];
}

// 获取分类下的所有建筑
export function getBuildingsByCategory(category: string): BuildingDefinition[] {
  return Object.values(BUILDING_DEFINITIONS).filter(building => building.category === category);
}

// 检查建筑是否解锁
export function isBuildingUnlocked(buildingId: string, researchedTechs: Set<string>): boolean {
  const building = getBuildingDefinition(buildingId);
  if (!building) return false;
  
  if (building.requiredTechnology) {
    return researchedTechs.has(building.requiredTechnology);
  }
  
  return true;
}

// 获取可用建筑列表
export function getAvailableBuildings(researchedTechs: Set<string>): BuildingDefinition[] {
  return Object.values(BUILDING_DEFINITIONS).filter(building => 
    isBuildingUnlocked(building.id, researchedTechs)
  );
}