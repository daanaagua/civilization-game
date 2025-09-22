'use client';

import React from 'react';
import { X, Shield, Zap, TrendingUp, TrendingDown, Users, Home, Hammer, Beaker, Sword, Crown, Wheat, TreePine, Mountain, Wrench, Coins, AlertTriangle, Building, BookOpen, Info } from 'lucide-react';
import { useGameStore } from '@/lib/game-store';
import { Buff, BuffEffect } from '@/types/game';
import { globalEffectsSystem, EffectSourceType } from '@/lib/effects-system';

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
      iron: '铁',
      copper: '铜',
      cloth: '布革',
      weapons: '武器',
      livestock: '牲畜',
      horses: '马',
      researchPoints: '研究点',
      currency: '货币',
      magic: '魔力',
      faith: '信仰',
      crystal: '水晶'
    };
    return map[res] || res.replace(/_/g, ' ');
  };
  // 百分比显示：保留两位小数并去掉多余0
  const formatPercentString = (n: number) => {
    const rounded = Math.round(n * 100) / 100;
    const str = rounded.toFixed(2).replace(/\.00$/, '').replace(/(\.\d*[1-9])0$/, '$1');
    return `${rounded > 0 ? '+' : ''}${str}%`;
  };

  const upsertEffect = (name: string, addValuePct: number, source: string) => {
    // 百分比型效果合并（以 % 展示）
    const existing = allEffects.get(name);
    if (existing) {
      const existingValue = parseFloat(existing.value.replace('%', '').replace('+', '')) || 0;
      const totalValue = existingValue + addValuePct;
      allEffects.set(name, {
        value: totalValue === 0 ? '0%' : formatPercentString(totalValue),
        sources: [...existing.sources, source]
      });
    } else {
      allEffects.set(name, { value: formatPercentString(addValuePct), sources: [source] });
    }
  };
  // 数值型效果合并（不带 %，用于 稳定度/腐败度 等点数）
  const upsertNumberEffect = (name: string, delta: number, source: string) => {
    const existing = allEffects.get(name);
    const valueStr = delta > 0 ? `+${Math.round(delta)}` : `${Math.round(delta)}`;
    if (existing) {
      const existingValue = parseFloat(existing.value.replace('+', '')) || 0;
      const totalValue = existingValue + delta;
      allEffects.set(name, {
        value: totalValue === 0 ? '0' : `${totalValue > 0 ? '+' : ''}${Math.round(totalValue)}`,
        sources: [...existing.sources, source]
      });
    } else {
      allEffects.set(name, { value: valueStr, sources: [source] });
    }
  };

  // 统一处理一条效果并写入聚合表
  const processEffect = (effect: any, sourceName: string) => {
    const type = String(effect?.type || '').toLowerCase();
    const target = effect?.target ?? effect?.resource;
    // 统一百分比：优先用 isPercentage，其次倍率区间转换
    const isPct = effect?.isPercentage === true || (typeof effect?.value === 'number' && effect.value > 0 && effect.value < 1);
    const raw = Number(effect?.value || 0);
    const valPct = isPct ? raw * 100 : normalizePercent(raw);

    // 资源效率类
    if (type === 'resource_multiplier' || type === 'resource_production' || type === 'resource_production_bonus' || type === 'resource_efficiency') {
      if (typeof target === 'string' && target && target !== 'all') {
        upsertEffect(`${getResLabel(String(target))}效率`, valPct, sourceName);
      } else {
        upsertEffect('生产效率', valPct, sourceName);
      }
      return;
    }

    // 人口、科研
    if (type === 'population_growth' || type === 'population_growth_bonus') { upsertEffect('人口增长率', valPct, sourceName); return; }
    if (type === 'research_speed' || type === 'research_speed_bonus') { upsertEffect('科技研发速度', valPct, sourceName); return; }

    // 信仰、魔力
    if (type === 'faith_gain') { upsertEffect('信仰获取', valPct, sourceName); return; }
    if (type === 'magic_gain') { upsertEffect('魔力获取', valPct, sourceName); return; }
    if (type === 'magic_efficiency') { upsertEffect('魔法效率', valPct, sourceName); return; }
    if (type === 'magic_resistance' || type === 'magic_resist') { upsertEffect('魔法抗性', valPct, sourceName); return; }

    // 稳定/腐败（点数）
    if (type === 'stability') { upsertNumberEffect('稳定度', Number(raw) || 0, sourceName); return; }
    if (type === 'corruption') { upsertNumberEffect('腐败度', Number(raw) || 0, sourceName); return; }

    // 贸易、关系、建造
    if (type === 'trade_income') { upsertEffect('贸易收益', valPct, sourceName); return; }
    if (type === 'trade_efficiency') { upsertEffect('交易兑换效率', valPct, sourceName); return; }
    if (type === 'relation_improvement' || type === 'relationship_change') { upsertEffect('关系改善速度', valPct, sourceName); return; }
    if (type === 'building_efficiency' || type === 'build_speed') { upsertEffect('建筑建造速度', valPct, sourceName); return; }

    // 事件/维护/消耗/灾害
    if (type === 'morale_event_success') { upsertEffect('士气相关事件成功率', valPct, sourceName); return; }
    if (type === 'maintenance_reduction') { upsertEffect('全局维护/损耗', valPct, sourceName); return; }
    if (type === 'supply_consumption') { upsertEffect('物资消耗', valPct, sourceName); return; }
    if (type === 'disaster_response') { upsertEffect('灾害/事件处理效率', valPct, sourceName); return; }

    // 军事类（若仍存在）
    if (type === 'military' || type === 'military_strength' || type === 'army') {
      const sub = String(target || '').toLowerCase();
      if (sub.includes('morale')) { upsertEffect('军队士气', valPct, sourceName); return; }
      if (sub.includes('combat') || sub === 'combat_power') { upsertEffect('军队战斗力', valPct, sourceName); return; }
      if (sub.includes('supply') || sub.includes('consumption')) { upsertEffect('军需消耗', valPct, sourceName); return; }
      upsertEffect('军力', valPct, sourceName); return;
    }

    // 兜底：未知类型忽略，避免污染
  };

  Object.values(gameState.technologies).forEach((tech) => {
    if (tech?.researched && Array.isArray(tech.effects)) {
      tech.effects.forEach((effect: any) => {
        // 兼容一些数据里把“稳定度点数”写成 stability_bonus 的情况
        if (String(effect?.type || '') === 'stability_bonus') {
          upsertNumberEffect('稳定度', Number(effect?.value) || 0, tech.name);
        } else {
          processEffect(effect, tech.name);
        }
      });
    }
  });
  
  // 添加Buff效果（同样区分资源特定与全局）
  const activeBuffs = getActiveBuffs();
  activeBuffs.forEach((buff) => {
    (buff?.effects || []).forEach((effect: any) => {
      processEffect(effect, buff.name);
    });
  });
  
  // 添加“人物效果”（来自全局效果系统，source.type === 'character'）
  const characterEffects = globalEffectsSystem.getEffectsBySourceType(EffectSourceType.CHARACTER);
  characterEffects.forEach((eff: any) => {
    const sourceName = eff?.source?.name || '人物';
    processEffect(eff, sourceName);
  });

  // 其他来源：建筑/事件/宝物/政策（如存在）
  const otherSourceTypes: Array<any> = ['building','event','treasure','policy'];
  otherSourceTypes.forEach((srcType) => {
    try {
      const list = globalEffectsSystem.getEffectsBySourceType(srcType as any) || [];
      list.forEach((eff: any) => {
        const sourceName = eff?.source?.name || getSourceTypeName(srcType);
        processEffect(eff, sourceName);
      });
    } catch {}
  });

  // 动态展示：不再强制填充固定项目，全部来源合并后按存在值渲染

  const formatValue = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value}%`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-4xl mx-4">
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

        {/* 效果列表（自适应高度与列数） */}
        <div className="max-h-[70vh] overflow-auto">
          {(() => {
            // 排序：将“稳定度”“腐败度”置底，其余按名称排序
            const entries = Array.from(allEffects.entries()).sort((a, b) => {
              const order = (name: string) => {
                if (name === '稳定度') return 1000;
                if (name === '腐败度') return 1001;
                return 0;
              };
              const oa = order(a[0]); const ob = order(b[0]);
              if (oa !== ob) return oa - ob;
              return a[0].localeCompare(b[0], 'zh-Hans');
            });
            const count = entries.length;
            const cols = count > 24 ? 3 : count > 12 ? 2 : 1;
            const gridClass = cols === 3
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'
              : cols === 2
                ? 'grid grid-cols-1 md:grid-cols-2 gap-3'
                : 'grid grid-cols-1 gap-3';
            return (
              <div className={gridClass}>
                {entries.map(([effectName, effectData]) => {
                  const num = parseFloat(effectData.value.replace('%','').replace('+','')) || 0;
                  const colorClass = effectName === '腐败度'
                    ? (num < 0 ? 'text-green-400' : num > 0 ? 'text-red-400' : 'text-gray-400')
                    : (num > 0 ? 'text-green-400' : num < 0 ? 'text-red-400' : 'text-gray-400');
                  return (
                    <div key={effectName} className="space-y-0.5 p-2 rounded border border-gray-700/50 bg-gray-900/30">
                      <div className="flex items-center justify-between leading-tight">
                        <span className="text-gray-300 text-xs">{effectName}</span>
                        <span className={`font-semibold text-xs ${colorClass}`}>
                          {effectData.value}
                        </span>
                      </div>
                      {effectData.sources.length > 0 && (
                        <div className="text-[10px] text-gray-500 leading-tight">
                          来源: {effectData.sources.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
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