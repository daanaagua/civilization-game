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
      { type: 'building', id: 'campfire', name: '篝火' }
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