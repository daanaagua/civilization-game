'use client';

import React from 'react';
import { useGameStore } from '@/lib/game-store';

interface StatusDetailsTooltipProps {
  statusType: 'stability' | 'corruption';
  children: React.ReactNode;
}

export function StatusDetailsTooltip({ statusType, children }: StatusDetailsTooltipProps) {
  const { gameState } = useGameStore();
  const { resources, technologies, corruption, stability, buildings } = gameState;

  const calculateStabilityFactors = () => {
    const factors: { source: string; effect: number; color: string }[] = [];

    // 基础稳定度
    factors.push({
      source: '基础稳定度',
      effect: 50,
      color: 'text-blue-400'
    });

    // 政治制度加成
    if (technologies['tribal_organization']?.researched) {
      factors.push({
        source: '部落组织',
        effect: 5,
        color: 'text-green-400'
      });
    }
    if (technologies['monarchy']?.researched) {
      factors.push({
        source: '君主制',
        effect: 15,
        color: 'text-green-400'
      });
    }
    if (technologies['feudalism']?.researched) {
      factors.push({
        source: '分封制',
        effect: 5,
        color: 'text-green-400'
      });
    }
    if (technologies['centralization']?.researched) {
      factors.push({
        source: '集权制',
        effect: 5,
        color: 'text-green-400'
      });
    }

    // 人口规模影响
    const population = resources.population;
    const researchedTechCount = Object.values(technologies).filter(tech => tech.researched).length;
    const softLimit = 10 * (1 + researchedTechCount * 0.1);
    
    let populationEffect = 0;
    if (population > softLimit * 3.0) {
      populationEffect = -40;
    } else if (population > softLimit * 2.5) {
      populationEffect = -30;
    } else if (population > softLimit * 2.0) {
      populationEffect = -25;
    } else if (population > softLimit * 1.5) {
      populationEffect = -20;
    } else if (population > softLimit * 1.2) {
      populationEffect = -15;
    }
    
    if (populationEffect !== 0) {
      factors.push({
        source: '人口规模压力',
        effect: populationEffect,
        color: 'text-red-400'
      });
    }

    // 资源充足度影响
    const foodSufficiency = (resources.food / Math.max(1, population * 2)) * 100;
    let resourceEffect = 0;
    if (foodSufficiency > 150) {
      resourceEffect = 8;
    } else if (foodSufficiency >= 100) {
      resourceEffect = 4;
    } else if (foodSufficiency >= 80) {
      resourceEffect = 0;
    } else if (foodSufficiency >= 50) {
      resourceEffect = -12;
    } else {
      resourceEffect = -30;
    }
    
    if (resourceEffect !== 0) {
      const effectName = resourceEffect > 0 ? '食物充足' : '食物短缺';
      factors.push({
        source: effectName,
        effect: resourceEffect,
        color: resourceEffect > 0 ? 'text-green-400' : 'text-red-400'
      });
    }

    // 腐败度影响
    if (corruption > 0) {
      factors.push({
        source: '腐败度影响',
        effect: -corruption,
        color: 'text-red-400'
      });
    }

    return factors;
  };

  const calculateCorruptionFactors = () => {
    const factors: { source: string; effect: string; color: string }[] = [];

    // 法院建筑的压制效果
    const courtCount = buildings.court?.count || 0;
    if (courtCount > 0) {
      const suppressionRate = courtCount * 2; // 每个法院每天减少2点腐败度
      factors.push({
        source: `法院 (${courtCount}个)`,
        effect: `-${suppressionRate.toFixed(1)}/天`,
        color: 'text-green-400'
      });
    }

    // 人口规模的腐败度增长
    const population = resources.population;
    let corruptionIncrease = 0;
    
    if (population >= 50) {
      corruptionIncrease = 3;
    } else if (population >= 30) {
      corruptionIncrease = 2;
    } else if (population >= 15) {
      corruptionIncrease = 1;
    } else if (population >= 8) {
      corruptionIncrease = 0.5;
    }
    
    if (corruptionIncrease > 0) {
      factors.push({
        source: '人口规模',
        effect: `+${corruptionIncrease.toFixed(1)}/天`,
        color: 'text-red-400'
      });
    }

    // 科技影响
    if (technologies['legal_code']?.researched) {
      factors.push({
        source: '法律法典',
        effect: '减缓增长',
        color: 'text-green-400'
      });
    }
    if (technologies['bureaucracy']?.researched) {
      factors.push({
        source: '官僚制度',
        effect: '加速增长',
        color: 'text-red-400'
      });
    }

    return factors;
  };

  const factors = statusType === 'stability' ? calculateStabilityFactors() : calculateCorruptionFactors();
  const currentValue = statusType === 'stability' ? stability : corruption;

  return (
    <div className="group relative">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-56">
        <div className="font-semibold mb-2 text-center">
          {statusType === 'stability' ? '稳定度' : '腐败度'} 详情
        </div>
        
        <div className="mb-2 text-center">
          <span className="text-lg font-bold">
            {currentValue.toFixed(1)}
          </span>
          <span className="text-gray-400"> / 100</span>
        </div>
        
        {factors.length > 0 ? (
          <div className="space-y-1">
            {factors.map((factor, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-300">{factor.source}:</span>
                <span className={factor.color}>
                  {statusType === 'stability' ? 
                    (factor.effect > 0 ? `+${factor.effect}` : factor.effect.toString()) :
                    factor.effect
                  }
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-center">
            {statusType === 'stability' ? '无影响因素' : '无变化因素'}
          </div>
        )}
        
        {statusType === 'stability' && (
          <div className="mt-2 pt-2 border-t border-gray-600 text-xs">
            <div className="text-gray-300 font-medium mb-1">当前效果:</div>
            {currentValue >= 80 ? (
              <div className="text-green-400">
                <div>• 人口增长率：+20%</div>
                <div>• 生产效率：+10%</div>
                <div>• 科技研发速度：+15%</div>
                <div>• 贸易收益：+20%</div>
                <div>• 军队士气：+15%</div>
              </div>
            ) : currentValue >= 60 ? (
              <div className="text-blue-400">
                <div>• 人口增长率：+10%</div>
                <div>• 生产效率：+5%</div>
                <div>• 科技研发速度：+5%</div>
                <div>• 贸易收益：+10%</div>
                <div>• 军队士气：+5%</div>
              </div>
            ) : currentValue >= 40 ? (
              <div className="text-gray-400">
                <div>• 正常状态</div>
              </div>
            ) : currentValue >= 20 ? (
              <div className="text-yellow-400">
                <div>• 人口增长率：-25%</div>
                <div>• 生产效率：-10%</div>
                <div>• 科技研发速度：-15%</div>
                <div>• 贸易收益：-20%</div>
                <div>• 军队士气：-10%</div>
              </div>
            ) : (
              <div className="text-red-400">
                <div>• 人口增长率：-50%</div>
                <div>• 生产效率：-25%</div>
                <div>• 科技研发速度：-30%</div>
                <div>• 贸易收益：-40%</div>
                <div>• 军队士气：-25%</div>
              </div>
            )}
          </div>
        )}
        
        {statusType === 'corruption' && (
          <div className="mt-2 pt-2 border-t border-gray-600 text-xs">
            <div className="text-gray-300 font-medium mb-1">当前效果:</div>
            {currentValue <= 25 ? (
              <div className="text-gray-400">
                <div>• 无负面影响</div>
              </div>
            ) : currentValue <= 50 ? (
              <div className="text-yellow-400">
                <div>• 资源产出：-10%</div>
                <div>• 建筑成本：+10%</div>
              </div>
            ) : currentValue <= 75 ? (
              <div className="text-orange-400">
                <div>• 资源产出：-25%</div>
                <div>• 建筑成本：+25%</div>
                <div>• 税收效率：-15%</div>
              </div>
            ) : (
              <div className="text-red-400">
                <div>• 资源产出：-40%</div>
                <div>• 建筑成本：+50%</div>
                <div>• 税收效率：-30%</div>
                <div>• 军队维护：+25%</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}