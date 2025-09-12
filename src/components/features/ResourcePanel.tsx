'use client';

import { useGameStore } from '@/lib/game-store';

// 临时实现格式化函数
const formatResource = (amount: number, maxStorage?: number): string => {
  const formatNumber = (num: number): string => {
    if (num < 1000) return num.toFixed(1);
    const units = ['', 'K', 'M', 'B'];
    let unitIndex = 0;
    let value = num;
    while (value >= 1000 && unitIndex < units.length - 1) {
      value /= 1000;
      unitIndex++;
    }
    return `${value.toFixed(1)}${units[unitIndex]}`;
  };
  
  const formattedAmount = formatNumber(amount);
  if (maxStorage !== undefined) {
    const formattedMax = formatNumber(maxStorage);
    return `${formattedAmount}/${formattedMax}`;
  }
  return formattedAmount;
};

const formatProductionRate = (rate: number): string => {
  if (rate === 0) return '';
  const sign = rate > 0 ? '+' : '';
  return `${sign}${rate.toFixed(1)}/秒`;
};

export function ResourcePanel() {
  const { resources, manualCollectResource } = useGameStore();

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">💰</span>
        资源
      </h2>
      
      <div className="space-y-3">
        {Object.values(resources).map((resource) => (
          <div
            key={resource.id}
            className={`
              flex items-center justify-between p-3 rounded-lg transition-colors
              ${resource.canManualCollect 
                ? 'bg-gray-700 hover:bg-gray-600 cursor-pointer' 
                : 'bg-gray-750'
              }
            `}
            onClick={() => resource.canManualCollect && manualCollectResource(resource.id)}
            title={resource.description}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{resource.icon}</span>
              <div>
                <div className="font-medium">{resource.name}</div>
                {resource.productionRate > 0 && (
                  <div className="text-sm text-green-400">
                    {formatProductionRate(resource.productionRate)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-mono">
                {formatResource(resource.amount, resource.maxStorage)}
              </div>
              {resource.canManualCollect && (
                <div className="text-xs text-gray-400">点击收集</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}