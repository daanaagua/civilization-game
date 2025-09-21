'use client';

import React from 'react';
import { X, Shield, Zap, TrendingUp, TrendingDown, Users, Home, Hammer, Beaker, Sword, Crown, Wheat, TreePine, Mountain, Wrench, Coins, AlertTriangle, Building, BookOpen, Info } from 'lucide-react';
import { useGameStore } from '@/lib/game-store';
import { Buff, BuffEffect } from '@/types/game';

// 直接效果接口
interface DirectEffect {
  id: string;
  name: string;
  description: string;
  source: string;
  sourceType: 'stability' | 'corruption' | 'buff' | 'technology';
  effects: {
    type: string;
    target: string;
    value: number;
    isPercentage: boolean;
  }[];
}

// 获取资源图标
function getResourceIcon(resource: string) {
  switch (resource) {
    case 'food':
      return <Wheat className="w-4 h-4" />;
    case 'wood':
      return <TreePine className="w-4 h-4" />;
    case 'stone':
      return <Mountain className="w-4 h-4" />;
    case 'tools':
      return <Wrench className="w-4 h-4" />;
    case 'population':
      return <Users className="w-4 h-4" />;
    default:
      return <Crown className="w-4 h-4" />;
  }
}

// 获取效果类型图标
function getEffectTypeIcon(type: string) {
  switch (type) {
    case 'resource_production':
    case 'resource_multiplier':
      return <Coins className="w-4 h-4 text-yellow-400" />;
    case 'stability':
    case 'stability_bonus':
      return <Shield className="w-4 h-4 text-green-400" />;
    case 'corruption':
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    case 'population_growth':
      return <Users className="w-4 h-4 text-blue-400" />;
    case 'building_efficiency':
      return <Building className="w-4 h-4 text-purple-400" />;
    case 'research_speed':
      return <BookOpen className="w-4 h-4 text-cyan-400" />;
    case 'military_strength':
      return <Sword className="w-4 h-4" />;
    default:
      return <Info className="w-4 h-4 text-gray-400" />;
  }
}

// 获取来源类型的名称
function getSourceTypeName(sourceType: string): string {
  switch (sourceType) {
    case 'building':
      return '建筑';
    case 'technology':
      return '科技';
    case 'character':
      return '人物';
    case 'event':
      return '事件';
    case 'treasure':
      return '宝物';
    case 'policy':
      return '政策';
    case 'buff':
      return 'Buff';
    case 'stability':
      return '稳定度';
    case 'corruption':
      return '腐败度';
    default:
      return '未知';
  }
}



// 格式化效果值
function formatEffectValue(value: number, isPercentage: boolean): string {
  const sign = value > 0 ? '+' : '';
  const suffix = isPercentage ? '%' : '';
  return `${sign}${value.toFixed(1)}${suffix}`;
}

// 获取效果值的颜色
function getEffectValueColor(value: number): string {
  return value > 0 ? 'text-green-400' : 'text-red-400';
}

// 规范化数值：部分数据以倍率(例如1.2)表示，部分以百分比(例如15)表示
function normalizePercent(value: number): number {
  if (value > 1 && value < 3) {
    return (value - 1) * 100;
  }
  return value;
}

interface AllEffectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 计算稳定度对游戏机制的影响（根据stability.md设计文档）
function getStabilityEffects(stability: number): Array<{name: string, value: string}> {
  let populationGrowth = 0;
  let productionEfficiency = 0;
  let researchSpeed = 0;
  let tradeIncome = 0;
  let buildingSpeed = 0;
  let armyMorale = 0;

  if (stability >= 90) {
    // 极度稳定（90-100）
    populationGrowth = 0; // 正常（100%）
    productionEfficiency = 30;
    researchSpeed = 25;
    tradeIncome = 40;
    buildingSpeed = 20;
    armyMorale = 20;
  } else if (stability >= 75) {
    // 高度稳定（75-89）
    populationGrowth = 0; // 正常（100%）
    productionEfficiency = 15;
    researchSpeed = 10;
    tradeIncome = 20;
    buildingSpeed = 10;
    armyMorale = 10;
  } else if (stability >= 60) {
    // 基本稳定（60-74）
    populationGrowth = 0; // 正常（100%）
    productionEfficiency = 5;
    researchSpeed = 0;
    tradeIncome = 0;
    buildingSpeed = 0;
    armyMorale = 0;
  } else if (stability >= 45) {
    // 轻度不稳（45-59）
    populationGrowth = -25;
    productionEfficiency = -10;
    researchSpeed = -15;
    tradeIncome = -20;
    buildingSpeed = 0;
    armyMorale = -10;
  } else if (stability >= 30) {
    // 中度不稳（30-44）
    populationGrowth = -50;
    productionEfficiency = -25;
    researchSpeed = -30;
    tradeIncome = -40;
    buildingSpeed = -20;
    armyMorale = -25;
  } else if (stability >= 15) {
    // 严重不稳（15-29）
    populationGrowth = -75;
    productionEfficiency = -40;
    researchSpeed = -50;
    tradeIncome = -60;
    buildingSpeed = -30;
    armyMorale = -40;
  } else {
    // 极度不稳（0-14）
    populationGrowth = -90;
    productionEfficiency = -60;
    researchSpeed = -75;
    tradeIncome = -80;
    buildingSpeed = -50;
    armyMorale = -60;
  }

  return [
    { name: '人口增长率', value: populationGrowth === 0 ? '0%' : `${populationGrowth > 0 ? '+' : ''}${populationGrowth}%` },
    { name: '生产效率', value: productionEfficiency === 0 ? '0%' : `${productionEfficiency > 0 ? '+' : ''}${productionEfficiency}%` },
    { name: '科技研发速度', value: researchSpeed === 0 ? '0%' : `${researchSpeed > 0 ? '+' : ''}${researchSpeed}%` },
    { name: '贸易收益', value: tradeIncome === 0 ? '0%' : `${tradeIncome > 0 ? '+' : ''}${tradeIncome}%` },
    { name: '军队士气', value: armyMorale === 0 ? '0%' : `${armyMorale > 0 ? '+' : ''}${armyMorale}%` }
  ];
}

// 计算腐败度对游戏机制的影响
function getCorruptionEffects(corruption: number): Array<{name: string, value: string}> {
  let productionEfficiency = 0;
  let buildingCost = 0;
  let researchSpeed = 0;
  let tradeIncome = 0;
  let armyMaintenance = 0;
  let eventFrequency = 0;

  if (corruption <= 25) {
    // 低腐败度（0-25%）- 无负面影响
    productionEfficiency = 0;
    buildingCost = 0;
    researchSpeed = 0;
    tradeIncome = 0;
    armyMaintenance = 0;
    eventFrequency = 0;
  } else if (corruption <= 50) {
    // 轻度腐败（26-50%）
    productionEfficiency = -10;
    buildingCost = 10;
    researchSpeed = -5;
    tradeIncome = -15;
    armyMaintenance = 15;
    eventFrequency = 20;
  } else if (corruption <= 75) {
    // 中度腐败（51-75%）
    productionEfficiency = -25;
    buildingCost = 20;
    researchSpeed = -15;
    tradeIncome = -30;
    armyMaintenance = 30;
    eventFrequency = 40;
  } else {
    // 高度腐败（76-100%）
    productionEfficiency = -50;
    buildingCost = 40;
    researchSpeed = -30;
    tradeIncome = -50;
    armyMaintenance = 50;
    eventFrequency = 60;
  }

  const effects = [];
  if (productionEfficiency !== 0) {
    effects.push({ name: '生产效率', value: `${productionEfficiency}%` });
  }
  if (buildingCost !== 0) {
    effects.push({ name: '建筑成本', value: `+${buildingCost}%` });
  }
  if (researchSpeed !== 0) {
    effects.push({ name: '科技研发速度', value: `${researchSpeed}%` });
  }
  if (tradeIncome !== 0) {
    effects.push({ name: '贸易收益', value: `${tradeIncome}%` });
  }
  if (armyMaintenance !== 0) {
    effects.push({ name: '军队维护费', value: `+${armyMaintenance}%` });
  }
  
  return effects;
}

export function AllEffectsModal({ isOpen, onClose }: AllEffectsModalProps) {
  const gameState = useGameStore((state) => state.gameState);
  const getActiveBuffs = useGameStore((state) => state.getActiveBuffs);

  if (!isOpen) return null;

  // 获取稳定度和腐败度的具体效果
  const stabilityEffects = getStabilityEffects(gameState.stability);
  const corruptionEffects = getCorruptionEffects(gameState.corruption);
  
  // 合并所有效果，优先显示稳定度效果，然后是腐败度效果
  const allEffects = new Map<string, {value: string, sources: string[]}>();
  
  // 添加稳定度效果
  stabilityEffects.forEach(effect => {
    allEffects.set(effect.name, {
      value: effect.value,
      sources: effect.value !== '0%' ? ['稳定度'] : []
    });
  });
  
  // 添加腐败度效果（会覆盖或累加稳定度效果）
  corruptionEffects.forEach(effect => {
    const existing = allEffects.get(effect.name);
    if (existing) {
      // 如果已存在该效果，需要累加数值
      const existingValue = parseFloat(existing.value.replace('%', '').replace('+', ''));
      const newValue = parseFloat(effect.value.replace('%', '').replace('+', ''));
      const totalValue = existingValue + newValue;
      allEffects.set(effect.name, {
        value: totalValue === 0 ? '0%' : `${totalValue > 0 ? '+' : ''}${totalValue}%`,
        sources: totalValue !== 0 ? [...existing.sources, '腐败度'] : existing.sources
      });
    } else {
      allEffects.set(effect.name, {
        value: effect.value,
        sources: effect.value !== '0%' ? ['腐败度'] : []
      });
    }
  });
  
  // 添加科技效果（将资源特定加成拆分为“{资源名}效率”）
  // 动态资源标签：已知映射优先，否则将下划线转空格做回退
  const getResLabel = (res: string) => {
    const map: Record<string, string> = {
      food: '食物',
      wood: '木材',
      stone: '石材',
      tools: '工具',
      iron: '铁'
    };
    return map[res] || res.replace(/_/g, ' ');
  };
  const upsertEffect = (name: string, addValuePct: number, source: string) => {
    const existing = allEffects.get(name);
    const valueStr = addValuePct > 0 ? `+${addValuePct}%` : `${addValuePct}%`;
    if (existing) {
      const existingValue = parseFloat(existing.value.replace('%', '').replace('+', '')) || 0;
      const totalValue = existingValue + addValuePct;
      allEffects.set(name, {
        value: totalValue === 0 ? '0%' : `${totalValue > 0 ? '+' : ''}${totalValue}%`,
        sources: [...existing.sources, source]
      });
    } else {
      allEffects.set(name, { value: valueStr, sources: [source] });
    }
  };

  Object.values(gameState.technologies).forEach((tech) => {
    if (tech.researched && tech.effects) {
      tech.effects.forEach((effect: any) => {
        switch (effect.type) {
          case 'resource_multiplier': {
            const val = normalizePercent(effect.value);
            if (typeof effect.target === 'string' && effect.target && effect.target !== 'all') {
              upsertEffect(`${getResLabel(effect.target)}效率`, val, tech.name);
            } else {
              upsertEffect('生产效率', val, tech.name);
            }
            break;
          }
          case 'resource_production_bonus': {
            const val = normalizePercent(effect.value);
            if (typeof effect.target === 'string' && effect.target && effect.target !== 'all') {
              upsertEffect(`${getResLabel(effect.target)}效率`, val, tech.name);
            } else {
              upsertEffect('生产效率', val, tech.name);
            }
            break;
          }
          case 'population_growth_bonus': {
            upsertEffect('人口增长率', normalizePercent(effect.value), tech.name);
            break;
          }
          case 'research_speed_bonus': {
            upsertEffect('科技研发速度', normalizePercent(effect.value), tech.name);
            break;
          }
          default:
            break;
        }
      });
    }
  });
  
  // 添加Buff效果（同样区分资源特定与全局）
  const activeBuffs = getActiveBuffs();
  activeBuffs.forEach((buff) => {
    buff.effects.forEach((effect: any) => {
      switch (effect.type) {
        case 'population_growth': {
          const val = normalizePercent(effect.value);
          upsertEffect('人口增长率', val, buff.name);
          break;
        }
        case 'resource_production': {
          const val = normalizePercent(effect.value);
          if (typeof effect.target === 'string' && effect.target && effect.target !== 'all') {
            upsertEffect(`${getResLabel(effect.target)}效率`, val, buff.name);
          } else {
            upsertEffect('生产效率', val, buff.name);
          }
          break;
        }
        case 'research_speed': {
          const val = normalizePercent(effect.value);
          upsertEffect('科技研发速度', val, buff.name);
          break;
        }
        case 'building_efficiency': {
          const val = normalizePercent(effect.value);
          upsertEffect('生产效率', val, buff.name);
          break;
        }
        default:
          break;
      }
    });
  });
  
  // 确保所有基础效果都显示，即使值为0
  const baseEffects = ['人口增长率', '生产效率', '科技研发速度', '贸易收益', '军队士气'];
  baseEffects.forEach(effectName => {
    if (!allEffects.has(effectName)) {
      allEffects.set(effectName, {
        value: '0%',
        sources: []
      });
    }
  });

  const formatValue = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value}%`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">全部效果</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 效果列表 */}
        <div className="space-y-3">
          {Array.from(allEffects.entries()).map(([effectName, effectData]) => {
            const isPositive = effectData.value.includes('+');
            const isNegative = effectData.value.includes('-');
            const isNeutral = effectData.value === '0%';
            
            return (
              <div key={effectName} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{effectName}:</span>
                  <span className={`font-semibold ${
                    isPositive ? 'text-green-400' : 
                    isNegative ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {effectData.value}
                  </span>
                </div>
                {effectData.sources.length > 0 && (
                  <div className="text-xs text-gray-500 ml-2">
                    来源: {effectData.sources.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 当前状态 */}
        <div className="mt-6 pt-4 border-t border-gray-600">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">稳定度: </span>
              <span className="text-white font-semibold">{gameState.stability.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-400">腐败度: </span>
              <span className="text-white font-semibold">{gameState.corruption.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}