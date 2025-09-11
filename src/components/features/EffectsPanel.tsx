'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

// 效果类型枚举
export enum EffectType {
  PERMANENT = 'permanent',    // 常驻效果（稳定度、腐败度等）
  EVENT = 'event',           // 突发事件效果（丰收等）
  CHARACTER = 'character',   // 人物效果
  ARTIFACT = 'artifact',     // 宝物效果
  BUILDING = 'building',     // 建筑效果
  TECHNOLOGY = 'technology'  // 科技效果
}

// 效果数据接口
export interface Effect {
  id: string;
  name: string;
  type: EffectType;
  value?: number;           // 效果数值（可选）
  description: string;      // 悬浮提示描述
  buffs: string[];         // 具体buff列表
  duration?: number;       // 持续时间（可选，-1表示永久）
  icon?: string;           // 图标（可选）
  color?: string;          // 标签颜色（可选）
}

// 效果标签组件
interface EffectTagProps {
  effect: Effect;
  onHover?: (effect: Effect | null) => void;
}

function EffectTag({ effect, onHover }: EffectTagProps) {
  const getTagColor = (type: EffectType) => {
    switch (type) {
      case EffectType.PERMANENT:
        return 'bg-blue-600 border-blue-500';
      case EffectType.EVENT:
        return 'bg-green-600 border-green-500';
      case EffectType.CHARACTER:
        return 'bg-purple-600 border-purple-500';
      case EffectType.ARTIFACT:
        return 'bg-yellow-600 border-yellow-500';
      case EffectType.BUILDING:
        return 'bg-orange-600 border-orange-500';
      case EffectType.TECHNOLOGY:
        return 'bg-cyan-600 border-cyan-500';
      default:
        return 'bg-gray-600 border-gray-500';
    }
  };

  const formatValue = (value?: number) => {
    if (value === undefined) return '';
    return value > 0 ? `+${value}` : `${value}`;
  };

  return (
    <div
      className={`
        inline-flex items-center px-2 py-1 rounded-md border text-xs font-medium text-white
        cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg
        ${effect.color || getTagColor(effect.type)}
      `}
      onMouseEnter={() => onHover?.(effect)}
      onMouseLeave={() => onHover?.(null)}
    >
      {effect.icon && <span className="mr-1">{effect.icon}</span>}
      <span>{effect.name}</span>
      {effect.value !== undefined && (
        <span className="ml-1 font-bold">{formatValue(effect.value)}</span>
      )}
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
        {effect.value !== undefined && (
          <span className="text-sm font-bold text-yellow-400">
            {effect.value > 0 ? `+${effect.value}` : `${effect.value}`}
          </span>
        )}
      </div>
      
      <p className="text-gray-300 text-sm mb-2">{effect.description}</p>
      
      {effect.buffs.length > 0 && (
        <div className="space-y-1">
          <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">效果:</h5>
          {effect.buffs.map((buff, index) => (
            <div key={index} className="text-xs text-green-400 flex items-center">
              <span className="mr-1">•</span>
              <span>{buff}</span>
            </div>
          ))}
        </div>
      )}
      
      {effect.duration !== undefined && effect.duration > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <span className="text-xs text-gray-400">
            剩余时间: {effect.duration} 回合
          </span>
        </div>
      )}
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

  const currentEffects = effects;

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
export type { Effect, EffectsPanelProps };