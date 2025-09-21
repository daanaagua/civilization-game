import { 
  Nation, 
  RelationshipLevel, 
  MarketPrices, 
  TradeRecord, 
  DiplomaticAction, 
  RaidEvent, 
  MercenaryUnit,
  DiplomaticEffect,
  Relationship,
  Country
} from '../types/diplomacy';
import { 
  NATION_TEMPLATES, 
  BASE_MARKET_PRICES, 
  DIPLOMACY_CONFIG, 
  MERCENARY_UNITS,
  SPECIAL_TREASURES 
} from './diplomacy-data';
import { GameState, Resources } from '../types/game';

// 生成随机的市场价格
export function generateMarketPrices(): MarketPrices {
  const prices: MarketPrices = {} as MarketPrices;
  const [minMultiplier, maxMultiplier] = DIPLOMACY_CONFIG.priceVolatilityRange;
  
  for (const [resource, basePrice] of Object.entries(BASE_MARKET_PRICES)) {
    const multiplier = minMultiplier + Math.random() * (maxMultiplier - minMultiplier);
    prices[resource as keyof MarketPrices] = Math.round(basePrice * multiplier * 100) / 100;
  }
  
  return prices;
}

// 根据关系等级计算折扣
export function calculateRelationshipDiscount(relationship: RelationshipLevel, relationshipValue: number): number {
  const [minDiscount, maxDiscount] = DIPLOMACY_CONFIG.relationshipDiscountRange;
  
  switch (relationship) {
    case 'hostile':
      return maxDiscount; // 敌对关系无折扣
    case 'neutral':
      // 中立关系：40-60分时0.95-0.85折扣
      const neutralDiscount = 0.95 - (relationshipValue - 40) * 0.005;
      return Math.max(minDiscount, Math.min(maxDiscount, neutralDiscount));
    case 'friendly':
      // 友好关系：60-100分时0.85-0.7折扣
      const friendlyDiscount = 0.85 - (relationshipValue - 60) * 0.00375;
      return Math.max(minDiscount, Math.min(0.85, friendlyDiscount));
    default:
      return maxDiscount;
  }
}

// 根据好感度数值确定关系等级
export function getRelationshipLevel(relationshipValue: number): RelationshipLevel {
  if (relationshipValue < 40) return 'hostile';
  if (relationshipValue < 60) return 'neutral';
  return 'friendly';
}

// 计算关系自然衰减（兼容旧调用）
export function calculateRelationshipDecay(relationship: Relationship): number {
  // 使用配置的基础衰减率，并在战争状态下加速衰减
  let decay = -DIPLOMACY_CONFIG.relationshipDecayRate;
  if (relationship.atWar) {
    decay -= 0.5;
  }
  return decay;
}

// 新增：根据发现顺序生成初始关系（兼容旧存档/旧调用）
export function generateInitialRelationship(discoveryOrder: number): Relationship {
  let initialRelationship: number;
  if (discoveryOrder <= 3) {
    initialRelationship = 40 + Math.random() * 40;
  } else if (discoveryOrder === 4) {
    initialRelationship = 20 + Math.random() * 60;
  } else {
    initialRelationship = 10 + Math.random() * 80;
  }
  const value = Math.round(initialRelationship);
  return {
    level: getRelationshipLevel(value),
    value,
    atWar: false,
  };
}

// 生成随机的市场价格
export function generateNation(discoveryOrder: number, gameTime: number): Nation {
  // 随机选择国家模板
  const template = NATION_TEMPLATES[Math.floor(Math.random() * NATION_TEMPLATES.length)];
  
  // 根据发现顺序确定初始关系
  let initialRelationship: number;
  if (discoveryOrder <= 3) {
    // 前三个国家：中立及以上 (40-80)
    initialRelationship = 40 + Math.random() * 40;
  } else if (discoveryOrder === 4) {
    // 第四个国家：任意关系 (20-80)
    initialRelationship = 20 + Math.random() * 60;
  } else {
    // 第五个及以后：可能敌对 (10-90)
    initialRelationship = 10 + Math.random() * 80;
  }
  
  const relationshipLevel = getRelationshipLevel(initialRelationship);
  const marketPrices = generateMarketPrices();
  const priceMultiplier = 0.9 + Math.random() * 0.2; // 0.9-1.1
  const relationshipDiscount = calculateRelationshipDiscount(relationshipLevel, initialRelationship);
  
  const nation: Nation = {
    id: `nation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: template.name,
    description: template.description,
    relationship: relationshipLevel,
    relationshipValue: Math.round(initialRelationship),
    discoveredAt: gameTime,
    isDestroyed: false,
    marketPrices,
    priceMultiplier,
    relationshipDiscount,
    traits: template.traits,
    specialTreasure: template.specialTreasure,
    militaryStrength: template.militaryStrength,
    isAtWar: false
  };
  
  return nation;
}

// 计算贸易价格
export function calculateTradePrice(
  nation: Nation, 
  resource: keyof MarketPrices, 
  quantity: number, 
  isBuying: boolean
): { unitPrice: number; totalCost: number; relationshipChange: number } {
  const basePrice = nation.marketPrices[resource];
  const adjustedPrice = basePrice * nation.priceMultiplier;
  
  let finalPrice: number;
  if (isBuying) {
    // 购买时应用关系折扣
    finalPrice = adjustedPrice * nation.relationshipDiscount;
  } else {
    // 出售时价格稍低
    finalPrice = adjustedPrice * 0.8;
  }
  
  const unitPrice = Math.round(finalPrice * 100) / 100;
  const totalCost = Math.round(unitPrice * quantity * 100) / 100;
  
  // 贸易带来的关系改善（微小）
  const relationshipChange = Math.min(0.5, totalCost * 0.001);
  
  return { unitPrice, totalCost, relationshipChange };
}

// 执行贸易（支持新旧两种调用方式）
export function executeTrade(
  nation: Nation,
  resource: keyof MarketPrices,
  quantity: number,
  isBuying: boolean,
  gameTime: number
): { success: boolean; tradeRecord?: TradeRecord; error?: string };
export function executeTrade(
  state: GameState,
  countryId: string,
  ourOffer: Partial<GameState['resources']>,
  theirOffer: Partial<GameState['resources']>
): { success: boolean; newResources?: Partial<GameState['resources']>; newRelationship?: Relationship; tradeRecord?: any; error?: string };
export function executeTrade(...args: any[]): any {
  // 旧接口：executeTrade(state, countryId, ourOffer, theirOffer)
  if (args.length >= 4 && args[0] && typeof args[0] === 'object' && 'resources' in args[0] && 'diplomacy' in args[0]) {
    const state = args[0] as GameState;
    const countryId = args[1] as string;
    const ourOffer = (args[2] || {}) as Partial<Resources>;
    const theirOffer = (args[3] || {}) as Partial<Resources>;

    // 仅允许交易 MarketPrices 中定义的资源
    const tradableKeys = Object.keys(BASE_MARKET_PRICES) as (keyof MarketPrices)[];

    const calcValue = (bundle: Partial<Resources>): number => {
      let total = 0;
      for (const key of tradableKeys) {
        const qty = (bundle as any)[key] || 0;
        if (qty) total += (state.diplomacy.marketPrices as any)[key] * qty;
      }
      return total;
    };

    const ourValue = calcValue(ourOffer);
    const theirValue = calcValue(theirOffer);

    if (ourValue === 0 && theirValue === 0) {
      return { success: false, error: '无效的交易：没有可交易的资源' };
    }

    // 允许一定误差范围
    const fair = ourValue === 0 || theirValue === 0 ? true : (Math.min(ourValue, theirValue) / Math.max(ourValue, theirValue) >= 0.8);
    if (!fair) {
      return { success: false, error: '交易不公平，未能达成' };
    }

    // 生成资源变更：收到他们的，付出我们的
    const newResources: Partial<Resources> = {};
    for (const key of tradableKeys) {
      const give = (ourOffer as any)[key] || 0;
      const receive = (theirOffer as any)[key] || 0;
      if (give || receive) {
        (newResources as any)[key] = ((state.resources as any)[key] || 0) - give + receive;
      }
    }

    // 关系小幅提升，基于交易总额
    const totalVolume = ourValue + theirValue;
    const relChange = Math.min(1, totalVolume * 0.001);
    const currentRel = state.diplomacy.relationships[countryId] || { level: 'neutral', value: 50, atWar: false } as Relationship;
    const newValue = Math.max(0, Math.min(100, currentRel.value + relChange));
    const newRelationship: Relationship = {
      level: getRelationshipLevel(newValue),
      value: Math.round(newValue * 10) / 10,
      atWar: currentRel.atWar || false,
    };

    // 交易记录（简化）
    const tradeRecord = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      countryId,
      countryName: (state.diplomacy.discoveredCountries.find(c => c.id === countryId)?.name) || '未知国家',
      timestamp: state.gameTime,
      ourOffer,
      theirOffer,
      relationshipChange: relChange,
      totalVolume,
    };

    return { success: true, newResources, newRelationship, tradeRecord };
  }

  // 新接口：executeTrade(nation, resource, quantity, isBuying, gameTime)
  const nation = args[0] as Nation;
  const resource = args[1] as keyof MarketPrices;
  const quantity = args[2] as number;
  const isBuying = args[3] as boolean;
  const gameTime = args[4] as number;

  if (nation.isDestroyed) {
    return { success: false, error: '该国家已被消灭' };
  }
  if (nation.isAtWar) {
    return { success: false, error: '战争期间无法进行贸易' };
  }
  const { unitPrice, totalCost, relationshipChange } = calculateTradePrice(nation, resource, quantity, isBuying);
  const tradeRecord: TradeRecord = {
    id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nationId: nation.id,
    timestamp: gameTime,
    type: isBuying ? 'buy' : 'sell',
    resource,
    quantity,
    unitPrice,
    totalCost,
    relationshipChange
  };
  return { success: true, tradeRecord };
}

// 计算赠礼效果
export function calculateGiftEffect(giftValue: number, nation: Nation): number {
  // 基础效率受国家特性影响
  let efficiency = DIPLOMACY_CONFIG.giftEfficiencyRate;
  
  // 商业国家对货币赠礼更敏感
  const hasTradeBonus = nation.traits.some(trait => trait.effects.tradeBonus);
  if (hasTradeBonus) {
    efficiency *= 1.5;
  }
  
  // 战士文化对赠礼不太敏感
  const hasWarCulture = nation.traits.some(trait => trait.effects.warStrength);
  if (hasWarCulture) {
    efficiency *= 0.7;
  }
  
  // 关系越差，赠礼效果越低
  if (nation.relationship === 'hostile') {
    efficiency *= 0.5;
  } else if (nation.relationship === 'neutral') {
    efficiency *= 0.8;
  }
  
  return giftValue * efficiency;
}

// 执行赠礼
export function executeGift(
  nation: Nation,
  giftValue: number,
  gameTime: number
): { success: boolean; diplomaticAction?: DiplomaticAction; error?: string };
export function executeGift(
  state: GameState,
  countryId: string,
  gift: Partial<GameState['resources']>
): { success: boolean; newResources?: Partial<GameState['resources']>; newRelationship?: Relationship; giftRecord?: any; error?: string };
export function executeGift(...args: any[]): any {
  // 旧接口：executeGift(state, countryId, gift)
  if (args.length === 3 && args[0] && typeof args[0] === 'object' && 'resources' in args[0] && 'diplomacy' in args[0]) {
    const state = args[0] as GameState;
    const countryId = args[1] as string;
    const gift = (args[2] || {}) as Partial<Resources>;

    const tradableKeys = Object.keys(BASE_MARKET_PRICES) as (keyof MarketPrices)[];
    const calcValue = (bundle: Partial<Resources>): number => {
      let total = 0;
      for (const key of tradableKeys) {
        const qty = (bundle as any)[key] || 0;
        if (qty) total += (state.diplomacy.marketPrices as any)[key] * qty;
      }
      return total;
    };

    // 资源扣除
    const newResources: Partial<Resources> = {};
    for (const key of tradableKeys) {
      const give = (gift as any)[key] || 0;
      if (give) {
        (newResources as any)[key] = ((state.resources as any)[key] || 0) - give;
      }
    }

    const giftValue = calcValue(gift);
    const efficiency = DIPLOMACY_CONFIG.giftEfficiencyRate;
    const relChange = Math.max(0, giftValue * efficiency);

    const currentRel = state.diplomacy.relationships[countryId] || { level: 'neutral', value: 50, atWar: false } as Relationship;
    const newValue = Math.max(0, Math.min(100, currentRel.value + relChange));
    const newRelationship: Relationship = {
      level: getRelationshipLevel(newValue),
      value: Math.round(newValue * 10) / 10,
      atWar: currentRel.atWar || false,
    };

    const giftRecord = {
      id: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      countryId,
      countryName: (state.diplomacy.discoveredCountries.find(c => c.id === countryId)?.name) || '未知国家',
      timestamp: state.gameTime,
      giftDetails: gift,
      relationshipChange: relChange,
    };

    return { success: true, newResources, newRelationship, giftRecord };
  }

  // 新接口：executeGift(nation, giftValue, gameTime)
  const nation = args[0] as Nation;
  const giftValue = args[1] as number;
  const gameTime = args[2] as number;

  if (nation.isDestroyed) {
    return { success: false, error: '该国家已被消灭' };
  }
  if (nation.isAtWar) {
    return { success: false, error: '战争期间无法赠礼' };
  }
  const relationshipChange = calculateGiftEffect(giftValue, nation);
  const diplomaticAction: DiplomaticAction = {
    id: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'gift',
    nationId: nation.id,
    timestamp: gameTime,
    cost: giftValue,
    result: `提升关系 +${relationshipChange.toFixed(1)}`,
    relationshipChange
  };
  return { success: true, diplomaticAction };
}

// 检查佣兵可用性
export function getAvailableMercenaries(nation: Nation): MercenaryUnit[] {
  if (nation.isDestroyed || nation.isAtWar) {
    return [];
  }
  
  const available: MercenaryUnit[] = [];
  
  for (const mercenary of Object.values(MERCENARY_UNITS)) {
    // 检查关系要求
    const meetsRelationship = 
      (mercenary.requirements.relationship === 'neutral' && nation.relationship !== 'hostile') ||
      (mercenary.requirements.relationship === 'friendly' && nation.relationship === 'friendly');
    
    const meetsValue = nation.relationshipValue >= mercenary.requirements.minRelationshipValue;
    
    // 随机可用性
    const isAvailable = Math.random() < DIPLOMACY_CONFIG.mercenaryAvailabilityChance;
    
    if (meetsRelationship && meetsValue && isAvailable) {
      available.push(mercenary);
    }
  }
  
  return available;
}

// 雇佣佣兵
export function hireMercenary(
  nation: Nation,
  mercenaryId: string,
  gameTime: number
): { success: boolean; diplomaticAction?: DiplomaticAction; mercenaryContract?: any; error?: string } {
  const mercenary = MERCENARY_UNITS[mercenaryId];
  if (!mercenary) {
    return { success: false, error: '佣兵单位不存在' };
  }
  
  const available = getAvailableMercenaries(nation);
  if (!available.find(m => m.id === mercenaryId)) {
    return { success: false, error: '该佣兵单位当前不可用' };
  }
  
  const diplomaticAction: DiplomaticAction = {
    id: `hire_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'hire_mercenaries',
    nationId: nation.id,
    timestamp: gameTime,
    cost: mercenary.cost,
    result: `雇佣了${mercenary.name}`,
    relationshipChange: 1 // 雇佣佣兵略微提升关系
  };
  
  const mercenaryContract = {
    unitId: mercenaryId,
    hiredAt: gameTime,
    expiresAt: gameTime + mercenary.duration * 24 * 60 * 60 * 1000, // 转换为毫秒
    cost: mercenary.cost
  };
  
  return { success: true, diplomaticAction, mercenaryContract };
}

// 宣战
export function declareWar(
  nation: Nation,
  gameTime: number
): { success: boolean; diplomaticAction?: DiplomaticAction; error?: string } {
  if (nation.isDestroyed) {
    return { success: false, error: '该国家已被消灭' };
  }
  
  if (nation.isAtWar) {
    return { success: false, error: '已经处于战争状态' };
  }
  
  const diplomaticAction: DiplomaticAction = {
    id: `war_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'declare_war',
    nationId: nation.id,
    timestamp: gameTime,
    cost: DIPLOMACY_CONFIG.warDeclarationCost,
    result: `向${nation.name}宣战`,
    relationshipChange: -50 // 宣战大幅降低关系
  };
  
  return { success: true, diplomaticAction };
}

// 生成袭扰事件
export function generateRaidEvent(
  nation: Nation,
  gameTime: number,
  playerMilitaryStrength: number
): RaidEvent {
  // 袭扰军队实力基于国家军事实力和随机因素
  const baseStrength = nation.militaryStrength * (0.3 + Math.random() * 0.4);
  const raidStrength = Math.round(baseStrength);
  
  // 计算损失（基于实力对比）
  const strengthRatio = raidStrength / Math.max(playerMilitaryStrength, 1);
  const damageMultiplier = Math.min(1, strengthRatio * 0.5);
  
  const populationLoss = Math.round(50 + Math.random() * 100 * damageMultiplier);
  const resourceLoss: Partial<MarketPrices> = {
    food: Math.round(100 + Math.random() * 200 * damageMultiplier),
    wood: Math.round(50 + Math.random() * 100 * damageMultiplier),
    stone: Math.round(30 + Math.random() * 60 * damageMultiplier)
  };
  
  const raidEvent: RaidEvent = {
    id: `raid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nationId: nation.id,
    timestamp: gameTime,
    strength: raidStrength,
    damage: {
      population: populationLoss,
      resources: resourceLoss
    },
    playerLosses: {
      population: populationLoss,
      resources: resourceLoss
    },
    resolved: false
  };
  
  return raidEvent;
}

// 更新国家关系（时间衰减）
export function updateNationRelationships(nations: Nation[], deltaTime: number): Nation[] {
  return nations.map(nation => {
    if (nation.isDestroyed) return nation;
    
    // 计算关系衰减
    let decayRate = DIPLOMACY_CONFIG.relationshipDecayRate;
    
    // 特性影响衰减速度
    for (const trait of nation.traits) {
      if (trait.effects.relationshipDecay) {
        decayRate += trait.effects.relationshipDecay;
      }
    }
    
    // 战争状态下关系持续恶化
    if (nation.isAtWar) {
      decayRate += 0.5;
    }
    
    // 应用衰减（每月）
    const monthsPassed = deltaTime / (30 * 24 * 60 * 60 * 1000);
    const decay = decayRate * monthsPassed;
    
    let newRelationshipValue = nation.relationshipValue - decay;
    newRelationshipValue = Math.max(0, Math.min(100, newRelationshipValue));
    
    const newRelationshipLevel = getRelationshipLevel(newRelationshipValue);
    const newDiscount = calculateRelationshipDiscount(newRelationshipLevel, newRelationshipValue);
    
    return {
      ...nation,
      relationshipValue: Math.round(newRelationshipValue * 10) / 10,
      relationship: newRelationshipLevel,
      relationshipDiscount: newDiscount
    };
  });
}

// 应用关系变化
export function applyRelationshipChange(nation: Nation, change: number): Nation {
  const newValue = Math.max(0, Math.min(100, nation.relationshipValue + change));
  const newLevel = getRelationshipLevel(newValue);
  const newDiscount = calculateRelationshipDiscount(newLevel, newValue);
  
  return {
    ...nation,
    relationshipValue: Math.round(newValue * 10) / 10,
    relationship: newLevel,
    relationshipDiscount: newDiscount
  };
}

// 获取国家提供的外交效果
export function getNationEffects(nation: Nation): DiplomaticEffect[] {
  const effects: DiplomaticEffect[] = [];
  
  // 特殊宝物效果（仅在国家被消灭后获得）
  if (nation.isDestroyed && nation.specialTreasure) {
    const treasure = SPECIAL_TREASURES[nation.specialTreasure];
    if (treasure) {
      for (const effect of treasure.effects) {
        effects.push({
          id: `treasure_${nation.specialTreasure}_${effect.type}`,
          name: `${treasure.name}: ${effect.description}`,
          description: treasure.description,
          source: nation.name,
          type: effect.type as any,
          value: effect.value,
          appliedAt: Date.now()
        });
      }
    }
  }
  
  return effects;
}

// 外交系统类
export class DiplomacySystem {
  static generateMarketPrices = generateMarketPrices;
  static calculateRelationshipDiscount = calculateRelationshipDiscount;
  static getRelationshipLevel = getRelationshipLevel;
  // 兼容旧调用名
  static calculateRelationshipLevel = getRelationshipLevel;
  static generateNation = generateNation;
  static calculateTradePrice = calculateTradePrice;
  static executeTrade = executeTrade;
  static calculateGiftEffect = calculateGiftEffect;
  static executeGift = executeGift;
  static getAvailableMercenaries = getAvailableMercenaries;
  static hireMercenary = hireMercenary;
  static declareWar = declareWar;
  static generateRaidEvent = generateRaidEvent;
  static updateNationRelationships = updateNationRelationships;
  static applyRelationshipChange = applyRelationshipChange;
  static getNationEffects = getNationEffects;
  // 兼容旧调用：关系衰减
  static calculateRelationshipDecay = calculateRelationshipDecay;
  // 新增：初始关系生成（旧接口）
  static generateInitialRelationship = generateInitialRelationship;
}

export default {
  generateMarketPrices,
  calculateRelationshipDiscount,
  getRelationshipLevel,
  generateNation,
  calculateTradePrice,
  executeTrade,
  calculateGiftEffect,
  executeGift,
  getAvailableMercenaries,
  hireMercenary,
  declareWar,
  generateRaidEvent,
  updateNationRelationships,
  applyRelationshipChange,
  getNationEffects
};