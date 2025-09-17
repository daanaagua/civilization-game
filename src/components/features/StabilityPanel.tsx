'use client';

import { useGameStore } from '@/lib/game-store';

export function StabilityPanel() {
  const { gameState } = useGameStore();
  const stability = gameState.stability;
  const maxStability = 100;

  const stabilityPercentage = (stability / maxStability) * 100;
  
  const getStabilityColor = () => {
    if (stabilityPercentage >= 70) return 'bg-green-500';
    if (stabilityPercentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStabilityStatus = () => {
    if (stabilityPercentage >= 70) return '稳定';
    if (stabilityPercentage >= 40) return '一般';
    return '不稳定';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">⚖️</span>
        稳定度
      </h2>
      
      <div className="text-center">
        <div className="text-2xl font-bold mb-2">
          {stability.toFixed(2)}/{maxStability}
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${getStabilityColor()}`}
            style={{ width: `${Math.min(stabilityPercentage, 100)}%` }}
          />
        </div>
        
        <div className="text-sm text-gray-400 mb-4">
          状态: <span className={`font-semibold ${
            stabilityPercentage >= 70 ? 'text-green-400' :
            stabilityPercentage >= 40 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {getStabilityStatus()}
          </span>
        </div>
        
        <div className="text-xs text-gray-500">
          稳定度影响人口增长和资源生产效率
        </div>
      </div>
    </div>
  );
}