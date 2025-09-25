'use client';

import { GameState } from '@/types/game';
import { BUILDING_DEFINITIONS } from './building-data';

// 效果类型枚举
export enum EffectType {
  STABILITY = 'stability',
  CORRUPTION = 'corruption',
  POPULATION_GROWTH = 'population_growth',
  RESOURCE_PRODUCTION = 'resource_production',
  RESEARCH_SPEED = 'research_speed',
  BUILDING_COST = 'building_cost',
  MILITARY_STRENGTH = 'military_strength',
  TRADE_INCOME = 'trade_income',
  INHERITANCE = 'inheritance'
}

// 效果来源类型
export enum EffectSourceType {
  BASE = 'base',
  TECHNOLOGY = 'technology',
  BUILDING = 'building',
  CHARACTER = 'character',
  ARTIFACT = 'artifact',
  EVENT = 'event',
  INHERITANCE = 'inheritance'
}

// 单个效果接口
export interface Effect {
  id: string;
  name: string;
  description: string;
  type: EffectType;
  value: number;
  isPercentage: boolean;
  source: EffectSource;
  duration?: number; // -1 表示永久，undefined 表示永久，正数表示剩余回合
  icon?: string;
}

// 效果来源接口
export interface EffectSource {
  type: EffectSourceType;
  id: string;
  name: string;
}

// 效果系统类
export class EffectsSystem {
  private effects: Effect[] = [];

  private normalize(val: number): number {
    // 统一浮点精度，减少 0.60000000001 等误差
    const n = Number(val) || 0;
    return Number(n.toFixed(6));
  }

  // 添加效果
  addEffect(effect: Effect | Omit<Effect, 'id'>): void {
    // 如果没有id，生成一个
    const effectWithId: Effect = 'id' in effect ? effect : {
      ...effect,
      id: `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // 规范化数值精度
    (effectWithId as any).value = this.normalize((effectWithId as any).value);

    // 检查是否已存在相同ID的效果
    const existingIndex = this.effects.findIndex(e => e.id === effectWithId.id);
    if (existingIndex >= 0) {
      // 更新现有效果
      this.effects[existingIndex] = effectWithId;
    } else {
      // 添加新效果
      this.effects.push(effectWithId);
    }

    // 生命周期事件：通知效果已添加
    try {
      const { GlobalEventBus } = require('@/lib/event-bus/event-bus');
      GlobalEventBus.emit('effect-added', effectWithId);
    } catch {}
  }

  // 移除效果
  removeEffect(effectId: string): void {
    this.effects = this.effects.filter(e => e.id !== effectId);
  }

  // 按来源移除效果
  removeEffectsBySource(sourceType: EffectSourceType, sourceId?: string): void {
    const removed: Effect[] = [];
    this.effects = this.effects.filter(e => {
      const keep =
        e.source.type !== sourceType ||
        (sourceId ? e.source.id !== sourceId : false);
      if (!keep) removed.push(e);
      return keep;
    });
    // 生命周期事件：通知效果已移除
    if (removed.length) {
      try {
        const { GlobalEventBus } = require('@/lib/event-bus/event-bus');
        removed.forEach(e => GlobalEventBus.emit('effect-removed', e));
      } catch {}
    }
  }

  // 获取所有效果
  getAllEffects(): Effect[] {
    return [...this.effects];
  }

  // 获取所有活跃效果（别名方法，与getAllEffects相同）
  getActiveEffects(): Effect[] {
    return this.getAllEffects();
  }

  // 按类型获取效果
  getEffectsByType(type: EffectType): Effect[] {
    return this.effects.filter(e => e.type === type);
  }

  // 按来源类型获取效果
  getEffectsBySourceType(sourceType: EffectSourceType): Effect[] {
    return this.effects.filter(e => e.source.type === sourceType);
  }

  // 按来源获取效果（支持可选的sourceId过滤）
  getEffectsBySource(sourceType: EffectSourceType, sourceId?: string): Effect[] {
    return this.effects.filter(e => {
      if (e.source.type !== sourceType) return false;
      if (sourceId && e.source.id !== sourceId) return false;
      return true;
    });
  }

  // 计算特定类型效果的总值
  calculateTotalEffect(type: EffectType): number {
    // 默认：直接求和（稳定度/腐败度为点数）
    const effects = this.getEffectsByType(type);
    const sum = effects.reduce((total, effect) => total + effect.value, 0);
    return this.normalize(sum);
  }

  // 计算特定类型效果的详细总值（绝对值和百分比分开）
  calculateDetailedTotalEffect(type: EffectType): { absolute: number; percentage: number } {
    const effects = this.getEffectsByType(type);
    let absolute = 0;
    let percentage = 0;

    effects.forEach(effect => {
      if (effect.isPercentage) {
        percentage += effect.value;
      } else {
        absolute += effect.value;
      }
    });

    return { absolute, percentage };
  }

  // 更新持续时间（每回合调用）
  updateDurations(): void {
    this.effects = this.effects.filter(effect => {
      if (effect.duration === undefined || effect.duration === -1) {
        return true; // 永久效果
      }
      effect.duration--;
      return effect.duration > 0;
    });
  }

  // 清空所有效果
  clear(): void {
    this.effects = [];
  }

  // 从游戏状态更新效果系统
  updateFromGameState(gameState: GameState): void {
    // 清空现有效果
    this.clear();
    
    // 初始化基础效果
    this.initializeBaseEffects(gameState);
    
    // 更新科技效果
    this.updateTechnologyEffects(gameState);
    
    // 更新建筑效果
    this.updateBuildingEffects(gameState);

    // 映射临时事件效果为展示标签
    this.updateTemporaryEventEffects(gameState);
    
    // 更新持续时间（仅针对本系统内部duration效果；临时效果由temporary-effects管理）
    this.updateDurations();
  }

  // 初始化基础效果
  initializeBaseEffects(gameState: GameState): void {
    // 清空现有效果
    this.clear();

    // 添加稳定度（与侧边栏显示的当前稳定度一致，用于告知国家效果）
    this.addEffect({
      id: 'base_stability',
      name: '稳定度',
      description: `当前文明的稳定程度：${gameState.stability}`,
      type: EffectType.STABILITY,
      value: gameState.stability,
      isPercentage: false,
      source: {
        type: EffectSourceType.BASE,
        id: 'stability',
        name: '基础稳定度'
      },
      duration: -1
    });

    // 添加腐败度效果
    this.addEffect({
      id: 'base_corruption',
      name: '腐败度',
      description: `文明内部的腐败程度：${gameState.corruption}`,
      type: EffectType.CORRUPTION,
      value: gameState.corruption,
      isPercentage: false,
      source: {
        type: EffectSourceType.BASE,
        id: 'corruption',
        name: '基础腐败度'
      },
      duration: -1
    });

    // 注意：稳定度和腐败度的具体影响现在在EffectsPanel组件中计算和显示
    // 这里不再生成单独的研究速度效果，避免重复和混乱
  }

  // 根据游戏状态更新科技效果
  updateTechnologyEffects(gameState: GameState): void {
    // 移除所有科技效果
    this.effects = this.effects.filter(e => e.source.type !== EffectSourceType.TECHNOLOGY);

    // 重新添加已研究科技的效果
    Object.entries(gameState.technologies).forEach(([techId, tech]) => {
      if (tech.researched && Array.isArray(tech.effects)) {
        tech.effects.forEach((effect, idx) => {
          let mappedType: EffectType | null = null;
          let isPercentage = false;

          switch (effect.type) {
            case 'resource_production_bonus':
              mappedType = EffectType.RESOURCE_PRODUCTION;
              isPercentage = true;
              break;
            case 'research_speed_bonus':
              mappedType = EffectType.RESEARCH_SPEED;
              isPercentage = true;
              break;
            case 'stability_bonus':
              mappedType = EffectType.STABILITY;
              isPercentage = false;
              break;
            case 'population_growth_bonus':
              mappedType = EffectType.POPULATION_GROWTH;
              isPercentage = true;
              break;
            case 'military_bonus':
              mappedType = EffectType.MILITARY_STRENGTH;
              isPercentage = true;
              break;
            case 'building_efficiency_bonus':
              // 作为整体生产效率加成展示
              mappedType = EffectType.RESOURCE_PRODUCTION;
              isPercentage = true;
              break;
            case 'resource_storage_bonus':
              // 储存上限效果由资源系统/状态处理，这里不加入效果面板，避免误导
              mappedType = null;
              break;
            case 'global_bonus':
            case 'resource_multiplier':
              // 全局或倍率类效果由其他系统计算展示，这里暂不映射
              mappedType = null;
              break;
            default:
              // 未映射的类型先忽略，避免破坏 UI
              mappedType = null;
          }

          if (mappedType !== null) {
            this.addEffect({
              id: `tech_${techId}_${idx}_${effect.type}`,
              name: tech.name,
              description: (effect as any).description ?? `${effect.type}${(effect as any).target ? ` (${(effect as any).target})` : ''}`,
              type: mappedType,
              value: (effect as any).value,
              isPercentage,
              source: {
                type: EffectSourceType.TECHNOLOGY,
                id: techId,
                name: tech.name
              }
            });
          }
        });
      }
    });
  }

  // 根据游戏状态更新建筑效果
  updateBuildingEffects(gameState: GameState): void {
    // 移除所有建筑效果
    this.effects = this.effects.filter(e => e.source.type !== EffectSourceType.BUILDING);

    // 重新添加建筑效果
    Object.entries(gameState.buildings).forEach(([buildingId, building]) => {
      if (building.count > 0) {
        const def = BUILDING_DEFINITIONS[building.buildingId];
        if (!def) return;

        // 处理定义中的 effects（通用数值类效果）
        if (Array.isArray(def.effects)) {
          def.effects.forEach((effect, idx) => {
            let mappedType: EffectType | null = null;
            let isPercentage = !!effect.isPercentage;

            switch (effect.type) {
              case 'resource_production':
                mappedType = EffectType.RESOURCE_PRODUCTION;
                // 如果未显式标记，则默认为百分比加成
                if (effect.isPercentage === undefined) isPercentage = true;
                break;
              case 'research_bonus':
                mappedType = EffectType.RESEARCH_SPEED;
                if (effect.isPercentage === undefined) isPercentage = true;
                break;
              case 'stability_bonus':
                mappedType = EffectType.STABILITY;
                break;
              case 'defense_bonus':
                mappedType = EffectType.MILITARY_STRENGTH;
                break;
              case 'worker_efficiency':
                mappedType = EffectType.RESOURCE_PRODUCTION;
                if (effect.isPercentage === undefined) isPercentage = true;
                break;
              case 'resource_storage':
              case 'population_capacity':
                // 展示层忽略这两类，实际数值由其他系统处理
                mappedType = null;
                break;
              default:
                mappedType = null;
            }

            if (mappedType !== null) {
              this.addEffect({
                id: `building_${buildingId}_${idx}_${effect.type}`,
                name: `${def.name} (${building.count}个)`,
                description: effect.description ?? `${effect.type}${effect.target ? ` (${effect.target})` : ''}`,
                type: mappedType,
                value: effect.value * building.count,
                isPercentage,
                source: {
                  type: EffectSourceType.BUILDING,
                  id: buildingId,
                  name: def.name
                }
              });
            }
          });
        }

        // 可选：将 specialEffects 也映射为展示效果
        if (Array.isArray(def.specialEffects)) {
          def.specialEffects.forEach((se, idx) => {
            let mappedType: EffectType | null = null;
            let isPercentage = false;
            switch (se.type) {
              case 'stability':
                mappedType = EffectType.STABILITY; break;
              case 'research_speed':
                mappedType = EffectType.RESEARCH_SPEED; isPercentage = true; break;
              case 'defense':
                mappedType = EffectType.MILITARY_STRENGTH; break;
              case 'population_growth':
                mappedType = EffectType.POPULATION_GROWTH; break;
              default:
                mappedType = null;
            }
            if (mappedType !== null) {
              this.addEffect({
                id: `building_${buildingId}_special_${idx}_${se.type}`,
                name: `${def.name} (${building.count}个)`,
                description: se.description,
                type: mappedType,
                value: se.value * building.count,
                isPercentage,
                source: {
                  type: EffectSourceType.BUILDING,
                  id: buildingId,
                  name: def.name
                }
              });
            }
          });
        }
      }
    });
  }

  // 从游戏状态映射临时效果（事件来源）
  updateTemporaryEventEffects(gameState: GameState): void {
    // 先移除旧的事件来源效果
    this.effects = this.effects.filter(e => e.source.type !== EffectSourceType.EVENT);

    let tempMod: any;
    try {
      tempMod = require('./temporary-effects');
    } catch {
      tempMod = null;
    }
    const getActive = tempMod?.getActiveTemporaryEffects;
    const active: any[] = typeof getActive === 'function' ? getActive(gameState) : (gameState.temporaryEffects || []);

    const labelOfTarget = (t: string) => {
      const map: Record<string, string> = {
        food_production: '食物生产',
        wood_production: '木材生产',
        stone_production: '石材生产',
        tools_production: '工具生产',
        iron_production: '铁生产',
        money_income: '货币收入',
        stability: '稳定度',
        research_speed: '科技研发速度'
      };
      return map[t] || t.replace(/_/g, ' ');
    };

    const typeOfTarget = (t: string): EffectType => {
      if (t.endsWith('_production')) return EffectType.RESOURCE_PRODUCTION;
      if (t.endsWith('_income')) return EffectType.TRADE_INCOME;
      if (t === 'stability') return EffectType.STABILITY;
      if (t === 'research_speed') return EffectType.RESEARCH_SPEED;
      return EffectType.RESOURCE_PRODUCTION;
    };

    for (const te of active) {
      const mods: any[] = Array.isArray(te.effects) ? te.effects : [];
      for (const m of mods) {
        const isPct = m.type === 'percentage';
        const val = isPct ? m.value : m.value; // 百分比值直接用数值，EffectsPanel 会按 isPercentage 格式化
        const etype = typeOfTarget(String(m.target));
        this.addEffect({
          id: te.id,
          name: te.name,
          description: te.description,
          type: etype,
          value: val,
          isPercentage: isPct,
          source: {
            type: EffectSourceType.EVENT,
            id: te.source,
            name: te.name
          }
        });
      }
    }
  }

  // 获取效果的显示信息
  getEffectDisplayInfo(effect: Effect): {
    displayValue: string;
    color: string;
    bgColor: string;
    borderColor: string;
  } {
    const isPositive = effect.value > 0;
    const displayValue = effect.isPercentage 
      ? `${isPositive ? '+' : ''}${effect.value}%`
      : `${isPositive ? '+' : ''}${effect.value}`;

    let color: string;
    let bgColor: string;
    let borderColor: string;

    // 根据效果类型和数值确定颜色
    if (effect.type === EffectType.CORRUPTION) {
      // 腐败度：值越高越坏
      color = effect.value > 0 ? 'text-red-300' : 'text-green-300';
      bgColor = effect.value > 0 ? 'bg-red-900/30' : 'bg-green-900/30';
      borderColor = effect.value > 0 ? 'border-red-500/30' : 'border-green-500/30';
    } else {
      // 其他效果：正值好，负值坏
      color = isPositive ? 'text-green-300' : 'text-red-300';
      bgColor = isPositive ? 'bg-green-900/30' : 'bg-red-900/30';
      borderColor = isPositive ? 'border-green-500/30' : 'border-red-500/30';
    }

    return { displayValue, color, bgColor, borderColor };
  }
}

// 全局效果系统实例
export const globalEffectsSystem = new EffectsSystem();