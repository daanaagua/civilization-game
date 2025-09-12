'use client';

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

const formatNumber = (num: number, decimals: number = 1): string => {
  if (num < 1000) {
    return num.toFixed(decimals === 0 ? 0 : Math.min(decimals, 1));
  }
  
  const units = ['', 'K', 'M', 'B', 'T', 'Q'];
  let unitIndex = 0;
  let value = num;
  
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }
  
  return `${value.toFixed(decimals)}${units[unitIndex]}`;
};

export function GameStatsPanel() {
  const { gameState } = useGameStore();
  const { statistics, gameStartTime, inheritancePoints } = gameState;

  // 添加安全检查避免statistics未定义的错误
  if (!statistics) {
    return <div className="p-4 text-center text-gray-500">加载统计数据中...</div>;
  }

  // 使用store中的totalPlayTime避免水合错误
  const playTime = statistics.totalPlayTime || 0;

  const stats = [
    {
      label: '游戏时间',
      value: formatTime(playTime),
      icon: '⏱️',
    },
    {
      label: '当前世代',
      value: `第${statistics.currentGeneration}代`,
      icon: '🏛️',
    },
    {
      label: '继承点数',
      value: formatNumber(inheritancePoints),
      icon: '⭐',
    },
    {
      label: '已建建筑',
      value: Object.values(statistics.totalBuildingsBuilt).reduce((sum, count) => sum + count, 0),
      icon: '🏗️',
    },
    {
      label: '研发科技',
      value: statistics.totalTechnologiesResearched,
      icon: '🔬',
    },
    {
      label: '解锁成就',
      value: statistics.totalAchievementsUnlocked,
      icon: '🏆',
    },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">📊</span>
        游戏统计
      </h2>
      
      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-sm text-gray-300">{stat.label}</span>
            </div>
            <span className="font-semibold text-white">{stat.value}</span>
          </div>
        ))}
      </div>
      
      {/* 进度提示 */}
      <div className="mt-4 p-3 bg-gray-700 rounded-lg">
        <div className="text-xs text-gray-400 mb-1">发展进度</div>
        <div className="text-sm text-gray-300">
          {statistics.totalAchievementsUnlocked === 0 && '刚刚起步，继续努力！'}
          {statistics.totalAchievementsUnlocked > 0 && statistics.totalAchievementsUnlocked < 5 && '初有成就，继续发展！'}
          {statistics.totalAchievementsUnlocked >= 5 && '文明蒸蒸日上！'}
        </div>
      </div>
    </div>
  );
}