'use client';

import React from 'react';
import { useGameStore } from '@/lib/game-store';
import { BUILDINGS } from '@/lib/game-data';

interface ResourceDetailsTooltipProps {
  resource: 'food' | 'wood' | 'stone' | 'tools' | 'population' | 'housing';
}

export function ResourceDetailsTooltip({ resource }: ResourceDetailsTooltipProps) {
  const { gameState } = useGameStore();
  const { buildings, resources, technologies, stability, corruption } = gameState;

  const calculateDetailedRates = () => {
    const details: { source: string; rate: number; color: string }[] = [];

    // 如果是人口或住房，显示不同的信息
    if (resource === 'population') {
      details.push({
        source: '当前人口',
        rate: resources.population,
        color: 'text-blue-400'
      });
      details.push({
        source: '住房容量',
        rate: resources.housing,
        color: 'text-gray-400'
      });
      return details;
    }

    if (resource === 'housing') {
      // 计算住房来源
      Object.values(buildings).forEach((building) => {
        const buildingData = BUILDINGS[building.buildingId];
        if (buildingData?.provides?.housing) {
          const housingProvided = buildingData.provides.housing * building.count;
          if (housingProvided > 0) {
            details.push({
              source: buildingData.name,
              rate: housingProvided,
              color: 'text-green-400'
            });
          }
        }
      });
      return details;
    }

    // 计算稳定度和腐败度的总体影响
    let stabilityMultiplier = 1;
    if (stability >= 80) stabilityMultiplier = 1.1;
    else if (stability >= 60) stabilityMultiplier = 1.05;
    else if (stability < 40) stabilityMultiplier = 0.95;
    else if (stability < 20) stabilityMultiplier = 0.9;

    let corruptionMultiplier = 1;
    if (corruption > 90) corruptionMultiplier = 0.4;
    else if (corruption > 75) corruptionMultiplier = 0.6;
    else if (corruption > 50) corruptionMultiplier = 0.75;
    else if (corruption > 25) corruptionMultiplier = 0.9;

    // 人口消耗（仅食物）
    if (resource === 'food' && resources.population > 0) {
      const baseConsumption = resources.population * 0.2;
      const finalConsumption = baseConsumption * stabilityMultiplier;
      details.push({
        source: '人口消耗',
        rate: -finalConsumption,
        color: 'text-red-400'
      });
    }

    // 建筑产出
    Object.values(buildings).forEach((building) => {
      const buildingData = BUILDINGS[building.buildingId];
      if (buildingData?.produces?.[resource]) {
        let efficiency = 1;
        
        // 计算工人效率
        if (buildingData.canAssignWorkers && buildingData.maxWorkers) {
          const assignedWorkers = building.assignedWorkers || 0;
          const maxWorkers = buildingData.maxWorkers;
          efficiency = Math.max(0.1, assignedWorkers / maxWorkers);
        }
        
        let baseRate = buildingData.produces[resource] * building.count * efficiency;
        
        // 应用科技加成
        Object.values(technologies).forEach((tech) => {
          if (tech.researched && tech.effects) {
            tech.effects.forEach((effect) => {
              if (effect.type === 'resource_multiplier' && effect.target === resource) {
                baseRate *= effect.value;
              }
            });
          }
        });
        
        // 应用稳定度和腐败度影响
        const finalRate = baseRate * stabilityMultiplier * corruptionMultiplier;
        
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
    if (resource === 'food' && resources.food > 0) {
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
    if (resource === 'population' || resource === 'housing') {
      return rate.toString();
    }
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(2)}/s`;
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
        <div>当前数量: {resources[resource]}</div>
        {resource !== 'housing' && resource !== 'population' && (
          <div>存储上限: {gameState.resourceLimits[resource]}</div>
        )}
        {resource === 'population' && (
          <div>住房容量: {resources.housing}</div>
        )}
        
        {details.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="font-medium mb-1">详细信息:</div>
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-300">{detail.source}:</span>
                <span className={detail.color}>
                  {formatRate(detail.rate)}
                </span>
              </div>
            ))}
            
            {resource !== 'population' && resource !== 'housing' && (
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