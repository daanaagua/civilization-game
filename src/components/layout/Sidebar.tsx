'use client';

import { useGameStore } from '@/lib/game-store';
import { formatNumber } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { StatusDetailsTooltip } from '@/components/ui/status-details-tooltip';

interface SidebarProps {}



export function Sidebar({}: SidebarProps) {
  const { gameState, population, maxPopulation, clickResource } = useGameStore();
  const { resources, stability } = gameState;
  
  // 使用游戏状态中的实际腐败度
  const corruption = gameState.corruption;
  
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
    if (corruption > 90) return '资源产出 -60%，建筑成本 +100%';
    if (corruption > 75) return '资源产出 -40%，建筑成本 +50%';
    if (corruption > 50) return '资源产出 -25%，建筑成本 +20%';
    if (corruption > 25) return '资源产出 -10%，无建筑成本影响';
    return '无负面影响';
  };
  
  return (
    <aside className="w-80 bg-gray-800 border-r border-gray-700 min-h-screen">
      <div className="p-4">
        <h1 className="text-xl font-bold text-white mb-6">文明发展</h1>
        
        {/* 资源显示 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">资源</h3>
          <div className="space-y-3">
            {/* 食物 */}
             <Tooltip content={`食物产出详情：\n• 基础产出: +0.05/s\n• 工人产出: +${(gameState.workerAllocations?.farmer || 0) * 0.2}/s\n• 建筑加成: +${(Object.values(gameState.buildings).reduce((sum, count) => sum + count * 0.03, 0)).toFixed(1)}/s\n\n点击可手动收集食物`}>
               <div 
                 className="inline-flex items-center justify-between w-full px-3 py-2 rounded-md border text-sm font-medium text-white cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg bg-gray-800 border-gray-600"
                 onClick={() => clickResource('food')}
               >
                 <div className="flex items-center">
                   <span>食物</span>
                 </div>
                 <span className="font-bold">
                   {formatNumber(resources.food)}/{formatNumber(gameState.resourceLimits.food)}
                 </span>
               </div>
             </Tooltip>
            
            {/* 木材 */}
             <Tooltip content={`木材产出详情：\n• 基础产出: +0.04/s\n• 工人产出: +${(gameState.workerAllocations?.lumberjack || 0) * 0.18}/s\n• 建筑加成: +${(Object.values(gameState.buildings).reduce((sum, count) => sum + count * 0.025, 0)).toFixed(1)}/s\n\n点击可手动收集木材`}>
               <div 
                 className="inline-flex items-center justify-between w-full px-3 py-2 rounded-md border text-sm font-medium text-white cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg bg-gray-800 border-gray-600"
                 onClick={() => clickResource('wood')}
               >
                 <div className="flex items-center">
                   <span>木材</span>
                 </div>
                 <span className="font-bold">
                   {formatNumber(resources.wood)}/{formatNumber(gameState.resourceLimits.wood)}
                 </span>
               </div>
             </Tooltip>
            
            {/* 石料 */}
             <Tooltip content={`石料产出详情：\n• 基础产出: +0.03/s\n• 工人产出: +${(gameState.workerAllocations?.miner || 0) * 0.15}/s\n• 建筑加成: +${(Object.values(gameState.buildings).reduce((sum, count) => sum + count * 0.02, 0)).toFixed(1)}/s\n\n点击可手动收集石料`}>
               <div 
                 className="inline-flex items-center justify-between w-full px-3 py-2 rounded-md border text-sm font-medium text-white cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg bg-gray-800 border-gray-600"
                 onClick={() => clickResource('stone')}
               >
                 <div className="flex items-center">
                   <span>石料</span>
                 </div>
                 <span className="font-bold">
                   {formatNumber(resources.stone)}/{formatNumber(gameState.resourceLimits.stone)}
                 </span>
               </div>
             </Tooltip>
            
            {/* 人口 */}
             <Tooltip content={`当前人口: ${formatNumber(population)}\n最大人口: ${formatNumber(maxPopulation)}\n\n人口增长受住房限制影响`}>
               <div 
                 className="inline-flex items-center justify-between w-full px-3 py-2 rounded-md border text-sm font-medium text-white transition-all duration-200 bg-gray-800 border-gray-600"
               >
                 <div className="flex items-center">
                   <span>人口</span>
                 </div>
                 <span className="font-bold">
                   {formatNumber(population)}/{formatNumber(maxPopulation)}
                 </span>
               </div>
             </Tooltip>
          </div>
        </div>
        
        {/* 状态显示 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">状态</h3>
          <div className="space-y-3">
            {/* 稳定度 */}
            <StatusDetailsTooltip statusType="stability">
               <div 
                 className="inline-flex items-center justify-between w-full px-3 py-2 rounded-md border text-sm font-medium text-white transition-all duration-200 bg-gray-800 border-gray-600"
               >
                 <div className="flex items-center">
                   <span>稳定度</span>
                 </div>
                 <span className="font-bold">{stability}%</span>
               </div>
            </StatusDetailsTooltip>
            
            {/* 腐败度 */}
            <StatusDetailsTooltip statusType="corruption">
               <div 
                 className="inline-flex items-center justify-between w-full px-3 py-2 rounded-md border text-sm font-medium text-white transition-all duration-200 bg-gray-800 border-gray-600"
               >
                 <div className="flex items-center">
                   <span>腐败度</span>
                 </div>
                 <span className="font-bold">{corruption}%</span>
               </div>
            </StatusDetailsTooltip>
          </div>
        </div>
      </div>
    </aside>
  );
}