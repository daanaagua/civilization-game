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

export const useEffects = () => {
  const { getActiveEffects, getEffectsByType, getEffectsBySource, calculateEffectTotal } = useGameStore();
  // 订阅effectsVersion用于触发重渲染
  const effectsVersion = useGameStore((s) => s.effectsVersion);

  // 获取所有活跃效果
  const activeEffects = useMemo(() => {
    return getActiveEffects();
  }, [getActiveEffects, effectsVersion]);

  // 获取效果显示信息
  const getEffectDisplayInfo = (effect: Effect): EffectDisplayInfo => {
    const getSourceName = (sourceType: EffectSourceType, sourceId: string): string => {
      switch (sourceType) {
        case 'stability':
          return '稳定度';
        case 'corruption':
          return '腐败度';
        case 'technology':
          return `科技: ${sourceId}`;
        case 'building':
          return `建筑: ${sourceId}`;
        case 'character':
          return `人物: ${sourceId}`;
        case 'event':
          return `事件: ${sourceId}`;
        case 'inheritance':
          return `继承: ${sourceId}`;
        case 'item':
          return `物品: ${sourceId}`;
        default:
          return sourceId;
      }
    };

    const getEffectName = (type: EffectType): string => {
      switch (type) {
        case 'population_growth':
          return '人口增长';
        case 'resource_production':
          return '资源生产';
        case 'research_speed':
          return '研究速度';
        case 'building_cost':
          return '建筑成本';
        case 'military_strength':
          return '军事力量';
        case 'trade_efficiency':
          return '贸易效率';
        case 'happiness':
          return '幸福度';
        case 'corruption_resistance':
          return '腐败抗性';
        default:
          return type;
      }
    };

    const getEffectDescription = (effect: Effect): string => {
      const sign = effect.value >= 0 ? '+' : '';
      const percentage = effect.isPercentage ? '%' : '';
      return `${sign}${effect.value}${percentage}`;
    };

    return {
      id: effect.id,
      name: getEffectName(effect.type),
      description: getEffectDescription(effect),
      value: effect.value,
      type: effect.type,
      sourceType: (effect as any).sourceType,
      sourceId: (effect as any).sourceId,
      sourceName: (effect as any).source?.name ?? getSourceName((effect as any).sourceType, (effect as any).sourceId),
      isPositive: effect.value >= 0
    };
  };

  // 按来源分组效果
  const effectsBySource = useMemo(() => {
    const grouped = new Map<string, EffectsBySource>();

    activeEffects.forEach(effect => {
      const key = `${(effect as any).source?.type ?? (effect as any).sourceType}-${(effect as any).source?.id ?? (effect as any).sourceId}`;
      const displayInfo = getEffectDisplayInfo(effect);

      if (!grouped.has(key)) {
        grouped.set(key, {
          sourceType: (effect as any).source?.type ?? (effect as any).sourceType,
          sourceId: (effect as any).source?.id ?? (effect as any).sourceId,
          sourceName: displayInfo.sourceName,
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