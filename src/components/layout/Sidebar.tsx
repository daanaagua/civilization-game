'use client';

import { useGameStore } from '@/lib/game-store';
import { ResourceItem } from '@/components/ui/resource-item';
import { StatusIndicator } from '@/components/ui/status-indicator';

interface SidebarProps {}

// 格式化数字显示
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return Math.floor(num).toString();
};

export function Sidebar({}: SidebarProps) {
  const { gameState, maxPopulation, clickResource } = useGameStore();
  const { resources, stability } = gameState;
  
  // 计算腐败度（暂时用100-稳定度作为腐败度）
  const corruption = Math.max(0, 100 - stability);
  
  // 稳定度效果计算
  const getStabilityEffect = (stability: number): string => {
    if (stability >= 80) return '人口增长 +20%，资源产出 +10%';
    if (stability >= 60) return '人口增长 +10%，资源产出 +5%';
    if (stability >= 40) return '正常状态';
    if (stability >= 20) return '人口增长 -10%，资源产出 -5%';
    return '人口增长 -20%，资源产出 -10%';
  };
  
  // 腐败度效果计算
  const getCorruptionEffect = (corruption: number): string => {
    if (corruption >= 80) return '资源产出 -30%，建筑成本 +50%';
    if (corruption >= 60) return '资源产出 -20%，建筑成本 +30%';
    if (corruption >= 40) return '资源产出 -10%，建筑成本 +15%';
    if (corruption >= 20) return '资源产出 -5%，建筑成本 +10%';
    return '无负面影响';
  };
  
  return (
    <aside className="w-80 bg-gray-800 border-r border-gray-700 min-h-screen">
      <div className="p-4">
        <h1 className="text-xl font-bold text-white mb-6">文明发展</h1>
        
        {/* 资源显示 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">资源</h3>
          <div className="space-y-2">
            <ResourceItem
              name="食物"
              value={resources.food}
              limit={gameState.resourceLimits.food}
              tooltipContent={`食物产出详情：\n• 基础产出: +0.05/s\n• 工人产出: +${(gameState.workerAllocations?.farmer || 0) * 0.2}/s\n• 建筑加成: +${(Object.values(gameState.buildings).reduce((sum, count) => sum + count * 0.03, 0)).toFixed(1)}/s\n\n点击可手动收集食物...`}
              onClick={() => clickResource('food')}
            />
            <ResourceItem
              name="木材"
              value={resources.wood}
              limit={gameState.resourceLimits.wood}
              tooltipContent={`木材产出详情：\n• 基础产出: +0.04/s\n• 工人产出: +${(gameState.workerAllocations?.lumberjack || 0) * 0.18}/s\n• 建筑加成: +${(Object.values(gameState.buildings).reduce((sum, count) => sum + count * 0.025, 0)).toFixed(1)}/s\n\n点击可手动收集木材...`}
              onClick={() => clickResource('wood')}
            />
            <ResourceItem
              name="石料"
              value={resources.stone}
              limit={gameState.resourceLimits.stone}
              tooltipContent={`石料产出详情：\n• 基础产出: +0.03/s\n• 工人产出: +${(gameState.workerAllocations?.miner || 0) * 0.15}/s\n• 建筑加成: +${(Object.values(gameState.buildings).reduce((sum, count) => sum + count * 0.02, 0)).toFixed(1)}/s\n\n点击可手动收集石料...`}
              onClick={() => clickResource('stone')}
            />
            <ResourceItem
              name="人口"
              value={resources.population}
              limit={maxPopulation}
              tooltipContent={`当前人口: ${formatNumber(resources.population)}\n最大人口: ${formatNumber(maxPopulation)}\n\n人口增长受住房限制影响`}
            />
          </div>
        </div>
        
        {/* 状态显示 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">状态</h3>
          <div className="space-y-2">
            <StatusIndicator
              name="稳定度"
              value={stability}
              maxValue={100}
              color="blue"
              tooltipContent={`当前稳定度: ${stability}%\n\n效果: ${getStabilityEffect(stability)}\n\n稳定度影响人口增长和资源产出效率`}
            />
            <StatusIndicator
              name="腐败度"
              value={corruption}
              maxValue={100}
              color="red"
              tooltipContent={`当前腐败度: ${corruption}%\n\n效果: ${getCorruptionEffect(corruption)}\n\n腐败度会降低资源产出并增加建筑成本`}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}