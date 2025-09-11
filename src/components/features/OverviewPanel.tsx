'use client';

import { PopulationPanel } from './PopulationPanel';
import { GameStatsPanel } from './GameStatsPanel';

export function OverviewPanel() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">文明概览</h1>
        <p className="text-gray-400">管理你的文明，从原始部落发展到强大帝国</p>
      </div>

      {/* 主要信息面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左列 */}
        <div className="space-y-6">
          <PopulationPanel />
        </div>
        
        {/* 右列 */}
        <div className="space-y-6">
          <GameStatsPanel />
        </div>
      </div>
      
      {/* 游戏提示 */}
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-400 text-xl">💡</div>
          <div>
            <h3 className="text-blue-300 font-semibold mb-1">游戏提示</h3>
            <p className="text-blue-200 text-sm">
              建造更多建筑来扩展人口容量和发展文明。通过科技研发解锁新的建筑和功能。
              合理管理人口分配以提高文明效率。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}