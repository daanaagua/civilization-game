import { Technology, TechnologyCategory } from '../types/game';

// 科技数据配置
export const TECHNOLOGIES: Record<string, Technology> = {
  // 2.1 生产科技
  fire: {
    id: 'fire',
    name: '生火',
    description: '掌握火的使用，提高食物效率并减少腐烂',
    category: 'production',
    cost: { wood: 10 },
    researchTime: 20,
    requires: [],
    unlocks: [
      { type: 'building', id: 'housing', name: '住房' }
    ],
    effects: [
      { type: 'resource_production_bonus', target: 'food', value: 10, description: '+10%食物效率' },
      { type: 'resource_storage_bonus', target: 'food', value: -5, description: '-5%食物腐烂' }
    ],
    unlocked: true,
    researched: false
  },

  logging: {
    id: 'logging',
    name: '伐木',
    description: '学会有效砍伐树木，解锁伐木场',
    category: 'production',
    cost: { wood: 12 },
    researchTime: 30,
    requires: ['fire'],
    unlocks: [
      { type: 'building', id: 'logging_camp', name: '伐木场' },
      { type: 'character', id: 'lumberjack', name: '伐木工' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  quarrying: {
    id: 'quarrying',
    name: '采石',
    description: '学会开采石料，解锁采石场',
    category: 'production',
    cost: { wood: 15 },
    researchTime: 30,
    requires: ['fire'],
    unlocks: [
      { type: 'building', id: 'quarry', name: '采石场' },
      { type: 'character', id: 'quarryman', name: '采石工' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  storage: {
    id: 'storage',
    name: '储存',
    description: '建造储存设施，增加资源储存上限',
    category: 'production',
    cost: { wood: 15, stone: 15 },
    researchTime: 40,
    requires: ['fire'],
    unlocks: [
      { type: 'building', id: 'storage_pit', name: '储存点' }
    ],
    effects: [
      { type: 'resource_storage_bonus', target: 'all', value: 50, description: '每个储存点+50%资源储存上限' }
    ],
    unlocked: false,
    researched: false
  },

  primitive_hunting: {
    id: 'primitive_hunting',
    name: '原始狩猎',
    description: '学会基础狩猎技巧，解锁狩猎营地',
    category: 'production',
    cost: { wood: 18, stone: 8 },
    researchTime: 60, // 2个月
    requires: ['fire'],
    unlocks: [
      { type: 'building', id: 'hunting_camp', name: '狩猎营地' },
      { type: 'character', id: 'hunter', name: '猎人' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  basic_agriculture: {
    id: 'basic_agriculture',
    name: '基础农业',
    description: '学会种植作物，解锁农田',
    category: 'production',
    cost: { wood: 20, stone: 10 },
    researchTime: 90, // 3个月
    requires: ['fire'],
    unlocks: [
      { type: 'building', id: 'farm', name: '农田' },
      { type: 'character', id: 'farmer', name: '农民' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  primitive_animal_husbandry: {
    id: 'primitive_animal_husbandry',
    name: '原始畜牧',
    description: '学会饲养家畜，解锁牧场',
    category: 'production',
    cost: { wood: 25, stone: 15, food: 5 },
    researchTime: 240, // 8个月
    requires: ['basic_agriculture'],
    unlocks: [
      { type: 'building', id: 'pasture', name: '牧场' },
      { type: 'character', id: 'herder', name: '牧民' },
      { type: 'resource', id: 'livestock', name: '家畜' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  tool_making: {
    id: 'tool_making',
    name: '工具制造',
    description: '学会制作基础工具，解锁工坊',
    category: 'production',
    cost: { wood: 30, stone: 20, tools: 5 },
    researchTime: 300, // 10个月
    requires: ['logging', 'quarrying'],
    unlocks: [
      { type: 'building', id: 'workshop', name: '工坊' },
      { type: 'character', id: 'craftsman', name: '工匠' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  textile_making: {
    id: 'textile_making',
    name: '织布技术',
    description: '学会纺织布料，解锁织布坊',
    category: 'production',
    cost: { wood: 40, stone: 30, tools: 5, researchPoints: 150 },
    researchTime: 360, // 12个月
    requires: ['primitive_animal_husbandry'],
    unlocks: [
      { type: 'building', id: 'weaving_workshop', name: '织布坊' },
      { type: 'building', id: 'cloth_warehouse', name: '布革仓库' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  bronze_smelting: {
    id: 'bronze_smelting',
    name: '青铜冶炼',
    description: '掌握青铜冶炼技术，解锁铜矿和冶炼',
    category: 'production',
    cost: { wood: 120, stone: 100, tools: 20, researchPoints: 450 },
    researchTime: 720, // 24个月
    requires: ['tool_making'],
    unlocks: [
      { type: 'building', id: 'copper_mine', name: '铜矿场' },
      { type: 'building', id: 'copper_smelter', name: '铜冶炼厂' },
      { type: 'building', id: 'copper_warehouse', name: '铜仓库' },
      { type: 'resource', id: 'copper', name: '铜' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  iron_smelting: {
    id: 'iron_smelting',
    name: '铁冶炼',
    description: '掌握铁冶炼技术，进入铁器时代',
    category: 'production',
    cost: { wood: 200, stone: 180, tools: 30, copper: 20, researchPoints: 700 },
    researchTime: 1080, // 36个月
    requires: ['bronze_smelting'],
    unlocks: [
      { type: 'building', id: 'iron_mine', name: '铁矿场' },
      { type: 'building', id: 'iron_smelter', name: '铁冶炼厂' },
      { type: 'building', id: 'iron_warehouse', name: '铁仓库' },
      { type: 'resource', id: 'iron', name: '铁' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  horse_taming: {
    id: 'horse_taming',
    name: '马匹驯养',
    description: '学会驯养马匹，解锁马厩和骑兵',
    category: 'production',
    cost: { wood: 180, stone: 150, tools: 30, researchPoints: 300 },
    researchTime: 648, // 21.6个月
    requires: ['primitive_animal_husbandry', 'storage'],
    unlocks: [
      { type: 'building', id: 'stable', name: '马厩' },
      { type: 'building', id: 'stable_expansion', name: '马厩扩建' },
      { type: 'resource', id: 'horses', name: '马匹' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  crystal_exploration: {
    id: 'crystal_exploration',
    name: '水晶勘探',
    description: '发现神秘水晶，解锁水晶采集',
    category: 'special',
    cost: { wood: 100, stone: 80, tools: 20, researchPoints: 250 },
    researchTime: 540, // 18个月
    requires: ['quarrying', 'writing_invention'],
    unlocks: [
      { type: 'building', id: 'crystal_mine', name: '水晶矿场' },
      { type: 'resource', id: 'crystal', name: '水晶' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  crystal_processing: {
    id: 'crystal_processing',
    name: '水晶加工',
    description: '掌握水晶加工技术，提升水晶价值',
    category: 'special',
    cost: { wood: 200, stone: 180, tools: 35, crystal: 30, researchPoints: 500 },
    researchTime: 792, // 26.4个月
    requires: ['crystal_exploration', 'tool_making'],
    unlocks: [
      { type: 'building', id: 'crystal_workshop', name: '水晶工坊' },
      { type: 'building', id: 'crystal_warehouse', name: '水晶仓库' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  // 存储加工科技
  wood_processing: {
    id: 'wood_processing',
    name: '木材处理',
    description: '优化木材储存和处理技术',
    category: 'production',
    cost: { wood: 80, stone: 40, tools: 15, researchPoints: 250 },
    researchTime: 468, // 15.6个月
    requires: ['logging', 'tool_making'],
    unlocks: [
      { type: 'building', id: 'wood_warehouse', name: '木材仓库' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  stone_processing: {
    id: 'stone_processing',
    name: '石料加工',
    description: '优化石料储存和处理技术',
    category: 'production',
    cost: { wood: 100, stone: 80, tools: 20, researchPoints: 300 },
    researchTime: 504, // 16.8个月
    requires: ['quarrying', 'tool_making'],
    unlocks: [
      { type: 'building', id: 'stone_warehouse', name: '石料仓库' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  tool_storage: {
    id: 'tool_storage',
    name: '工具存储',
    description: '建立专门的工具储存设施',
    category: 'production',
    cost: { wood: 120, stone: 100, tools: 30, researchPoints: 350 },
    researchTime: 540, // 18个月
    requires: ['tool_making'],
    unlocks: [
      { type: 'building', id: 'tool_warehouse', name: '工具仓库' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  food_processing: {
    id: 'food_processing',
    name: '食物加工',
    description: '改善食物储存和加工技术',
    category: 'production',
    cost: { wood: 80, stone: 70, tools: 15, researchPoints: 180 },
    researchTime: 468, // 15.6个月
    requires: ['basic_agriculture', 'tool_making'],
    unlocks: [
      { type: 'building', id: 'food_warehouse', name: '食物仓库' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  weapon_storage: {
    id: 'weapon_storage',
    name: '兵器储存',
    description: '建立专门的武器储存设施',
    category: 'military',
    cost: { wood: 120, stone: 90, tools: 30, researchPoints: 200 },
    researchTime: 504, // 16.8个月
    requires: ['primitive_weapons', 'storage'],
    unlocks: [
      { type: 'building', id: 'weapon_warehouse', name: '武器库' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  // 2.2 军事科技
  primitive_weapons: {
    id: 'primitive_weapons',
    name: '原始武器',
    description: '制作基础武器，解锁武库',
    category: 'military',
    cost: { wood: 40, stone: 30, tools: 5 },
    researchTime: 120, // 4个月
    requires: ['tool_making'],
    unlocks: [
      { type: 'building', id: 'armory', name: '武库' },
      { type: 'character', id: 'weaponsmith', name: '武器匠' },
      { type: 'resource', id: 'weapons', name: '武器' }
    ],
    effects: [],
    unlocked: false,
    researched: false
  },

  hunting_skills: {
    id: 'hunting_skills',
    name: '狩猎技巧',
    description: '提升狩猎效率，解锁猎人兵种',
    category: 'military',
    cost: { wood: 25, stone: 15, tools: 5 },
    researchTime: 180, // 6个月
    requires: ['primitive_hunting'],
    unlocks: [
      { type: 'character', id: 'hunter_soldier', name: '猎人兵种' }
    ],
    effects: [
      { type: 'resource_production_bonus', target: 'food', value: 10, description: '+10%狩猎效率' }
    ],
    unlocked: false,
    researched: false
  },

  // 2.3 社会科技
  tribal_organization: {
    id: 'tribal_organization',
    name: '部落组织',
    description: '建立部落组织结构，解锁酋长角色',
    category: 'social',
    cost: { wood: 20, stone: 10 },
    researchTime: 120, // 4个月
    requires: ['fire'],
    unlocks: [
      { type: 'character', id: 'chief', name: '酋长' }
    ],
    effects: [
      { type: 'stability_bonus', target: 'stability', value: 5, description: '+5稳定度' }
    ],
    unlocked: false,
    researched: false
  },

  // 2.5 研究科技
  elder_system: {
    id: 'elder_system',
    name: '长老制度',
    description: '建立长老制度，提升科技研发速度',
    category: 'research',
    cost: { wood: 30, stone: 20, tools: 10 },
    researchTime: 120, // 4个月
    requires: ['tribal_organization'],
    unlocks: [
      { type: 'character', id: 'elder', name: '长老' }
    ],
    effects: [
      { type: 'research_speed_bonus', target: 'research', value: 15, description: '提升科技研发速度' }
    ],
    unlocked: false,
    researched: false
  },

  writing_invention: {
    id: 'writing_invention',
    name: '文字发明',
    description: '发明文字系统，解锁研究点系统',
    category: 'research',
    cost: { wood: 50, stone: 40, tools: 10 },
    researchTime: 240, // 8个月
    requires: ['elder_system'],
    unlocks: [
      { type: 'resource', id: 'researchPoints', name: '研究点' }
    ],
    effects: [
      { type: 'research_speed_bonus', target: 'research', value: 10, description: '+10%科技研发速度' }
    ],
    unlocked: false,
    researched: false
  }
};

// 科技分类配置
export const TECHNOLOGY_CATEGORIES: Record<TechnologyCategory, { name: string; description: string; color: string }> = {
  production: {
    name: '生产科技',
    description: '提升资源生产和储存能力',
    color: 'bg-green-500'
  },
  military: {
    name: '军事科技',
    description: '增强军事力量和防御能力',
    color: 'bg-red-500'
  },
  social: {
    name: '社会科技',
    description: '改善社会组织和治理',
    color: 'bg-blue-500'
  },
  special: {
    name: '特殊科技',
    description: '神秘的魔法和特殊能力',
    color: 'bg-purple-500'
  },
  research: {
    name: '研究科技',
    description: '提升研究能力和知识传承',
    color: 'bg-yellow-500'
  }
};

// 获取科技的前置条件检查
export function getTechnologyPrerequisites(technologyId: string): string[] {
  const tech = TECHNOLOGIES[technologyId];
  return tech?.requires || [];
}

// 检查科技是否可以研究
export function canResearchTechnology(technologyId: string, researchedTechs: Set<string>): boolean {
  const tech = TECHNOLOGIES[technologyId];
  if (!tech || tech.researched) return false;
  
  const prerequisites = getTechnologyPrerequisites(technologyId);
  return prerequisites.every(prereq => researchedTechs.has(prereq));
}

// 获取科技解锁的内容
export function getTechnologyUnlocks(technologyId: string) {
  const tech = TECHNOLOGIES[technologyId];
  return tech?.unlocks || [];
}

// 按分类获取科技
export function getTechnologiesByCategory(category: TechnologyCategory): Technology[] {
  return Object.values(TECHNOLOGIES).filter(tech => tech.category === category);
}

// 获取所有可研究的科技
export function getAvailableTechnologies(researchedTechs: Set<string>): Technology[] {
  return Object.values(TECHNOLOGIES).filter(tech => 
    !tech.researched && canResearchTechnology(tech.id, researchedTechs)
  );
}