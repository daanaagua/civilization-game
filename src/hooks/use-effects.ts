'use client';

import { useState, useEffect, useCallback } from 'react';
import { Effect, EffectType } from '@/components/features/EffectsPanel';

// 效果管理Hook
export function useEffects() {
  const [effects, setEffects] = useState<Effect[]>([]);

  // 添加效果
  const addEffect = useCallback((effect: Effect) => {
    setEffects(prev => {
      // 检查是否已存在相同ID的效果
      const existingIndex = prev.findIndex(e => e.id === effect.id);
      if (existingIndex >= 0) {
        // 更新现有效果
        const newEffects = [...prev];
        newEffects[existingIndex] = effect;
        return newEffects;
      } else {
        // 添加新效果
        return [...prev, effect];
      }
    });
  }, []);

  // 移除效果
  const removeEffect = useCallback((effectId: string) => {
    setEffects(prev => prev.filter(e => e.id !== effectId));
  }, []);

  // 更新效果值
  const updateEffectValue = useCallback((effectId: string, newValue: number) => {
    setEffects(prev => prev.map(effect => 
      effect.id === effectId 
        ? { ...effect, value: newValue }
        : effect
    ));
  }, []);

  // 减少持续时间
  const decreaseDuration = useCallback(() => {
    setEffects(prev => {
      const updatedEffects = prev.map(effect => {
        if (effect.duration !== undefined && effect.duration > 0) {
          return { ...effect, duration: effect.duration - 1 };
        }
        return effect;
      }).filter(effect => {
        // 移除持续时间为0的效果（除非是永久效果）
        return effect.duration === undefined || effect.duration > 0 || effect.duration === -1;
      });
      
      return updatedEffects;
    });
  }, []);

  // 获取特定类型的效果
  const getEffectsByType = useCallback((type: EffectType) => {
    return effects.filter(effect => effect.type === type);
  }, [effects]);

  // 获取特定效果的值
  const getEffectValue = useCallback((effectId: string) => {
    const effect = effects.find(e => e.id === effectId);
    return effect?.value || 0;
  }, [effects]);

  // 检查是否有特定效果
  const hasEffect = useCallback((effectId: string) => {
    return effects.some(e => e.id === effectId);
  }, [effects]);

  // 计算总的效果加成（按类型）
  const getTotalBonus = useCallback((effectIds: string[]) => {
    return effects
      .filter(effect => effectIds.includes(effect.id))
      .reduce((total, effect) => total + (effect.value || 0), 0);
  }, [effects]);

  // 初始化默认效果
  useEffect(() => {
    const defaultEffects: Effect[] = [
      {
        id: 'stability',
        name: '稳定度',
        type: EffectType.PERMANENT,
        value: 75,
        description: '当前文明的稳定程度，影响各项发展效率',
        buffs: [
          '人口增长速度 +15%',
          '资源产出效率 +10%',
          '建筑建造速度 +5%'
        ],
        icon: '⚖️'
      },
      {
        id: 'corruption',
        name: '腐败度',
        type: EffectType.PERMANENT,
        value: -25,
        description: '文明内部的腐败程度，会降低各项效率',
        buffs: [
          '税收效率 -25%',
          '军队维护成本 +15%',
          '建筑维护成本 +10%'
        ],
        icon: '💀'
      },
      {
        id: 'inheritance',
        name: '继承点',
        type: EffectType.PERMANENT,
        value: 150,
        description: '可用于重生时获得永久加成的点数',
        buffs: [
          '重生后可获得永久加成',
          '解锁特殊建筑和科技'
        ],
        icon: '👑'
      }
    ];

    setEffects(defaultEffects);
  }, []);

  return {
    effects,
    addEffect,
    removeEffect,
    updateEffectValue,
    decreaseDuration,
    getEffectsByType,
    getEffectValue,
    hasEffect,
    getTotalBonus
  };
}

// 效果计算工具函数
export const EffectUtils = {
  // 计算稳定度对资源产出的影响
  calculateStabilityBonus: (stability: number) => {
    if (stability >= 80) return 0.2; // +20%
    if (stability >= 60) return 0.1; // +10%
    if (stability >= 40) return 0; // 无加成
    if (stability >= 20) return -0.1; // -10%
    return -0.2; // -20%
  },

  // 计算腐败度对税收的影响
  calculateCorruptionPenalty: (corruption: number) => {
    return Math.max(0, 1 - (corruption / 100));
  },

  // 格式化效果描述
  formatEffectDescription: (effect: Effect) => {
    let description = effect.description;
    if (effect.value !== undefined) {
      const valueStr = effect.value > 0 ? `+${effect.value}` : `${effect.value}`;
      description += ` (${valueStr})`;
    }
    return description;
  },

  // 获取效果的颜色主题
  getEffectTheme: (effect: Effect) => {
    if (effect.value !== undefined) {
      if (effect.value > 0) return 'positive';
      if (effect.value < 0) return 'negative';
    }
    return 'neutral';
  }
};