'use client';

import React from 'react';
import { useGameStore } from '@/lib/game-store';
import { calculateDetailedRates } from '@/lib/resource-calculations';
import { Resources } from '@/types/game';
import { formatNumber } from '@/lib/utils';

interface ResourceDetailsTooltipProps {
  resource: 'food' | 'wood' | 'stone' | 'tools' | 'population' | 'housing';
}

export function ResourceDetailsTooltip({ resource }: ResourceDetailsTooltipProps) {
  const { gameState, getResourceRateDetails } = useGameStore();
  const { resources } = gameState;

  const details = getResourceRateDetails(resource);
  const totalRate = details ? details.reduce((sum, detail) => sum + detail.rate, 0) : 0;

  const formatRate = (rate: number) => {
    if (resource === 'population' || resource === 'housing') {
      return formatNumber(rate, 0); // 人口和住房显示为整数
    }
    const sign = rate >= 0 ? '+' : '-';
    return `${sign}${formatNumber(Math.abs(rate))}/s`; // 使用统一的格式化函数，保留两位小数
  };

  const getResourceName = () => {
    const names = {
      food: '食物',
      wood: '木材', 
      stone: '石料',
      tools: '工具',
      population: '人口',
      housing: '住房'
    };
    return names[resource];
  };

  const getResourceDescription = () => {
    const descriptions = {
      food: '维持人口生存的基本资源',
      wood: '建造和制作的基础材料',
      stone: '坚固建筑的重要材料', 
      tools: '提高生产效率的器具',
      population: '文明发展的核心力量',
      housing: '人口居住的容量限制'
    };
    return descriptions[resource];
  };

  return (
    <div className="max-w-xs">
      <div className="font-semibold mb-1">{getResourceName()}</div>
      <div className="text-xs mb-2">{getResourceDescription()}</div>
      <div className="text-xs space-y-1">
        <div>当前数量: {resource === 'population' ? formatNumber(resources[resource], 0) : formatNumber(resources[resource])}</div>
        {resource !== 'housing' && resource !== 'population' && (
          <div>存储上限: {gameState.resourceLimits[resource]}</div>
        )}
        {resource === 'population' && (
          <div>住房容量: {resources.housing}</div>
        )}
        
        {details.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="font-medium mb-1">详细信息:</div>
            {details && details.length > 0 ? (
              details.map((detail, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-300">{detail.source}:</span>
                  <span className={detail.color}>
                    {formatRate(detail.rate)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center">暂无详细信息</div>
            )}
            
            {details && details.length > 1 && resource !== 'population' && resource !== 'housing' && (
              <div className="mt-1 pt-1 border-t border-gray-700 flex justify-between items-center font-medium">
                <span>总计:</span>
                <span className={totalRate >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatRate(totalRate)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}