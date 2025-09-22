'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { Effect, EffectType, EffectSourceType, globalEffectsSystem } from '@/lib/effects-system';
import { AllEffectsModal } from '@/components/ui/AllEffectsModal';
import { useGameStore } from '@/lib/game-store';

 // 格式化效果值显示
function formatValue(value: number, isPercentage: boolean): string {
  const rounded = Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
  const fixed = rounded.toFixed(2);
  const signed = rounded > 0 ? `+${fixed}` : fixed; // 负数自动带 -
  return isPercentage ? `${signed}%` : signed;
}

// 本地工具：归一化倍率/百分比
function normalizePercent(value: number): number {
  if (value > 1 && value < 3) return (value - 1) * 100;
  return value;
}
function getResLabel(res: string) {
  const map: Record<string, string> = {
    food: '食物',
    wood: '木材',
    stone: '石材',
    tools: '工具',
    iron: '铁'
  };
  return map[res] || res.replace(/_/g, ' ');
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
    // 崩溃（0-14）
    populationGrowth = -100;
    productionEfficiency = -60;
    researchSpeed = -80;
    tradeIncome = -80;
    buildingSpeed = -50;
    armyMorale = -60;
  }

  const effects = [
    { name: '人口增长率', value: populationGrowth === 0 ? '正常' : `${populationGrowth > 0 ? '+' : ''}${populationGrowth}%` },
    { name: '生产效率', value: productionEfficiency === 0 ? '正常' : `${productionEfficiency > 0 ? '+' : ''}${productionEfficiency}%` },
    { name: '科技研发速度', value: researchSpeed === 0 ? '正常' : `${researchSpeed > 0 ? '+' : ''}${researchSpeed}%` },
    { name: '贸易收益', value: tradeIncome === 0 ? '正常' : `${tradeIncome > 0 ? '+' : ''}${tradeIncome}%` },
    { name: '军队士气', value: armyMorale === 0 ? '正常' : `${armyMorale > 0 ? '+' : ''}${armyMorale}%` }
  ];

  // 只有在有建筑速度影响时才显示
  if (buildingSpeed !== 0) {
    effects.splice(4, 0, { name: '建筑建造速度', value: `${buildingSpeed > 0 ? '+' : ''}${buildingSpeed}%` });
  }

  return effects;
}

// 计算腐败度对游戏机制的影响（严格按照 corruption.md）
function getCorruptionEffects(corruption: number): Array<{name: string, value: string}> {
  const items: Array<{name: string, value: string}> = [];

  // 资源效率（所有资源产出）
  let productionPenalty = 0;
  if (corruption >= 26 && corruption <= 50) productionPenalty = -10;
  else if (corruption >= 51 && corruption <= 75) productionPenalty = -25;
  else if (corruption >= 76 && corruption <= 90) productionPenalty = -40;
  else if (corruption >= 91) productionPenalty = -60;
  if (productionPenalty !== 0) {
    items.push({ name: '资源产出', value: `${productionPenalty}%` });
  }

  // 建筑建造成本
  let buildingCostIncrease = 0;
  if (corruption >= 51 && corruption <= 75) buildingCostIncrease = 20;
  else if (corruption >= 76 && corruption <= 90) buildingCostIncrease = 50;
  else if (corruption >= 91) buildingCostIncrease = 100;
  if (buildingCostIncrease !== 0) {
    items.push({ name: '建筑建造成本', value: `+${buildingCostIncrease}%` });
  }

  // 稳定度（直接扣除腐败度点数）
  if (corruption > 0) {
    items.push({ name: '稳定度', value: `-${Math.floor(corruption)}` });
  }

  // 外交影响
  if (corruption > 60) {
    items.push({ name: '外交关系改善速度', value: `-50%` });
  }
  if (corruption > 80) {
    items.push({ name: '其他文明信任度', value: `-20%` });
  }

  // 科技影响（较高阈值覆盖较低阈值）
  let researchPenalty = 0;
  if (corruption > 85) researchPenalty = -50;
  else if (corruption > 70) researchPenalty = -30;
  if (researchPenalty !== 0) {
    items.push({ name: '科技研究速度', value: `${researchPenalty}%` });
  }

  return items;
}

// 效果标签组件
interface EffectTagProps {
  effect: Effect;
  onHover?: (effect: Effect | null) => void;
}

function EffectTag({ effect, onHover }: EffectTagProps) {
  const getEffectColor = (type: EffectType, value: number) => {
    // 腐败度：值越高颜色越红
    if (type === EffectType.CORRUPTION) {
      // 约定：腐败度“减少”为正面（绿色），增加为负面（红/橙/黄）
      if (value <= 0) return 'bg-green-900/50 border-green-500 text-green-300';
      if (value > 75) return 'bg-red-900/50 border-red-500 text-red-300';
      if (value > 50) return 'bg-orange-900/50 border-orange-500 text-orange-300';
      if (value > 25) return 'bg-yellow-900/50 border-yellow-500 text-yellow-300';
      return 'bg-green-900/50 border-green-500 text-green-300';
    }
    
    // 稳定度：值越高颜色越绿
    if (type === EffectType.STABILITY) {
      if (value >= 75) return 'bg-green-900/50 border-green-500 text-green-300';
      if (value >= 50) return 'bg-blue-900/50 border-blue-500 text-blue-300';
      if (value >= 25) return 'bg-yellow-900/50 border-yellow-500 text-yellow-300';
      return 'bg-red-900/50 border-red-500 text-red-300';
    }
    
    // 其他效果：正值绿色，负值红色
    return value >= 0 
      ? 'bg-green-900/50 border-green-500 text-green-300'
      : 'bg-red-900/50 border-red-500 text-red-300';
  };

  const colorClass = getEffectColor(effect.type, effect.value);
  const displayValue = formatValue(effect.value, effect.isPercentage);
  
  // 使用displayName如果存在，否则使用默认格式
  const displayText = (effect as any).displayName || `${effect.name}: ${displayValue}`;

  return (
    <div
      className={`px-3 py-1 rounded-full border text-sm font-medium cursor-pointer transition-all hover:scale-105 ${colorClass}`}
      onMouseEnter={() => onHover?.(effect)}
      onMouseLeave={() => onHover?.(null)}
    >
      {displayText}
    </div>
  );
}

// 效果提示框组件
interface EffectTooltipProps {
  effect: Effect | null;
  position: { x: number; y: number };
}

function EffectTooltip({ effect, position }: EffectTooltipProps) {
  if (!effect) return null;

  const formatValue = (value: number, isPercentage: boolean) => {
    const rounded = Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
    const fixed = rounded.toFixed(2);
    const signed = rounded > 0 ? `+${fixed}` : fixed;
    return isPercentage ? `${signed}%` : signed;
  };

  // 事件类效果：在浮框中展示剩余时间
  const getEventRemainingText = () => {
    const src: any = (effect as any).source || {};
    if (src.type !== 'event') return null;

    // 尝试从全局状态读取对应临时效果的剩余时间
    try {
      // 动态引入以避免循环依赖
      const { useGameStore } = require('@/lib/game-store');
      const { getRemainingDays } = require('@/lib/temporary-effects');
      const gameState = useGameStore.getState().gameState;
      const list = gameState.temporaryEffects || [];
      const matched = list.find((e: any) => e.id === (effect as any).id);
      if (!matched) return null;
      const daysFloat = getRemainingDays(matched, gameState.gameTime);
      const days = Math.max(0, Math.ceil(daysFloat));
      if (days >= 1) return `剩余${days}天`;
      const hours = Math.max(0, Math.ceil(daysFloat * 24));
      return `剩余约${hours}小时`;
    } catch (e) {
      return null;
    }
  };

  // 根据效果类型获取详细影响说明
  const getEffectDetails = () => {
    if (effect.type === EffectType.STABILITY) {
      const stabilityEffects = getStabilityEffects(effect.value);
      return (
        <div className="space-y-1">
          <div className="text-gray-300">稳定度影响以下游戏机制：</div>
          {stabilityEffects.map((item, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span className="text-gray-400">{item.name}:</span>
              <span className={item.value.includes('-') ? 'text-red-400' : 'text-green-400'}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    
    if (effect.type === EffectType.CORRUPTION) {
      const corruptionEffects = getCorruptionEffects(effect.value);
      return (
        <div className="space-y-1">
          <div className="text-gray-300 mb-2">腐败度影响以下游戏机制：</div>
          {corruptionEffects.map((item, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span className="text-gray-400">{item.name}:</span>
              <span className={(parseFloat(item.value.replace('%','').replace('+','')) || 0) < 0 ? 'text-green-400' : (parseFloat(item.value.replace('%','').replace('+','')) || 0) > 0 ? 'text-red-400' : 'text-gray-400'}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    
    // 其他效果类型的通用描述
    return (
      <div className="text-gray-300">
        {effect.description || `该效果为您的国家提供${formatValue(effect.value, effect.isPercentage)}的${effect.name}加成`}
      </div>
    );
  };

  return (
    <div
      className="fixed z-50 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl max-w-xs"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translateY(-100%)'
      }}
    >
      <div className="flex items-center space-x-2 mb-2">
        {effect.icon && <span className="text-lg">{effect.icon}</span>}
        <h4 className="text-white font-semibold">{effect.name}</h4>
        <span className="text-sm font-bold text-yellow-400">
          {formatValue(effect.value, effect.isPercentage)}
        </span>
      </div>
      
      {/* 事件剩余时间 */}
      {(() => {
        const txt = getEventRemainingText();
        return txt ? <div className="text-xs text-gray-400 mb-2">{txt}</div> : null;
      })()}
      
      {getEffectDetails()}
      
      <div className="mt-2 pt-2 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          来源: {effect.source.name}
        </div>
        {effect.duration !== undefined && effect.duration > 0 && (
          <div className="text-xs text-gray-400 mt-1">
            剩余时间: {effect.duration} 回合
          </div>
        )}
      </div>
    </div>
  );
}

// 主要的效果面板组件
interface EffectsPanelProps {
  effects: Effect[];
  className?: string;
}

export function EffectsPanel({ effects, className }: EffectsPanelProps) {
  const [hoveredEffect, setHoveredEffect] = useState<Effect | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [techHover, setTechHover] = useState(false);

  // 读取游戏状态中的科技，构建“科技”浮框明细
  const gameState = useGameStore((s) => s.gameState);
  const researchedTechs = Object.values(gameState.technologies || {}).filter((t: any) => t?.researched);

  // 将科技效果映射为“名称：说明”行
  const techBuffLines: Array<{ techName: string; text: string }> = [];
  researchedTechs.forEach((tech: any) => {
    (tech.effects || []).forEach((eff: any) => {
      const type = eff?.type;
      const target = eff?.target ?? eff?.resource;
      const valPct = normalizePercent(Number(eff?.value || 0));
      if (!type || !Number.isFinite(valPct) || valPct === 0) return;

      switch (type) {
        case 'resource_multiplier':
        case 'resource_production_bonus': {
          if (typeof target === 'string' && target && target !== 'all') {
            techBuffLines.push({ techName: tech.name, text: `${getResLabel(target)}效率 ${valPct > 0 ? '+' : ''}${valPct}%` });
          } else {
            techBuffLines.push({ techName: tech.name, text: `生产效率 ${valPct > 0 ? '+' : ''}${valPct}%` });
          }
          break;
        }
        case 'population_growth_bonus':
          techBuffLines.push({ techName: tech.name, text: `人口增长率 ${valPct > 0 ? '+' : ''}${valPct}%` });
          break;
        case 'research_speed_bonus':
          techBuffLines.push({ techName: tech.name, text: `科技研发速度 ${valPct > 0 ? '+' : ''}${valPct}%` });
          break;
        case 'stability_bonus': {
          const v = Number(eff?.value || 0);
          techBuffLines.push({ techName: tech.name, text: `稳定度 ${v > 0 ? '+' : ''}${v}` });
          break;
        }
        default:
          // 其他类型先忽略，避免误导
          break;
      }
    });
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  if (!effects || effects.length === 0) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-4 ${className || ''}`}>
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">当前效果</h3>
        </div>
        <p className="text-gray-400 text-sm">暂无生效的国家效果</p>
      </div>
    );
  }

  // 从标签列表中过滤掉“科技来源”的效果（合并为单一“科技”徽章显示）
  // 同时过滤掉“人物来源”的效果（改由本组件按职位聚合渲染，避免重复与未知标签）
  const displayEffects = effects.filter((e: any) => {
    const srcType = e?.source?.type ?? e?.sourceType;
    return (
      srcType !== EffectSourceType.TECHNOLOGY &&
      srcType !== 'technology' &&
      srcType !== EffectSourceType.CHARACTER &&
      srcType !== 'character'
    );
  });

  // 按类型分组效果，确保鲁棒性
  const groupedEffects = displayEffects.reduce((acc, effect) => {
    // 统一读取来源（兼容旧结构与新结构）
    const src: any = (effect as any).source || {};
    const sourceType = src.type || (effect as any).sourceType || effect.type || 'unknown';
    const sourceId = src.id || (effect as any).sourceId || (effect as any).id || 'default';
    const effectType = effect.type || 'unknown';

    // 事件类：每个事件独立成标签，使用效果自身 id 作为唯一键，避免与同类合并
    const key = sourceType === 'event'
      ? `event_${(effect as any).id || sourceId}`
      : `${effectType}_${sourceType}_${sourceId}`;
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(effect);
    return acc;
  }, {} as Record<string, Effect[]>)

  const [showAllEffects, setShowAllEffects] = useState(false);

  // 读取在职人物（按职位）
  const activeByPosition: Record<string, any> = useGameStore(
    (s) => ((s.gameState.characterSystem as any)?.activeByPosition || {})
  );

  // 职位 -> 中文标签
  const positionLabel = (pos: string) => {
    const map: Record<string, string> = {
      chief: '酋长',
      king: '国王',
      emperor: '皇帝',
      president: '总统',
      elder: '长老',
      grand_scholar: '大学士',
      academy_head: '学院院长',
      high_priest: '大祭司',
      archbishop: '大主教',
      pope: '教宗',
      archmage: '大法师',
      royal_archmage: '御用大法师',
      chief_judge: '大法官',
      speaker: '议长',
      general: '将军',
      grand_marshal: '大元帅',
      diplomat: '外交官'
    };
    return map[pos] || pos;
  };

  // 资源名翻译（与侧边栏一致）
  function getResLabel(res: string) {
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
  }

  // 将单条效果转为“名称 与 数值文本”
  const effectLineOf = (eff: any) => {
    const type = eff?.type;
    const target = eff?.target ?? eff?.resource;
    const raw = Number(eff?.value || 0);
    const isPct = eff?.isPercentage ?? (raw > 0 && raw < 1);
    const val = isPct ? `${(raw * 100 >= 0 ? '+' : '')}${(raw * 100).toFixed(2)}%` : `${raw >= 0 ? '+' : ''}${raw.toFixed(2)}`;

    // 名称映射
    if (type === 'resource_multiplier' || type === 'resource_production' || type === 'resource_production_bonus') {
      if (target && target !== 'all') return { name: `${getResLabel(String(target))}效率`, value: val };
      return { name: '生产效率', value: val };
    }
    if (type === 'population_growth' || type === 'population_growth_bonus') {
      return { name: '人口增长率', value: isPct ? val : `${raw >= 0 ? '+' : ''}${raw}%` };
    }
    if (type === 'research_speed' || type === 'research_speed_bonus') {
      return { name: '科技研发速度', value: val };
    }
    if (type === 'stability' || type === EffectType.STABILITY) {
      // 稳定度通常是点数
      const v = Number(eff?.value || 0);
      return { name: '稳定度', value: `${v >= 0 ? '+' : ''}${Math.round(v)}` };
    }
    if (type === 'corruption' || type === EffectType.CORRUPTION) {
      const v = Number(eff?.value || 0);
      return { name: '腐败度', value: `${v >= 0 ? '+' : ''}${Math.round(v)}` };
    }
    if (type === 'resource_efficiency') {
      if (target && target !== 'all') return { name: `${getResLabel(String(target))}效率`, value: val };
      return { name: '资源效率', value: val };
    }
    if (type === 'faith_gain') return { name: '信仰获取', value: val };
    if (type === 'magic_gain') return { name: '魔力获取', value: val };
    if (type === 'magic_efficiency') return { name: '魔法效率', value: val };
    if (type === 'magic_resistance' || type === 'magic_resist') return { name: '魔法抗性', value: val };
    if (type === 'trade_income') return { name: '贸易收益', value: val };
    if (type === 'trade_efficiency') return { name: '交易兑换效率', value: val };
    if (type === 'relation_improvement' || type === 'relationship_change') return { name: '关系改善速度', value: val };
    if (type === 'disaster_response') return { name: '灾害/事件处理效率', value: val };
    if (type === 'maintenance_reduction') return { name: '全局维护/损耗', value: val };
    if (type === 'morale_event_success') return { name: '士气相关事件成功率', value: val };
    if (type === 'population_growth' || type === 'population_growth_bonus') {
      return { name: '人口增长率', value: isPct ? val : `${raw >= 0 ? '+' : ''}${raw}%` };
    }
    if (type === 'research_speed' || type === 'research_speed_bonus') {
      return { name: '科技研发速度', value: val };
    }
    // 军事类映射
    if (type === 'military' || type === 'military_strength' || type === 'army') {
      const sub = String(target || '').toLowerCase();
      if (sub.includes('combat') || sub === 'combat_power') return { name: '军队战斗力', value: isPct ? val : `${raw >= 0 ? '+' : ''}${Math.round(raw)}` };
      if (sub.includes('morale')) return { name: '军队士气', value: isPct ? val : `${raw >= 0 ? '+' : ''}${Math.round(raw)}` };
      if (sub.includes('supply') || sub.includes('consumption')) return { name: '军需消耗', value: isPct ? val : `${raw >= 0 ? '+' : ''}${Math.round(raw)}` };
      // 默认归为“军力”
      return { name: '军力', value: isPct ? val : `${raw >= 0 ? '+' : ''}${Math.round(raw)}` };
    }

    // 兜底
    // 兜底：尽量将英文 target 翻译成中文
    const translateFallback = (t?: string, tar?: string) => {
      if (!t) return '效果';
      if ((t === 'military' || t === 'army') && tar) {
        const s = tar.toLowerCase();
        if (s.includes('combat') || s === 'combat_power') return '军队战斗力';
        if (s.includes('morale')) return '军队士气';
        if (s.includes('supply') || s.includes('consumption')) return '军需消耗';
      }
      return t.replace(/_/g, ' ');
    };
    const name = eff?.name || (target ? `${translateFallback(String(type), String(target))}` : translateFallback(String(type)));
    return { name, value: val };
  };

  // 计算每个职位的人物效果明细（属性折算 + 特性 + Buff）
  const characterEffectsByPos: Record<string, Array<{ name: string; value: string }>> = (() => {
    const out: Record<string, Array<{ name: string; value: string }>> = {};
    let mapping: any = null;
    try {
      // 复用 store 中使用的映射，确保口径一致
      mapping = (require('@/lib/character-data') as any).CHARACTER_ATTRIBUTE_EFFECTS || null;
    } catch {
      mapping = null;
    }

    Object.entries(activeByPosition).forEach(([pos, ch]: [string, any]) => {
      if (!ch) return;
      const lines: Array<{ name: string; value: string }> = [];

      // 1) 属性折算
      if (mapping && ch.type && mapping[ch.type]) {
        const attrs = ch.attributes || {};
        const m = mapping[ch.type];
        const applyOne = (key: 'force' | 'intelligence' | 'charisma') => {
          const def = m[key];
          const pts = Number(attrs?.[key] || 0);
          if (def && pts > 0) {
            const val = Number(def.value || 0) * pts;
            const eff = {
              type: def.type,
              target: def.target,
              value: val,
              isPercentage: def.value < 1
            };
            const line = effectLineOf(eff);
            if (line && Number.isFinite(Number(val)) && Math.abs(val) > 0) lines.push(line);
          }
        };
        applyOne('force');
        applyOne('intelligence');
        applyOne('charisma');
      }

      // 2) 特性效果
      (ch.traits || []).forEach((t: any) => {
        // 2.1 显式映射常见特性（与全局下沉口径一致），以便悬浮明细直接显示
        if (t?.id === 'industrious') {
          const eff = { type: 'resource_production_bonus', target: 'all', value: 0.05, isPercentage: true, name: '生产效率' };
          const line = effectLineOf(eff);
          lines.push(line);
        } else if (t?.id === 'bookish') {
          const eff = { type: 'resource_production_bonus', target: 'all', value: -0.04, isPercentage: true, name: '生产效率' };
          const line = effectLineOf(eff);
          lines.push(line);
        } else if (t?.id === 'wasteful') {
          const eff = { type: 'resource_production_bonus', target: 'all', value: 0.05, isPercentage: true, name: '生产效率' };
          const line = effectLineOf(eff);
          lines.push(line);
        }
        // 2.2 读取特性自带的 effects（如果有）
        (t?.effects || []).forEach((eff: any) => {
          const line = effectLineOf(eff);
          // 过滤 0 值
          const vnum = Number(eff?.isPercentage ? (eff.value * 100) : eff.value);
          if (Number.isFinite(vnum) && Math.abs(vnum) > 0) lines.push(line);
        });
      });

      // 3) Buff 效果
      (ch.buffs || []).forEach((b: any) => {
        (b?.effects || []).forEach((eff: any) => {
          const line = effectLineOf(eff);
          const vnum = Number(eff?.isPercentage ? (eff.value * 100) : eff.value);
          if (Number.isFinite(vnum) && Math.abs(vnum) > 0) lines.push(line);
        });
      });

      // 合并同名指标（名称相同的做数值合并）
      const merged: Record<string, number> = {};
      const isPctName = (name: string) =>
        ['效率', '速度', '收益', '获取', '增长率'].some((k) => name.includes(k));
      lines.forEach((ln) => {
        // 解析数值
        const m = ln.value.match(/([+-]?\d+(\.\d+)?)%$/);
        if (m) {
          const n = parseFloat(m[1]);
          merged[ln.name] = (merged[ln.name] || 0) + n;
        } else {
          // 非百分比，则按点数合并
          const n = parseFloat(ln.value);
          if (!isNaN(n)) merged[ln.name] = (merged[ln.name] || 0) + n;
        }
      });
      const finalLines = Object.entries(merged).map(([name, num]) => {
        const isPct = isPctName(name);
        const txt = isPct
          ? `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`
          : `${num >= 0 ? '+' : ''}${Math.round(num)}`;
        return { name, value: txt };
      });

      if (finalLines.length > 0) {
        out[pos] = finalLines;
      }
    });

    return out;
  })();

  // 人物职位标签悬浮控制
  const [hoverCharPos, setHoverCharPos] = useState<string | null>(null);

  return (
    <div className={`bg-gray-800/50 rounded-lg p-4 ${className || ''}`} onMouseMove={handleMouseMove}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">当前效果</h3>
        </div>
        <button
          onClick={() => setShowAllEffects(true)}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
        >
          <Info className="h-4 w-4" />
          全部效果
        </button>
      </div>
      
      {/* 横排显示效果标签，支持自动换行 */}
      <div className="flex flex-wrap gap-2">
        {/* 科技合并徽章 */}
        {researchedTechs.length > 0 && (
          <div
            className="px-3 py-1 rounded-full border text-sm font-medium cursor-pointer transition-all hover:scale-105 bg-blue-900/40 border-blue-500/50 text-blue-200"
            onMouseEnter={() => setTechHover(true)}
            onMouseLeave={() => setTechHover(false)}
          >
            科技
          </div>
        )}

        {/* 人物效果（按职位聚合为单一徽章） */}
        {Object.entries(characterEffectsByPos).map(([pos, lines]) => (
          <div
            key={`charpos_${pos}`}
            className="px-3 py-1 rounded-full border text-sm font-medium cursor-pointer transition-all hover:scale-105 bg-amber-900/40 border-amber-500/50 text-amber-200"
            onMouseEnter={() => setHoverCharPos(pos)}
            onMouseLeave={() => setHoverCharPos(null)}
            title={positionLabel(pos)}
          >
            {positionLabel(pos)}
          </div>
        ))}

        {/* 其余系统效果标签（已剔除科技与人物来源） */}
        {Object.entries(groupedEffects).map(([key, effectGroup]) => {
          // 对于同类型的效果，显示合并后的值
          const firstEffect = effectGroup[0];
          const totalValue = effectGroup.reduce((sum, effect) => sum + effect.value, 0);
          // 强制稳定度和腐败度不显示数值
          const isStabilityOrCorruption = firstEffect.name === '稳定度' || firstEffect.name === '腐败度';

          const mergedEffect = {
            ...firstEffect,
            value: totalValue,
            name: firstEffect.name || '未知效果',
            type: firstEffect.type || EffectType.STABILITY,
            isPercentage: isStabilityOrCorruption ? false : (firstEffect.isPercentage !== undefined ? firstEffect.isPercentage : true),
            // 若原效果携带自定义 displayName（如事件临时效果标签），则优先使用，不要覆盖
            displayName: (firstEffect as any).displayName ?? (isStabilityOrCorruption ? firstEffect.name : `${firstEffect.name}: ${formatValue(totalValue, firstEffect.isPercentage)}`)
          };
          
          return (
            <EffectTag
              key={key}
              effect={mergedEffect}
              onHover={setHoveredEffect}
            />
          );
        })}
      </div>

      {hoveredEffect && (
        <EffectTooltip
          effect={hoveredEffect}
          position={mousePosition}
        />
      )}

      {/* 科技浮框明细 */}
      {techHover && researchedTechs.length > 0 && (
        <div
          className="fixed z-50 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl max-w-sm"
          style={{ left: mousePosition.x + 10, top: mousePosition.y - 10, transform: 'translateY(-100%)' }}
        >
          <div className="text-white font-semibold mb-2">科技效果</div>
          {techBuffLines.length === 0 ? (
            <div className="text-xs text-gray-400">已研究科技暂无可显示的数值类效果</div>
          ) : (
            <div className="space-y-1">
              {techBuffLines.map((line, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-gray-400">{line.techName}:</span>
                  <span className={line.text.includes('-') ? 'text-red-400' : 'text-green-400'}>{line.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 人物职位浮框明细 */}
      {hoverCharPos && characterEffectsByPos[hoverCharPos] && (
        <div
          className="fixed z-50 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl max-w-sm"
          style={{ left: mousePosition.x + 10, top: mousePosition.y - 10, transform: 'translateY(-100%)' }}
        >
          <div className="text-white font-semibold mb-2">{positionLabel(hoverCharPos)}效果</div>
          <div className="space-y-1">
            {characterEffectsByPos[hoverCharPos].map((line, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-gray-400">{line.name}:</span>
                {(() => {
                  const num = parseFloat(line.value.replace('%','').replace('+','')) || 0;
                  const cls = line.name === '腐败度'
                    ? (num < 0 ? 'text-green-400' : num > 0 ? 'text-red-400' : 'text-gray-400')
                    : (num > 0 ? 'text-green-400' : num < 0 ? 'text-red-400' : 'text-gray-400');
                  return <span className={cls}>{line.value}</span>;
                })()}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 全部效果弹窗 */}
      <AllEffectsModal 
        isOpen={showAllEffects} 
        onClose={() => setShowAllEffects(false)} 
      />
    </div>
  );
}

// 导出类型和接口供其他组件使用
export type { EffectsPanelProps };