import { CharacterType, CharacterPosition, CharacterTrait, CharacterUnlockCondition } from '../types/character';

// 人物特性数据
export const CHARACTER_TRAITS: Record<string, CharacterTrait> = {
  ambitious: {
    id: 'ambitious',
    name: '野心勃勃',
    description: '腐败度+5，所有属性效果+20%',
    type: 'negative',
    effects: [
      { type: 'corruption', target: 'base', value: 5, isPercentage: false, description: '腐败度+5' },
      { type: 'attribute', target: 'all_effects', value: 20, isPercentage: true, description: '所有属性效果+20%' }
    ]
  },
  beautiful: {
    id: 'beautiful',
    name: '闭月羞花',
    description: '+4魅力，但腐败度+3，稳定度-5',
    type: 'negative',
    effects: [
      { type: 'attribute', target: 'charisma', value: 4, isPercentage: false, description: '魅力+4' },
      { type: 'corruption', target: 'base', value: 3, isPercentage: false, description: '腐败度+3' },
      { type: 'stability', target: 'base', value: -5, isPercentage: false, description: '稳定度-5' }
    ]
  },
  handsome: {
    id: 'handsome',
    name: '面容姣好',
    description: '+2魅力，但被敌对势力策反概率+20%，腐败度+2',
    type: 'negative',
    effects: [
      { type: 'attribute', target: 'charisma', value: 2, isPercentage: false, description: '魅力+2' },
      { type: 'corruption', target: 'base', value: 2, isPercentage: false, description: '腐败度+2' }
    ]
  },
  ugly: {
    id: 'ugly',
    name: '丑陋不堪',
    description: '-2魅力，但免疫恐惧类负面状态，腐败度-3',
    type: 'positive',
    effects: [
      { type: 'attribute', target: 'charisma', value: -2, isPercentage: false, description: '魅力-2' },
      { type: 'corruption', target: 'base', value: -3, isPercentage: false, description: '腐败度-3' }
    ]
  },
  strong_odor: {
    id: 'strong_odor',
    name: '体味重',
    description: '-1魅力，外交相关活动成功率-15%，但可驱散野兽，稳定度+3',
    type: 'positive',
    effects: [
      { type: 'attribute', target: 'charisma', value: -1, isPercentage: false, description: '魅力-1' },
      { type: 'stability', target: 'base', value: 3, isPercentage: false, description: '稳定度+3' }
    ]
  },
  photographic_memory: {
    id: 'photographic_memory',
    name: '过目不忘',
    description: '可以复制他人技能，但每使用一次有10%概率遗忘自身一个技能',
    type: 'positive',
    effects: []
  },
  natural_strength: {
    id: 'natural_strength',
    name: '天生神力',
    description: '+2武力，体力上限+25%，但每天消耗食物+50%，军队维护成本+15%',
    type: 'negative',
    effects: [
      { type: 'attribute', target: 'force', value: 2, isPercentage: false, description: '武力+2' },
      { type: 'military', target: 'maintenance_cost', value: 15, isPercentage: true, description: '军队维护成本+15%' }
    ]
  },
  extraordinary_temperament: {
    id: 'extraordinary_temperament',
    name: '气质非凡',
    description: '+2魅力，派系关系+15%，但会吸引刺客关注，遇刺概率+10%，腐败度+3',
    type: 'negative',
    effects: [
      { type: 'attribute', target: 'charisma', value: 2, isPercentage: false, description: '魅力+2' },
      { type: 'corruption', target: 'base', value: 3, isPercentage: false, description: '腐败度+3' }
    ]
  },
  wise_beyond_years: {
    id: 'wise_beyond_years',
    name: '智慧早熟',
    description: '+2智力，经验获得速度+25%，但寿命-5年，科技研发速度-10%',
    type: 'negative',
    effects: [
      { type: 'attribute', target: 'intelligence', value: 2, isPercentage: false, description: '智力+2' },
      { type: 'research', target: 'speed', value: -10, isPercentage: true, description: '科技研发速度-10%' }
    ]
  },
  cowardly: {
    id: 'cowardly',
    name: '胆小如鼠',
    description: '所有战斗相关属性-3，但逃跑成功率+50%，阴谋事件存活率+30%，腐败度-5',
    type: 'positive',
    effects: [
      { type: 'attribute', target: 'force', value: -3, isPercentage: false, description: '武力-3' },
      { type: 'corruption', target: 'base', value: -5, isPercentage: false, description: '腐败度-5' }
    ]
  },
  arrogant: {
    id: 'arrogant',
    name: '傲慢自大',
    description: '所有魅力相关效果+30%，但拒绝接受建议，政策执行效率-20%，稳定度-10',
    type: 'negative',
    effects: [
      { type: 'attribute', target: 'charisma_effects', value: 30, isPercentage: true, description: '魅力相关效果+30%' },
      { type: 'stability', target: 'base', value: -10, isPercentage: false, description: '稳定度-10' }
    ]
  }
};

// 人物解锁条件
export const CHARACTER_UNLOCK_CONDITIONS: Record<CharacterType, CharacterUnlockCondition> = {
  [CharacterType.RULER]: {
    // 统治者默认解锁
  },
  [CharacterType.RESEARCH_LEADER]: {
    requiredTechnology: ['writing'],
    requiredPopulation: 50
  },
  [CharacterType.FAITH_LEADER]: {
    requiredTechnology: ['religion'],
    requiredPopulation: 30
  },
  [CharacterType.MAGE_LEADER]: {
    requiredTechnology: ['magic_basics'],
    requiredPopulation: 100
  },
  [CharacterType.CIVIL_LEADER]: {
    requiredTechnology: ['law'],
    requiredPopulation: 200
  },
  [CharacterType.GENERAL]: {
    requiredTechnology: ['military_organization'],
    requiredPopulation: 100
  },
  [CharacterType.DIPLOMAT]: {
    requiredTechnology: ['diplomacy'],
    requiredPopulation: 150
  }
};

// 人物职位升级条件
export const POSITION_UPGRADE_CONDITIONS: Record<CharacterPosition, CharacterUnlockCondition> = {
  [CharacterPosition.CHIEF]: {},
  [CharacterPosition.KING]: {
    requiredTechnology: ['monarchy'],
    requiredPopulation: 1000,
    requiredStability: 70
  },
  [CharacterPosition.EMPEROR]: {
    requiredTechnology: ['empire'],
    requiredPopulation: 5000,
    requiredStability: 80
  },
  [CharacterPosition.PRESIDENT]: {
    requiredTechnology: ['democracy'],
    requiredPopulation: 3000,
    requiredStability: 75
  },
  [CharacterPosition.ELDER]: {},
  [CharacterPosition.GRAND_SCHOLAR]: {
    requiredTechnology: ['university'],
    requiredPopulation: 500
  },
  [CharacterPosition.ACADEMY_HEAD]: {
    requiredTechnology: ['academy'],
    requiredPopulation: 2000
  },
  [CharacterPosition.HIGH_PRIEST]: {},
  [CharacterPosition.ARCHBISHOP]: {
    requiredTechnology: ['organized_religion'],
    requiredPopulation: 1000
  },
  [CharacterPosition.POPE]: {
    requiredTechnology: ['papal_authority'],
    requiredPopulation: 3000
  },
  [CharacterPosition.ARCHMAGE]: {},
  [CharacterPosition.ROYAL_ARCHMAGE]: {
    requiredTechnology: ['advanced_magic'],
    requiredPopulation: 1500
  },
  [CharacterPosition.CHIEF_JUDGE]: {},
  [CharacterPosition.SPEAKER]: {
    requiredTechnology: ['parliament'],
    requiredPopulation: 2000
  },
  [CharacterPosition.GENERAL]: {},
  [CharacterPosition.GRAND_MARSHAL]: {
    requiredTechnology: ['professional_army'],
    requiredPopulation: 2500
  },
  [CharacterPosition.DIPLOMAT]: {}
};

// 人物属性效果计算
export const CHARACTER_ATTRIBUTE_EFFECTS = {
  [CharacterType.RULER]: {
    force: { type: 'military', target: 'morale', value: 0.5, description: '+0.5% 全局部队士气/点' },
    intelligence: { type: 'economic', target: 'production_speed', value: 0.5, description: '+0.5% 人口生产速度/点' },
    charisma: { type: 'stability', target: 'base', value: 1, description: '+1 稳定度/点' }
  },
  [CharacterType.RESEARCH_LEADER]: {
    force: null,
    intelligence: { type: 'research', target: 'speed', value: 2, description: '+2% 科技研发速度/点' },
    charisma: { type: 'stability', target: 'base', value: 0.5, description: '+0.5% 稳定度/点' }
  },
  [CharacterType.FAITH_LEADER]: {
    force: null,
    intelligence: { type: 'economic', target: 'faith_output', value: 1, description: '+1% 信仰产出/点' },
    charisma: { type: 'stability', target: 'base', value: 1, description: '+1% 稳定度/点' }
  },
  [CharacterType.MAGE_LEADER]: {
    force: { type: 'military', target: 'magic_power', value: 1, description: '+1% 魔法威力/点' },
    intelligence: { type: 'military', target: 'magic_efficiency', value: 2, description: '+2% 魔法效率/点' },
    charisma: { type: 'military', target: 'magic_resistance', value: 0.5, description: '+0.5% 魔法抗性/点' }
  },
  [CharacterType.CIVIL_LEADER]: {
    force: null,
    intelligence: { type: 'corruption', target: 'base', value: -1, description: '-1 腐败度/点' },
    charisma: { type: 'stability', target: 'base', value: 0.2, description: '+0.2 稳定度/点' }
  },
  [CharacterType.GENERAL]: {
    force: { type: 'military', target: 'combat_power', value: 2, description: '+2% 军队战斗力/点' },
    intelligence: { type: 'military', target: 'supply_consumption', value: -1, description: '-1% 部队补给消耗/点' },
    charisma: { type: 'military', target: 'morale', value: 1, description: '+1% 军队士气/点' }
  },
  [CharacterType.DIPLOMAT]: {
    force: null,
    intelligence: { type: 'economic', target: 'trade_efficiency', value: 1, description: '+1% 交易转换率/点' },
    charisma: { type: 'global', target: 'relationship_change', value: 2, description: '+2% 关系改变率/点' }
  }
};

// 随机人物名称池
export const CHARACTER_NAMES = {
  male: [
    '阿尔弗雷德', '巴德温', '查理', '德里克', '埃德蒙', '弗雷德里克', '加雷斯', '哈罗德',
    '伊万', '杰克', '凯文', '利奥', '马库斯', '尼古拉斯', '奥利弗', '帕特里克',
    '昆汀', '罗伯特', '塞缪尔', '托马斯', '乌尔里希', '维克多', '威廉', '泽维尔'
  ],
  female: [
    '阿德莱德', '贝阿特丽斯', '克拉拉', '多萝西', '伊丽莎白', '弗洛拉', '格蕾丝', '海伦',
    '伊莎贝拉', '茱莉亚', '凯瑟琳', '露西', '玛格丽特', '娜塔莉', '奥利维亚', '佩内洛普',
    '昆妮', '罗莎琳德', '索菲亚', '特蕾莎', '乌苏拉', '维多利亚', '温妮弗雷德', '泽诺比亚'
  ]
};

// 人物生成配置
export const CHARACTER_GENERATION_CONFIG = {
  baseAttributeRange: { min: 3, max: 8 },
  traitProbability: 0.3, // 30%概率拥有特性
  maxTraitsPerCharacter: 2,
  baseAge: { min: 25, max: 45 },
  baseLoyalty: { min: 60, max: 90 },
  baseHealth: 100
};