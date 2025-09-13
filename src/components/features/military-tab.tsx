'use client';

import React, { useState, useEffect } from 'react';
import { MilitaryUnit, UnitType, TrainingQueue } from '../../types/military';
import { MilitarySystem } from '../../lib/military-system';
import { getUnitType, getAvailableUnitTypes } from '../../lib/military-data';
import { CombatSystem } from '../../lib/combat-system';

interface MilitaryTabProps {
  gameState: {
    resources: Record<string, number>;
    population: number;
    maxPopulation: number;
    military: {
      units: MilitaryUnit[];
      trainingQueue: TrainingQueue[];
      availableUnitTypes: string[];
      isTraining: boolean;
    };
    technologies: Record<string, any>;
  };
  onUpdateGameState: (updates: any) => void;
}

export function MilitaryTab({ gameState, onUpdateGameState }: MilitaryTabProps) {
  const [militarySystem] = useState(() => new MilitarySystem());
  const [trainingAmounts, setTrainingAmounts] = useState<Record<string, number>>({});

  // 获取已研究的科技
  const researchedTechs = gameState.technologies ? 
    Object.keys(gameState.technologies).filter(techId => 
      gameState.technologies[techId]?.researched
    ) : [];
  
  // 获取可用的兵种类型
  const availableUnitTypes = getAvailableUnitTypes(researchedTechs);
  
  // 获取当前军队
  const currentUnits = gameState.military?.units || [];
  
  // 获取训练队列
  const trainingQueue = gameState.military?.trainingQueue || [];
  
  // 计算占用人口
  const occupiedPopulation = currentUnits.reduce((total, unit) => total + (unit.assignedPopulation || 0), 0);
  
  // 计算盈余人口
  const surplusPopulation = gameState.population - occupiedPopulation;
  
  // 处理训练单位
  const handleTrainUnit = (unitTypeId: string, amount?: number) => {
    const trainingAmount = amount || trainingAmounts[unitTypeId] || 1;
    
    if (trainingAmount <= 0) return;
    
    try {
      const result = militarySystem.trainUnit(
        unitTypeId,
        trainingAmount,
        gameState.resources,
        gameState.population,
        currentUnits,
        trainingQueue
      );
      
      if (result.success) {
        onUpdateGameState({
          resources: result.updatedResources,
          population: result.updatedPopulation,
          trainingQueue: result.updatedQueue
        });
        // 重置该兵种的训练数量
        setTrainingAmounts(prev => ({ ...prev, [unitTypeId]: 1 }));
      } else {
        alert(result.error || '训练失败');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '训练失败');
    }
  };
  
  // 更新训练数量
  const updateTrainingAmount = (unitTypeId: string, amount: number) => {
    setTrainingAmounts(prev => ({ ...prev, [unitTypeId]: Math.max(1, amount) }));
  };
  
  // 处理取消训练
  const handleCancelTraining = (queueId: string) => {
    const result = militarySystem.cancelTraining(
      queueId,
      gameState.resources,
      trainingQueue
    );
    
    if (result.success) {
      onUpdateGameState({
        resources: result.updatedResources,
        trainingQueue: result.updatedQueue
      });
    }
  };
  
  // 更新训练进度
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let hasUpdates = false;
      
      const updatedQueue = trainingQueue.filter(item => {
        if (now >= item.completionTime) {
          // 训练完成
          const result = militarySystem.completeTraining(
            item,
            currentUnits,
            gameState.population
          );
          
          if (result.success) {
            onUpdateGameState({
              militaryUnits: result.updatedUnits,
              population: result.updatedPopulation
            });
            hasUpdates = true;
          }
          
          return false; // 从队列中移除
        }
        return true;
      });
      
      if (hasUpdates) {
        onUpdateGameState({ trainingQueue: updatedQueue });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [trainingQueue, currentUnits, gameState.population, militarySystem, onUpdateGameState]);
  
  return (
    <div className="space-y-6">
      {/* 人口状况 */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">人口状况</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-300">当前人口</div>
            <div className="text-xl font-bold text-white">{gameState.population}</div>
          </div>
          <div>
            <div className="text-sm text-gray-300">盈余人口</div>
            <div className="text-xl font-bold text-green-400">{surplusPopulation}</div>
          </div>
        </div>
      </div>

      {/* 可训练军事单位 */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">可训练军事单位</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableUnitTypes.map(unitType => {
            const trainingAmount = trainingAmounts[unitType.id] || 1;
            
            return (
              <div key={unitType.id} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{unitType.name}</h4>
                    <p className="text-sm text-gray-400">{unitType.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-300">战斗力</div>
                    <div className="text-lg font-bold text-blue-400">{unitType.combatPower}</div>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-3">{unitType.description}</p>
                
                {/* 招募成本 */}
                <div className="mb-4">
                  <h5 className="font-medium text-gray-300 mb-2">招募成本</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(unitType.recruitmentCost).map(([resource, cost]) => (
                      <div key={resource} className="text-gray-400">
                        {resource}: {cost}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 训练控制 */}
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max={surplusPopulation}
                    value={trainingAmount}
                    onChange={(e) => updateTrainingAmount(unitType.id, parseInt(e.target.value) || 1)}
                    className="w-20 px-2 py-1 bg-gray-700 text-white border border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleTrainUnit(unitType.id)}
                    disabled={surplusPopulation < trainingAmount}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    训练 {trainingAmount} 个
                  </button>
                  <button
                    onClick={() => handleTrainUnit(unitType.id, 1)}
                    disabled={surplusPopulation < 1}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    +1
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 训练队列 */}
      {trainingQueue.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">训练队列</h3>
          <div className="space-y-3">
            {trainingQueue.map(item => {
              const unitType = getUnitType(item.unitTypeId);
              if (!unitType) return null;
              
              const now = Date.now();
              const totalTime = item.completionTime - item.startTime;
              const elapsedTime = now - item.startTime;
              const progress = Math.min(100, (elapsedTime / totalTime) * 100);
              const remainingTime = Math.max(0, item.completionTime - now);
              
              return (
                <div key={item.id} className="bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-white font-medium">{unitType.name}</h4>
                      <p className="text-gray-400 text-sm">训练数量: {item.count}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-300">剩余时间</div>
                      <div className="text-white font-medium">
                        {Math.ceil(remainingTime / 1000)}秒
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-300 mb-1">
                      <span>训练进度</span>
                      <span>{Math.floor(progress)}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleCancelTraining(item.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-1 rounded text-sm font-medium transition-colors"
                  >
                    取消训练
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}