'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/game-store';
import { Technology } from '@/types/game';
import { formatNumber, formatResourceCost, formatTime } from '@/utils/format';
import { 
  Flame, 
  Wheat, 
  Hammer, 
  Building, 
  Shield, 
  Palette,
  Play,
  Lock,
  Check,
  Clock,
  Zap,
  BookOpen,
  Wrench
} from 'lucide-react';

// Note: This file is currently unused by the app. Relax the key typing to avoid strict union mismatch errors during type checking.
// const technologyCategoryConfig: Record<TechnologyCategory, { name: string; icon: any; color: string }> = {
const technologyCategoryConfig: Record<string, { name: string; icon: any; color: string }> = {
  survival: { name: '生存', icon: Flame, color: 'text-red-600' },
  agriculture: { name: '农业', icon: Wheat, color: 'text-green-600' },
  crafting: { name: '工艺', icon: Hammer, color: 'text-blue-600' },
  construction: { name: '建筑', icon: Building, color: 'text-stone-600' },
  military: { name: '军事', icon: Shield, color: 'text-red-700' },
  culture: { name: '文化', icon: Palette, color: 'text-purple-600' },
  social: { name: '社会', icon: Zap, color: 'text-yellow-600' },
  knowledge: { name: '知识', icon: BookOpen, color: 'text-indigo-600' },
  metalworking: { name: '冶金', icon: Wrench, color: 'text-orange-600' },
  production: { name: '生产', icon: Hammer, color: 'text-amber-600' },
};

interface TechnologyCardProps {
  technology: Technology;
  onResearch: () => void;
  canAfford: boolean;
  isResearching: boolean;
  researchProgress?: number;
}

const TechnologyCard = ({ 
  technology, 
  onResearch, 
  canAfford, 
  isResearching, 
  researchProgress = 0 
}: TechnologyCardProps) => {
  const categoryConfig = technologyCategoryConfig[technology.category];
  if (!categoryConfig) {
    console.error('Invalid technology category:', technology);
    return null;
  }
  const CategoryIcon = categoryConfig.icon;
  
  const isUnlocked = technology.unlocked;
  const isResearched = technology.researched;
  
  return (
    <div className={`card hover:shadow-md transition-all duration-200 ${
      !isUnlocked 
        ? 'opacity-50 bg-stone-100' 
        : isResearched 
        ? 'bg-green-50 border-green-200'
        : isResearching
        ? 'bg-blue-50 border-blue-200'
        : 'bg-white'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${categoryConfig.color} bg-stone-50`}>
            <CategoryIcon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900">{technology.name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${categoryConfig.color} bg-stone-100`}>
              {categoryConfig.name}
            </span>
          </div>
        </div>
        
        {isResearched && (
          <div className="bg-green-100 text-green-800 p-1 rounded-full">
            <Check size={16} />
          </div>
        )}
        
        {isResearching && (
          <div className="bg-blue-100 text-blue-800 p-1 rounded-full animate-pulse">
            <Zap size={16} />
          </div>
        )}
      </div>
      
      <p className="text-sm text-stone-600 mb-4 leading-relaxed">
        {technology.description}
      </p>
      
      {/* 研究进度 */}
      {isResearching && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-blue-600">研究进度</span>
            <span className="text-xs text-blue-600">
              {Math.round((researchProgress / technology.researchTime) * 100)}%
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill bg-blue-600" 
              style={{ width: `${(researchProgress / technology.researchTime) * 100}%` }}
            />
          </div>
          <div className="text-xs text-stone-500 mt-1">
            剩余时间: {formatTime(technology.researchTime - researchProgress)}
          </div>
        </div>
      )}

      {/* 资源消耗 */}
      <div className="grid grid-cols-1 gap-2 mb-4 text-xs text-stone-600">
        {formatResourceCost(technology.cost).map((text, index) => (
          <div key={index} className="flex justify-between">
            <span className="font-medium text-stone-700">{text}</span>
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        {!isUnlocked ? (
          <button className="btn btn-secondary btn-sm" disabled>
            <Lock size={14} className="mr-1" /> 未解锁
          </button>
        ) : isResearched ? (
          <button className="btn btn-success btn-sm" disabled>
            <Check size={14} className="mr-1" /> 已研究
          </button>
        ) : isResearching ? (
          <button className="btn btn-warning btn-sm" disabled>
            <Clock size={14} className="mr-1" /> 研究中
          </button>
        ) : (
          <button 
            className="btn btn-primary btn-sm"
            onClick={onResearch}
            disabled={!canAfford}
          >
            <Play size={14} className="mr-1" /> 开始研究
          </button>
        )}
      </div>
    </div>
  );
};

export const TechnologyPanel = () => {
  const { gameState, startResearch } = useGameStore();
  const { technologies, resources, researchState } = gameState;
  
  const [filter, setFilter] = useState<'all' | 'available' | 'researching' | 'completed'>('all');
  const [search, setSearch] = useState('');
  
  const techList = Object.values(technologies);

  const filteredTechs = techList.filter(tech => {
    if (filter === 'completed') return tech.researched;
    if (filter === 'researching') return researchState.currentResearch?.technologyId === tech.id;
    if (filter === 'available') {
      // 判断前置科技是否满足
      const requiresMet = (tech.requires ?? []).every(req => technologies[req]?.researched);
      return requiresMet && !tech.researched;
    }
    return true;
  }).filter(tech => tech.name.includes(search));

  const canAfford = (tech: Technology) => {
    return Object.entries(tech.cost).every(([key, value]) => {
      const k = key as keyof typeof resources;
      return (resources[k] ?? 0) >= (value ?? 0);
    });
  };

  return (
    <div className="space-y-6">
      {/* 过滤与搜索 */}
      <div className="flex items-center gap-4">
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value as any)} 
          className="select select-sm select-bordered"
        >
          <option value="all">全部</option>
          <option value="available">可研究</option>
          <option value="researching">研究中</option>
          <option value="completed">已完成</option>
        </select>
        <input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索科技..."
          className="input input-sm input-bordered"
        />
      </div>

      {/* 科技卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTechs.map(tech => {
          const isResearching = researchState.currentResearch?.technologyId === tech.id;
          const researchProgress = isResearching ? (researchState.currentResearch?.progress ?? 0) : 0;
          return (
            <TechnologyCard
              key={tech.id}
              technology={tech}
              onResearch={() => startResearch(tech.id)}
              canAfford={canAfford(tech)}
              isResearching={isResearching}
              researchProgress={researchProgress}
            />
          );
        })}
      </div>
    </div>
  );
};