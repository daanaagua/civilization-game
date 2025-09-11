'use client';

import { useGameStore } from '@/lib/store/gameStore';
// 临时实现canAffordCost函数
const canAffordCost = (
  costs: Array<{ resourceId: string; amount: number }>,
  resources: Record<string, { amount: number }>
): boolean => {
  return costs.every(cost => {
    const resource = resources[cost.resourceId];
    return resource && resource.amount >= cost.amount;
  });
};

export function QuickActionsPanel() {
  const { buildings, resources, buildBuilding } = useGameStore();

  // 获取最基础的几个建筑用于快速建造
  const quickBuildings = ['hut', 'farm', 'lumberyard', 'quarry'].map(id => buildings[id]).filter(Boolean);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">⚡</span>
        快速操作
      </h2>
      
      <div className="space-y-3">
        {quickBuildings.map((building) => {
          const canAfford = canAffordCost(building.cost, resources);
          
          return (
            <button
              key={building.id}
              onClick={() => buildBuilding(building.id)}
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
                  <span className="text-lg">{building.icon}</span>
                  <div>
                    <div className="font-medium">{building.name}</div>
                    <div className="text-xs text-gray-400">
                      拥有: {building.count}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-gray-400">
                    {building.cost.map(cost => 
                      `${cost.amount}${resources[cost.resourceId]?.icon || ''}`
                    ).join(' ')}
                  </div>
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