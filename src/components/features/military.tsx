'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/game-store';
import { formatNumber } from '@/utils/format';
import { 
  Swords, 
  Shield, 
  Users, 
  Plus, 
  Minus,
  Zap,
  Target,
  Crown,
  AlertTriangle
} from 'lucide-react';

// 军事单位定义
const MILITARY_UNITS = {
  scout: {
    id: 'scout',
    name: '侦察兵',
    description: '轻装快速的侦察单位，用于探索和收集情报',
    cost: {
      food: 10,
      wood: 5,
      tools: 1
    },
    stats: {
      attack: 5,
      defense: 3,
      health: 60
    },
    requirements: {
      buildings: {},
      technologies: ['primitive_weapons']
    },
    trainingTime: 120 // 2分钟
  },
  warrior: {
    id: 'warrior',
    name: '战士',
    description: '基础的近战单位，装备简单武器和护甲',
    cost: {
      food: 20,
      wood: 10,
      tools: 2
    },
    stats: {
      attack: 10,
      defense: 8,
      health: 100
    },
    requirements: {
      buildings: { barracks: 1 },
      technologies: ['warfare']
    },
    trainingTime: 180 // 3分钟
  },
  archer: {
    id: 'archer',
    name: '弓箭手',
    description: '远程攻击单位，擅长远距离作战',
    cost: {
      food: 15,
      wood: 25,
      tools: 3
    },
    stats: {
      attack: 12,
      defense: 5,
      health: 80
    },
    requirements: {
      buildings: { barracks: 1 },
      technologies: ['archery']
    },
    trainingTime: 240 // 4分钟
  },
  guard: {
    id: 'guard',
    name: '守卫',
    description: '防御型单位，专门保护建筑和人民',
    cost: {
      food: 25,
      wood: 15,
      stone: 10,
      tools: 4
    },
    stats: {
      attack: 8,
      defense: 15,
      health: 120
    },
    requirements: {
      buildings: { guard_tower: 1 },
      technologies: ['defensive_tactics']
    },
    trainingTime: 300 // 5分钟
  },
  elite_warrior: {
    id: 'elite_warrior',
    name: '精英战士',
    description: '经验丰富的战士，拥有更强的战斗能力',
    cost: {
      food: 40,
      wood: 20,
      stone: 5,
      tools: 8
    },
    stats: {
      attack: 18,
      defense: 12,
      health: 150
    },
    requirements: {
      buildings: { training_ground: 1 },
      technologies: ['professional_army']
    },
    trainingTime: 600 // 10分钟
  }
};

interface TrainingQueue {
  id: string;
  unitType: string;
  startTime: number;
  duration: number;
  completed: boolean;
}

interface Army {
  [unitType: string]: number;
}

export const MilitaryPanel = () => {
  const { gameState, spendResources, canAfford, getBuildingCount, army, addUnit, getUnitCount } = useGameStore();
  const [trainingQueue, setTrainingQueue] = useState<TrainingQueue[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  // 检查是否可以训练单位
  const canTrainUnit = (unitType: string) => {
    const unit = MILITARY_UNITS[unitType as keyof typeof MILITARY_UNITS];
    if (!unit) return false;

    // 检查资源
    if (!canAfford(unit.cost)) return false;

    // 检查建筑要求
    if (unit.requirements.buildings) {
      for (const [buildingId, count] of Object.entries(unit.requirements.buildings)) {
        if (getBuildingCount(buildingId) < count) {
          return false;
        }
      }
    }

    // 检查科技要求
    if (unit.requirements.technologies) {
      for (const techId of unit.requirements.technologies) {
        if (!gameState.technologies[techId]?.researched) {
          return false;
        }
      }
    }

    return true;
  };

  // 开始训练单位
  const startTraining = (unitType: string) => {
    const unit = MILITARY_UNITS[unitType as keyof typeof MILITARY_UNITS];
    if (!unit || !canTrainUnit(unitType)) return;

    // 消耗资源
    if (spendResources(unit.cost)) {
      const training: TrainingQueue = {
        id: `training_${Date.now()}`,
        unitType,
        startTime: Date.now(),
        duration: unit.trainingTime * 1000, // 转换为毫秒
        completed: false
      };

      setTrainingQueue(prev => [...prev, training]);
    }
  };

  // 完成训练
  const completeTraining = (trainingId: string) => {
    const training = trainingQueue.find(t => t.id === trainingId);
    if (!training) return;

    // 添加单位到军队
    addUnit(training.unitType, 1);

    // 从训练队列中移除
    setTrainingQueue(prev => prev.filter(t => t.id !== trainingId));
  };

  // 检查训练是否完成
  const checkTraining = () => {
    const now = Date.now();
    trainingQueue.forEach(training => {
      if (!training.completed && now >= training.startTime + training.duration) {
        completeTraining(training.id);
      }
    });
  };

  // 定期检查训练状态
  useState(() => {
    const interval = setInterval(checkTraining, 1000);
    return () => clearInterval(interval);
  });

  // 计算军队总战力
  const getTotalPower = () => {
    return Object.entries(army).reduce((total, [unitType, count]) => {
      const unit = MILITARY_UNITS[unitType as keyof typeof MILITARY_UNITS];
      return total + (unit ? (unit.stats.attack + unit.stats.defense) * count : 0);
    }, 0);
  };

  const totalUnits = Object.values(army).reduce((sum, count) => sum + count, 0);
  const totalPower = getTotalPower();

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-2">
          <Swords className="text-red-600" size={24} />
          军事中心
        </h2>
        <p className="text-stone-600 mb-6">
          训练军队保卫部落，提升军事实力。不同的军事单位有各自的特点和用途。
        </p>

        {/* 军队概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-blue-600" size={20} />
              <span className="font-semibold text-blue-900">总兵力</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{totalUnits}</div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="text-red-600" size={20} />
              <span className="font-semibold text-red-900">战斗力</span>
            </div>
            <div className="text-2xl font-bold text-red-900">{totalPower}</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="text-green-600" size={20} />
              <span className="font-semibold text-green-900">训练中</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{trainingQueue.length}</div>
          </div>
        </div>
      </div>

      {/* 当前军队 */}
      {totalUnits > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-stone-900 mb-4">当前军队</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(army).map(([unitType, count]) => {
              if (count === 0) return null;
              const unit = MILITARY_UNITS[unitType as keyof typeof MILITARY_UNITS];
              if (!unit) return null;
              
              return (
                <div key={unitType} className="bg-stone-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-stone-900">{unit.name}</h4>
                    <span className="text-lg font-bold text-stone-700">{count}</span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-500">攻击:</span>
                      <span className="text-red-600">{unit.stats.attack}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">防御:</span>
                      <span className="text-blue-600">{unit.stats.defense}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">生命:</span>
                      <span className="text-green-600">{unit.stats.health}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 训练队列 */}
      {trainingQueue.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-stone-900 mb-4">训练队列</h3>
          <div className="space-y-3">
            {trainingQueue.map(training => {
              const unit = MILITARY_UNITS[training.unitType as keyof typeof MILITARY_UNITS];
              const progress = Math.min(1, (Date.now() - training.startTime) / training.duration);
              const remainingTime = Math.max(0, training.duration - (Date.now() - training.startTime));
              
              return (
                <div key={training.id} className="bg-stone-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="text-stone-600" size={16} />
                      <span className="font-medium">训练 {unit.name}</span>
                    </div>
                    <span className="text-sm text-stone-500" suppressHydrationWarning>
                      {Math.ceil(remainingTime / 1000)}秒
                    </span>
                  </div>
                  
                  <div className="w-full bg-stone-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 单位训练 */}
      <div className="card">
        <h3 className="text-xl font-semibold text-stone-900 mb-4">训练单位</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(MILITARY_UNITS).map(unit => {
            const canTrain = canTrainUnit(unit.id);
            const isSelected = selectedUnit === unit.id;
            
            return (
              <div 
                key={unit.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-red-500 bg-red-50' 
                    : canTrain 
                      ? 'border-stone-200 bg-white hover:border-red-300 hover:bg-red-50'
                      : 'border-stone-200 bg-stone-50 opacity-50 cursor-not-allowed'
                }`}
                onClick={() => canTrain && setSelectedUnit(isSelected ? null : unit.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-stone-900">{unit.name}</h4>
                  <div className="text-sm text-stone-500">
                    {Math.floor(unit.trainingTime / 60)}分钟
                  </div>
                </div>
                
                <p className="text-sm text-stone-600 mb-3">{unit.description}</p>
                
                <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                  <div className="text-center">
                    <div className="text-red-600 font-semibold">{unit.stats.attack}</div>
                    <div className="text-stone-500">攻击</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-600 font-semibold">{unit.stats.defense}</div>
                    <div className="text-stone-500">防御</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-600 font-semibold">{unit.stats.health}</div>
                    <div className="text-stone-500">生命</div>
                  </div>
                </div>
                
                <div className="space-y-1 text-xs text-stone-500 mb-3">
                  <div>消耗资源:</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(unit.cost).map(([resource, amount]) => (
                      <span key={resource} className="bg-stone-100 px-2 py-1 rounded">
                        {resource}: {amount}
                      </span>
                    ))}
                  </div>
                </div>
                
                {!canTrain && (
                  <div className="flex items-center gap-1 text-xs text-red-600 mb-2">
                    <AlertTriangle size={12} />
                    <span>需求未满足</span>
                  </div>
                )}
                
                {isSelected && canTrain && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startTraining(unit.id);
                      setSelectedUnit(null);
                    }}
                    className="w-full btn btn-primary flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    开始训练
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};