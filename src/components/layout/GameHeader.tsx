'use client';

import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { useGameStore } from '@/lib/game-store';
import { CompactTimeDisplay } from '@/components/features/TimeDisplay';

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
  // 使用选择器订阅，确保 isPaused 与 isRunning 能正确响应更新
  const isPaused = useGameStore(state => state.gameState.isPaused);
  const isRunning = useGameStore(state => state.isRunning);
  const gameState = useGameStore(state => state.gameState);
  const togglePause = useGameStore(state => state.togglePause);
  const resetGame = useGameStore(state => state.resetGame);
  const startGame = useGameStore(state => state.startGame);
  // 新增：开发用速度选择器所需的状态与方法
  const gameSpeed = useGameStore(state => state.gameState.settings.gameSpeed);
  const setGameSpeed = useGameStore(state => state.setGameSpeed);
  const setActiveTab = useGameStore(state => state.setActiveTab);

  // 从gameState中获取statistics，避免未定义错误
  const statistics = gameState?.statistics || { totalPlayTime: 0 };

  // 使用store中的totalPlayTime避免水合错误
  const playTime = statistics.totalPlayTime;

  // 开发模式下使用的速度档位（尽量精简）
  const devSpeedOptions = [1, 5, 10, 50] as const;

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        {/* 游戏标题和信息 */}
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold text-white">文明发展游戏</h1>
          
          <div className="flex items-center space-x-4 text-sm text-gray-300">
            {/* 游戏时间显示 */}
            <CompactTimeDisplay className="text-white" />
            
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
            onClick={!isRunning ? startGame : togglePause}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors font-medium ${
              (!isRunning || isPaused)
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            {!isRunning || isPaused ? <Play size={20} /> : <Pause size={20} />}
            <span>{!isRunning ? '开始' : isPaused ? '继续' : '暂停'}</span>
          </button>

          {/* 开发模式：速度选择器（仅 dev 环境显示，不影响生产） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="hidden md:flex items-center space-x-2" aria-label="开发模式速度选择器">
              <span className="text-xs text-gray-300/80 select-none">速度</span>
              <div className="inline-flex rounded-md overflow-hidden border border-gray-600">
                {devSpeedOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setGameSpeed(s)}
                    className={
                      `px-2.5 py-1 text-xs transition-colors ` +
                      (gameSpeed === s
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600')
                    }
                    title={`设置游戏速度为 ${s}x（仅开发）`}
                    aria-pressed={gameSpeed === s}
                  >
                    {s}x
                  </button>
                ))}
              </div>
              <span className="text-[10px] leading-none px-1.5 py-0.5 rounded bg-purple-700/30 text-purple-200 border border-purple-500/30 select-none">DEV</span>
            </div>
          )}

          <button
            onClick={resetGame}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            title="重置游戏"
          >
            <RotateCcw size={18} />
            <span className="hidden sm:inline">重置</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
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