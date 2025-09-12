'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { Effect, EffectType } from '@/lib/effects-system';

// 效果标签组件
interface EffectTagProps {
  effect: Effect;
  onHover?: (effect: Effect | null) => void;
}

function EffectTag({ effect, onHover }: EffectTagProps) {
  const getTagColor = (type: EffectType) => {
    switch (type) {
      case EffectType.STABILITY:
        return 'bg-green-600 border-green-500';
      case EffectType.CORRUPTION:
        return 'bg-red-600 border-red-500';
      case EffectType.POPULATION_GROWTH:
        return 'bg-blue-600 border-blue-500';
      case EffectType.RESOURCE_PRODUCTION:
        return 'bg-yellow-600 border-yellow-500';
      case EffectType.RESEARCH_SPEED:
        return 'bg-purple-600 border-purple-500';
      case EffectType.BUILDING_COST:
        return 'bg-orange-600 border-orange-500';
      case EffectType.MILITARY_STRENGTH:
        return 'bg-red-700 border-red-600';
      case EffectType.INHERITANCE:
        return 'bg-cyan-600 border-cyan-500';
      default:
        return 'bg-gray-600 border-gray-500';
    }
  };

  const formatValue = (value: number, isPercentage: boolean) => {
    const formattedValue = value > 0 ? `+${value}` : `${value}`;
    return isPercentage ? `${formattedValue}%` : formattedValue;
  };

  return (
    <div
      className={`
        inline-flex items-center px-2 py-1 rounded-md border text-xs font-medium text-white
        cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg
        ${getTagColor(effect.type)}
      `}
      onMouseEnter={() => onHover?.(effect)}
      onMouseLeave={() => onHover?.(null)}
    >
      {effect.icon && <span className="mr-1">{effect.icon}</span>}
      <span>{effect.name}</span>
      <span className="ml-1 font-bold">{formatValue(effect.value, effect.isPercentage)}</span>
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
      
      <p className="text-gray-300 text-sm mb-2">{effect.description}</p>
      
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

  const currentEffects = effects || [];

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  // 按类型分组效果
  const groupedEffects = currentEffects.reduce((groups, effect) => {
    if (!groups[effect.type]) {
      groups[effect.type] = [];
    }
    groups[effect.type].push(effect);
    return groups;
  }, {} as Record<EffectType, Effect[]>);

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 p-4 ${className || ''}`} onMouseMove={handleMouseMove}>
      <div className="flex items-center space-x-2 mb-3">
        <Info size={18} className="text-blue-400" />
        <h3 className="text-lg font-semibold text-white">当前效果</h3>
      </div>
      
      <div className="space-y-3">
        {Object.entries(groupedEffects).map(([type, typeEffects]) => (
          <div key={type} className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {typeEffects.map((effect) => (
                <EffectTag
                  key={effect.id}
                  effect={effect}
                  onHover={setHoveredEffect}
                />
              ))}
            </div>
          </div>
        ))}
        
        {currentEffects.length === 0 && (
          <div className="text-gray-400 text-sm text-center py-4">
            当前没有生效的效果
          </div>
        )}
      </div>
      
      <EffectTooltip effect={hoveredEffect} position={mousePosition} />
    </div>
  );
}

// 导出类型和接口供其他组件使用
export type { EffectsPanelProps };