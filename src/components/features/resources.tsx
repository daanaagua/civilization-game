'use client';

import { useGameStore } from '@/lib/game-store';
import { formatNumber } from '@/utils/format';
import { 
  Apple, 
  TreePine, 
  Mountain, 
  Hammer, 
  Users, 
  Home,
  Coins,
  Wheat,
  Sword
} from 'lucide-react';

interface ResourceConfig {
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  clickable: boolean;
  description: string;
  requiresTech?: string;
}

const resourceConfig: Record<string, ResourceConfig> = {
  food: {
    name: '食物',
    icon: Apple,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    clickable: true,
    description: '维持人口生存的基本资源'
  },
  wood: {
    name: '木材',
    icon: TreePine,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    clickable: true,
    description: '建造和制作的基础材料'
  },
  stone: {
    name: '石料',
    icon: Mountain,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    clickable: true,
    description: '坚固建筑的重要材料'
  },
  tools: {
    name: '工具',
    icon: Hammer,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    clickable: false,
    description: '提高生产效率的器具'
  },
  population: {
    name: '人口',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    clickable: false,
    description: '文明发展的核心力量'
  },
  housing: {
    name: '住房',
    icon: Home,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    clickable: false,
    description: '人口居住的容量限制'
  },
  // 高级资源（需要科技解锁后显示）
  livestock: {
    name: '牲畜',
    icon: Wheat,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    clickable: false,
    description: '畜牧业产出的动物资源',
    requiresTech: 'animal_husbandry'
  },
  weapons: {
    name: '武器',
    icon: Sword,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    clickable: false,
    description: '军事力量的重要装备',
    requiresTech: 'bronze_working'
  },
  copper: {
    name: '铜',
    icon: Mountain,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    clickable: false,
    description: '制作青铜器的重要材料',
    requiresTech: 'bronze_working'
  },
  iron: {
    name: '铁',
    icon: Mountain,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    clickable: false,
    description: '制作铁器的珍贵材料',
    requiresTech: 'iron_working'
  }
};

interface ResourceCardProps {
  resourceType: keyof typeof resourceConfig;
  value: number;
  rate?: number;
}

const ResourceCard = ({ resourceType, value, rate }: ResourceCardProps) => {
  const { clickResource, isRunning } = useGameStore();
  const config = resourceConfig[resourceType];
  const Icon = config.icon;
  
  const handleClick = () => {
    if (config.clickable) {
      clickResource(resourceType as 'food' | 'wood' | 'stone');
    }
  };
  
  const isClickable = config.clickable && isRunning;
  
  return (
    <div 
      className={`card ${config.bgColor} ${config.borderColor} ${
        isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      } ${
        config.clickable && !isRunning ? 'opacity-60' : ''
      }`}
      onClick={handleClick}
      title={
        config.clickable 
          ? isRunning 
            ? `点击增加1个${config.name}` 
            : `游戏未开始，无法收集${config.name}`
          : config.description
      }
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`${config.color.replace('text-', 'bg-')} text-white p-2 rounded-lg`}>
          <Icon size={20} />
        </div>
        <h3 className={`font-semibold ${config.color}`}>{config.name}</h3>
        {config.clickable && (
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