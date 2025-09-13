'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { Effect, EffectType } from '@/lib/effects-system';
import { AllEffectsModal } from '@/components/ui/AllEffectsModal';

// 格式化效果值显示
function formatValue(value: number, isPercentage: boolean): string {
  const formattedValue = value > 0 ? `+${value}` : `${value}`;
  return isPercentage ? `${formattedValue}%` : formattedValue;
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

// 计算腐败度对游戏机制的影响
function getCorruptionEffects(corruption: number): Array<{name: string, value: string}> {
  const taxEfficiency = Math.max(-50, -corruption);
  const buildingCost = Math.min(50, corruption);
  const researchSpeed = Math.max(-30, -corruption * 0.5);
  const tradeIncome = Math.max(-40, -corruption * 0.8);
  const armyMaintenance = Math.min(30, corruption * 0.6);

  return [
    { name: '税收效率', value: `${taxEfficiency}%` },
    { name: '建筑成本', value: `+${buildingCost}%` },
    { name: '科技研发速度', value: `${researchSpeed}%` },
    { name: '贸易收益', value: `${tradeIncome}%` },
    { name: '军队维护费', value: `+${armyMaintenance}%` }
  ];
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
    const formattedValue = value > 0 ? `+${value}` : `${value}`;
    return isPercentage ? `${formattedValue}%` : formattedValue;
  };

  // 根据效果类型获取详细影响说明
  const getEffectDetails = () => {
    if (effect.type === EffectType.STABILITY) {
      const stabilityEffects = getStabilityEffects(effect.value);
      return (
        <div className="space-y-1">
          <div className="text-gray-300 mb-2">稳定度影响以下游戏机制：</div>
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
              <span className={item.value.includes('-') ? 'text-red-400' : 'text-green-400'}>
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

  // 按类型分组效果，确保鲁棒性
  const groupedEffects = effects.reduce((acc, effect) => {
    // 创建更稳定的分组键，处理各种可能的效果来源
    const sourceType = (effect as any).sourceType || effect.type || 'unknown';
    const sourceId = (effect as any).sourceId || 'default';
    const effectType = effect.type || 'unknown';
    const key = `${effectType}_${sourceType}_${sourceId}`;
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(effect);
    return acc;
  }, {} as Record<string, Effect[]>);

  const [showAllEffects, setShowAllEffects] = useState(false);

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
            // 直接在这里控制显示，稳定度和腐败度只显示名称
            displayName: isStabilityOrCorruption ? firstEffect.name : `${firstEffect.name}: ${formatValue(totalValue, firstEffect.isPercentage)}`
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