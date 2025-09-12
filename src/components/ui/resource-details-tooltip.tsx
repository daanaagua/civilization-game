'use client';

import React from 'react';
import { useGameStore } from '@/lib/game-store';
import { BUILDINGS } from '@/lib/game-data';

interface ResourceDetailsTooltipProps {
  resourceType: 'food' | 'wood' | 'stone' | 'tools';
  children: React.ReactNode;
}

export function ResourceDetailsTooltip({ resourceType, children }: ResourceDetailsTooltipProps) {
  const { gameState } = useGameStore();
  const { buildings, resources, technologies } = gameState;

  const calculateDetailedRates = () => {
    const details: { source: string; rate: number; color: string }[] = [];

    // 人口消耗（仅食物）
    if (resourceType === 'food' && resources.population > 0) {
      const consumptionRate = resources.population * 0.2;
      details.push({
        source: '人口消耗',
        rate: -consumptionRate,
        color: 'text-red-400'
      });
    }

    // 建筑产出
    Object.values(buildings).forEach((building) => {
      const buildingData = BUILDINGS[building.buildingId];
      if (buildingData?.produces?.[resourceType]) {
        let efficiency = 1;
        
        // 计算工人效率
        if (buildingData.canAssignWorkers && buildingData.maxWorkers) {
          const assignedWorkers = building.assignedWorkers || 0;
          const maxWorkers = buildingData.maxWorkers;
          efficiency = Math.max(0.1, assignedWorkers / maxWorkers);
        }
        
        const baseRate = buildingData.produces[resourceType] * building.count * efficiency;
        
        // 应用科技加成
        let techMultiplier = 1;
        Object.values(technologies).forEach((tech) => {
          if (tech.researched && tech.effects) {
            tech.effects.forEach((effect) => {
              if (effect.type === 'resource_multiplier' && effect.target === resourceType) {
                techMultiplier *= effect.value;
              }
            });
          }
        });
        
        const finalRate = baseRate * techMultiplier;
        
        if (finalRate > 0) {
          const workerInfo = buildingData.canAssignWorkers 
            ? ` (${building.assignedWorkers || 0}/${buildingData.maxWorkers}工人)`
            : '';
          
          details.push({
            source: `${buildingData.name}${workerInfo}`,
            rate: finalRate,
            color: 'text-green-400'
          });
        }
      }
    });

    // 食物腐烂（仅在未解锁保鲜技术时）
    if (resourceType === 'food' && resources.food > 0) {
      const hasPreservation = technologies['food_preservation']?.researched;
      if (!hasPreservation) {
        const rotRate = resources.food * 0.001; // 0.1%每秒腐烂
        details.push({
          source: '腐烂',
          rate: -rotRate,
          color: 'text-orange-400'
        });
      }
    }

    return details;
  };

  const details = calculateDetailedRates();
  const totalRate = details.reduce((sum, detail) => sum + detail.rate, 0);

  const formatRate = (rate: number) => {
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(2)}/s`;
  };

  return (
    <div className="group relative">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-48">
        <div className="font-semibold mb-2 text-center">
          {resourceType === 'food' ? '食物' : 
           resourceType === 'wood' ? '木材' : 
           resourceType === 'stone' ? '石材' : '工具'} 详情
        </div>
        
        {details.length > 0 ? (
          <div className="space-y-1">
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-300">{detail.source}:</span>
                <span className={detail.color}>{formatRate(detail.rate)}</span>
              </div>
            ))}
            <div className="border-t border-gray-600 pt-1 mt-2">
              <div className="flex justify-between items-center font-semibold">
                <span>总计:</span>
                <span className={totalRate >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatRate(totalRate)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-center">无产出或消耗</div>
        )}
        
        {resourceType === 'food' && (
          <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
            点击可手动收集食物
          </div>
        )}
      </div>
    </div>
  );
}