import { Nation, NationTrait, MercenaryUnit, DiplomacyConfig, MarketPrices } from '../types/diplomacy';

// 基础市场价格
export const BASE_MARKET_PRICES: MarketPrices = {
  food: 1,
  wood: 1,
  stone: 1,
  cloth: 5,
  copper: 8,
  iron: 12,
  weapons: 15
};

// 国家特性数据
export const NATION_TRAITS: Record<string, NationTrait> = {
  // 贸易相关特性
  merchant_republic: {
    id: 'merchant_republic',
    name: '商业共和国',
    description: '擅长贸易，提供更好的价格和更多的商品',
    effects: {
      tradeBonus: 0.15,
      relationshipDecay: -0.5
    }
  },
  
  trading_empire: {
    id: 'trading_empire',
    name: '贸易帝国',
    description: '庞大的贸易网络，资源丰富',
    effects: {
      tradeBonus: 0.25,
      specialResource: 'exotic_goods'
    }
  },
  
  // 军事相关特性
  warrior_culture: {
    id: 'warrior_culture',
    name: '战士文化',
    description: '崇尚武力，军事实力强大',
    effects: {
      warStrength: 0.3,
      relationshipDecay: 0.2
    }
  },
  
  nomadic_raiders: {
    id: 'nomadic_raiders',
    name: '游牧掠夺者',
    description: '机动性强的游牧民族，经常发动袭击',
    effects: {
      warStrength: 0.2,
      relationshipDecay: 0.3
    }
  },
  
  // 特殊特性
  ancient_wisdom: {
    id: 'ancient_wisdom',
    name: '古老智慧',
    description: '拥有古老的知识和技术',
    effects: {
      specialResource: 'ancient_knowledge'
    }
  },
  
  mountain_fortress: {
    id: 'mountain_fortress',
    name: '山地要塞',
    description: '易守难攻的山地国家',
    effects: {
      warStrength: 0.4,
      tradeBonus: -0.1
    }
  },
  
  seafaring_nation: {
    id: 'seafaring_nation',
    name: '海洋民族',
    description: '精通航海和海上贸易',
    effects: {
      tradeBonus: 0.2,
      specialResource: 'sea_treasures'
    }
  },
  
  desert_kingdom: {
    id: 'desert_kingdom',
    name: '沙漠王国',
    description: '适应沙漠环境的强韧民族',
    effects: {
      warStrength: 0.15,
      specialResource: 'desert_gems'
    }
  }
};

// 国家模板数据
export const NATION_TEMPLATES: Omit<Nation, 'id' | 'relationship' | 'relationshipValue' | 'discoveredAt' | 'isDestroyed' | 'marketPrices' | 'priceMultiplier' | 'relationshipDiscount' | 'lastRaidTime' | 'nextRaidTime' | 'isAtWar'>[] = [
  {
    name: '翡翠商会',
    description: '以贸易闻名的富裕商业联盟，控制着重要的贸易路线',
    traits: [NATION_TRAITS.merchant_republic],
    specialTreasure: 'emerald_seal',
    militaryStrength: 60
  },
  
  {
    name: '铁血部落',
    description: '崇尚武力的游牧民族，以骑兵和掠夺著称',
    traits: [NATION_TRAITS.warrior_culture, NATION_TRAITS.nomadic_raiders],
    specialTreasure: 'warlord_banner',
    militaryStrength: 85
  },
  
  {
    name: '古老王国',
    description: '历史悠久的文明古国，拥有深厚的文化底蕴',
    traits: [NATION_TRAITS.ancient_wisdom],
    specialTreasure: 'ancient_codex',
    militaryStrength: 70
  },
  
  {
    name: '山岭要塞',
    description: '建立在险峻山脉中的防御型国家',
    traits: [NATION_TRAITS.mountain_fortress],
    specialTreasure: 'mountain_crown',
    militaryStrength: 90
  },
  
  {
    name: '海洋联邦',
    description: '由多个岛屿组成的海上强国',
    traits: [NATION_TRAITS.seafaring_nation, NATION_TRAITS.trading_empire],
    specialTreasure: 'trident_of_tides',
    militaryStrength: 75
  },
  
  {
    name: '沙漠帝国',
    description: '统治广袤沙漠的古老帝国',
    traits: [NATION_TRAITS.desert_kingdom, NATION_TRAITS.ancient_wisdom],
    specialTreasure: 'desert_scepter',
    militaryStrength: 80
  },
  
  {
    name: '北境蛮族',
    description: '来自严寒北方的强悍战士',
    traits: [NATION_TRAITS.warrior_culture],
    specialTreasure: 'frost_axe',
    militaryStrength: 95
  },
  
  {
    name: '黄金城邦',
    description: '以财富和奢华著称的城市国家',
    traits: [NATION_TRAITS.trading_empire],
    specialTreasure: 'golden_chalice',
    militaryStrength: 50
  },
  
  {
    name: '森林守护者',
    description: '与自然和谐共存的森林民族',
    traits: [NATION_TRAITS.ancient_wisdom],
    militaryStrength: 65
  },
  
  {
    name: '钢铁联盟',
    description: '工业发达的军事联盟',
    traits: [NATION_TRAITS.warrior_culture],
    specialTreasure: 'steel_forge',
    militaryStrength: 100
  }
];

// 佣兵单位数据
export const MERCENARY_UNITS: Record<string, MercenaryUnit> = {
  light_cavalry: {
    id: 'light_cavalry',
    name: '轻骑兵',
    description: '机动性强的轻装骑兵，适合侦察和骚扰',
    cost: 500,
    upkeep: 50,
    strength: 15,
    duration: 30,
    requirements: {
      relationship: 'neutral',
      minRelationshipValue: 40
    }
  },
  
  heavy_infantry: {
    id: 'heavy_infantry',
    name: '重装步兵',
    description: '装备精良的重装步兵，防御力强',
    cost: 800,
    upkeep: 80,
    strength: 25,
    duration: 45,
    requirements: {
      relationship: 'friendly',
      minRelationshipValue: 60
    }
  },
  
  elite_archers: {
    id: 'elite_archers',
    name: '精锐弓箭手',
    description: '训练有素的远程部队，射程和精度都很高',
    cost: 600,
    upkeep: 60,
    strength: 20,
    duration: 35,
    requirements: {
      relationship: 'neutral',
      minRelationshipValue: 50
    }
  },
  
  siege_engineers: {
    id: 'siege_engineers',
    name: '攻城工程师',
    description: '专业的攻城部队，擅长破坏敌方防御',
    cost: 1200,
    upkeep: 100,
    strength: 30,
    duration: 60,
    requirements: {
      relationship: 'friendly',
      minRelationshipValue: 70
    }
  },
  
  royal_guard: {
    id: 'royal_guard',
    name: '皇家卫队',
    description: '最精锐的职业军人，战斗力极强',
    cost: 2000,
    upkeep: 150,
    strength: 50,
    duration: 90,
    requirements: {
      relationship: 'friendly',
      minRelationshipValue: 80
    }
  }
};

// 特殊宝物效果
export const SPECIAL_TREASURES: Record<string, {
  name: string;
  description: string;
  effects: {
    type: string;
    value: number;
    description: string;
  }[];
}> = {
  emerald_seal: {
    name: '翡翠印章',
    description: '商会的权威象征，提升贸易效率',
    effects: [
      { type: 'trade_efficiency', value: 0.15, description: '所有贸易收益+15%' },
      { type: 'currency_generation', value: 0.1, description: '货币产出+10%' }
    ]
  },
  
  warlord_banner: {
    name: '战王旗帜',
    description: '激励士气的战旗，提升军事能力',
    effects: [
      { type: 'military_strength', value: 0.2, description: '军事实力+20%' },
      { type: 'recruitment_speed', value: 0.25, description: '招募速度+25%' }
    ]
  },
  
  ancient_codex: {
    name: '古老法典',
    description: '记录古代智慧的珍贵典籍',
    effects: [
      { type: 'research_speed', value: 0.15, description: '研究速度+15%' },
      { type: 'stability', value: 10, description: '稳定度+10' }
    ]
  },
  
  mountain_crown: {
    name: '山岭王冠',
    description: '山地王者的象征，提供防御加成',
    effects: [
      { type: 'defense_bonus', value: 0.3, description: '防御力+30%' },
      { type: 'building_durability', value: 0.2, description: '建筑耐久+20%' }
    ]
  },
  
  trident_of_tides: {
    name: '潮汐三叉戟',
    description: '海神的武器，掌控海洋力量',
    effects: [
      { type: 'exploration_speed', value: 0.25, description: '探索速度+25%' },
      { type: 'naval_strength', value: 0.4, description: '海军实力+40%' }
    ]
  },
  
  desert_scepter: {
    name: '沙漠权杖',
    description: '沙漠之王的权杖，蕴含神秘力量',
    effects: [
      { type: 'resource_efficiency', value: 0.15, description: '资源采集效率+15%' },
      { type: 'heat_resistance', value: 1, description: '免疫炎热环境负面效果' }
    ]
  },
  
  frost_axe: {
    name: '霜寒战斧',
    description: '北境战士的传奇武器',
    effects: [
      { type: 'melee_damage', value: 0.3, description: '近战伤害+30%' },
      { type: 'cold_resistance', value: 1, description: '免疫寒冷环境负面效果' }
    ]
  },
  
  golden_chalice: {
    name: '黄金圣杯',
    description: '象征财富和繁荣的圣器',
    effects: [
      { type: 'currency_generation', value: 0.25, description: '货币产出+25%' },
      { type: 'population_growth', value: 0.15, description: '人口增长+15%' }
    ]
  },
  
  steel_forge: {
    name: '钢铁熔炉',
    description: '传说中的锻造设施',
    effects: [
      { type: 'weapon_production', value: 0.5, description: '武器产出+50%' },
      { type: 'building_speed', value: 0.2, description: '建造速度+20%' }
    ]
  }
};

// 外交系统配置
export const DIPLOMACY_CONFIG: DiplomacyConfig = {
  baseMarketPrices: BASE_MARKET_PRICES,
  priceVolatilityRange: [0.8, 1.2],
  relationshipDiscountRange: [0.7, 1.0],
  giftEfficiencyRate: 0.01, // 1货币 = 1%好感度（基础值）
  relationshipDecayRate: 0.1, // 每月衰减0.1%
  raidIntervalRange: [10, 20], // 10-20年
  warDeclarationCost: 1000,
  mercenaryAvailabilityChance: 0.3
};

export default {
  BASE_MARKET_PRICES,
  NATION_TRAITS,
  NATION_TEMPLATES,
  MERCENARY_UNITS,
  SPECIAL_TREASURES,
  DIPLOMACY_CONFIG
};