'use client';

import { useGameStore } from '@/lib/game-store';
import { formatNumber } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { StatusDetailsTooltip } from '@/components/ui/status-details-tooltip';
import { ResourceDetailsTooltip } from '@/components/ui/resource-details-tooltip';
import { useMemo } from 'react';
import { createPopulationSelectors } from '@/lib/slices';
import { makeGameStorePopulationProvider } from '@/lib/adapters/population-adapter';
import { resourceConfig } from '@/lib/resource-config';

interface SidebarProps {}

export function Sidebar({}: SidebarProps) {
  const { gameState, clickResource } = useGameStore();
  const { resources, stability } = gameState;
  // 统一人口选择器（零侵入适配现有 store）
  const provider = useMemo(() => makeGameStorePopulationProvider(), []);
  const selectors = useMemo(() => createPopulationSelectors(provider), [provider]);
  const overview = useGameStore(state => selectors.getOverview(state));
  
  // 使用游戏状态中的实际腐败度
  const corruption = gameState.corruption;
  
  // 稳定度效果计算
  const getStabilityEffect = (stability: number): string => {
    if (stability >= 80) return '人口增长 +20%，资源产出 +10%';
    if (stability >= 60) return '人口增长 +10%，资源产出 +5%';
    if (stability >= 40) return '正常状态';
    if (stability >= 20) return '人口增长 -10%，资源产出 -5%';
    return '人口增长 -20%，资源产出 -10%';
  };
  
  // 腐败度效果计算
  const getCorruptionEffect = (corruption: number): string => {
    if (corruption > 90) return '资源产出 -60%，建筑成本 +100%';
    if (corruption > 75) return '资源产出 -40%，建筑成本 +50%';
    if (corruption > 50) return '资源产出 -25%，建筑成本 +20%';
    if (corruption > 25) return '资源产出 -10%，无建筑成本影响';
    return '无负面影响';
  };
  
  // 动态资源列表（与顶部 ResourcePanel 同规则）
  const renderResourceRows = () => {
    const { settings, unlockedResources, resourceRates, resourceLimits } = gameState as any;

    // 并集键：resourceConfig ∪ 当前 state
    const keysFromConfig = Object.keys(resourceConfig || {});
    const keysFromState = Object.keys(resources || {});
    const allKeys = Array.from(new Set([...keysFromConfig, ...keysFromState]));

    // 排序：核心资源优先，其余按字母序
    const preferred = ['food','wood','stone','tools','population'];
    const ordered = [
      ...preferred.filter(k => allKeys.includes(k)),
      ...allKeys.filter(k => !preferred.includes(k)).sort()
    ].filter(k => k !== 'leather' && k !== 'housing');

    // 可见性：人口/住房始终显示；devMode 全显；否则 解锁/数值非0/速率非0
    const visible = ordered.filter((key) => {
      if (key === 'population') return true;
      if (settings?.devMode) return true;
      const isUnlocked = Array.isArray(unlockedResources) && unlockedResources.includes(key);
      const amount = (resources as any)?.[key] ?? 0;
      const rate = key === 'housing' ? 0 : ((((resourceRates || {}) as any)[key] ?? 0) as number);
      return isUnlocked || amount !== 0 || rate !== 0;
    });

    return visible.map((key) => {
      const cfg = (resourceConfig as any)[key];
      const label = cfg?.name || key;

      const clickable = (key === 'food' || key === 'wood' || key === 'stone');
      const onClick = () => { if (clickable) clickResource(key as any); };

      const amount = (resources as any)?.[key] ?? 0;
      const limit = key === 'population'
        ? overview.cap
        : (typeof (resourceLimits as any)?.[key] === 'number' ? (resourceLimits as any)[key] : undefined);

      const valueText = key === 'population'
        ? `${formatNumber(overview.current, 0)}/${formatNumber(overview.cap, 0)}`
        : `${formatNumber(amount)}${typeof limit === 'number' && key !== 'housing' ? `/${formatNumber(limit)}` : ''}`;

      return (
        <Tooltip key={key} content={<ResourceDetailsTooltip resource={key as any} />}>
          <div
            className={`inline-flex items-center justify-between w-full px-3 py-2 rounded-md border text-sm font-medium text-white ${clickable ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''} bg-gray-800 border-gray-600 select-none transition-all duration-200`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
          >
            <div className="flex items-center">
              <span>{label}</span>
            </div>
            <span className="font-bold">{valueText}</span>
          </div>
        </Tooltip>
      );
    });
  };

  return (
    <aside className="w-80 bg-gray-800 border-r border-gray-700 min-h-screen">
      <div className="p-4">
        <h1 className="text-xl font-bold text-white mb-6">文明发展</h1>
        
        {/* 资源显示 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">资源</h3>
          <div className="space-y-3">
            {renderResourceRows()}
          </div>
        </div>
        
        {/* 状态显示 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">状态</h3>
          <div className="space-y-3">
            {/* 稳定度 */}
            <StatusDetailsTooltip statusType="stability">
               <div 
                 className="inline-flex items-center justify-between w-full px-3 py-2 rounded-md border text-sm font-medium text-white transition-all duration-200 bg-gray-800 border-gray-600 select-none"
                 onMouseDown={(e) => e.preventDefault()}
               >
                 <div className="flex items-center">
                   <span>稳定度</span>
                 </div>
                 <span className="font-bold">{stability.toFixed(2)}</span>
               </div>
            </StatusDetailsTooltip>
            
            {/* 腐败度 */}
            <StatusDetailsTooltip statusType="corruption">
               <div 
                 className="inline-flex items-center justify-between w-full px-3 py-2 rounded-md border text-sm font-medium text-white transition-all duration-200 bg-gray-800 border-gray-600 select-none"
                 onMouseDown={(e) => e.preventDefault()}
               >
                 <div className="flex items-center">
                   <span>腐败度</span>
                 </div>
                 <span className="font-bold">{corruption}</span>
               </div>
            </StatusDetailsTooltip>
          </div>
        </div>
      </div>
    </aside>
  );
}