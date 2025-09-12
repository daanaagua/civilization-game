'use client';

import React from 'react';
import { Tooltip } from '@/components/ui/tooltip';
import { Shield, AlertTriangle } from 'lucide-react';

interface StatusIndicatorProps {
  name: string;
  value: number;
  maxValue: number;
  color: 'blue' | 'red' | 'green' | 'yellow';
  tooltipContent?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  name,
  value,
  maxValue,
  color,
  tooltipContent,
  className = ''
}) => {
  const Icon = name === '稳定度' ? Shield : AlertTriangle;

  const config = {
    blue: {
      bgColor: 'bg-gray-700/50',
      borderColor: 'border-gray-600',
      hoverBorderColor: 'hover:border-blue-400/50',
      textColor: 'text-blue-400',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-400'
    },
    red: {
      bgColor: 'bg-gray-700/50',
      borderColor: 'border-gray-600',
      hoverBorderColor: 'hover:border-red-400/50',
      textColor: 'text-red-400',
      gradientFrom: 'from-red-500',
      gradientTo: 'to-red-400'
    },
    green: {
      bgColor: 'bg-gray-700/50',
      borderColor: 'border-gray-600',
      hoverBorderColor: 'hover:border-green-400/50',
      textColor: 'text-green-400',
      gradientFrom: 'from-green-500',
      gradientTo: 'to-green-400'
    },
    yellow: {
      bgColor: 'bg-gray-700/50',
      borderColor: 'border-gray-600',
      hoverBorderColor: 'hover:border-yellow-400/50',
      textColor: 'text-yellow-400',
      gradientFrom: 'from-yellow-500',
      gradientTo: 'to-yellow-400'
    }
  }[color];

  const percentage = Math.max(0, Math.min(100, (value / maxValue) * 100));
  const displayTooltip = tooltipContent || `${name}: ${value.toFixed(1)}/${maxValue}`;

  return (
    <Tooltip content={displayTooltip}>
      <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-3 ${config.hoverBorderColor} transition-colors cursor-help ${className}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${config.textColor}`} />
            <span className="text-sm font-medium text-gray-300">{name}</span>
          </div>
          <span className={`text-sm font-bold ${config.textColor}`}>{value.toFixed(1)}</span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-3 shadow-inner">
          <div 
            className={`bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} h-3 rounded-full transition-all duration-300 shadow-sm`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-400 mt-1 text-center">{value.toFixed(1)}%</div>
      </div>
    </Tooltip>
  );
};