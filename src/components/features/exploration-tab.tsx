'use client';

import React, { useState, useEffect } from 'react';
import { MilitaryUnit, DiscoveredLocation, ExplorationResult } from '../../types/military';
import { ExplorationSystem } from '../../lib/exploration-system';
import { CombatSystem } from '../../lib/combat-system';
import { getUnitType } from '../../lib/military-data';
import { getDungeonById } from '../../lib/dungeon-data';
import { useGameStore } from '@/lib/game-store';
import { GlobalEventBus } from '@/lib/event-bus';
import { runEffects } from '@/lib/events/effect-runner';

interface ExplorationTabProps {
  gameState: {
    resources: Record<string, number>;
    population: number;
    maxPopulation: number;
    military: {
      units: MilitaryUnit[];
      trainingQueue: any[];
      availableUnitTypes: string[];
      isTraining: boolean;
    };
    exploration: {
      discoveredLocations: {
        dungeons: DiscoveredLocation[];
        countries: DiscoveredLocation[];
        events: DiscoveredLocation[];
      };
      explorationHistory: ExplorationResult[];
    };
  };
  onUpdateGameState: (updates: any) => void;
}

export function ExplorationTab({ gameState, onUpdateGameState }: ExplorationTabProps) {
  const { discoverCountry } = useGameStore();
  const addNotification = useGameStore(state => state.addNotification);
  const startAdventureWithUnits = useGameStore(state => state.startAdventureWithUnits);

  // 统一选择器：获取已研究科技集合
  // 避免在各组件重复实现
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getResearchedSet, hasCapability } = require('@/lib/selectors');
  // 使用 store 的实时 gameState 优先，避免父级 props 未刷新导致的门禁误判
  const storeGameState = useGameStore(state => state.gameState);
  const researchedSet: Set<string> = getResearchedSet(storeGameState ?? gameState);
  const isPaused = useGameStore(state => !!state.gameState?.isPaused);
  
  const [explorationSystem] = useState(() => {
    const system = new ExplorationSystem();
    if (gameState.exploration) {
      // 将分类的 discoveredLocations 扁平化为数组，符合 ExplorationSystem 的导入类型
      const flatDiscovered: DiscoveredLocation[] = [
        ...(gameState.exploration.discoveredLocations?.dungeons || []),
        ...(gameState.exploration.discoveredLocations?.countries || []),
        ...(gameState.exploration.discoveredLocations?.events || []),
      ];
      system.importExplorationData({
        discoveredLocations: flatDiscovered,
        explorationHistory: gameState.exploration.explorationHistory || [],
      });
    }
    return system;
  });
  
  const [combatSystem] = useState(() => new CombatSystem());
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [isExploring, setIsExploring] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  // 本地计算型探险点：由 selectors 统一计算
  const [ongoingMissions, setOngoingMissions] = useState<{ id: string; cost: number }[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { computeExplorationPoints } = require('@/lib/selectors');
  const explorationPoints = computeExplorationPoints(gameState, getUnitType, ongoingMissions);
  const [attackUnits, setAttackUnits] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // 获取可用的探索单位
  const availableExplorationUnits = explorationSystem.getAvailableExplorationUnits(gameState.military?.units || []);
  
  // 获取可用的战斗单位（用于攻击副本）
  const availableCombatUnits = (gameState.military?.units || []).filter(unit => {
    const unitType = getUnitType(unit.typeId);
    return !unitType?.isExplorer && unit.count > 0 && unit.status === 'defending';
  });
  
  // 计算当前人口使用情况
  const currentPopulation = gameState.population;
  const maxPopulation = gameState.maxPopulation;
  
  // 获取已发现的位置
  const discoveredLocations = explorationSystem.getDiscoveredLocations();
  
  // 获取探索历史
  const explorationHistory = explorationSystem.getExplorationHistory();
  
  // 获取推荐的探索队伍
  const recommendedForce = explorationSystem.getRecommendedExplorationForce(gameState.military?.units || []);
  
  // 处理探索
  const handleExplore = async () => {
    if (isPaused) {
      addNotification({
        type: 'warning',
        title: '游戏已暂停',
        message: '暂停时无法进行探索。请先恢复游戏。'
      });
      return;
    }
    if (selectedUnits.length === 0) {
      addNotification({
        type: 'warning',
        title: '未选择单位',
        message: '请选择至少一个探索单位'
      });
      return;
    }

    
    const explorationUnits = (gameState.military?.units || []).filter(unit => 
      selectedUnits.includes(unit.id)
    );
    
    if (!explorationSystem.hasExplorationUnits(explorationUnits)) {
      addNotification({
        type: 'error',
        title: '不可用单位',
        message: '选择的单位中没有可用的探索单位'
      });
      return;
    }
    
    // 占用1点探险点（本地进行中任务）
    const missionId = `m_${Date.now()}`;
    setOngoingMissions(prev => [...prev, { id: missionId, cost: 1 }]);
    setIsExploring(true);
    // 不再广播 ExploreStarted，避免事件栏显示“开始/结束”等无关卡片
    
    try {
      // 模拟出发前准备时间
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 启动新的冒险线（只增加侦察点，不做即时结算）
      const { started } = startAdventureWithUnits(explorationUnits);

      // 仅右下角 Toast 简短提示；不包含侦察点与时间，不写入事件栏
      if (started) {
        addNotification({
          type: 'info',
          title: '冒险队已出发',
          message: ''
        });
      } else {
        addNotification({
          type: 'warning',
          title: '未能出发',
          message: '请确认选择了侦察兵/冒险家等探索单位'
        });
      }

      setSelectedUnits([]);
    } catch (error) {
      {
        const msg = error instanceof Error ? error.message : '探索失败';
        addNotification({
          type: 'error',
          title: '探索失败',
          message: msg
        });
        // 不再广播 ExploreEnded，避免出现“冒险结束了 冒险队已出发”的错误文案
      }
    } finally {
      // 释放本地占用的探险点
      setOngoingMissions(prev => prev.filter(m => m.id !== missionId));
      setIsExploring(false);
    }
  };
  
  // 处理攻击副本
  const handleAttackDungeon = async () => {
    if (!selectedLocation || attackUnits.length === 0) {
      alert('请选择目标和攻击单位');
      return;
    }
    
    const location = explorationSystem.getLocationDetails(selectedLocation);
    if (!location || location.type !== 'dungeon') {
      alert('无效的攻击目标');
      return;
    }
    
    const dungeon = getDungeonById(location.data.id);
    if (!dungeon) {
      alert('未找到副本数据');
      return;
    }
    
    const combatUnits = (gameState.military?.units || []).filter(unit => 
      attackUnits.includes(unit.id)
    );
    
    // 预测战斗结果
    const prediction = combatSystem.predictBattleOutcome(combatUnits, dungeon.enemies);
    
    const confirmMessage = `战斗预测：\n` +
      `我方战力: ${Math.floor(prediction.playerPower)}\n` +
      `敌方战力: ${Math.floor(prediction.enemyPower)}\n` +
      `胜率: ${prediction.winChance}%\n` +
      `建议: ${prediction.recommendation === 'attack' ? '进攻' : 
               prediction.recommendation === 'retreat' ? '撤退' : '准备更多'}\n\n` +
      `确定要攻击吗？`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      // 执行战斗
      const combatResult = combatSystem.simulateCombat(combatUnits, dungeon);
      
      // 应用战斗结果
      combatSystem.applyCombatResult(combatResult, gameState.military?.units || []);
      
      // 更新游戏状态
      const updates: any = {
        military: {
          ...gameState.military,
          units: [...(gameState.military?.units || [])]
        }
      };
      
      // 如果胜利，添加奖励
      if (combatResult.victory && combatResult.rewards) {
        const updatedResources = { ...gameState.resources };
        Object.entries(combatResult.rewards).forEach(([resource, amount]) => {
          if (amount && amount > 0) {
            updatedResources[resource] = (updatedResources[resource] || 0) + amount;
          }
        });
        updates.resources = updatedResources;
      }
      
      onUpdateGameState(updates);
      
      // 显示战斗报告
      const report = combatSystem.generateBattleReport(combatResult, dungeon);
      alert(report);
      
      setAttackUnits([]);
      setSelectedLocation('');
    } catch (error) {
      alert(error instanceof Error ? error.message : '战斗失败');
    }
  };
  
  // 渲染探索控制区域
  const renderExplorationControls = () => {
    return (
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">探索控制</h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {showHistory ? '隐藏历史' : '探索历史'}
            </button>
          </div>
        </div>
        
        {/* 探索单位和开始探索 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-300 mb-2">可用探索单位</h4>
            {availableExplorationUnits.length === 0 ? (
              <p className="text-gray-400 text-sm">没有可用的探索单位</p>
            ) : (
              <div className="space-y-2">
                {availableExplorationUnits.map(unit => {
                  const unitType = getUnitType(unit.typeId);
                  if (!unitType) return null;
                  
                  const isSelected = selectedUnits.includes(unit.id);
                  
                  return (
                    <div
                      key={unit.id}
                      className={`p-2 rounded border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedUnits(prev => prev.filter(id => id !== unit.id));
                        } else {
                          setSelectedUnits(prev => [...prev, unit.id]);
                        }
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-white">{unitType.name}</span>
                        <span className="text-gray-400">x{unit.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="flex flex-col justify-center">
            <button
              onClick={handleExplore}
              disabled={selectedUnits.length === 0 || isExploring || isPaused}
              title={
                isPaused
                  ? '暂停时无法进行探索'
                  : selectedUnits.length === 0
                    ? '请选择探索单位'
                    : undefined
              }
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isExploring ? '探索中...' : '开始探索'}
            </button>
            
            {recommendedForce.recommended.length > 0 && (
              <button
                onClick={() => {
                  const recommendedIds = recommendedForce.recommended.map(unit => unit.id);
                  setSelectedUnits(recommendedIds);
                }}
                className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                使用推荐配置
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // 渲染已发现位置
  const renderDiscoveredLocations = () => {
    return (
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">已发现位置</h3>
        
        {discoveredLocations.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>还没有发现任何位置</p>
            <p className="text-sm mt-2">派遣探索单位去探索大陆吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {discoveredLocations.map(location => {
              const canAttack = location.type === 'dungeon' && 
                explorationSystem.canAttackLocation(location.id, gameState.military?.units || []);
              
              return (
                <div key={location.id} className="bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-white">{location.name}</h4>
                    {typeof location.difficulty === 'number' && (
                      <div className={`text-sm font-bold ${
                        location.difficulty! <= 30 ? 'text-green-400' :
                        location.difficulty! <= 60 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {location.difficulty}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-400 capitalize mb-2">
                    {location.type === 'dungeon' ? '地下城' : 
                     location.type === 'country' ? '国家' : location.type}
                  </p>
                  
                  <p className="text-gray-300 text-xs mb-3 line-clamp-2">{location.description}</p>
                  
                  {canAttack && (
                    <button
                      onClick={() => setSelectedLocation(location.id)}
                      className="w-full px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      攻击
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };
  
  // 渲染探索历史
  const renderHistoryTab = () => {
    return (
      <div className="space-y-4">
        {explorationHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>还没有探索历史</p>
          </div>
        ) : (
          explorationHistory.slice().reverse().map((result, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className={`font-medium ${
                  result.success ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result.success ? '✅ 探索成功' : '❌ 探索失败'}
                </div>
                
                <div className="text-sm text-gray-400">
                  {new Date(result.timestamp).toLocaleString()}
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-3">{result.description}</p>
              
              {result.discovery && (
                <div className="bg-gray-700 p-3 rounded mb-3">
                  <h5 className="font-medium text-white mb-1">发现: {result.discovery.name}</h5>
                  <p className="text-sm text-gray-400">{result.discovery.description}</p>
                </div>
              )}
              
              {result.event && (
                <div className="bg-gray-700 p-3 rounded mb-3">
                  <h5 className="font-medium text-white mb-1">{result.event.title}</h5>
                  <p className="text-sm text-gray-400">{result.event.description}</p>
                </div>
              )}
              
              {result.casualties && Object.keys(result.casualties).length > 0 && (
                <div className="bg-red-900/30 p-3 rounded">
                  <h5 className="font-medium text-red-400 mb-1">伤亡</h5>
                  {Object.entries(result.casualties).map(([typeId, count]) => {
                    const unitType = getUnitType(typeId);
                    return (
                      <div key={typeId} className="text-sm text-red-300">
                        {unitType?.name || typeId}: -{count}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  };
  
  // 科技门禁：需要“侦察学”
  const scoutingUnlocked =
    hasCapability(storeGameState ?? gameState, 'cap.scouting') ||
    researchedSet.has('scouting_tech');

  // 订阅运行态以触发渲染
  const activeAdventureRun = useGameStore(state => state.gameState?.exploration?.activeAdventureRun);
  const currentDay = useGameStore(state => state.gameState?.timeSystem?.currentDay ?? 0);

  // 进度条渲染
  const renderAdventureProgress = () => {
    if (!activeAdventureRun) return null;
    const nodes = activeAdventureRun.nodes || [];
    const total = nodes.length;
    const resolved = nodes.filter(n => n.resolved).length;
    const finalNode = nodes.find(n => n.kind === 'final');
    const progress = total > 0 ? (resolved / total) * 100 : 0;

    return (
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-white">冒险进度</h3>
          <div className="text-sm text-gray-300">
            {resolved}/{total} 节点
            {finalNode ? <span className="ml-3 text-gray-400">最终判定日：第 {finalNode.etaDay} 天</span> : null}
          </div>
        </div>
        <div className="relative h-3 bg-gray-700 rounded">
          <div
            className="absolute left-0 top-0 h-3 bg-green-600 rounded"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        {/* 节点刻度 */}
        <div className="relative mt-3">
          <div className="h-0.5 bg-gray-600" />
          <div className="absolute inset-0 flex justify-between">
            {nodes.map((n, idx) => {
              const reached = !!n.resolved || currentDay >= n.etaDay;
              const isFinal = n.kind === 'final';
              return (
                <div key={n.id} className="relative" style={{ width: `${100 / (total - 1 || 1)}%` }}>
                  <div
                    className={[
                      'mx-auto rounded-full',
                      isFinal ? 'w-5 h-5 border-2' : 'w-3 h-3',
                      reached ? 'bg-green-400 border-green-300' : 'bg-gray-500 border-gray-400'
                    ].join(' ')}
                    title={`${isFinal ? '最终' : '节点'} · 预计第${n.etaDay}天`}
                  />
                  <div className="text-xs text-center mt-1 text-gray-300">{isFinal ? '终' : idx + 1}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 探索控制区域 */}
      {!scoutingUnlocked ? (
        <div className="bg-amber-900/30 border border-amber-700 text-amber-200 p-4 rounded">
          需要研究“侦察学”后才能派遣侦察兵进行探索
        </div>
      ) : (
        renderExplorationControls()
      )}
      
      {/* 冒险进度条 */}
      {renderAdventureProgress()}

      {/* 已发现位置 */}
      {renderDiscoveredLocations()}
      
      {/* 探索历史 */}
      {showHistory && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">探索历史</h3>
          {renderHistoryTab()}
        </div>
      )}
      
      {/* 攻击界面 */}
      {selectedLocation && (
        <div className="bg-gray-800 p-4 rounded-lg border-2 border-red-500">
          <h3 className="text-lg font-semibold text-white mb-4">准备攻击</h3>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-300 mb-2">选择攻击单位</h4>
            
            {availableCombatUnits.length === 0 ? (
              <p className="text-gray-400">没有可用的战斗单位</p>
            ) : (
              <div className="space-y-2">
                {availableCombatUnits.map(unit => {
                  const unitType = getUnitType(unit.typeId);
                  if (!unitType) return null;
                  
                  const isSelected = attackUnits.includes(unit.id);
                  
                  return (
                    <div
                      key={unit.id}
                      className={`p-2 rounded border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-red-500 bg-red-900/30'
                          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          setAttackUnits(prev => prev.filter(id => id !== unit.id));
                        } else {
                          setAttackUnits(prev => [...prev, unit.id]);
                        }
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-white">{unitType.name}</span>
                        <span className="text-gray-400">x{unit.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleAttackDungeon}
              disabled={attackUnits.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              确认攻击
            </button>
            
            <button
              onClick={() => {
                setSelectedLocation('');
                setAttackUnits([]);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}