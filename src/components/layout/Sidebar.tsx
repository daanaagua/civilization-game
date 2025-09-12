'use client';

import { useGameStore } from '@/lib/game-store';

interface SidebarProps {}

// 格式化数字显示
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return Math.floor(num).toString();
};

export function Sidebar({}: SidebarProps) {
  const { gameState } = useGameStore();
  const { resources, stability } = gameState;
  const population = resources.population;
  const maxPopulation = gameState.resourceLimits.population;
  
  // 计算腐败度（暂时用100-稳定度作为腐败度）
  const corruption = Math.max(0, 100 - stability);
  
  return (
    <aside className="w-80 bg-gray-800 border-r border-gray-700 min-h-screen">
      <div className="p-4">
        <h1 className="text-xl font-bold text-white mb-6">文明发展</h1>
        
        {/* 资源显示 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">资源</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-gray-700 px-3 py-2 rounded">
              <span className="text-sm text-gray-300">食物</span>
              <span className="text-sm font-medium text-white">
                {formatNumber(resources.food || 0)}/{formatNumber(gameState.resourceLimits.food || 100)}
              </span>
            </div>
            <div className="flex justify-between items-center bg-gray-700 px-3 py-2 rounded">
              <span className="text-sm text-gray-300">木材</span>
              <span className="text-sm font-medium text-white">
                {formatNumber(resources.wood || 0)}/{formatNumber(gameState.resourceLimits.wood || 200)}
              </span>
            </div>
            <div className="flex justify-between items-center bg-gray-700 px-3 py-2 rounded">
              <span className="text-sm text-gray-300">石料</span>
              <span className="text-sm font-medium text-white">
                {formatNumber(resources.stone || 0)}/{formatNumber(gameState.resourceLimits.stone || 150)}
              </span>
            </div>
            <div className="flex justify-between items-center bg-gray-700 px-3 py-2 rounded">
              <span className="text-sm text-gray-300">人口</span>
              <span className="text-sm font-medium text-white">
                {population}/{maxPopulation}
              </span>
            </div>
          </div>
        </div>
        
        {/* 状态显示 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">状态</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-300">稳定度</span>
                <span className="text-sm font-medium text-blue-400">{stability}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${stability}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-300">腐败度</span>
                <span className="text-sm font-medium text-red-400">{corruption}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${corruption}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}