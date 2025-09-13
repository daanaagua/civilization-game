'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/game-store';
import { BUILDINGS } from '@/lib/game-data';
import { Building, BuildingType } from '@/types/game';
import { formatNumber, formatResourceCost } from '@/utils/format';
import { 
  Home, 
  Factory, 
  Shield, 
  Palette, 
  Star,
  Package,
  Plus,
  Lock,
  Check,
  Users,
  Minus,
  Trash2
} from 'lucide-react';

const buildingTypeConfig: Record<BuildingType, { name: string; icon: any; color: string }> = {
  housing: { name: '住房', icon: Home, color: 'text-blue-600' },
  production: { name: '生产', icon: Factory, color: 'text-green-600' },
  military: { name: '军事', icon: Shield, color: 'text-red-600' },
  cultural: { name: '文化', icon: Palette, color: 'text-purple-600' },
  special: { name: '特殊', icon: Star, color: 'text-yellow-600' },
  storage: { name: '储存', icon: Package, color: 'text-orange-600' },
};

interface BuildingCardProps {
  building: Building;
  count: number;
  onBuild: () => void;
  canAfford: boolean;
}

const BuildingCard = ({ building, count, onBuild, canAfford }: BuildingCardProps) => {
  const { gameState, assignWorkerToBuilding, removeWorkerFromBuilding, getAvailableWorkers, isBuildingUnlocked } = useGameStore();
  const typeConfig = buildingTypeConfig[building.type];
  const TypeIcon = typeConfig.icon;
  
  const isUnlocked = isBuildingUnlocked(building.id);
  const hasRequirements = !building.requires || building.requires.length === 0;
  
  const buildingInstance = gameState.buildings[building.id];
  const assignedWorkers = buildingInstance?.assignedWorkers || 0;
  const availableWorkers = getAvailableWorkers();
  const canAssignWorkers = building.canAssignWorkers && count > 0;
  const maxWorkers = building.maxWorkers || 0;
  
  const handleAssignWorker = () => {
    if (availableWorkers > 0 && assignedWorkers < maxWorkers * count) {
      assignWorkerToBuilding(building.id);
    }
  };
  
  const handleRemoveWorker = () => {
    if (assignedWorkers > 0) {
      removeWorkerFromBuilding(building.id);
    }
  };
  
  return (
    <div className={`card hover:shadow-md transition-all duration-200 ${
      !isUnlocked ? 'opacity-50 bg-stone-100' : 'bg-white'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${typeConfig.color} bg-stone-50`}>
            <TypeIcon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900">{building.name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${typeConfig.color} bg-stone-100`}>
              {typeConfig.name}
            </span>
          </div>
        </div>
        
        {count > 0 && (
          <div className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-sm font-medium">
            {count}
          </div>
        )}
      </div>
      
      <p className="text-sm text-stone-600 mb-4 leading-relaxed">
        {building.description}
      </p>
      
      {/* 工人分配 */}
      {canAssignWorkers && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-stone-500 mb-2">人口分配</h4>
          <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg text-white">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-white" />
              <span className="text-sm font-medium">
                {assignedWorkers}/{maxWorkers * count}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRemoveWorker}
                disabled={assignedWorkers === 0}
                className="w-6 h-6 rounded bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Minus size={12} />
              </button>
              <button
                onClick={handleAssignWorker}
                disabled={availableWorkers === 0 || assignedWorkers >= maxWorkers * count}
                className="w-6 h-6 rounded bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
          {availableWorkers === 0 && assignedWorkers < maxWorkers * count && (
            <p className="text-xs text-amber-600 mt-1">没有可用人口</p>
          )}
        </div>
      )}
      
      {/* 生产效果 */}
      {building.produces && assignedWorkers > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-stone-500 mb-2">生产效果</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(building.produces).map(([resource, amount]) => {
              let efficiency = 1;
              if (canAssignWorkers && maxWorkers > 0) {
                efficiency = Math.max(0.1, assignedWorkers / (maxWorkers * count));
              }
              const actualAmount = amount * efficiency;
              
              return (
                <span key={resource} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  +{formatNumber(actualAmount * 60)}/分钟 {resource === 'food' ? '食物' : resource === 'wood' ? '木材' : resource === 'stone' ? '石料' : resource === 'tools' ? '工具' : resource === 'housing' ? '住房' : resource}
                  {canAssignWorkers && efficiency < 1 && (
                    <span className="text-amber-700 ml-1">({Math.round(efficiency * 100)}%)</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
      
      {/* 建造成本 */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-stone-500 mb-2">建造成本</h4>
        <div className="flex flex-wrap gap-2">
          {formatResourceCost(building.cost).map((cost, index) => (
            <span key={index} className="text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded">
              {cost}
            </span>
          ))}
        </div>
      </div>
      
      {/* 前置要求 */}
      {building.requires && building.requires.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-stone-500 mb-2">前置要求</h4>
          <div className="flex flex-wrap gap-2">
            {building.requires.map((req) => (
              <span key={req} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                {req}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* 建造按钮 */}
      <div className="flex gap-2">
        <button
          onClick={onBuild}
          disabled={!isUnlocked || !canAfford}
          className={`flex-1 btn flex items-center justify-center gap-2 ${
            !isUnlocked 
              ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
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
          ) : canAfford ? (
            <>
              <Plus size={16} />
              建造
            </>
          ) : (
            <>
              <span>资源不足</span>
            </>
          )}
        </button>
        {count > 0 && (
          <button
            onClick={() => demolishBuilding(building.id)}
            className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
            title="拆除建筑"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export const BuildingsPanel = () => {
  const { gameState, buildStructure, demolishBuilding, canAfford, getBuildingCount } = useGameStore();
  const [selectedType, setSelectedType] = useState<BuildingType | 'all'>('all');
  
  const buildingTypes: (BuildingType | 'all')[] = ['all', 'housing', 'production', 'cultural', 'military', 'special'];
  
  const filteredBuildings = Object.values(BUILDINGS).filter(building => {
    if (selectedType === 'all') return true;
    return building.type === selectedType;
  });
  
  const handleBuild = (buildingId: string) => {
    const success = buildStructure(buildingId);
    if (!success) {
      // 可以在这里添加错误提示
      console.log('建造失败');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* 建筑类型筛选 */}
      <div className="flex flex-wrap gap-2">
        {buildingTypes.map((type) => {
          const isActive = selectedType === type;
          const config = type === 'all' 
            ? { name: '全部', icon: Star, color: 'text-stone-600' }
            : buildingTypeConfig[type];
          const Icon = config.icon;
          
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
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
      
      {/* 建筑列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBuildings.map((building) => {
          const count = getBuildingCount(building.id);
          const affordable = canAfford(building.cost);
          
          return (
            <BuildingCard
              key={building.id}
              building={building}
              count={count}
              onBuild={() => handleBuild(building.id)}
              canAfford={affordable}
            />
          );
        })}
      </div>
      
      {filteredBuildings.length === 0 && (
        <div className="text-center py-12">
          <div className="text-stone-400 mb-2">
            <Factory size={48} className="mx-auto" />
          </div>
          <p className="text-stone-500">暂无可用的建筑</p>
        </div>
      )}
    </div>
  );
};