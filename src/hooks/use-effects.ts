'use client';

import { useGameStore } from '@/lib/game-store';
import { Effect, EffectType, EffectSourceType } from '@/lib/effects-system';
import { useMemo } from 'react';

// 效果显示信息
interface EffectDisplayInfo {
  id: string;
  name: string;
  description: string;
  value: number;
  type: EffectType;
  sourceType: EffectSourceType;
  sourceId: string;
  sourceName: string;
  isPositive: boolean;
}

// 按来源分组的效果
interface EffectsBySource {
  sourceType: EffectSourceType;
  sourceId: string;
  sourceName: string;
  effects: EffectDisplayInfo[];
}

// 引入临时效果工具以获取活跃临时效果和剩余时间
import { getActiveTemporaryEffects, getRemainingDays, TemporaryEffect } from '@/lib/temporary-effects';

export const useEffects = () => {
  const { getActiveEffects, getEffectsByType, getEffectsBySource, calculateEffectTotal } = useGameStore();
  // 订阅effectsVersion用于触发重渲染
  const effectsVersion = useGameStore((s) => s.effectsVersion);
  // 订阅 gameTime 以便让临时效果的剩余时间在UI上实时更新
  const gameTime = useGameStore((s) => s.gameState.gameTime);
  const gameState = useGameStore((s) => s.gameState);

  // 将单个临时效果映射为一个可在 EffectsPanel 中展示的伪 Effect
  const mapTemporaryEffectToEffect = (te: TemporaryEffect): Effect & { displayName?: string } => {
    // 统计百分比与绝对值修饰（按事件级整合）
    let percentageTotal = 0;
    let absoluteTotal = 0;

    for (const m of te.effects) {
      if (m.type === 'percentage') {
        percentageTotal += m.value; // m.value 已是百分比（如 15 表示+15%）
      } else {
        absoluteTotal += m.value;
      }
    }

    // 以百分比优先作为展示（更贴近“产量+15%”）
    const usePercentage = Math.abs(percentageTotal) >= Math.abs(absoluteTotal);
    const value = usePercentage ? percentageTotal : absoluteTotal;

    // 标签仅显示事件名
    const displayName = te.name;

    return {
      id: te.id,
      name: te.name,
      description: te.description,
      type: EffectType.RESOURCE_PRODUCTION,
      value: Number(value.toFixed(2)),
      isPercentage: usePercentage,
      source: {
        type: EffectSourceType.EVENT,
        id: te.source,
        name: te.name,
      },
      // 将剩余时间放到 tooltip（EffectTooltip）里处理，这里不展示
      duration: undefined,
      icon: te.icon ?? '✨',
      // 提供 EffectsPanel 的显示覆写
      displayName,
    } as unknown as Effect & { displayName?: string };
  };

  // 获取所有活跃效果（系统效果 + 临时事件效果）
  const activeEffects = useMemo(() => {
    const systemEffects = getActiveEffects();

    // 将活跃临时效果映射为展示用效果
    const activeTemporary = getActiveTemporaryEffects(gameState).map(mapTemporaryEffectToEffect);

    // 合并后返回：将事件类效果排在前面以提升可见度
    return [...activeTemporary, ...systemEffects];
  }, [getActiveEffects, effectsVersion, gameTime, gameState]);

  // 获取效果显示信息
  const getEffectDisplayInfo = (effect: Effect): EffectDisplayInfo => {
    const getSourceName = (sourceType: EffectSourceType, sourceId: string): string => {
      switch (sourceType) {
        case EffectSourceType.BASE:
          return '基础';
        case EffectSourceType.TECHNOLOGY:
          return `科技: ${sourceId}`;
        case EffectSourceType.BUILDING:
          return `建筑: ${sourceId}`;
        case EffectSourceType.CHARACTER:
          return `人物: ${sourceId}`;
        case EffectSourceType.ARTIFACT:
          return `神器: ${sourceId}`;
        case EffectSourceType.EVENT:
          return `事件: ${sourceId}`;
        case EffectSourceType.INHERITANCE:
          return `继承: ${sourceId}`;
        default:
          return sourceId;
      }
    };

    const getEffectName = (type: EffectType): string => {
      switch (type) {
        case EffectType.STABILITY:
          return '稳定度';
        case EffectType.CORRUPTION:
          return '腐败度';
        case EffectType.POPULATION_GROWTH:
          return '人口增长';
        case EffectType.RESOURCE_PRODUCTION:
          return '资源生产';
        case EffectType.RESEARCH_SPEED:
          return '研究速度';
        case EffectType.BUILDING_COST:
          return '建筑成本';
        case EffectType.MILITARY_STRENGTH:
          return '军事力量';
        case EffectType.TRADE_INCOME:
          return '贸易收入';
        case EffectType.INHERITANCE:
          return '继承效果';
        default:
          return type as unknown as string;
      }
    };

    const getEffectDescription = (effect: Effect): string => {
      const sign = effect.value >= 0 ? '+' : '';
      const percentage = effect.isPercentage ? '%' : '';
      return `${sign}${effect.value}${percentage}`;
    };

    // 兼容: 某些效果可能缺少 source 字段，提供安全默认值以避免崩溃
    const safeSource = effect.source ?? { type: EffectSourceType.BASE, id: 'unknown', name: '基础' };
    return {
      id: effect.id,
      name: getEffectName(effect.type),
      description: getEffectDescription(effect),
      value: effect.value,
      type: effect.type,
      sourceType: safeSource.type,
      sourceId: safeSource.id,
      sourceName: safeSource.name ?? getSourceName(safeSource.type, safeSource.id),
      isPositive: effect.value >= 0
    };
  };

  // 按来源分组效果
  const effectsBySource = useMemo(() => {
    const grouped = new Map<string, EffectsBySource>();

    activeEffects.forEach(effect => {
      const src = effect.source ?? { type: EffectSourceType.BASE, id: 'unknown', name: '基础' };
      const key = `${src.type}-${src.id}`;
      const displayInfo = getEffectDisplayInfo(effect);

      if (!grouped.has(key)) {
        const src = effect.source ?? { type: EffectSourceType.BASE, id: 'unknown', name: displayInfo.sourceName };
        grouped.set(key, {
          sourceType: src.type,
          sourceId: src.id,
          sourceName: src.name ?? displayInfo.sourceName,
          effects: []
        });
      }

      grouped.get(key)!.effects.push(displayInfo);
    });

    return Array.from(grouped.values());
  }, [activeEffects]);

  // 获取特定类型的效果总值
  const getEffectTotal = (type: EffectType) => {
    return calculateEffectTotal(type);
  };

  // 获取特定来源的效果
  const getSourceEffects = (sourceType: EffectSourceType, sourceId?: string) => {
    return getEffectsBySource(sourceType, sourceId).map(getEffectDisplayInfo);
  };

  // 获取特定类型的效果
  const getTypeEffects = (type: EffectType) => {
    return getEffectsByType(type).map(getEffectDisplayInfo);
  };

  return {
    activeEffects,
    effectsBySource,
    getEffectTotal,
    getSourceEffects,
    getTypeEffects,
    getEffectDisplayInfo
  };
};

// 效果工具函数
export const EffectUtils = {
  // 计算稳定度加成
  calculateStabilityBonus: (stability: number) => {
    if (stability >= 75) return 0.25; // +25%
    if (stability >= 50) return 0.15; // +15%
    if (stability >= 25) return 0.05; // +5%
    return 0;
  },

  // 计算腐败度惩罚
  calculateCorruptionPenalty: (corruption: number) => {
    return Math.min(corruption * 0.01, 0.5); // 每点腐败度-1%，最多-50%
  },

  // 格式化效果描述
  formatEffectDescription: (effect: Effect) => {
    const sign = effect.value >= 0 ? '+' : '';
    const percentage = effect.isPercentage ? '%' : '';
    return `${sign}${effect.value}${percentage}`;
  },

  // 获取效果主题色
  getEffectTheme: (effect: Effect) => {
    return effect.value >= 0 ? 'positive' : 'negative';
  }
};