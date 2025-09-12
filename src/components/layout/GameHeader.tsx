'use client';

import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { useGameStore } from '@/lib/game-store';

// 临时实现格式化函数
const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.floor(seconds)}秒`;
  }
  
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}分${remainingSeconds}秒`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}小时${minutes}分`;
};

export function GameHeader() {
  const {
    isPaused,
    isRunning,
    gameStartTime,
    gameState,
    togglePause,
    resetGame,
  } = useGameStore();

  // 从gameState中获取statistics，避免未定义错误
  const statistics = gameState?.statistics || { totalPlayTime: 0 };

  // 使用store中的totalPlayTime避免水合错误
  const playTime = statistics.totalPlayTime;

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        {/* 游戏标题和信息 */}
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold text-white">文明发展游戏</h1>
          
          <div className="flex items-center space-x-4 text-sm text-gray-300">
            <div className="flex items-center space-x-1">
              <span>⏱️</span>
              <span>{formatTime(playTime)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <span>🏆</span>
              <span>第{statistics.currentGeneration}代</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <span>⭐</span>
              <span>{statistics.totalAchievementsUnlocked}成就</span>
            </div>
          </div>
        </div>

        {/* 游戏控制 */}
        <div className="flex items-center space-x-3">
          {/* 开始/暂停按钮 */}
          <button
            onClick={togglePause}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors font-medium ${
              !isRunning 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            {!isRunning ? <Play size={20} /> : <Pause size={20} />}
            <span>{!isRunning ? '开始' : '暂停'}</span>
          </button>

          <button
            onClick={resetGame}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            title="重置游戏"
          >
            <RotateCcw size={18} />
            <span className="hidden sm:inline">重置</span>
          </button>

          <button
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            title="设置"
          >
            <Settings size={18} />
            <span className="hidden sm:inline">设置</span>
          </button>
        </div>
      </div>
    </header>
  );
}