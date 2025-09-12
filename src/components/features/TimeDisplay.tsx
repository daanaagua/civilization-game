'use client';

import React from 'react';
import { useGameTime } from '@/hooks/use-game-time';
import { useGameStore } from '@/lib/game-store';
import { Season } from '@/lib/time-system';

interface TimeDisplayProps {
  className?: string;
  showSeason?: boolean;
  showTotalDays?: boolean;
}

/**
 * 时间显示组件
 * 显示当前游戏日期和季节
 */
export function TimeDisplay({ 
  className = '', 
  showSeason = true, 
  showTotalDays = false 
}: TimeDisplayProps) {
  const { formattedDate, seasonName, totalDays, season } = useGameTime();

  // 季节对应的颜色和图标
  const getSeasonStyle = (currentSeason: Season) => {
    switch (currentSeason) {
      case Season.SPRING:
        return {
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: '🌸'
        };
      case Season.SUMMER:
        return {
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: '☀️'
        };
      case Season.AUTUMN:
        return {
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          icon: '🍂'
        };
      case Season.WINTER:
        return {
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: '❄️'
        };
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: '📅'
        };
    }
  };

  const seasonStyle = getSeasonStyle(season);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* 日期显示 */}
      <div className="flex items-center space-x-2">
        <div className="text-lg font-mono font-bold text-gray-800">
          {formattedDate}
        </div>
        {showTotalDays && (
          <div className="text-sm text-gray-500">
            (第{totalDays}天)
          </div>
        )}
      </div>

      {/* 季节显示 */}
      {showSeason && (
        <div className={`
          flex items-center space-x-1 px-3 py-1 rounded-full border
          ${seasonStyle.bg} ${seasonStyle.border}
        `}>
          <span className="text-lg">{seasonStyle.icon}</span>
          <span className={`text-sm font-medium ${seasonStyle.color}`}>
            {seasonName}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 紧凑版时间显示组件
 */
export function CompactTimeDisplay({ className = '' }: { className?: string }) {
  const { formatGameDate } = useGameStore();
  const gameDate = formatGameDate();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-lg">📅</span>
      <span className="text-sm font-mono">{gameDate}</span>
    </div>
  );
}

/**
 * 详细时间信息组件
 */
export function DetailedTimeDisplay({ className = '' }: { className?: string }) {
  const { currentDate, formattedDate, seasonName, totalDays, season } = useGameTime();
  const seasonStyle = getSeasonStyle(season);

  return (
    <div className={`p-4 bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="space-y-3">
        {/* 主要日期显示 */}
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-gray-800">
            {formattedDate}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            游戏进行第 {totalDays} 天
          </div>
        </div>

        {/* 季节信息 */}
        <div className={`
          flex items-center justify-center space-x-2 p-3 rounded-lg
          ${seasonStyle.bg} ${seasonStyle.border} border
        `}>
          <span className="text-2xl">{seasonStyle.icon}</span>
          <span className={`text-lg font-medium ${seasonStyle.color}`}>
            {seasonName}
          </span>
        </div>

        {/* 详细信息 */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm text-gray-600">
          <div>
            <div className="font-medium">{currentDate.year}</div>
            <div className="text-xs">年</div>
          </div>
          <div>
            <div className="font-medium">{currentDate.month + 1}</div>
            <div className="text-xs">月</div>
          </div>
          <div>
            <div className="font-medium">{currentDate.day}</div>
            <div className="text-xs">日</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 辅助函数，提取到组件外部以便复用
function getSeasonStyle(currentSeason: Season) {
  switch (currentSeason) {
    case Season.SPRING:
      return {
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: '🌸'
      };
    case Season.SUMMER:
      return {
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: '☀️'
      };
    case Season.AUTUMN:
      return {
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: '🍂'
      };
    case Season.WINTER:
      return {
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: '❄️'
      };
    default:
      return {
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        icon: '📅'
      };
  }
}