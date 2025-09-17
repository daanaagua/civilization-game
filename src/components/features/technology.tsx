'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/game-store';
import { Technology, TechnologyCategory } from '@/types/game';
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

const technologyCategoryConfig: Record<TechnologyCategory, { name: string; icon: any; color: string }> = {
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
      
      {/* 科技效果 */}
      {technology.effects && technology.effects.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-stone-500 mb-2">科技效果</h4>
          <div className="space-y-1">
            {technology.effects.map((effect, index) => (
              <div key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {effect.type === 'resource_multiplier' && (
                  <span>{effect.target} 生产效率 +{Math.round((effect.value - 1) * 100)}%</span>
                )}
                {effect.type === 'building_unlock' && (
                  <span>解锁新建筑</span>
                )}
                {effect.type === 'population_growth' && (
                  <span>人口增长 +{effect.value}</span>
                )}
                {effect.type === 'stability_bonus' && (
                  <span>稳定度 +{effect.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 解锁内容 */}
      {technology.unlocks && technology.unlocks.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-stone-500 mb-2">解锁内容</h4>
          <div className="flex flex-wrap gap-2">
            {technology.unlocks.map((unlock) => (
              <span key={unlock} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                {unlock}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* 研究成本 */}
      {!isResearched && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-stone-500 mb-2">研究成本</h4>
          <div className="flex flex-wrap gap-2">
            {formatResourceCost(technology.cost).map((cost, index) => (
              <span key={index} className="text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded">
                {cost}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-stone-500">
            <Clock size={12} />
            <span>研究时间: {formatTime(technology.researchTime)}</span>
          </div>
        </div>
      )}
      
      {/* 前置要求 */}
      {technology.requires && technology.requires.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-stone-500 mb-2">前置要求</h4>
          <div className="flex flex-wrap gap-2">
            {technology.requires.map((req) => (
              <span key={req} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                {req}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* 研究按钮 */}
      {!isResearched && (
        <button
          onClick={onResearch}
          disabled={!isUnlocked || !canAfford || isResearching}
          className={`w-full btn flex items-center justify-center gap-2 ${
            !isUnlocked 
              ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
              : isResearching
              ? 'bg-blue-200 text-blue-700 cursor-not-allowed'
              : canAfford
              ? 'btn-primary'
              : 'bg-stone-200 text-stone-500 cursor-not-allowed'
          }`}
        >
          {!isUnlocked ? (
            <>
              <Lock size={16} />
              未解锁
            </>
          ) : isResearching ? (
            <>
              <Zap size={16} className="animate-pulse" />
              研究中...
            </>
          ) : canAfford ? (
            <>
              <Play size={16} />
              开始研究
            </>
          ) : (
            <>
              <span>资源不足</span>
            </>
          )}
        </button>
      )}
      
      {isResearched && (
        <div className="w-full bg-green-100 text-green-800 py-2 px-4 rounded-lg text-center font-medium">
          <Check size={16} className="inline mr-2" />
          已完成研究
        </div>
      )}
    </div>
  );
};

export const TechnologyPanel = () => {
  const { gameState, startResearch, canAfford } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<TechnologyCategory | 'all'>('all');
  
  const categories: (TechnologyCategory | 'all')[] = ['all', 'survival', 'agriculture', 'crafting', 'construction', 'military', 'social', 'knowledge', 'metalworking', 'culture', 'production'];
  
  const filteredTechnologies = Object.values(gameState.technologies).filter(tech => {
    if (selectedCategory === 'all') return true;
    return tech.category === selectedCategory;
  });
  
  const currentResearch = gameState.researchState?.currentResearch || null;
  
  const handleResearch = (technologyId: string) => {
    const success = startResearch(technologyId);
    if (!success) {
      console.log('研究失败');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* 当前研究状态 */}
      {currentResearch && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                <Zap size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">正在研究</h3>
                <p className="text-blue-700">
                  {gameState.technologies[currentResearch.technologyId]?.name}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                // 暂停研发功能
                const { pauseResearch } = useGameStore.getState();
                pauseResearch();
              }}
              className="btn btn-secondary text-sm px-3 py-1"
            >
              暂停研发
            </button>
          </div>
          
          <div className="progress-bar mb-2">
            <div 
              className="progress-fill bg-blue-600" 
              style={{ 
                width: `${(currentResearch.progress / (gameState.technologies[currentResearch.technologyId]?.researchTime || 1)) * 100}%` 
              }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-blue-700">
            <span>
              {Math.round((currentResearch.progress / (gameState.technologies[currentResearch.technologyId]?.researchTime || 1)) * 100)}% 完成
            </span>
            <span>
              剩余: {formatTime((gameState.technologies[currentResearch.technologyId]?.researchTime || 0) - currentResearch.progress)}
            </span>
          </div>
        </div>
      )}
      
      {/* 科技类别筛选 */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          const config = category === 'all' 
            ? { name: '全部', icon: Zap, color: 'text-stone-600' }
            : technologyCategoryConfig[category];
          const Icon = config.icon;
          
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                isActive
                  ? 'bg-primary-100 border-primary-300 text-primary-800'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Icon size={16} />
              {config.name}
            </button>
          );
        })}
      </div>
      
      {/* 科技列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechnologies.map((technology) => {
          const affordable = canAfford(technology.cost);
          const isResearching = currentResearch?.technologyId === technology.id;
          const researchProgress = isResearching ? currentResearch.progress : 0;
          
          return (
            <TechnologyCard
              key={technology.id}
              technology={technology}
              onResearch={() => handleResearch(technology.id)}
              canAfford={affordable}
              isResearching={isResearching}
              researchProgress={researchProgress}
            />
          );
        })}
      </div>
      
      {filteredTechnologies.length === 0 && (
        <div className="text-center py-12">
          <div className="text-stone-400 mb-2">
            <Zap size={48} className="mx-auto" />
          </div>
          <p className="text-stone-500">暂无可用的科技</p>
        </div>
      )}
    </div>
  );
};