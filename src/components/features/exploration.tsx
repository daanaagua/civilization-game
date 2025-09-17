'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/game-store';
import { formatNumber, formatTime } from '@/utils/format';
import { 
  Compass, 
  MapPin, 
  Clock, 
  Users, 
  Gem, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play
} from 'lucide-react';

// 探险地点定义
const EXPLORATION_LOCATIONS = {
  nearby_forest: {
    id: 'nearby_forest',
    name: '附近森林',
    description: '探索部落周围的森林，寻找资源和新的发现',
    duration: 300, // 5分钟
    requirements: {
      scouts: 1,
      technologies: ['scouting']
    },
    rewards: {
      food: { min: 10, max: 30 },
      wood: { min: 15, max: 25 },
      probability: 0.8
    },
    risks: {
      injury: 0.1,
      lost: 0.05
    }
  },
  mountain_caves: {
    id: 'mountain_caves',
    name: '山洞探索',
    description: '深入山洞寻找矿物和古老的秘密',
    duration: 600, // 10分钟
    requirements: {
      scouts: 2,
      technologies: ['mining', 'tools']
    },
    rewards: {
      stone: { min: 20, max: 40 },
      tools: { min: 1, max: 3 },
      probability: 0.7
    },
    risks: {
      injury: 0.15,
      lost: 0.1
    }
  },
  distant_lands: {
    id: 'distant_lands',
    name: '远方土地',
    description: '派遣侦察兵探索遥远的土地，寻找新的机遇',
    duration: 1200, // 20分钟
    requirements: {
      scouts: 3,
      technologies: ['navigation', 'advanced_tools']
    },
    rewards: {
      food: { min: 30, max: 60 },
      wood: { min: 25, max: 50 },
      stone: { min: 15, max: 35 },
      probability: 0.6
    },
    risks: {
      injury: 0.2,
      lost: 0.15
    }
  }
};

interface ExplorationMission {
  id: string;
  locationId: string;
  scouts: number;
  startTime: number;
  duration: number;
  status: 'active' | 'completed' | 'failed';
}

export const ExplorationPanel = () => {
  const { gameState, addResources, spendResources, getUnitCount } = useGameStore();
  const [activeMissions, setActiveMissions] = useState<ExplorationMission[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const isPaused = useGameStore(state => state.gameState.isPaused);

  // 获取可用侦察兵数量
  const getAvailableScouts = () => {
    const totalScouts = getUnitCount('scout');
    const activeScouts = activeMissions.reduce((sum, mission) => 
      mission.status === 'active' ? sum + mission.scouts : sum, 0
    );
    return Math.max(0, totalScouts - activeScouts);
  };

  // 检查是否满足探险要求
  const canExplore = (location: any) => {
    const availableScouts = getAvailableScouts();
    if (availableScouts < location.requirements.scouts) return false;
    
    // 检查科技要求
    if (location.requirements.technologies) {
      for (const techId of location.requirements.technologies) {
        if (!gameState.technologies[techId]?.researched) {
          return false;
        }
      }
    }
    
    return true;
  };

  // 开始探险
  const startExploration = (locationId: string) => {
    const location = EXPLORATION_LOCATIONS[locationId as keyof typeof EXPLORATION_LOCATIONS];
    if (!location || !canExplore(location)) return;

    const mission: ExplorationMission = {
      id: `mission_${Date.now()}`,
      locationId,
      scouts: location.requirements.scouts,
      startTime: Date.now(),
      duration: location.duration * 1000, // 转换为毫秒
      status: 'active'
    };

    setActiveMissions(prev => [...prev, mission]);
    setSelectedLocation(null);
  };

  // 完成探险
  const completeMission = (missionId: string) => {
    const mission = activeMissions.find(m => m.id === missionId);
    if (!mission) return;

    const location = EXPLORATION_LOCATIONS[mission.locationId as keyof typeof EXPLORATION_LOCATIONS];
    
    // 计算结果
    const success = Math.random() < location.rewards.probability;
    
    if (success) {
      // 成功获得奖励
      const rewards: any = {};
      Object.entries(location.rewards).forEach(([key, value]) => {
        if (key !== 'probability' && typeof value === 'object' && 'min' in value && 'max' in value) {
          rewards[key] = Math.floor(Math.random() * (value.max - value.min + 1)) + value.min;
        }
      });
      addResources(rewards);
    }

    // 更新任务状态
    setActiveMissions(prev => 
      prev.map(m => 
        m.id === missionId 
          ? { ...m, status: success ? 'completed' : 'failed' }
          : m
      )
    );

    // 3秒后移除已完成的任务
    setTimeout(() => {
      setActiveMissions(prev => prev.filter(m => m.id !== missionId));
    }, 3000);
  };

  // 检查任务是否完成
  const checkMissions = () => {
    const now = Date.now();
    activeMissions.forEach(mission => {
      if (mission.status === 'active' && now >= mission.startTime + mission.duration) {
        completeMission(mission.id);
      }
    });
  };

  // 定期检查任务状态（暂停时不运行）
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(checkMissions, 1000);
    return () => clearInterval(interval);
  }, [isPaused, activeMissions]);

  const availableScouts = getAvailableScouts();
  const totalScouts = getUnitCount('scout');

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-2">
          <Compass className="text-blue-600" size={24} />
          探险中心
        </h2>
        <p className="text-stone-600 mb-6">
          派遣侦察兵探索未知区域，寻找资源和发现新的机遇。探险有风险，请谨慎选择。
        </p>

        {/* 侦察兵状态 */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="text-blue-600" size={20} />
              <span className="font-semibold text-blue-900">侦察兵状态</span>
            </div>
            <div className="text-blue-900">
              可用: {availableScouts} / 总计: {totalScouts}
            </div>
          </div>
        </div>
      </div>

      {/* 活动任务 */}
      {activeMissions.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-stone-900 mb-4">进行中的探险</h3>
          <div className="space-y-3">
            {activeMissions.map(mission => {
              const location = EXPLORATION_LOCATIONS[mission.locationId as keyof typeof EXPLORATION_LOCATIONS];
              const progress = Math.min(1, (Date.now() - mission.startTime) / mission.duration);
              const remainingTime = Math.max(0, mission.duration - (Date.now() - mission.startTime));
              
              return (
                <div key={mission.id} className="bg-stone-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="text-stone-600" size={16} />
                      <span className="font-medium">{location.name}</span>
                      <span className="text-sm text-stone-500">({mission.scouts} 侦察兵)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {mission.status === 'active' && (
                        <>
                          <Clock className="text-blue-600" size={16} />
                          <span className="text-sm text-blue-600" suppressHydrationWarning>
                            {formatTime(remainingTime / 1000)}
                          </span>
                        </>
                      )}
                      {mission.status === 'completed' && (
                        <CheckCircle className="text-green-600" size={16} />
                      )}
                      {mission.status === 'failed' && (
                        <XCircle className="text-red-600" size={16} />
                      )}
                    </div>
                  </div>
                  
                  {mission.status === 'active' && (
                    <div className="w-full bg-stone-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  )}
                  
                  {mission.status === 'completed' && (
                    <p className="text-sm text-green-600">探险成功！获得了丰富的资源。</p>
                  )}
                  
                  {mission.status === 'failed' && (
                    <p className="text-sm text-red-600">探险失败，侦察兵空手而归。</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 探险地点 */}
      <div className="card">
        <h3 className="text-xl font-semibold text-stone-900 mb-4">可探索地点</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(EXPLORATION_LOCATIONS).map(location => {
            const canStart = canExplore(location);
            const isSelected = selectedLocation === location.id;
            
            return (
              <div 
                key={location.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : canStart 
                      ? 'border-stone-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                      : 'border-stone-200 bg-stone-50 opacity-50 cursor-not-allowed'
                }`}
                onClick={() => canStart && setSelectedLocation(isSelected ? null : location.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-stone-900">{location.name}</h4>
                  <div className="flex items-center gap-1 text-sm text-stone-500">
                    <Clock size={14} />
                    {formatTime(location.duration)}
                  </div>
                </div>
                
                <p className="text-sm text-stone-600 mb-3">{location.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">需要侦察兵:</span>
                    <span className={canStart ? 'text-stone-700' : 'text-red-600'}>
                      {location.requirements.scouts}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">成功率:</span>
                    <span className="text-green-600">
                      {Math.round(location.rewards.probability * 100)}%
                    </span>
                  </div>
                  
                  {location.requirements.technologies && (
                    <div className="text-xs text-stone-500">
                      需要科技: {location.requirements.technologies.join(', ')}
                    </div>
                  )}
                </div>
                
                {isSelected && canStart && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startExploration(location.id);
                    }}
                    className="w-full mt-3 btn btn-primary flex items-center justify-center gap-2"
                  >
                    <Play size={16} />
                    开始探险
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