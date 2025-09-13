// 外交系统类型定义

// 关系等级
export type RelationshipLevel = 'hostile' | 'neutral' | 'friendly';

// 外交行动类型
export type DiplomaticActionType = 'trade' | 'gift' | 'hire_mercenaries' | 'declare_war';

// 国家特性
export interface NationTrait {
  id: string;
  name: string;
  description: string;
  effects: {
    tradeBonus?: number; // 贸易加成
    relationshipDecay?: number; // 关系衰减速度
    warStrength?: number; // 战争实力加成
    specialResource?: string; // 特殊资源
  };
}

// 市场价格
export interface MarketPrices {
  food: number;
  wood: number;
  stone: number;
  cloth: number;
  copper: number;
  iron: number;
  weapons: number;
}

// 国家状态
export interface Nation {
  id: string;
  name: string;
  description: string;
  relationship: RelationshipLevel;
  relationshipValue: number; // 0-100，具体好感度数值
  discoveredAt: number; // 发现时间（游戏时间）
  isDestroyed: boolean; // 是否被消灭
  
  // 贸易相关
  marketPrices: MarketPrices;
  priceMultiplier: number; // 价格波动倍数 (0.8-1.2)
  relationshipDiscount: number; // 关系折扣 (0.7-1.0)
  
  // 特性和能力
  traits: NationTrait[];
  specialTreasure?: string; // 特有宝物ID
  
  // 军事相关
  militaryStrength: number; // 军事实力
  lastRaidTime?: number; // 上次袭扰时间
  nextRaidTime?: number; // 下次袭扰时间
  isAtWar: boolean; // 是否处于战争状态
}

// 贸易记录
export interface TradeRecord {
  id: string;
  nationId: string;
  timestamp: number;
  type: 'buy' | 'sell';
  resource: keyof MarketPrices;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  relationshipChange: number;
}

// 外交行动
export interface DiplomaticAction {
  id: string;
  type: DiplomaticActionType;
  nationId: string;
  timestamp: number;
  cost: number;
  result: string;
  relationshipChange: number;
}

// 佣兵单位
export interface MercenaryUnit {
  id: string;
  name: string;
  description: string;
  cost: number; // 雇佣费用
  upkeep: number; // 维护费用
  strength: number; // 战斗力
  duration: number; // 服役时间（天）
  requirements: {
    relationship: RelationshipLevel;
    minRelationshipValue: number;
  };
}

// 袭扰事件
export interface RaidEvent {
  id: string;
  nationId: string;
  timestamp: number;
  strength: number; // 袭扰军队实力
  damage: {
    population?: number;
    resources?: Partial<MarketPrices>;
    buildings?: string[]; // 被破坏的建筑ID
  };
  playerLosses: {
    population: number;
    resources: Partial<MarketPrices>;
  };
  resolved: boolean;
}

// 外交系统状态
export interface DiplomacyState {
  discoveredNations: Nation[];
  tradeHistory: TradeRecord[];
  diplomaticActions: DiplomaticAction[];
  activeRaids: RaidEvent[];
  hiredMercenaries: {
    unitId: string;
    hiredAt: number;
    expiresAt: number;
    cost: number;
  }[];
  
  // 统计数据
  totalTradeVolume: number;
  totalDiplomaticSpending: number;
  nationsDestroyed: number;
  relationshipChanges: {
    nationId: string;
    changes: { timestamp: number; change: number; reason: string; }[];
  }[];
}

// 外交系统配置
export interface DiplomacyConfig {
  baseMarketPrices: MarketPrices;
  priceVolatilityRange: [number, number]; // 价格波动范围
  relationshipDiscountRange: [number, number]; // 关系折扣范围
  giftEfficiencyRate: number; // 赠礼效率（货币转好感度比率）
  relationshipDecayRate: number; // 关系自然衰减速度
  raidIntervalRange: [number, number]; // 袭扰间隔范围（年）
  warDeclarationCost: number; // 宣战成本
  mercenaryAvailabilityChance: number; // 佣兵可用概率
}

// 外交效果
export interface DiplomaticEffect {
  id: string;
  name: string;
  description: string;
  source: string; // 来源（国家名称或特殊事件）
  type: 'trade_bonus' | 'resource_bonus' | 'military_bonus' | 'special';
  value: number;
  duration?: number; // 持续时间，undefined表示永久
  appliedAt: number;
}

export default {};