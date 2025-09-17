import { Building, Technology, Character, Achievement } from '@/types/game';

// 建筑数据
export const BUILDINGS: Record<string, Building> = {
  // 基础建筑
  shelter: {
    id: 'shelter',
    name: '简易住所',
    description: '为族人提供基本的居住场所，增加人口容量。',
    type: 'housing',
    cost: { wood: 15, stone: 8 },
    produces: { housing: 2 },
    unlocked: true,
  },
  

  
  storage: {
    id: 'storage',
    name: '储藏点',
    description: '储存各种资源，防止损失。每个储藏点增加所有资源的储存上限。',
    type: 'storage',
    cost: { wood: 25, stone: 15, tools: 2 },
    produces: { storage_capacity: 100 },
    requires: ['primitive_storage'],
    unlocked: false,
    canAssignWorkers: false,
    maxWorkers: 0,
  },
  
  // 生产建筑
  hunting_ground: {
    id: 'hunting_ground',
    name: '狩猎场',
    description: '组织狩猎活动，获得食物和皮毛。',
    type: 'production',
    cost: { wood: 25, stone: 15 },
    produces: { food: 0.5 },
    requires: ['hunting'],
    unlocked: false,
    canAssignWorkers: true,
    maxWorkers: 1,
  },
  
  gathering_hut: {
    id: 'gathering_hut',
    name: '采集小屋',
    description: '组织采集活动，收集野果和草药。',
    type: 'production',
    cost: { wood: 20, stone: 12 },
    produces: { food: 0.3 },
    requires: ['gathering'],
    unlocked: false,
    canAssignWorkers: true,
    maxWorkers: 1,
  },
  
  logging_camp: {
    id: 'logging_camp',
    name: '伐木场',
    description: '专门的伐木区域，提高木材采集效率。',
    type: 'production',
    cost: { wood: 35, stone: 20 },
    produces: { wood: 0.8 },
    requires: ['logging'],
    unlocked: false,
    canAssignWorkers: true,
    maxWorkers: 1,
  },
  
  quarry: {
    id: 'quarry',
    name: '采石场',
    description: '开采石料的专门场所。',
    type: 'production',
    cost: { wood: 40, stone: 25 },
    produces: { stone: 0.6 },
    requires: ['stone_gathering'],
    unlocked: false,
    canAssignWorkers: true,
    maxWorkers: 1,
  },
  
  // 农业建筑
  farm: {
    id: 'farm',
    name: '农田',
    description: '种植作物，提供稳定的食物来源。',
    type: 'production',
    cost: { wood: 50, stone: 35 },
    produces: { food: 1.2 },
    requires: ['primitive_agriculture'],
    unlocked: false,
    canAssignWorkers: true,
    maxWorkers: 1,
  },
  

  
  // 工艺建筑
  workshop: {
    id: 'workshop',
    name: '工坊',
    description: '制作工具和器具的专门场所。需要手工艺技术解锁。',
    type: 'production',
    cost: { wood: 55, stone: 40, tools: 6 },
    produces: { tools: 0.4 },
    consumes: { wood: 0.2, stone: 0.1 },
    requires: ['tool_making'],
    unlocked: false,
    canAssignWorkers: true,
    maxWorkers: 1,
  },
  
  pottery_kiln: {
    id: 'pottery_kiln',
    name: '陶窑',
    description: '制作陶器，改善生活质量。',
    type: 'production',
    cost: { wood: 30, stone: 60, tools: 5 },
    requires: ['pottery'],
    unlocked: false,
    canAssignWorkers: true,
    maxWorkers: 1,
  },
  
  // 铁器时代建筑
  iron_mine: {
    id: 'iron_mine',
    name: '铁矿',
    description: '开采铁矿石，为铁器制作提供原料。',
    type: 'production',
    cost: { wood: 80, stone: 120, tools: 15 },
    produces: { tools: 0.8 },
    requires: ['iron_working'],
    unlocked: false,
    canAssignWorkers: true,
    maxWorkers: 1,
  },
  
  forge: {
    id: 'forge',
    name: '锻造坊',
    description: '制作铁制工具和武器。',
    type: 'production',
    cost: { wood: 100, stone: 150, tools: 25 },
    produces: { tools: 1.0 },
    requires: ['iron_working'],
    unlocked: false,
    canAssignWorkers: true,
    maxWorkers: 1,
  },
  
  // 军事建筑
  barracks: {
    id: 'barracks',
    name: '兵营',
    description: '训练战士的专门场所，可以训练和驻扎军队。',
    type: 'military',
    cost: { wood: 60, stone: 40, tools: 10 },
    produces: { military_capacity: 5 },
    requires: ['warfare'],
    unlocked: false,
    canAssignWorkers: true,
    maxWorkers: 2,
  },
  
  watchtower: {
    id: 'watchtower',
    name: '守卫塔',
    description: '提供早期预警和防御加成，增强定居点安全。',
    type: 'military',
    cost: { wood: 80, stone: 60, tools: 8 },
    produces: { defense: 3 },
    requires: ['defensive_structures'],
    unlocked: false,
    canAssignWorkers: true,
    maxWorkers: 1,
  },
  
  palisade: {
    id: 'palisade',
    name: '木栅栏',
    description: '简单的防御工事，提供基础防护。',
    type: 'military',
    cost: { wood: 100, stone: 20, tools: 5 },
    produces: { defense: 2 },
    requires: ['defensive_structures'],
    unlocked: false,
    canAssignWorkers: false,
    maxWorkers: 0,
  },
  
  armory: {
    id: 'armory',
    name: '武器库',
    description: '储存武器和装备，提高军队战斗力。',
    type: 'military',
    cost: { wood: 70, stone: 50, tools: 15 },
    produces: { weapon_storage: 10 },
    requires: ['bronze_weapons'],
    unlocked: false,
    canAssignWorkers: true,
    maxWorkers: 1,
  },
  
  training_ground: {
    id: 'training_ground',
    name: '训练场',
    description: '军事训练专用场地，提高战士技能。',
    type: 'military',
    cost: { wood: 90, stone: 70, tools: 12 },
    produces: { training_efficiency: 1.5 },
    requires: ['warrior_training'],
    unlocked: false,
    canAssignWorkers: true,
    maxWorkers: 1,
  },
  
  wall: {
    id: 'wall',
    name: '城墙',
    description: '坚固的石制城墙，提供强大的防御力。',
    type: 'military',
    cost: { wood: 50, stone: 200, tools: 30 },
    produces: { defense: 8 },
    requires: ['fortification'],
    unlocked: false,
    canAssignWorkers: false,
    maxWorkers: 0,
  },

  courthouse: {
    id: 'courthouse',
    name: '法院',
    description: '建立司法体系和行政管理中心，可以安排官吏进行管理。',
    type: 'administrative',
    cost: { wood: 120, stone: 180, tools: 40 },
    produces: { administrative_capacity: 3 },
    requires: ['legal_code'],
    unlocked: false,
    canAssignWorkers: true,
    maxWorkers: 3,
  }
};

// 科技数据 - 根据technology.md重新设计
export const TECHNOLOGIES: Record<string, Technology> = {
  // 基础生存技术
  fire_making: {
    id: 'fire_making',
    name: '生火',
    description: '掌握钻木取火的方法，为部落带来温暖和光明。+10%食物效率，-5%食物腐烂，解锁烹饪。',
    category: 'survival',
    cost: { wood: 10 },
    researchTime: 5, // 5秒
    unlocked: true,
    researched: false,
    effects: [
      { type: 'resource_multiplier', target: 'food', value: 1.1 },
      { type: 'unlock_building', target: 'housing', value: 1 }
    ],
  },
  
  settlement: {
    id: 'settlement',
    name: '定居点',
    description: '建立固定的居住地点，解锁住房建筑，+5稳定度。',
    category: 'survival',
    cost: { wood: 20, stone: 10 },
    researchTime: 8, // 8秒
    requires: ['fire_making'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'stability_bonus', target: 'stability', value: 5 },
      { type: 'unlock_building', target: 'shelter', value: 1 }
    ],
  },
  
  stone_gathering: {
    id: 'stone_gathering',
    name: '采集石头',
    description: '学会有效采集和加工石料，解锁采石场，+20%石料获取效率。',
    category: 'crafting',
    cost: { wood: 15 },
    researchTime: 6, // 6秒
    requires: ['fire_making'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'resource_multiplier', target: 'stone', value: 1.2 },
      { type: 'unlock_building', target: 'quarry', value: 1 }
    ],
  },
  
  logging: {
    id: 'logging',
    name: '伐木',
    description: '掌握系统性的伐木技术，解锁伐木场，+20%木材获取效率。',
    category: 'survival',
    cost: { wood: 10 },
    researchTime: 5, // 5秒
    requires: ['fire_making'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'resource_multiplier', target: 'wood', value: 1.2 },
      { type: 'unlock_building', target: 'logging_camp', value: 1 }
    ],
  },
  
  hunting: {
    id: 'hunting',
    name: '狩猎技术',
    description: '学会制作简单陷阱和狩猎工具，提高食物获取效率。',
    category: 'survival',
    cost: { food: 20 },
    researchTime: 10, // 10秒
    requires: ['fire_making'],
    unlocks: ['hunting_ground'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'resource_multiplier', target: 'food', value: 1.2 }
    ],
  },
  
  gathering: {
    id: 'gathering',
    name: '采集技术',
    description: '学会识别可食用植物和高效采集方法。',
    category: 'survival',
    cost: { food: 15 },
    researchTime: 8, // 8秒
    requires: ['fire_making'],
    unlocks: ['gathering_hut'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'resource_multiplier', target: 'food', value: 1.1 }
    ],
  },
  
  // 工具制作科技 - 按照technology.md设计
  tool_making: {
    id: 'tool_making',
    name: '制造工具',
    description: '学会制作基础工具，解锁工坊、工匠职业、工具资源。',
    category: 'crafting',
    cost: { wood: 20, stone: 15 },
    researchTime: 12, // 12秒
    requires: ['stone_gathering', 'logging'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_building', target: 'workshop', value: 1 },
      { type: 'unlock_resource', target: 'tools', value: 1 }
    ],
  },
  
  primitive_storage: {
    id: 'primitive_storage',
    name: '原始贮存',
    description: '建造储存设施，解锁储藏点，+50%储存上限。',
    category: 'crafting',
    cost: { wood: 25, stone: 20 },
    researchTime: 15, // 15秒
    requires: ['tool_making'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'storage_bonus', target: 'storage', value: 1.5 },
      { type: 'unlock_building', target: 'storage', value: 1 }
    ],
  },
  
  stone_tool_improvement: {
    id: 'stone_tool_improvement',
    name: '石器改良',
    description: '改进石器制作工艺，+25%工具产出效率。',
    category: 'crafting',
    cost: { wood: 15, stone: 25 },
    researchTime: 240, // 8个月
    requires: ['tool_making'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'resource_multiplier', target: 'tools', value: 1.25 }
    ],
  },
  
  bone_crafting: {
    id: 'bone_crafting',
    name: '骨器制作',
    description: '利用动物骨骼制作精细工具，解锁骨器资源。',
    category: 'crafting',
    cost: { wood: 20, stone: 10 },
    researchTime: 270, // 9个月
    requires: ['tool_making', 'animal_husbandry'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_advanced_tools', target: 'bone_tools', value: 1 }
    ],
  },
  

  
  woodworking: {
    id: 'woodworking',
    name: '木工技术',
    description: '掌握木材加工技术，制作更精细的木制工具。',
    category: 'crafting',
    cost: { food: 30, wood: 15, tools: 2 },
    researchTime: 15, // 15秒
    requires: ['tool_making'],
    unlocks: ['logging_camp'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'resource_multiplier', target: 'wood', value: 1.3 },
      { type: 'improve_tool_quality', target: 'tools', value: 1.2 }
    ],
  },
  
  // 农业与畜牧科技
  primitive_agriculture: {
    id: 'primitive_agriculture',
    name: '原始农业',
    description: '学会基础的种植技术，解锁农田、农民职业。',
    category: 'agriculture',
    cost: { wood: 15, stone: 5 },
    researchTime: 20, // 20秒
    requires: ['settlement'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_building', target: 'farm', value: 1 },
      { type: 'unlock_job', target: 'farmer', value: 1 }
    ],
  },
  
  primitive_husbandry: {
    id: 'primitive_husbandry',
    name: '原始畜牧',
    description: '学会驯养动物，解锁牧场、家畜资源。',
    category: 'agriculture',
    cost: { wood: 20, stone: 10, food: 5 },
    researchTime: 240, // 8个月
    requires: ['primitive_agriculture'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_building', target: 'pasture', value: 1 },
      { type: 'unlock_resource', target: 'livestock', value: 1 }
    ],
  },
  
  seed_selection: {
    id: 'seed_selection',
    name: '种子选育',
    description: '通过选育改良种子，+15%农田产量。',
    category: 'agriculture',
    cost: { wood: 10, food: 15 },
    researchTime: 180, // 6个月
    requires: ['primitive_agriculture'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'resource_multiplier', target: 'food', value: 1.15 }
    ],
  },
  
  livestock_domestication: {
    id: 'livestock_domestication',
    name: '家畜驯化',
    description: '改进驯养技术，+20%牧场产量，解锁新家畜品种。',
    category: 'agriculture',
    cost: { wood: 15, food: 20 },
    researchTime: 300, // 10个月
    requires: ['primitive_husbandry'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'resource_multiplier', target: 'livestock', value: 1.2 },
      { type: 'unlock_advanced_livestock', target: 'advanced_livestock', value: 1 }
    ],
  },
  
  agriculture: {
    id: 'agriculture',
    name: '农业技术',
    description: '学会种植作物，获得稳定的食物来源。',
    category: 'agriculture',
    cost: { food: 50, tools: 5 },
    researchTime: 180,
    requires: ['tool_making'],
    unlocks: ['farm', 'granary'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'resource_multiplier', target: 'food', value: 1.5 }
    ],
  },
  
  animal_husbandry: {
    id: 'animal_husbandry',
    name: '畜牧业',
    description: '学会驯养动物，获得肉类、奶制品和皮毛。',
    category: 'agriculture',
    cost: { food: 80, tools: 8 },
    researchTime: 240,
    requires: ['agriculture', 'hunting'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'resource_multiplier', target: 'food', value: 1.3 }
    ],
  },
  
  // 军事科技
  primitive_weapons: {
    id: 'primitive_weapons',
    name: '原始武器',
    description: '学会制作简单武器，解锁木棒、石斧等基础武器。',
    category: 'military',
    cost: { wood: 15, stone: 10 },
    researchTime: 150, // 5个月
    requires: ['stone_gathering'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_weapon', target: 'club', value: 1 },
      { type: 'unlock_weapon', target: 'stone_axe', value: 1 }
    ],
  },
  
  throwing_techniques: {
    id: 'throwing_techniques',
    name: '投掷技术',
    description: '学会投掷武器技术，解锁投石器、标枪。',
    category: 'military',
    cost: { wood: 20, stone: 15 },
    researchTime: 180, // 6个月
    requires: ['primitive_weapons'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_weapon', target: 'sling', value: 1 },
      { type: 'unlock_weapon', target: 'javelin', value: 1 }
    ],
  },
  
  hunting_techniques: {
    id: 'hunting_techniques',
    name: '狩猎技术',
    description: '改进狩猎方法，+25%狩猎效率，解锁陷阱。',
    category: 'military',
    cost: { wood: 25, stone: 15, tools: 5 },
    researchTime: 210, // 7个月
    requires: ['throwing_techniques'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'hunting_efficiency', target: 'hunting', value: 1.25 },
      { type: 'unlock_building', target: 'trap', value: 1 }
    ],
  },
  
  warfare: {
    id: 'warfare',
    name: '战争技术',
    description: '学会组织战斗和制造武器。',
    category: 'military',
    cost: { wood: 50, stone: 30, tools: 10 },
    researchTime: 350,
    requires: ['hunting_techniques', 'bronze_working'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_military', target: 'military', value: 1 }
    ],
  },
  
  // 手工艺技术
  crafting: {
    id: 'crafting',
    name: '手工艺',
    description: '学会制作各种日用品和精细工具。',
    category: 'crafting',
    cost: { food: 40, wood: 20, stone: 15, tools: 3 },
    researchTime: 150,
    requires: ['woodworking'],
    unlocks: ['workshop'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_advanced_tools', target: 'tools', value: 1 }
    ],
  },
  
  pottery: {
    id: 'pottery',
    name: '陶器制作',
    description: '学会制作陶器，改善储存和烹饪条件。',
    category: 'crafting',
    cost: { food: 60, stone: 30, tools: 5 },
    researchTime: 200,
    requires: ['crafting'],
    unlocks: ['pottery_kiln'],
    unlocked: false,
    researched: false,
  },
  
  // 建筑科技
  basic_shelter: {
    id: 'basic_shelter',
    name: '基础庇护所',
    description: '学会建造简单的遮风挡雨建筑，解锁小屋。',
    category: 'construction',
    cost: { wood: 10, stone: 5 },
    researchTime: 120, // 4个月
    requires: ['fire_making'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_building', target: 'hut', value: 1 }
    ],
  },
  
  advanced_construction: {
    id: 'advanced_construction',
    name: '高级建筑',
    description: '学会更复杂的建筑技术，解锁大型建筑。',
    category: 'construction',
    cost: { wood: 25, stone: 15, tools: 5 },
    researchTime: 240, // 8个月
    requires: ['basic_shelter', 'tool_making'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_building', target: 'longhouse', value: 1 },
      { type: 'unlock_building', target: 'storage_pit', value: 1 }
    ],
  },
  
  defensive_structures: {
    id: 'defensive_structures',
    name: '防御建筑',
    description: '学会建造防御工事，解锁栅栏、瞭望塔。',
    category: 'construction',
    cost: { wood: 30, stone: 20, tools: 8 },
    researchTime: 300, // 10个月
    requires: ['advanced_construction'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_building', target: 'palisade', value: 1 },
      { type: 'unlock_building', target: 'watchtower', value: 1 }
    ],
  },
  
  construction: {
    id: 'construction',
    name: '建筑技术',
    description: '学会建造更复杂的建筑结构。',
    category: 'construction',
    cost: { food: 70, wood: 40, stone: 30, tools: 8 },
    researchTime: 300,
    requires: ['crafting'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'building_unlock', target: 'advanced_buildings', value: 1 }
    ],
  },
  
  // 铜石并用时代科技
  proto_writing: {
    id: 'proto_writing',
    name: '原始文字',
    description: '发明简单的符号记录系统，解锁基础记录功能。',
    category: 'knowledge',
    cost: { wood: 40, stone: 30, tools: 15 },
    researchTime: 720, // 2年
    requires: ['tribal_law'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_writing', target: 'proto_writing', value: 1 },
      { type: 'knowledge_preservation', target: 'knowledge', value: 1.1 }
    ],
  },
  
  record_keeping: {
    id: 'record_keeping',
    name: '记录保存',
    description: '建立系统的记录保存制度，+20%科技研发速度。',
    category: 'knowledge',
    cost: { wood: 50, stone: 40, tools: 20 },
    researchTime: 900, // 2.5年
    requires: ['proto_writing'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'research_speed_bonus', target: 'research', value: 1.2 },
      { type: 'unlock_building', target: 'archive', value: 1 }
    ],
  },
  
  number_concept: {
    id: 'number_concept',
    name: '数字概念',
    description: '发展抽象数字概念，解锁计数系统，+15%资源管理效率。',
    category: 'knowledge',
    cost: { wood: 35, stone: 25, tools: 10 },
    researchTime: 600, // 1.67年
    requires: ['proto_writing'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_counting', target: 'counting_system', value: 1 },
      { type: 'resource_efficiency', target: 'all_resources', value: 1.15 }
    ],
  },
  
  // 金属工艺 - 铜石并用时代
  copper_working: {
    id: 'copper_working',
    name: '铜器制作',
    description: '学会冶炼和加工铜，制作铜制工具和装饰品。',
    category: 'crafting',
    cost: { food: 80, stone: 40, tools: 10 },
    researchTime: 300,
    requires: ['pottery', 'construction'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'resource_multiplier', target: 'tools', value: 1.3 }
    ],
  },
  
  bronze_working: {
    id: 'bronze_working',
    name: '青铜器制作',
    description: '掌握青铜合金技术，制作更坚固的工具和武器。',
    category: 'crafting',
    cost: { food: 120, stone: 60, tools: 15 },
    researchTime: 400,
    requires: ['copper_working'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'resource_multiplier', target: 'tools', value: 1.5 }
    ],
  },
  
  iron_working: {
    id: 'iron_working',
    name: '铁器制作',
    description: '掌握铁器制作技术，进入铁器时代。',
    category: 'crafting',
    cost: { food: 200, stone: 100, tools: 25 },
    researchTime: 600,
    requires: ['bronze_working'],
    unlocks: ['iron_mine', 'forge'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'resource_multiplier', target: 'tools', value: 2.0 }
    ],
  },
  
  // 社会组织科技
  chieftain_system: {
    id: 'chieftain_system',
    name: '酋长制',
    description: '建立酋长领导制度，解锁酋长角色，强者上位继承法。',
    category: 'social',
    cost: { wood: 30, stone: 20 },
    researchTime: 300, // 10个月
    requires: ['settlement'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_character', target: 'chieftain', value: 1 },
      { type: 'unlock_inheritance', target: 'strength_inheritance', value: 1 }
    ],
  },
  
  elder_council: {
    id: 'elder_council',
    name: '长老会议',
    description: '建立长老议事制度，解锁长老角色，+15%科技研发速度。',
    category: 'social',
    cost: { wood: 40, stone: 30 },
    researchTime: 360, // 1年
    requires: ['chieftain_system'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_character', target: 'elder', value: 1 },
      { type: 'research_speed_bonus', target: 'research', value: 1.15 }
    ],
  },
  
  tribal_law: {
    id: 'tribal_law',
    name: '部落法则',
    description: '制定基本法律制度，+10稳定度，解锁基础法律系统。',
    category: 'social',
    cost: { wood: 35, stone: 25, tools: 10 },
    researchTime: 540, // 1.5年
    requires: ['elder_council'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'stability_bonus', target: 'stability', value: 10 },
      { type: 'unlock_legal_system', target: 'basic_law', value: 1 }
    ],
  },
  
  // 社会制度
  tribal_council: {
    id: 'tribal_council',
    name: '部落议事会',
    description: '建立部落议事制度，提高决策效率。',
    category: 'social',
    cost: { food: 60, tools: 5 },
    researchTime: 200,
    requires: ['construction'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_governance', target: 'governance', value: 1 }
    ],
  },
  
  legal_code: {
    id: 'legal_code',
    name: '法律法典',
    description: '建立基本的法律制度，规范社会秩序。',
    category: 'social',
    cost: { food: 100, tools: 15 },
    researchTime: 400,
    requires: ['tribal_council'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_corruption_system', target: 'corruption', value: 1 }
    ],
  },
  
  // 青铜时代科技
  organized_religion: {
    id: 'organized_religion',
    name: '有组织宗教',
    description: '建立正式的宗教体系和仪式，提高文化凝聚力。',
    category: 'culture',
    cost: { food: 100, wood: 50, stone: 30, tools: 10 },
    researchTime: 450,
    requires: ['proto_writing', 'tribal_law'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_building', target: 'temple', value: 1 },
      { type: 'stability_bonus', target: 'stability', value: 15 },
      { type: 'culture_boost', target: 'culture', value: 25 }
    ],
  },
  
  formal_government: {
    id: 'formal_government',
    name: '正式政府',
    description: '建立更复杂的政治管理体系，提高治理效率。',
    category: 'social',
    cost: { food: 150, wood: 75, stone: 50, tools: 20 },
    researchTime: 600,
    requires: ['elder_council', 'organized_religion'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_building', target: 'government_hall', value: 1 },
      { type: 'population_limit_increase', target: 'population', value: 50 },
      { type: 'governance_efficiency', target: 'governance', value: 1.15 }
    ],
  },
  
  professional_army: {
    id: 'professional_army',
    name: '职业军队',
    description: '建立专门的军事组织，提高战斗力。',
    category: 'military',
    cost: { food: 120, wood: 80, stone: 40, tools: 30 },
    researchTime: 480,
    requires: ['bronze_working', 'warfare'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_unit', target: 'bronze_warrior', value: 1 },
      { type: 'military_strength_bonus', target: 'military', value: 1.4 },
      { type: 'defense_bonus', target: 'defense', value: 1.25 }
    ],
  },
  
  advanced_agriculture: {
    id: 'advanced_agriculture',
    name: '高级农业',
    description: '发展更先进的农业技术和灌溉系统。',
    category: 'agriculture',
    cost: { food: 100, wood: 60, stone: 30, tools: 20 },
    researchTime: 420,
    requires: ['seed_selection', 'bronze_working'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'resource_multiplier', target: 'food', value: 1.3 },
      { type: 'unlock_building', target: 'irrigation_system', value: 1 },
      { type: 'population_growth_bonus', target: 'population', value: 1.15 }
    ],
  },
  
  trade_networks: {
    id: 'trade_networks',
    name: '贸易网络',
    description: '建立与其他部落的贸易关系，促进资源流通。',
    category: 'social',
    cost: { food: 80, wood: 40, stone: 20, tools: 15 },
    researchTime: 360,
    requires: ['number_concept', 'formal_government'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'unlock_building', target: 'marketplace', value: 1 },
      { type: 'resource_income_bonus', target: 'all_resources', value: 1.2 },
      { type: 'culture_boost', target: 'culture', value: 15 }
    ],
  },
  
  advanced_metallurgy: {
    id: 'advanced_metallurgy',
    name: '高级冶金',
    description: '改进金属冶炼技术，提高工具质量。',
    category: 'crafting',
    cost: { food: 140, wood: 70, stone: 60, tools: 25 },
    researchTime: 540,
    requires: ['bronze_working', 'advanced_construction'],
    unlocked: false,
    researched: false,
    effects: [
      { type: 'resource_multiplier', target: 'tools', value: 1.4 },
      { type: 'unlock_advanced_tools', target: 'advanced_bronze_tools', value: 1 }
    ],
  },
  
  written_language: {
      id: 'written_language',
      name: '文字语言',
      description: '发展完整的文字系统，促进知识传播。',
      category: 'knowledge',
      cost: { food: 120, wood: 80, stone: 50, tools: 15 },
      researchTime: 720,
      requires: ['record_keeping', 'organized_religion'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'research_speed_bonus', target: 'research', value: 1.3 },
        { type: 'unlock_building', target: 'library', value: 1 },
        { type: 'knowledge_preservation', target: 'knowledge', value: 1.25 }
      ],
    },

    // 铜石并用时代 - 农业改良科技
    irrigation_tech: {
      id: 'irrigation_tech',
      name: '灌溉技术',
      description: '发展灌溉系统，提高农田产量和抗旱能力。',
      category: 'agriculture',
      cost: { food: 75, wood: 25, stone: 15, tools: 10 },
      researchTime: 450,
      requires: ['primitive_agriculture'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'resource_multiplier', target: 'food', value: 1.3 },
        { type: 'unlock_building', target: 'irrigation_canal', value: 1 },
        { type: 'drought_resistance', target: 'agriculture', value: 1.5 }
      ],
    },
    livestock_breeding: {
      id: 'livestock_breeding',
      name: '家畜选育',
      description: '通过选择性繁殖改良家畜品种。',
      category: 'agriculture',
      cost: { food: 60, wood: 20, stone: 10, tools: 15 },
      researchTime: 600,
      requires: ['primitive_husbandry'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'resource_multiplier', target: 'livestock', value: 1.25 },
        { type: 'breeding_efficiency', target: 'livestock', value: 1.1 },
        { type: 'unlock_advanced_livestock', target: 'livestock_varieties', value: 1 }
      ],
    },
    crop_rotation: {
      id: 'crop_rotation',
      name: '轮作制度',
      description: '通过轮作保护土壤，提高农田产量。',
      category: 'agriculture',
      cost: { food: 90, wood: 30, stone: 20, tools: 25 },
      researchTime: 900,
      requires: ['irrigation_tech', 'primitive_writing'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'resource_multiplier', target: 'food', value: 1.4 },
        { type: 'soil_protection', target: 'agriculture', value: 1.2 },
        { type: 'sustainable_farming', target: 'environment', value: 1.1 }
      ],
    },

    // 手工业科技
    textile_making: {
      id: 'textile_making',
      name: '制作布革',
      description: '学会制作布料和皮革，提供新的材料。',
      category: 'crafting',
      cost: { food: 60, wood: 20, stone: 15, tools: 10 },
      researchTime: 600,
      requires: ['primitive_husbandry'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_building', target: 'textile_workshop', value: 1 },
        { type: 'unlock_resource', target: 'textiles', value: 1 },
        { type: 'clothing_production', target: 'comfort', value: 1.15 }
      ],
    },
    pottery_making: {
      id: 'pottery_making',
      name: '陶器制作',
      description: '制作陶器容器，提高储存效率。',
      category: 'crafting',
      cost: { food: 105, wood: 35, stone: 40, tools: 25 },
      researchTime: 750,
      requires: ['textile_making', 'primitive_writing'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_resource', target: 'pottery', value: 1 },
        { type: 'storage_efficiency', target: 'storage', value: 1.3 },
        { type: 'food_preservation', target: 'food', value: 1.1 }
      ],
    },
    dyeing_tech: {
      id: 'dyeing_tech',
      name: '染色技术',
      description: '掌握染色工艺，增加文化价值。',
      category: 'crafting',
      cost: { food: 75, wood: 25, stone: 20, tools: 30 },
      researchTime: 660,
      requires: ['textile_making'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_resource', target: 'dyes', value: 1 },
        { type: 'culture_boost', target: 'culture', value: 20 },
        { type: 'trade_value', target: 'textiles', value: 1.25 }
      ],
    },

    // 冶金科技
    copper_smelting: {
      id: 'copper_smelting',
      name: '青铜冶炼',
      description: '掌握铜的冶炼技术，开启金属时代。',
      category: 'metalworking',
      cost: { food: 150, wood: 50, stone: 40, tools: 30 },
      researchTime: 1500,
      requires: ['textile_making', 'primitive_writing'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_building', target: 'copper_mine', value: 1 },
        { type: 'unlock_building', target: 'smeltery', value: 1 },
        { type: 'unlock_resource', target: 'copper', value: 1 }
      ],
    },
    alloy_tech: {
      id: 'alloy_tech',
      name: '合金技术',
      description: '学会制作青铜合金，提高金属质量。',
      category: 'metalworking',
      cost: { food: 120, wood: 40, stone: 30, tools: 35 },
      researchTime: 1800,
      requires: ['copper_smelting'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'resource_multiplier', target: 'copper', value: 1.3 },
        { type: 'unlock_resource', target: 'bronze', value: 1 },
        { type: 'metal_quality', target: 'tools', value: 1.2 }
      ],
    },
    refining_tech: {
      id: 'refining_tech',
      name: '精炼技术',
      description: '改进金属精炼工艺，制作高质量工具。',
      category: 'metalworking',
      cost: { food: 135, wood: 45, stone: 35, tools: 40 },
      researchTime: 2100,
      requires: ['alloy_tech'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'metal_quality_boost', target: 'metals', value: 1.4 },
        { type: 'unlock_advanced_tools', target: 'refined_tools', value: 1 },
        { type: 'production_efficiency', target: 'crafting', value: 1.25 }
      ],
    },

    // 社会制度科技
    tribal_alliance: {
      id: 'tribal_alliance',
      name: '部落联盟',
      description: '与其他部落建立联盟关系。',
      category: 'social',
      cost: { food: 90, wood: 30, stone: 20, tools: 10 },
      researchTime: 900,
      requires: ['hunting_techniques'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_diplomacy', target: 'diplomacy', value: 1 },
        { type: 'stability_bonus', target: 'stability', value: 5 },
        { type: 'trade_opportunities', target: 'trade', value: 1.15 }
      ],
    },
    trade_system: {
      id: 'trade_system',
      name: '贸易制度',
      description: '建立正式的贸易体系和规则。',
      category: 'social',
      cost: { food: 120, wood: 40, stone: 30, tools: 35 },
      researchTime: 1200,
      requires: ['tribal_alliance', 'number_concept'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_trade_system', target: 'trade', value: 1 },
        { type: 'economic_growth', target: 'economy', value: 1.25 },
        { type: 'resource_exchange', target: 'resources', value: 1.1 }
      ],
    },
    specialization: {
      id: 'specialization',
      name: '专业分工',
      description: '发展专业化的职业分工体系。',
      category: 'social',
      cost: { food: 105, wood: 35, stone: 25, tools: 40 },
      researchTime: 1500,
      requires: ['trade_system'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'production_efficiency_all', target: 'production', value: 1.2 },
        { type: 'unlock_specialists', target: 'jobs', value: 1 },
        { type: 'skill_development', target: 'skills', value: 1.15 }
      ],
    },

    // 军事科技扩展
    hunting_tactics: {
      id: 'hunting_tactics',
      name: '狩猎战术',
      description: '发展组织化的狩猎策略和技巧。',
      category: 'military',
      cost: { food: 75, wood: 25, stone: 15, tools: 10 },
      researchTime: 450,
      requires: ['primitive_weapons'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_building', target: 'hunting_lodge', value: 1 },
        { type: 'unlock_job', target: 'hunter', value: 1 },
        { type: 'unlock_unit', target: 'archer', value: 1 }
      ],
    },
    bow_making: {
      id: 'bow_making',
      name: '弓箭制作',
      description: '制作弓箭，提供远程攻击能力。',
      category: 'military',
      cost: { food: 90, wood: 30, stone: 20, tools: 25 },
      researchTime: 600,
      requires: ['hunting_tactics'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_unit', target: 'archer', value: 1 },
        { type: 'ranged_combat_bonus', target: 'military', value: 1.3 },
        { type: 'hunting_efficiency', target: 'food', value: 1.2 }
      ],
    },
    armor_making: {
      id: 'armor_making',
      name: '护甲制作',
      description: '制作防护装备，提高战士防御力。',
      category: 'military',
      cost: { food: 120, wood: 40, stone: 30, tools: 35 },
      researchTime: 1200,
      requires: ['copper_smelting', 'textile_making'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_unit', target: 'heavy_warrior', value: 1 },
        { type: 'defense_bonus', target: 'military', value: 1.4 },
        { type: 'unit_survivability', target: 'military', value: 1.25 }
      ],
    },
    warrior_training: {
      id: 'warrior_training',
      name: '勇士选拔',
      description: '建立勇士选拔和训练体系。',
      category: 'military',
      cost: { food: 120, wood: 40, stone: 30, tools: 25 },
      researchTime: 900,
      requires: ['hunting_tactics', 'copper_smelting'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_job', target: 'warrior', value: 1 },
        { type: 'military_strength_bonus', target: 'military', value: 1.2 },
        { type: 'elite_unit_training', target: 'military', value: 1.15 }
      ],
    },

    // 青铜时代政治制度科技
    monarchy: {
      id: 'monarchy',
      name: '君主制',
      description: '建立君主统治制度，实现权力集中。',
      category: 'social',
      cost: { food: 240, wood: 80, stone: 60, tools: 40 },
      researchTime: 3000,
      requires: ['elder_council', 'warrior_training'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_inheritance_system', target: 'government', value: 1 },
        { type: 'centralized_power', target: 'authority', value: 1.3 },
        { type: 'attribute_inheritance', target: 'leadership', value: 1 }
      ],
    },
    legal_code: {
      id: 'legal_code',
      name: '法律法典',
      description: '制定成文法律，建立司法体系。',
      category: 'social',
      cost: { food: 210, wood: 70, stone: 50, tools: 60 },
      researchTime: 2400,
      requires: ['monarchy'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_building', target: 'courthouse', value: 1 },
        { type: 'unlock_job', target: 'administrator', value: 1 },
        { type: 'legal_system', target: 'justice', value: 1.25 }
      ],
    },
    centralization: {
      id: 'centralization',
      name: '集权制',
      description: '建立中央集权的政治体制。',
      category: 'social',
      cost: { food: 300, wood: 100, stone: 80, tools: 60 },
      researchTime: 3600,
      requires: ['monarchy', 'legal_code'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'global_production_bonus', target: 'production', value: 1.25 },
        { type: 'stability_penalty', target: 'stability', value: -10 },
        { type: 'administrative_efficiency', target: 'governance', value: 1.3 }
      ],
    },
    feudalism: {
      id: 'feudalism',
      name: '分封制',
      description: '建立分封制度，分散权力管理。',
      category: 'social',
      cost: { food: 270, wood: 90, stone: 70, tools: 50 },
      researchTime: 3300,
      requires: ['monarchy', 'tribal_alliance'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'stability_bonus', target: 'stability', value: 15 },
        { type: 'military_capacity', target: 'military', value: 1.5 },
        { type: 'local_autonomy', target: 'governance', value: 1.2 }
      ],
    },

    // 文化科技
    literacy: {
      id: 'literacy',
      name: '普及文字',
      description: '在民众中推广文字知识。',
      category: 'culture',
      cost: { food: 150, wood: 50, stone: 30, tools: 40 },
      researchTime: 2400,
      requires: ['primitive_writing'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'research_production_bonus', target: 'research', value: 1.3 },
        { type: 'technology_speed_bonus', target: 'technology', value: 1.25 },
        { type: 'cultural_development', target: 'culture', value: 1.2 }
      ],
    },
    religious_rituals: {
      id: 'religious_rituals',
      name: '宗教仪式',
      description: '建立正式的宗教仪式和信仰体系。',
      category: 'culture',
      cost: { food: 210, wood: 70, stone: 100, tools: 50 },
      researchTime: 3000,
      requires: ['advanced_construction'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_resource', target: 'faith', value: 1 },
        { type: 'daily_stability_bonus', target: 'stability', value: 3 },
        { type: 'spiritual_unity', target: 'culture', value: 1.25 }
      ],
    },
    artistic_creation: {
      id: 'artistic_creation',
      name: '艺术创作',
      description: '发展艺术和美学，提升文化价值。',
      category: 'culture',
      cost: { food: 180, wood: 60, stone: 40, tools: 55 },
      researchTime: 3600,
      requires: ['literacy', 'dyeing_tech'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_resource', target: 'art', value: 1 },
        { type: 'cultural_influence', target: 'culture', value: 1.3 },
        { type: 'aesthetic_value', target: 'happiness', value: 1.15 }
      ],
    },
    historical_records: {
      id: 'historical_records',
      name: '历史编纂',
      description: '记录和编纂历史，传承知识。',
      category: 'culture',
      cost: { food: 135, wood: 45, stone: 30, tools: 50 },
      researchTime: 2700,
      requires: ['literacy', 'record_keeping'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'experience_gain_bonus', target: 'characters', value: 1.15 },
        { type: 'knowledge_preservation', target: 'knowledge', value: 1.2 },
        { type: 'cultural_continuity', target: 'culture', value: 1.1 }
      ],
    },

    // 高级生产科技
    advanced_agriculture: {
      id: 'advanced_agriculture',
      name: '高级农业',
      description: '发展高级农业技术，提高粮食产量。',
      category: 'agriculture',
      cost: { food: 200, wood: 80, stone: 40, tools: 60 },
      researchTime: 3000,
      requires: ['irrigation_tech', 'crop_rotation'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'food_production_bonus', target: 'food', value: 1.4 },
        { type: 'unlock_building', target: 'granary', value: 1 },
        { type: 'agricultural_efficiency', target: 'farming', value: 1.3 }
      ],
    },
    advanced_crafting: {
      id: 'advanced_crafting',
      name: '高级手工业',
      description: '发展精细手工业，制作高质量物品。',
      category: 'crafting',
      cost: { food: 180, wood: 90, stone: 60, tools: 80 },
      researchTime: 3600,
      requires: ['textile_making', 'pottery_making', 'alloy_tech'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'tools_production_bonus', target: 'tools', value: 1.5 },
        { type: 'unlock_job', target: 'artisan', value: 1 },
        { type: 'quality_bonus', target: 'crafting', value: 1.25 }
      ],
    },
    mass_production: {
      id: 'mass_production',
      name: '批量生产',
      description: '建立批量生产体系，提高生产效率。',
      category: 'crafting',
      cost: { food: 240, wood: 120, stone: 80, tools: 100 },
      researchTime: 4200,
      requires: ['advanced_crafting', 'professional_division'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'global_production_bonus', target: 'production', value: 1.3 },
        { type: 'efficiency_bonus', target: 'workers', value: 1.2 },
        { type: 'resource_optimization', target: 'resources', value: 1.15 }
      ],
    },
    advanced_metallurgy: {
      id: 'advanced_metallurgy',
      name: '高级冶金',
      description: '掌握高级冶金技术，制作更好的金属制品。',
      category: 'metalworking',
      cost: { food: 300, wood: 100, stone: 150, tools: 120 },
      researchTime: 4800,
      requires: ['bronze_smelting', 'refining_tech'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_resource', target: 'bronze', value: 1 },
        { type: 'metal_quality_bonus', target: 'metalworking', value: 1.4 },
        { type: 'advanced_tools', target: 'tools', value: 1.3 }
      ],
    },

    // 高级军事科技
    bronze_weapons: {
      id: 'bronze_weapons',
      name: '青铜武器',
      description: '制作青铜武器，大幅提升军事实力。',
      category: 'military',
      cost: { food: 200, wood: 60, stone: 80, tools: 100 },
      researchTime: 3600,
      requires: ['advanced_metallurgy', 'weapon_making'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'military_strength_bonus', target: 'military', value: 1.5 },
        { type: 'unlock_unit', target: 'bronze_warrior', value: 1 },
        { type: 'weapon_durability', target: 'weapons', value: 1.3 }
      ],
    },
    military_formation: {
      id: 'military_formation',
      name: '军事阵型',
      description: '发展军事阵型和战术，提高作战效率。',
      category: 'military',
      cost: { food: 180, wood: 40, stone: 30, tools: 60 },
      researchTime: 3000,
      requires: ['warrior_training', 'bronze_weapons'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'tactical_bonus', target: 'military', value: 1.25 },
        { type: 'formation_discipline', target: 'army', value: 1.2 },
        { type: 'combat_coordination', target: 'battle', value: 1.15 }
      ],
    },
    fortification: {
      id: 'fortification',
      name: '防御工事',
      description: '建造防御工事，保护定居点安全。',
      category: 'military',
      cost: { food: 250, wood: 150, stone: 200, tools: 80 },
      researchTime: 4200,
      requires: ['advanced_construction', 'military_formation'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_building', target: 'wall', value: 1 },
        { type: 'defense_bonus', target: 'settlement', value: 1.4 },
        { type: 'siege_resistance', target: 'defense', value: 1.3 }
      ],
    },
    standing_army: {
      id: 'standing_army',
      name: '常备军',
      description: '建立常备军制度，维持专业军队。',
      category: 'military',
      cost: { food: 400, wood: 100, stone: 80, tools: 120 },
      researchTime: 5400,
      requires: ['military_formation', 'centralization'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_job', target: 'professional_soldier', value: 1 },
        { type: 'military_capacity', target: 'army', value: 2.0 },
        { type: 'military_maintenance', target: 'upkeep', value: 1.5 }
      ],
    },

    // 高级生产科技
    pottery_making: {
      id: 'pottery_making',
      name: '制陶',
      description: '掌握陶器制作技术，提高储存效率。',
      category: 'production',
      cost: { food: 120, wood: 40, stone: 60, tools: 30 },
      researchTime: 1800,
      requires: ['construction'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'storage_bonus', target: 'storage', value: 1.4 },
        { type: 'food_preservation', target: 'food', value: 1.1 },
        { type: 'unlock_resource', target: 'pottery', value: 1 }
      ],
    },
    bronze_technology: {
      id: 'bronze_technology',
      name: '青铜技术',
      description: '改进青铜冶炼技术，提高金属产量。',
      category: 'production',
      cost: { food: 240, wood: 80, stone: 60, tools: 60, research: 20 },
      researchTime: 4500,
      requires: ['bronze_smelting'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'resource_multiplier', target: 'bronze', value: 1.5 },
        { type: 'tools_efficiency', target: 'tools', value: 1.2 },
        { type: 'unlock_advanced_bronze', target: 'advanced_bronze', value: 1 }
      ],
    },
    three_field_system: {
      id: 'three_field_system',
      name: '三圃制',
      description: '实行三圃轮作制度，大幅提高农业产量。',
      category: 'agriculture',
      cost: { food: 180, wood: 60, stone: 40, tools: 50, research: 30 },
      researchTime: 3000,
      requires: ['irrigation_tech', 'literacy'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'resource_multiplier', target: 'food', value: 1.5 },
        { type: 'food_stability', target: 'food', value: 1.2 },
        { type: 'disaster_resistance', target: 'agriculture', value: 1.3 }
      ],
    },
    hydraulic_engineering: {
      id: 'hydraulic_engineering',
      name: '水利工程',
      description: '建设大型水利设施，进一步提高农业产量。',
      category: 'production',
      cost: { food: 300, wood: 100, stone: 120, tools: 80, research: 35 },
      researchTime: 6000,
      requires: ['three_field_system', 'construction'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'resource_multiplier', target: 'food', value: 1.6 },
        { type: 'disaster_resistance', target: 'agriculture', value: 1.5 },
        { type: 'unlock_building', target: 'aqueduct', value: 1 }
      ],
    },

    // 高级军事科技扩展
    chariot_making: {
      id: 'chariot_making',
      name: '战车制作',
      description: '制造战车，提供强大的机动作战能力。',
      category: 'military',
      cost: { food: 240, wood: 80, stone: 60, tools: 70, research: 25 },
      researchTime: 5400,
      requires: ['bronze_technology', 'horse_domestication'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_unit', target: 'chariot', value: 1 },
        { type: 'mobility_bonus', target: 'military', value: 1.3 },
        { type: 'shock_attack', target: 'combat', value: 1.4 }
      ],
    },
    siege_engines: {
      id: 'siege_engines',
      name: '攻城器械',
      description: '制造攻城器械，提高攻城作战能力。',
      category: 'military',
      cost: { food: 270, wood: 90, stone: 70, tools: 80, research: 30 },
      researchTime: 6000,
      requires: ['bronze_weapons', 'engineering'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_unit', target: 'siege_engineer', value: 1 },
        { type: 'siege_bonus', target: 'siege', value: 1.5 },
        { type: 'fortification_damage', target: 'siege', value: 1.6 }
      ],
    },
    elite_training: {
      id: 'elite_training',
      name: '精锐训练',
      description: '建立精锐部队训练体系，提高军队质量。',
      category: 'military',
      cost: { food: 210, wood: 70, stone: 50, tools: 60, research: 25 },
      researchTime: 4500,
      requires: ['warrior_training', 'bronze_weapons'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_unit', target: 'elite_guard', value: 1 },
        { type: 'military_quality', target: 'military', value: 1.3 },
        { type: 'experience_bonus', target: 'combat', value: 1.2 }
      ],
    },

    // 高级科技
    iron_smelting: {
      id: 'iron_smelting',
      name: '铁冶炼',
      description: '掌握铁器冶炼技术，开启铁器时代。',
      category: 'production',
      cost: { food: 360, wood: 120, stone: 100, tools: 80, research: 40 },
      researchTime: 12000,
      requires: ['bronze_technology'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_building', target: 'iron_mine', value: 1 },
        { type: 'unlock_building', target: 'iron_smelter', value: 1 },
        { type: 'unlock_resource', target: 'iron', value: 1 },
        { type: 'era_advancement', target: 'iron_age', value: 1 }
      ],
    },
    horse_domestication: {
      id: 'horse_domestication',
      name: '驯马',
      description: '驯化马匹，获得强大的机动力。',
      category: 'agriculture',
      cost: { food: 240, wood: 80, stone: 60, tools: 40, research: 20 },
      researchTime: 7500,
      requires: ['bronze_technology', 'livestock_breeding'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_building', target: 'stable', value: 1 },
        { type: 'unlock_resource', target: 'horses', value: 1 },
        { type: 'unlock_unit', target: 'cavalry', value: 1 }
      ],
    },
    currency_system: {
      id: 'currency_system',
      name: '货币制度',
      description: '建立货币制度，促进贸易发展。',
      category: 'social',
      cost: { food: 210, wood: 70, stone: 50, tools: 65, research: 35 },
      researchTime: 9000,
      requires: ['trade_system', 'bronze_technology'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_resource', target: 'currency', value: 1 },
        { type: 'trade_efficiency', target: 'trade', value: 1.4 },
        { type: 'economic_development', target: 'economy', value: 1.3 }
      ],
    },
    engineering: {
      id: 'engineering',
      name: '工程学',
      description: '发展工程学知识，提高建造能力。',
      category: 'culture',
      cost: { food: 255, wood: 85, stone: 70, tools: 75, research: 40 },
      researchTime: 10500,
      requires: ['bronze_technology', 'number_concept'],
      unlocked: false,
      researched: false,
      effects: [
        { type: 'unlock_building', target: 'large_construction', value: 1 },
        { type: 'construction_efficiency', target: 'building', value: 1.3 },
        { type: 'unlock_job', target: 'engineer', value: 1 }
      ],
    },
};

// 游戏事件数据
export const GAME_EVENTS = {
  // 不暂停事件（探索发现类）
  ancient_artifact: {
    id: 'ancient_artifact',
    name: '古代文物',
    description: '探索者在废墟中发现了一件古代文物，为部落带来了珍贵的知识。',
    type: 'exploration',
    pausesGame: false,
    probability: 0.05,
    requirements: {
      population: { min: 8 },
      gameTime: { min: 300000 } // 5分钟后才可能触发
    },
    effects: {
      resources: { tools: 5 },
      stability: 3
    }
  },
  
  fertile_discovery: {
    id: 'fertile_discovery',
    name: '肥沃土地发现',
    description: '侦察队发现了一片肥沃的土地，适合扩展农业。',
    type: 'exploration',
    pausesGame: false,
    probability: 0.06,
    requirements: {
      population: { min: 6 },
      buildings: { has: ['farm'] }
    },
    effects: {
      resources: { food: 15 },
      stability: 5
    }
  },
  
  // 暂停事件（需要决策）
  harvest_festival: {
    id: 'harvest_festival',
    name: '丰收庆典',
    description: '部落迎来了丰收季节，族人们希望举办庆典来庆祝。你需要决定如何处理这个提议。',
    type: 'social',
    pausesGame: true,
    probability: 0.08,
    requirements: {
      population: { min: 10 },
      resources: { food: { min: 40 } }
    },
    choices: [
      {
        id: 'celebrate',
        text: '举办盛大庆典（消耗20食物，+15稳定度）',
        effects: {
          resources: { food: -20 },
          stability: 15
        }
      },
      {
        id: 'modest',
        text: '简单庆祝（消耗10食物，+8稳定度）',
        effects: {
          resources: { food: -10 },
          stability: 8
        }
      },
      {
        id: 'decline',
        text: '取消庆典（节约资源，-5稳定度）',
        effects: {
          stability: -5
        }
      }
    ]
  },
  
  drought_crisis: {
    id: 'drought_crisis',
    name: '干旱危机',
    description: '长期的干旱导致水源短缺，农作物枯萎。部落面临严重的食物危机，需要立即采取行动。',
    type: 'disaster',
    pausesGame: true,
    probability: 0.04,
    requirements: {
      population: { min: 8 },
      buildings: { has: ['farm'] }
    },
    choices: [
      {
        id: 'ration',
        text: '实行配给制（减少食物消耗，-10稳定度）',
        effects: {
          stability: -10,
          // 临时减少食物消耗率
        }
      },
      {
        id: 'search_water',
        text: '派遣队伍寻找新水源（消耗5工具，可能找到水源）',
        effects: {
          resources: { tools: -5 },
          // 有概率获得额外食物产出
        }
      },
      {
        id: 'trade_help',
        text: '向邻近部落求助（消耗10工具，获得20食物）',
        effects: {
          resources: { tools: -10, food: 20 }
        }
      }
    ]
  },
  
  stranger_arrival: {
    id: 'stranger_arrival',
    name: '陌生人到访',
    description: '一个陌生人来到了你的定居点，声称拥有特殊的技能，希望加入部落。你需要决定是否接纳他。',
    type: 'social',
    pausesGame: true,
    probability: 0.06,
    requirements: {
      population: { min: 5 },
      stability: { min: 30 }
    },
    choices: [
      {
        id: 'welcome',
        text: '热情接纳（+1人口，+5工具，+5稳定度）',
        effects: {
          resources: { population: 1, tools: 5 },
          stability: 5
        }
      },
      {
        id: 'cautious',
        text: '谨慎观察（+1人口，+2工具）',
        effects: {
          resources: { population: 1, tools: 2 }
        }
      },
      {
        id: 'refuse',
        text: '拒绝接纳（无变化）',
        effects: {}
      }
    ]
  }
};

// 人物数据
export const CHARACTERS: Record<string, Character> = {
  chief: {
    id: 'chief',
    name: '部落酋长',
    type: 'chief',
    level: 1,
    experience: 0,
    skills: {
      leadership: 8,
      crafting: 3,
      farming: 3,
      building: 4,
      military: 6,
      research: 5,
    },
    traits: ['天生领袖', '决策果断'],
    isActive: true,
    description: '部落的领导者，拥有出色的领导能力和决策智慧。',
  },
  
  elder: {
    id: 'elder',
    name: '部落长老',
    type: 'elder',
    level: 1,
    experience: 0,
    skills: {
      leadership: 6,
      crafting: 5,
      farming: 4,
      building: 4,
      military: 3,
      research: 8,
    },
    traits: ['博学多识', '经验丰富'],
    isActive: true,
    description: '部落中最有智慧的人，负责传承知识和指导研究。',
  },
};

// 成就数据
// 腐败度相关事件
export const CORRUPTION_EVENTS = {
  // 负面事件
  official_corruption: {
    id: 'official_corruption',
    name: '官员贪污',
    description: '发现有官员私吞公款，腐败度上升，资源减少。',
    type: 'negative',
    probability: 0.15, // 基础概率15%
    requirements: {
      corruption: { min: 20 }, // 腐败度至少20
      population: { min: 15 }, // 人口至少15
    },
    effects: {
      corruption: 10,
      stability: -5,
      resources: { food: -20, tools: -5 },
    },
  },

  public_unrest: {
    id: 'public_unrest',
    name: '民众抗议',
    description: '民众对腐败现象不满，爆发抗议活动，稳定度下降。',
    type: 'negative',
    probability: 0.12,
    requirements: {
      corruption: { min: 40 },
      stability: { max: 60 },
    },
    effects: {
      stability: -15,
      corruption: 5,
    },
  },

  resource_embezzlement: {
    id: 'resource_embezzlement',
    name: '资源挪用',
    description: '建设资源被挪用，建筑成本增加，腐败度上升。',
    type: 'negative',
    probability: 0.10,
    requirements: {
      corruption: { min: 30 },
      buildings_count: { min: 5 },
    },
    effects: {
      corruption: 8,
      building_cost_multiplier: 1.2, // 临时增加建筑成本
    },
  },

  // 正面事件
  honest_official: {
    id: 'honest_official',
    name: '清廉典型',
    description: '发现一位清廉的官员，树立正面榜样，腐败度下降。',
    type: 'positive',
    probability: 0.08,
    requirements: {
      corruption: { min: 10 },
      characters: { has: ['elder', 'chief'] },
    },
    effects: {
      corruption: -15,
      stability: 8,
    },
  },

  anti_corruption_campaign: {
    id: 'anti_corruption_campaign',
    name: '反腐运动',
    description: '发起反腐败运动，大幅降低腐败度，但消耗资源。',
    type: 'positive',
    probability: 0.05,
    requirements: {
      corruption: { min: 50 },
      stability: { min: 40 },
    },
    effects: {
      corruption: -25,
      stability: 10,
      resources: { food: -30, tools: -10 },
    },
  },
};

// 随机事件系统
export const RANDOM_EVENTS = {
  // 自然灾害
  drought: {
    id: 'drought',
    name: '干旱',
    description: '长期缺雨导致农作物减产，食物储备减少。',
    type: 'disaster',
    probability: 0.08,
    requirements: {
      population: { min: 8 },
      buildings: { has: ['farm'] },
    },
    effects: {
      resources: { food: -30 },
      stability: -10,
    },
  },

  flood: {
    id: 'flood',
    name: '洪水',
    description: '暴雨引发洪水，冲毁部分建筑和储存的资源。',
    type: 'disaster',
    probability: 0.06,
    requirements: {
      population: { min: 10 },
    },
    effects: {
      resources: { wood: -25, stone: -15, food: -20 },
      stability: -15,
    },
  },

  wildfire: {
    id: 'wildfire',
    name: '野火',
    description: '森林大火蔓延到定居点附近，威胁木材资源。',
    type: 'disaster',
    probability: 0.05,
    requirements: {
      population: { min: 6 },
      buildings: { has: ['logging_camp'] },
    },
    effects: {
      resources: { wood: -40 },
      stability: -8,
    },
  },

  // 发现事件
  ancient_ruins: {
    id: 'ancient_ruins',
    name: '古代遗迹',
    description: '探索者发现了古代文明的遗迹，获得了珍贵的工具和知识。',
    type: 'discovery',
    probability: 0.04,
    requirements: {
      population: { min: 12 },
      characters: { has: ['scout'] },
    },
    effects: {
      resources: { tools: 15, stone: 20 },
      stability: 5,
    },
  },

  fertile_land: {
    id: 'fertile_land',
    name: '肥沃土地',
    description: '发现了一片肥沃的土地，适合建立新的农田。',
    type: 'discovery',
    probability: 0.06,
    requirements: {
      population: { min: 8 },
      characters: { has: ['scout'] },
    },
    effects: {
      resources: { food: 25 },
      stability: 8,
    },
  },

  mineral_deposit: {
    id: 'mineral_deposit',
    name: '矿物矿床',
    description: '在山区发现了丰富的矿物资源，可以开采更多石料。',
    type: 'discovery',
    probability: 0.05,
    requirements: {
      population: { min: 10 },
      buildings: { has: ['quarry'] },
    },
    effects: {
      resources: { stone: 35, tools: 8 },
      stability: 6,
    },
  },

  // 社会事件
  baby_boom: {
    id: 'baby_boom',
    name: '婴儿潮',
    description: '部落迎来了生育高峰期，人口快速增长。',
    type: 'social',
    probability: 0.07,
    requirements: {
      population: { min: 15 },
      stability: { min: 60 },
    },
    effects: {
      resources: { population: 3 },
      stability: 10,
    },
  },

  skilled_immigrant: {
    id: 'skilled_immigrant',
    name: '技能移民',
    description: '一位拥有特殊技能的外来者加入了部落。',
    type: 'social',
    probability: 0.05,
    requirements: {
      population: { min: 12 },
      stability: { min: 50 },
    },
    effects: {
      resources: { population: 1, tools: 10 },
      stability: 5,
    },
  },

  festival: {
    id: 'festival',
    name: '丰收节',
    description: '部落举办盛大的丰收节庆典，提升士气和团结。',
    type: 'social',
    probability: 0.08,
    requirements: {
      population: { min: 10 },
      resources: { food: { min: 50 } },
    },
    effects: {
      resources: { food: -20 },
      stability: 15,
    },
  },

  // 外交事件
  trade_caravan: {
    id: 'trade_caravan',
    name: '商队到访',
    description: '一支商队路过定居点，愿意进行贸易交换。',
    type: 'diplomatic',
    probability: 0.06,
    requirements: {
      population: { min: 15 },
      technologies: { has: ['trade_system'] },
    },
    effects: {
      resources: { food: -15, tools: 20 },
      stability: 8,
    },
  },

  peaceful_contact: {
    id: 'peaceful_contact',
    name: '和平接触',
    description: '与邻近部落建立了友好关系，交换了知识和资源。',
    type: 'diplomatic',
    probability: 0.04,
    requirements: {
      population: { min: 20 },
      stability: { min: 70 },
    },
    effects: {
      resources: { food: 10, wood: 15, stone: 10 },
      stability: 12,
    },
  },

  // 技术突破
  innovation: {
    id: 'innovation',
    name: '技术突破',
    description: '部落工匠取得技术突破，提高了工具制作效率。',
    type: 'innovation',
    probability: 0.05,
    requirements: {
      population: { min: 12 },
      buildings: { has: ['workshop'] },
      characters: { has: ['craftsman'] },
    },
    effects: {
      resources: { tools: 15 },
      stability: 8,
    },
  },

  knowledge_sharing: {
    id: 'knowledge_sharing',
    name: '知识传承',
    description: '长老向年轻人传授古老的智慧，提升部落的整体能力。',
    type: 'innovation',
    probability: 0.06,
    requirements: {
      population: { min: 10 },
      characters: { has: ['elder'] },
    },
    effects: {
      stability: 12,
    },
  },
};

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_fire: {
    id: 'first_fire',
    name: '第一把火',
    description: '成功生起第一把火',
    category: 'development',
    condition: {
      type: 'technology_count',
      target: 'fire_making',
      value: 1,
    },
    reward: {
      type: 'inheritance_points',
      inheritancePoints: 1,
    },
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  
  population_10: {
    id: 'population_10',
    name: '小型部落',
    description: '人口达到10人',
    category: 'development',
    condition: {
      type: 'population_size',
      target: 'population',
      value: 10,
    },
    reward: {
      type: 'inheritance_points',
      inheritancePoints: 2,
    },
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  
  iron_age: {
    id: 'iron_age',
    name: '铁器时代',
    description: '研发铁器制作技术',
    category: 'technology',
    condition: {
      type: 'technology_count',
      target: 'iron_working',
      value: 1,
    },
    reward: {
      type: 'inheritance_points',
      inheritancePoints: 5,
    },
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
};