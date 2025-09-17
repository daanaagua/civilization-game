'use client';

import React, { useMemo } from 'react';
import { useGameStore } from '@/lib/game-store';
import { getBuildingDefinition } from '@/lib/building-data';
import { BuildingSystem } from '@/lib/building-system';

export function QuickActionsPanel() {
  const gameState = useGameStore(state => state.gameState);
  const constructBuilding = useGameStore(state => state.constructBuilding);
  const canConstructBuilding = useGameStore(state => state.canConstructBuilding);
  const getBuildingConstructionCost = useGameStore(state => state.getBuildingConstructionCost);

  const buildingSystem = useMemo(() => new BuildingSystem(gameState), [gameState]);

  // 选择几个基础建筑用于快速建造
  const quickBuildingIds = ['hut', 'farm', 'lumberyard', 'quarry'] as const;
  const quickBuildings = quickBuildingIds
    .map(id => getBuildingDefinition(id))
    .filter((b): b is NonNullable<ReturnType<typeof getBuildingDefinition>> => Boolean(b));

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">⚡</span>
        快速操作
      </h2>
      
      <div className="space-y-3">
        {quickBuildings.map((building) => {
          const currentCount = buildingSystem.getBuildingCount(building.id);
          const adjustedCost = getBuildingConstructionCost(building.id) || {} as Record<string, number>;
          const canConstruct = canConstructBuilding(building.id);
          const canAfford = canConstruct.canBuild;

          return (
            <button
              key={building.id}
              onClick={() => constructBuilding(building.id)}
              disabled={!canAfford}
              className={`
                w-full p-3 rounded-lg text-left transition-colors
                ${canAfford 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-750 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div>
                    <div className="font-medium">{building.name}</div>
                    <div className="text-xs text-gray-400">
                      拥有: {currentCount}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-gray-400">
                    {Object.entries(adjustedCost)
                      .map(([resource, amount]) => `${Number(amount)} ${resource}`)
                      .join(' ')}
                  </div>
                  {!canAfford && canConstruct.reason && (
                    <div className="text-[11px] text-gray-500 mt-1">{canConstruct.reason}</div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        
        {quickBuildings.length === 0 && (
          <div className="text-center text-gray-400 py-4">
            <div className="text-2xl mb-2">🚧</div>
            <div className="text-sm">暂无可用建筑</div>
          </div>
        )}
      </div>
    </div>
  );
}