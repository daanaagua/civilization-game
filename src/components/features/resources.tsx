'use client';

import { useGameStore } from '@/lib/game-store';
import { formatNumber } from '@/utils/format';
import { resourceConfig } from '@/lib/resource-config';

interface ResourceCardProps {
  resourceType: keyof typeof resourceConfig;
  value: number;
  rate?: number;
}

const ResourceCard = ({ resourceType, value, rate }: ResourceCardProps) => {
  const { clickResource, isPaused } = useGameStore();
  const config = resourceConfig[resourceType];
  const Icon = config.icon;
  
  const handleClick = () => {
    if (config.clickable) {
      // 仅允许三种基础资源进行点击收集
      if (resourceType === 'food' || resourceType === 'wood' || resourceType === 'stone') {
        clickResource(resourceType);
      }
    }
  };
  
  const isClickable = config.clickable && !isPaused && (resourceType === 'food' || resourceType === 'wood' || resourceType === 'stone');
  
  return (
    <div 
      className={`card ${config.bgColor} ${config.borderColor} ${
        isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      } ${
        config.clickable && isPaused ? 'opacity-60' : ''
      }`}
      onClick={handleClick}
      title={
        config.clickable 
          ? !isPaused 
            ? (resourceType === 'food' || resourceType === 'wood' || resourceType === 'stone' ? `点击增加1个${config.name}` : `${config.name}不可手动收集`)
            : `游戏已暂停，无法收集${config.name}`
          : config.description
      }
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`${config.color.replace('text-', 'bg-')} text-white p-2 rounded-lg`}>
          <Icon size={20} />
        </div>
        <h3 className={`font-semibold ${config.color}`}>{config.name}</h3>
        {isClickable && (
          <span className="text-xs text-gray-500 ml-auto">可点击</span>
        )}
      </div>
      <div className="flex flex-col min-h-[60px]">
        <div className={`text-2xl font-bold ${config.color} leading-tight`}>
          {formatNumber(value)}
        </div>
        <div className="text-sm text-gray-600 mt-1 h-5 flex items-center">
          {rate !== undefined && rate > 0 ? (
            <span>+{formatNumber(rate)}/秒</span>
          ) : (
            <span>&nbsp;</span>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">{config.description}</p>
    </div>
  );
};

export const ResourcesPanel = () => {
  const { gameState } = useGameStore();
  const { resources, resourceRates, technologies } = gameState;
  
  // 检查科技是否已研究
  const isTechResearched = (techId: string) => {
    return technologies[techId]?.researched || false;
  };
  
  // 过滤显示的资源
  const visibleResources = Object.entries(resourceConfig).filter(([key, config]) => {
    // 基础资源始终显示
    if (!config.requiresTech) return true;
    // 高级资源需要科技解锁
    return isTechResearched(config.requiresTech);
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-900">资源管理</h2>
        <div className="text-sm text-gray-600">
          点击食物、木材、石料可以手动收集
        </div>
      </div>
      
      {/* 基础资源 */}
      <div>
        <h3 className="text-lg font-semibold text-stone-800 mb-3">基础资源</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleResources
            .filter(([key, config]) => !config.requiresTech)
            .map(([key, config]) => (
              <ResourceCard
                key={key}
                resourceType={key as keyof typeof resourceConfig}
                value={resources[key as keyof typeof resources] || 0}
                rate={resourceRates[key as keyof typeof resourceRates]}
              />
            ))
          }
        </div>
      </div>
      
      {/* 高级资源 */}
      {visibleResources.some(([key, config]) => config.requiresTech) && (
        <div>
          <h3 className="text-lg font-semibold text-stone-800 mb-3">高级资源</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleResources
              .filter(([key, config]) => config.requiresTech)
              .map(([key, config]) => (
                <ResourceCard
                  key={key}
                  resourceType={key as keyof typeof resourceConfig}
                  value={resources[key as keyof typeof resources] || 0}
                  rate={resourceRates[key as keyof typeof resourceRates]}
                />
              ))
            }
          </div>
        </div>
      )}
      
      {/* 资源说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">资源说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>食物、木材、石料</strong>：可通过点击手动收集，也可通过建筑自动生产</li>
          <li>• <strong>工具</strong>：通过工坊等建筑生产，提高其他资源的采集效率</li>
          <li>• <strong>人口</strong>：文明的核心，需要食物维持，受住房限制</li>
          <li>• <strong>住房</strong>：通过建造居住建筑增加，限制人口上限</li>
          <li>• <strong>高级资源</strong>：需要研究相应科技后才会显示和解锁</li>
        </ul>
      </div>
    </div>
  );
};

export default ResourcesPanel;