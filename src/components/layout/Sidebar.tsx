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
  const isRunning = useGameStore(state => state.isRunning);
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

    // 分组排序（与 ResourcePanel 一致；新增资源时请参照分组规则）
    // 1) 人口（始终第一）
    // 2) 基础资源：木材、石料、食物（最常用基础）
    // 3) 高级生产性资源：工具、布革、铜、铁、武器等（由生产链产出，影响效率或军备）
    // 4) 生物类资源：牲畜、马等（多用于军事或事件）
    // 5) 特殊/抽象资源：货币、魔力、研究点、信仰、水晶等（不直接参与基础建造）
    // 注意：未归类的新资源自动排到最后（字母序）；housing/leather 被过滤不显示
    const GROUP_POP = ['population'];
    const GROUP_BASIC = ['wood', 'stone', 'food'];
    const GROUP_ADV = ['tools', 'cloth', 'copper', 'iron', 'weapons'];
    const GROUP_BIO = ['livestock', 'horses'];
    const GROUP_SPECIAL = ['currency', 'magic', 'researchPoints', 'faith', 'crystal'];

    const flatGroups = [...GROUP_POP, ...GROUP_BASIC, ...GROUP_ADV, ...GROUP_BIO, ...GROUP_SPECIAL];

    // 过滤不显示
    const filteredAll = allKeys.filter(k => k !== 'leather' && k !== 'housing');

    // 已分组的（保持声明顺序）
    const grouped = flatGroups.filter(k => filteredAll.includes(k));

    // 未分组的（字母序）
    const rest = filteredAll.filter(k => !flatGroups.includes(k)).sort();

    const ordered = [...grouped, ...rest];

    // 可见性：人口/住房始终显示；devMode 全显；否则 解锁/数值非0/速率非0
    const visible = ordered.filter((key) => {
      // 始终显示：人口 + 基础资源（木材/石料/食物）
      if (key === 'population') return true;
      if (['wood', 'stone', 'food'].includes(key)) return true;

      // 开发者模式：全显
      if (settings?.devMode) return true;

      // 常规：解锁 或 数值非0 或 速率非0
      const isUnlocked = Array.isArray(unlockedResources) && unlockedResources.includes(key);
      const amount = (resources as any)?.[key] ?? 0;
      const rate = key === 'housing' ? 0 : ((((resourceRates || {}) as any)[key] ?? 0) as number);
      return isUnlocked || amount !== 0 || rate !== 0;
    });

    return visible.map((key) => {
      const cfg = (resourceConfig as any)[key];
      const label = cfg?.name || key;

      const canClick = (key === 'food' || key === 'wood' || key === 'stone') && isRunning && !gameState.isPaused;
      const onClick = () => { if (canClick) clickResource(key as any); };

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
            className={`inline-flex items-center justify-between w-full px-3 py-2 rounded-md border text-sm font-medium text-white ${canClick ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''} bg-gray-800 border-gray-600 select-none transition-all duration-200`}
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