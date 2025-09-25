import { GameState } from '@/types/game';
import { getResourceDisplayName } from './event-utils';

// 临时效果接口
export interface TemporaryEffect {
  id: string;
  name: string; // 效果来源名称（如"丰收"）
  description: string; // 效果描述（如"食物产出+20%"）
  type: 'buff' | 'debuff' | 'mixed'; // 效果类型
  startTime: number; // 开始时间（游戏时间，天）
  duration: number; // 持续时间（天）
  effects: EffectModifier[]; // 效果修饰符数组
  source: string; // 效果来源（事件ID等）
  icon?: string; // 效果图标
}

// 效果修饰符
export interface EffectModifier {
  target: string; // 目标属性（如 'food_production', 'stability' 等）
  type: 'percentage' | 'absolute'; // 百分比修饰或绝对值修饰
  value: number; // 修饰值
}

/**
 * 添加临时效果
 * @param gameState 游戏状态
 * @param effect 临时效果
 */
export function addTemporaryEffect(gameState: GameState, effect: Omit<TemporaryEffect, 'id' | 'startTime'>): TemporaryEffect {
  const newEffect: TemporaryEffect = {
    ...effect,
    id: `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startTime: gameState.gameTime // 使用游戏时间
  };

  if (!gameState.temporaryEffects) {
    gameState.temporaryEffects = [];
  }

  // 去重：同源同名且效果修饰符完全一致、且仍在有效期内则不重复添加
  const now = gameState.gameTime;
  const isSameModifierSet = (a: EffectModifier[], b: EffectModifier[]) => {
    if (a.length !== b.length) return false;
    const key = (m: EffectModifier) => `${m.target}|${m.type}|${m.value}`;
    const setA = a.map(key).sort().join(',');
    const setB = b.map(key).sort().join(',');
    return setA === setB;
  };
  const exists = gameState.temporaryEffects.some(e => 
    now < e.startTime + e.duration &&
    e.source === newEffect.source &&
    e.name === newEffect.name &&
    isSameModifierSet(e.effects, newEffect.effects)
  );
  if (exists) {
    return {
      ...newEffect,
      id: `${newEffect.id}_dedup`
    };
  }

  gameState.temporaryEffects.push(newEffect);
  return newEffect;
}

/**
 * 移除临时效果
 * @param gameState 游戏状态
 * @param effectId 效果ID
 */
export function removeTemporaryEffect(gameState: GameState, effectId: string): void {
  if (!gameState.temporaryEffects) return;
  
  const index = gameState.temporaryEffects.findIndex(effect => effect.id === effectId);
  if (index !== -1) {
    gameState.temporaryEffects.splice(index, 1);
  }
}

/**
 * 获取活跃的临时效果
 * @param gameState 游戏状态
 * @returns 活跃的临时效果列表
 */
export function getActiveTemporaryEffects(gameState: GameState): TemporaryEffect[] {
  if (!gameState.temporaryEffects) return [];
  
  const currentGameTime = gameState.gameTime;
  return gameState.temporaryEffects.filter(effect => {
    return currentGameTime < effect.startTime + effect.duration;
  });
}

/**
 * 清理过期的临时效果
 * @param gameState 游戏状态
 */
export function cleanupExpiredEffects(gameState: GameState): void {
  if (!gameState.temporaryEffects) return;
  
  const currentGameTime = gameState.gameTime;
  gameState.temporaryEffects = gameState.temporaryEffects.filter(effect => {
    return currentGameTime < effect.startTime + effect.duration;
  });
}

/**
 * 获取效果剩余时间（天）
 * @param effect 临时效果
 * @param currentGameTime 当前游戏时间
 * @returns 剩余天数
 */
export function getRemainingDays(effect: TemporaryEffect, currentGameTime: number): number {
  const remaining = effect.startTime + effect.duration - currentGameTime;
  return Math.max(0, remaining);
}

/**
 * 计算临时效果对特定属性的总修饰值
 * @param gameState 游戏状态
 * @param target 目标属性
 * @param baseValue 基础值
 * @returns 修饰后的值
 */
export function applyTemporaryEffects(gameState: GameState, target: string, baseValue: number): number {
  const activeEffects = getActiveTemporaryEffects(gameState);
  let result = baseValue;
  let percentageModifier = 0;
  let absoluteModifier = 0;
  
  // 应用效果修饰符
  for (const effect of activeEffects) {
    for (const modifier of effect.effects) {
      if (modifier.target === target) {
        if (modifier.type === 'percentage') {
          percentageModifier += modifier.value;
        } else {
          absoluteModifier += modifier.value;
        }
      }
    }
  }
  
  // 先应用百分比修饰，再应用绝对值修饰
  result = result * (1 + percentageModifier / 100) + absoluteModifier;
  
  // 不再对结果做非负钳制，避免把净消耗抬为0而造成“+X/s”错觉
  return result;
}

/**
 * 格式化效果持续时间显示
 * @param remainingDays 剩余天数
 * @returns 格式化的时间字符串
 */
export function formatEffectDuration(remainingDays: number): string {
  if (remainingDays <= 0) {
    return '已过期';
  }
  
  if (remainingDays < 1) {
    const hours = Math.ceil(remainingDays * 24);
    return `${hours}小时`;
  }
  
  const days = Math.floor(remainingDays);
  const hours = Math.floor((remainingDays - days) * 24);
  
  if (days > 0 && hours > 0) {
    return `${days}天${hours}小时`;
  } else if (days > 0) {
    return `${days}天`;
  } else {
    return `${hours}小时`;
  }
}

/**
 * 从事件选项创建临时效果（新格式）
 * @param choiceId 选项ID
 * @param eventId 事件ID
 * @param eventName 事件名称
 * @param effects 效果对象
 * @param duration 持续时间（天）
 * @param gameState 游戏状态
 * @returns 临时效果对象或null
 */
export function createTemporaryEffectFromEventChoice(
  choiceId: string,
  eventId: string,
  eventName: string,
  effects: any,
  duration: number,
  gameState: GameState
): TemporaryEffect | null {
  if (!effects || duration <= 0) {
    return null;
  }
  
  const effectModifiers: EffectModifier[] = [];
  let description = '临时效果';
  
  // 处理不同类型的效果
  switch (effects.type) {
    case 'resource_production':
      effectModifiers.push({
        target: `${effects.target}_production`,
        type: 'percentage',
        value: effects.modifier * 100 // 转换为百分比
      });
      
      const displayName = getResourceDisplayName(effects.target);
      description = `${displayName}生产${effects.modifier > 0 ? '+' : ''}${(effects.modifier * 100).toFixed(0)}%`;
      break;
      
    case 'resource_income':
      effectModifiers.push({
        target: `${effects.target}_income`,
        type: 'absolute',
        value: effects.modifier
      });
      
      const incomeDisplayName = getResourceDisplayName(effects.target);
      description = `${incomeDisplayName}收入+${effects.modifier}/月`;
      break;
      
    case 'resource_percentage':
      // 这种类型通常是一次性效果，不适合临时效果系统
      return null;
      
    case 'resource_per_population':
      // 这种类型通常是一次性效果，不适合临时效果系统
      return null;
      
    default:
      return null;
  }
  
  if (effectModifiers.length === 0) {
    return null;
  }
  
  return {
    id: `${eventId}_${choiceId}_${Date.now()}`,
    name: eventName,
    description,
    type: 'buff',
    startTime: gameState.gameTime,
    duration,
    effects: effectModifiers,
    source: eventId,
    icon: '⬆️'
  };
}

/**
 * 从事件选项创建临时效果（旧格式，保持兼容性）
 * @param choiceId 选项ID
 * @param eventId 事件ID
 * @param eventName 事件名称
 * @param effectType 效果类型
 * @param duration 持续时间（天）
 * @param consequences 后果数组
 * @param gameState 游戏状态
 * @returns 临时效果对象或null
 */
export function createTemporaryEffectFromChoice(
  choiceId: string,
  eventId: string,
  eventName: string,
  effectType: string,
  duration: number,
  consequences: string[],
  gameState: GameState
): TemporaryEffect | null {
  if (effectType !== 'buff' && effectType !== 'mixed') {
    return null;
  }
  
  const effects: EffectModifier[] = [];
  let name = eventName;
  let description = '临时效果';
  
  // 解析后果字符串，创建效果修饰符
  for (const consequence of consequences) {
    if (consequence.includes('_production:')) {
      const [target, valueStr] = consequence.split(':');
      const isPercentage = valueStr.includes('%');
      const value = parseFloat(valueStr.replace('%', ''));
      
      effects.push({
        target,
        type: isPercentage ? 'percentage' : 'absolute',
        value
      });
      
      // 设置效果描述
      const resourceType = target.replace('_production', '');
      const displayName = getResourceDisplayName(resourceType);
      description = `${displayName}生产${value > 0 ? '+' : ''}${value}${isPercentage ? '%' : ''}`;
    } else if (consequence.includes('stability:')) {
      const [, valueStr] = consequence.split(':');
      const value = parseFloat(valueStr);
      
      effects.push({
        target: 'stability',
        type: 'absolute',
        value
      });
      
      description = `稳定度${value > 0 ? '+' : ''}${value}`;
    }
  }
  
  if (effects.length === 0) {
    return null;
  }
  
  return {
    id: `${eventId}_${choiceId}_${Date.now()}`,
    name,
    description,
    type: effectType as 'buff' | 'mixed',
    startTime: gameState.gameTime,
    duration,
    effects,
    source: eventId,
    icon: effectType === 'buff' ? '⬆️' : '⚡'
  };
}