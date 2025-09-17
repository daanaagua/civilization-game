'use client';

import { useGameStore } from '@/lib/game-store';
import { Resources, ResourceRates } from '@/types/game';
import { formatNumber } from '@/utils/format';
import { Tooltip } from './tooltip';
import { ResourceDetailsTooltip } from './resource-details-tooltip';
import { 
  Apple, 
  TreePine, 
  Mountain, 
  Hammer, 
  Users, 
  Home,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface ResourceDisplayProps {
  resource: keyof typeof resourceConfig; // 仅限支持在本组件中展示的资源键，避免索引越界
  showRate?: boolean;
  className?: string;
}

const resourceConfig = {
  food: {
    name: '食物',
    icon: Apple,
    color: 'text-green-400',
    bgColor: 'bg-slate-800',
    borderColor: 'border-slate-600',
    description: '维持人口生存的基本资源。可通过采集、农田、狩猎等方式获得。',
  },
  wood: {
    name: '木材',
    icon: TreePine,
    color: 'text-amber-400',
    bgColor: 'bg-slate-800',
    borderColor: 'border-slate-600',
    description: '建造和制作的基础材料。可通过伐木场或手动采集获得。',
  },
  stone: {
    name: '石料',
    icon: Mountain,
    color: 'text-stone-400',
    bgColor: 'bg-slate-800',
    borderColor: 'border-slate-600',
    description: '坚固建筑的重要材料。可通过采石场或手动采集获得。',
  },
  tools: {
    name: '工具',
    icon: Hammer,
    color: 'text-blue-400',
    bgColor: 'bg-slate-800',
    borderColor: 'border-slate-600',
    description: '提高生产效率的器具。通过工坊制作，需要消耗木材和石料。',
  },
  population: {
    name: '人口',
    icon: Users,
    color: 'text-purple-400',
    bgColor: 'bg-slate-800',
    borderColor: 'border-slate-600',
    description: '文明发展的核心力量。需要食物维持，受住房容量限制。',
  },
  housing: {
    name: '住房',
    icon: Home,
    color: 'text-indigo-400',
    bgColor: 'bg-slate-800',
    borderColor: 'border-slate-600',
    description: '人口居住的容量限制。通过建造居住建筑增加住房容量。',
  },
} as const;

type ResourceKey = keyof typeof resourceConfig;
// 仅用于生产速率的资源键（housing 没有生产速率）
type RateResourceKey = Extract<ResourceKey, keyof ResourceRates>;

export const ResourceDisplay = ({ resource, showRate = false, className = '' }: ResourceDisplayProps) => {
  const { gameState } = useGameStore();
  const { resources, resourceRates, resourceLimits } = gameState;
  
  const config = resourceConfig[resource];
  const Icon = config.icon;
  const amount = resources[resource as keyof Resources];
  const rate = resource === 'housing' ? 0 : (resourceRates[resource as RateResourceKey] ?? 0);
  const limit = resourceLimits[resource as keyof Resources];
  
  return (
    <Tooltip 
      content={
        <ResourceDetailsTooltip resource={resource as ResourceKey} />
      }
    >
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${config.bgColor} ${config.borderColor} ${className} cursor-help`}>
        <div className={`p-2 rounded-md ${config.color} bg-slate-700`}>
          <Icon size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200">
              {config.name}
            </span>
            {showRate && (
              <div className={`flex items-center gap-1 text-xs ${
                rate > 0 ? 'text-green-600' : rate < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {rate > 0 ? <TrendingUp size={12} /> : rate < 0 ? <TrendingDown size={12} /> : null}
                <span>{rate > 0 ? '+' : ''}{formatNumber(rate, 1)}/s</span>
              </div>
            )}
          </div>
          
          <div className="text-lg font-bold text-slate-100">
            {formatNumber(amount)}
            {resource !== 'housing' && (
              <span className="text-sm font-normal text-slate-400 ml-1">
                / {formatNumber(limit)}
              </span>
            )}
            {resource === 'population' && (
              <span className="text-xs text-slate-500 ml-1">
                (住房: {formatNumber(resources.housing)})
              </span>
            )}
          </div>
        </div>
      </div>
    </Tooltip>
  );
};

// 资源面板组件
export const ResourcePanel = () => {
  const resources: ResourceKey[] = ['food', 'wood', 'stone', 'tools', 'population', 'housing'];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {resources.map((resource) => (
        <ResourceDisplay 
          key={resource} 
          resource={resource} 
          showRate={resource !== 'housing'}
        />
      ))}
    </div>
  );
};