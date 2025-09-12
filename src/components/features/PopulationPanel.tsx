'use client';

import { useGameStore } from '@/lib/game-store';
import { formatNumber } from '@/utils/format';

export function PopulationPanel() {
  const { population, maxPopulation } = useGameStore();

  const populationPercentage = maxPopulation > 0 ? (population / maxPopulation) * 100 : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">👥</span>
        人口
      </h2>
      
      <div className="text-center">
        <div className="text-3xl font-bold mb-2">
          {formatNumber(population, 0)}/{formatNumber(maxPopulation, 0)}
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
          <div 
            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(populationPercentage, 100)}%` }}
          />
        </div>
        
        <div className="text-sm text-gray-400">
          人口使用率: {populationPercentage.toFixed(1)}%
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-700 rounded p-2">
            <div className="text-gray-400">当前人口</div>
            <div className="font-semibold">{formatNumber(population, 0)}</div> {/* 人口显示为整数 */}
          </div>
          <div className="bg-gray-700 rounded p-2">
            <div className="text-gray-400">人口上限</div>
            <div className="font-semibold">{formatNumber(maxPopulation, 0)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}