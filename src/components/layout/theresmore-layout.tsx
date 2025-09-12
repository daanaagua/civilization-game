'use client';

import React, { useState } from 'react';
import { useGameStore, useAchievementStore } from '@/lib/game-store';
import { formatNumber, formatTime } from '@/lib/utils';
import { RebirthConfirmation } from '@/components/ui/rebirth-confirmation';
import { Tooltip } from '@/components/ui/tooltip';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { ResourceItem } from '@/components/ui/resource-item';
import { StatusDetailsTooltip } from '@/components/ui/status-details-tooltip';
import {
  Users, Clock, Trophy, Zap, Shield, Beaker, Sword, Map,
  Settings, BarChart3, TrendingUp, Star, Gift, AlertTriangle,
  ChevronRight, X, Info
} from 'lucide-react';

// 稳定度效果计算
const getStabilityEffect = (stability: number): string => {
  if (stability >= 80) return '人口增长 +20%，资源产出 +10%';
  if (stability >= 60) return '人口增长 +10%，资源产出 +5%';
  if (stability >= 40) return '正常状态';
  if (stability >= 20) return '人口增长 -10%，资源产出 -5%';
  return '人口增长 -20%，资源产出 -10%';
};

// 腐败度效果计算
const getCorruptionEffect = (corruption: number): string => {
  if (corruption > 90) return '资源产出 -60%，建筑成本 +100%';
  if (corruption > 75) return '资源产出 -40%，建筑成本 +50%';
  if (corruption > 50) return '资源产出 -25%，建筑成本 +20%';
  if (corruption > 25) return '资源产出 -10%，无建筑成本影响';
  return '无负面影响';
};

// 资源面板
const ResourcesPanel = () => {
  const { gameState } = useGameStore();
  const { resources, resourceRates } = gameState;

  const resourceList = [
    { key: 'food', name: '食物', icon: '🌾', color: 'text-green-400' },
    { key: 'wood', name: '木材', icon: '🪵', color: 'text-amber-600' },
    { key: 'stone', name: '石材', icon: '🪨', color: 'text-gray-400' },
    { key: 'metal', name: '金属', icon: '⚙️', color: 'text-blue-400' },
    { key: 'knowledge', name: '知识', icon: '📚', color: 'text-purple-400' },
    { key: 'culture', name: '文化', icon: '🎭', color: 'text-pink-400' },
    { key: 'faith', name: '信仰', icon: '⛪', color: 'text-yellow-400' },
    { key: 'influence', name: '影响力', icon: '👑', color: 'text-red-400' }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">资源管理</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {resourceList.map((resource) => {
          const amount = resources[resource.key as keyof typeof resources] || 0;
          const rate = resourceRates[resource.key as keyof typeof resourceRates] || 0;
          
          return (
            <div key={resource.key} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{resource.icon}</span>
                <span className={`text-sm font-medium ${resource.color}`}>{resource.name}</span>
              </div>
              <div className="text-2xl font-bold text-gray-100 mb-1">
                {formatNumber(amount)}
              </div>
              <div className={`text-sm ${
                rate > 0 ? 'text-green-400' : rate < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {rate > 0 ? '+' : ''}{formatNumber(rate)}/秒
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 建筑面板
const BuildingsPanel = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">建筑系统</h2>
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-4">🏗️</div>
          <p>建筑系统开发中...</p>
        </div>
      </div>
      
      {/* 详细效果弹窗 */}
      {showDetailedEffects && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-100">详细效果</h2>
              <button
                onClick={() => setShowDetailedEffects(false)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* 稳定度详细信息 */}
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  稳定度效果 ({gameState.stability}%)
                </h3>
                <p className="text-gray-300 mb-2">{getStabilityEffect(gameState.stability)}</p>
                <div className="text-sm text-gray-400">
                  <p>• 高稳定度(80%+): 人口增长和资源产出获得显著加成</p>
                  <p>• 中等稳定度(40-79%): 轻微加成或正常状态</p>
                  <p>• 低稳定度(0-39%): 人口增长和资源产出受到负面影响</p>
                </div>
              </div>
              
              {/* 腐败度详细信息 */}
              {gameState.technologies['legal_code']?.researched && (
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    腐败度效果 ({gameState.corruption}%)
                  </h3>
                  <p className="text-gray-300 mb-2">{getCorruptionEffect(gameState.corruption)}</p>
                  <div className="text-sm text-gray-400">
                    <p>• 低腐败度(0-25%): 无负面影响</p>
                    <p>• 轻度腐败(26-50%): 资源产出 -10%</p>
                    <p>• 中度腐败(51-75%): 资源产出 -25%，建筑成本 +20%</p>
                    <p>• 高度腐败(76-90%): 资源产出 -40%，建筑成本 +50%</p>
                    <p>• 极度腐败(91-100%): 资源产出 -60%，建筑成本 +100%</p>
                  </div>
                </div>
              )}
              
              {/* 所有Buff详细信息 */}
              {buffSummary.sources.length > 0 && (
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    所有活跃效果
                  </h3>
                  <div className="space-y-3">
                    {buffSummary.sources.map((source, index) => (
                      <div key={index} className="bg-gray-800 p-3 rounded-lg border border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-200 font-medium">{source.name}</span>
                          <span className="text-xs text-gray-400 px-2 py-1 bg-gray-700 rounded">
                            {source.type === 'technology' ? '科技' : 
                             source.type === 'building' ? '建筑' : 
                             source.type === 'character' ? '人物' : 
                             source.type === 'inheritance' ? '继承' : '其他'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {source.buffs.map((buff, buffIndex) => (
                            <div key={buffIndex} className="text-sm text-gray-300 bg-purple-900/20 px-2 py-1 rounded border border-purple-500/20">
                              <span className="font-medium text-purple-300">{buff.name}</span>
                              {buff.description && (
                                <span className="text-gray-400 ml-2">- {buff.description}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 科技面板
const TechnologyPanel = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">科技树</h2>
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-4">🔬</div>
          <p>科技系统开发中...</p>
        </div>
      </div>
    </div>
  );
};

// 军事面板
const MilitaryPanel = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">军事力量</h2>
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-4">⚔️</div>
          <p>军事系统开发中...</p>
        </div>
      </div>
    </div>
  );
};

// 探索面板
const ExplorationPanel = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">世界探索</h2>
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-4">🗺️</div>
          <p>探索系统开发中...</p>
        </div>
      </div>
    </div>
  );
};

// 概览面板
const OverviewPanel = () => {
  const { gameState, getBuffSummary, handlePauseEventChoice, clearRecentEvents } = useGameStore();
  const { resources, resourceRates } = gameState;
  const [showAchievements, setShowAchievements] = useState(false);
  const [showBuffDetails, setShowBuffDetails] = useState(false);
  const [showEventHistory, setShowEventHistory] = useState(false);
  const [showDetailedEffects, setShowDetailedEffects] = useState(false);

  const buffSummary = getBuffSummary();

  const stats = [
    {
      name: '游戏时间',
      value: formatTime(gameState.gameTime),
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-500/50'
    },
    {
      name: '人口',
      value: formatNumber(gameState.population, 0), // 人口显示为整数
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-500/50'
    },
    {
      name: '解锁成就',
      value: `${gameState.achievements?.filter(a => a.unlocked).length || 0}/${gameState.achievements?.length || 0}`,
      icon: Trophy,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-500/50'
    }
  ];

  const resourceStats = [
    {
      name: '科技进度',
      current: Object.values(gameState.technologies).filter(t => t.researched).length,
      total: Object.keys(gameState.technologies).length,
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-100 mb-2">文明概览</h1>
        <p className="text-gray-400">从远古时代到现代科技，见证文明的伟大历程</p>
      </div>

      {/* 核心统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isAchievement = stat.name === '解锁成就';
          return (
            <div 
              key={stat.name} 
              className={`p-4 rounded-lg border-2 ${stat.bgColor} ${stat.borderColor} ${
                isAchievement ? 'cursor-pointer hover:bg-gray-700 transition-colors' : ''
              }`}
              onClick={isAchievement ? () => setShowAchievements(true) : undefined}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{stat.name}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 进度统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resourceStats.map((stat) => {
          const progress = (stat.current / stat.total) * 100;
          return (
            <div key={stat.name} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 font-medium">{stat.name}</span>
                <span className={`text-sm ${stat.color}`}>
                  {stat.current}/{stat.total}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    stat.color === 'text-amber-400' ? 'bg-amber-400' : 'bg-purple-400'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          );
        })}      </div>

      {/* 当前效果栏 */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-400" />
            当前效果
          </h3>
          <button
            onClick={() => setShowDetailedEffects(true)}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
          >
            <Info className="h-4 w-4" />
            详细效果
          </button>
        </div>
        
        {/* 稳定度和腐败度标签 */}
        <div className="flex gap-4 mb-4">
          <StatusDetailsTooltip statusType="stability">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-900/30 border border-green-500/30 rounded-lg cursor-help">
              <Shield className="h-4 w-4 text-green-400" />
              <span className="text-green-300 text-sm font-medium">稳定度</span>
              <span className="text-green-200 text-sm">{gameState.stability}%</span>
            </div>
          </StatusDetailsTooltip>
          
          {gameState.technologies['legal_code']?.researched && (
            <StatusDetailsTooltip statusType="corruption">
              <div className="flex items-center gap-2 px-3 py-2 bg-red-900/30 border border-red-500/30 rounded-lg cursor-help">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-red-300 text-sm font-medium">腐败度</span>
                <span className="text-red-200 text-sm">{gameState.corruption}%</span>
              </div>
            </StatusDetailsTooltip>
          )}
        </div>
        
        {buffSummary.sources.length > 0 && (
          <div className="space-y-3">
            {buffSummary.sources.map((source, index) => (
              <div key={index} className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 font-medium">{source.name}</span>
                  <span className="text-xs text-gray-400 px-2 py-1 bg-gray-700 rounded">
                    {source.type === 'technology' ? '科技' : 
                     source.type === 'building' ? '建筑' : 
                     source.type === 'character' ? '人物' : 
                     source.type === 'inheritance' ? '继承' : '其他'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {source.buffs.map((buff, buffIndex) => (
                    <div key={buffIndex} className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
                      {buff.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 事件栏 */}
      <div className="space-y-4">
        {/* 暂停事件 */}
        {gameState.pauseEvents && gameState.pauseEvents.length > 0 && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              需要处理的事件
            </h3>
            <div className="space-y-3">
              {gameState.pauseEvents.map((event) => (
                <div key={event.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <h4 className="font-semibold text-gray-100 mb-2">{event.title}</h4>
                  <p className="text-gray-300 mb-3">{event.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {event.choices.map((choice, index) => (
                      <button
                        key={index}
                        onClick={() => handlePauseEventChoice(event.id, index)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        {choice.text}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 不暂停事件历史 */}
        {gameState.recentEvents && gameState.recentEvents.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-400" />
                最近事件
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEventHistory(!showEventHistory)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {showEventHistory ? '收起' : '展开'}
                </button>
                <button
                  onClick={clearRecentEvents}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  清空
                </button>
              </div>
            </div>
            {showEventHistory && (
              <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                {gameState.recentEvents.map((event) => (
                  <div key={event.id} className="text-sm text-gray-300 p-2 bg-gray-900 rounded">
                    <span className="text-blue-400">[{formatTime(event.timestamp)}]</span> {event.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buff详情弹窗 */}
      {showBuffDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowBuffDetails(false)}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                <Zap className="h-6 w-6 text-purple-400" />
                活跃效果详情
              </h2>
              <button 
                onClick={() => setShowBuffDetails(false)}
                className="text-gray-400 hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(buffSummary.totalEffects).map(([type, value]) => {
                if (value === 0) return null;
                const effectNames: Record<string, string> = {
                  resourceProduction: '资源产出',
                  populationGrowth: '人口增长',
                  researchSpeed: '研究速度',
                  stability: '稳定度',
                  corruption: '腐败度',
                  militaryPower: '军事力量'
                };
                return (
                  <div key={type} className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-medium">{effectNames[type] || type}</span>
                      <span className={`font-bold text-lg ${
                        value > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {value > 0 ? '+' : ''}{value}%
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {Object.keys(buffSummary.totalEffects).every(key => buffSummary.totalEffects[key as keyof typeof buffSummary.totalEffects] === 0) && (
                <div className="col-span-full text-gray-400 text-center py-4">
                  当前无活跃效果
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 成就弹窗 */}
      {showAchievements && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAchievements(false)}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-400" />
                成就系统
              </h2>
              <button 
                onClick={() => setShowAchievements(false)}
                className="text-gray-400 hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {gameState.achievements.map((achievement) => (
                <div 
                  key={achievement.id} 
                  className={`p-4 rounded-lg border ${
                    achievement.unlocked 
                      ? 'bg-yellow-900/20 border-yellow-500/50' 
                      : 'bg-gray-900 border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Trophy className={`h-5 w-5 ${
                      achievement.unlocked ? 'text-yellow-400' : 'text-gray-500'
                    }`} />
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        achievement.unlocked ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        {achievement.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {achievement.description}
                      </p>
                      {achievement.unlocked && (
                        <p className="text-xs text-green-400 mt-2">
                          ✓ 已解锁
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 设置面板
const SettingsPanel = () => {
  const { resetGame } = useGameStore();

  const handleReset = () => {
    if (window.confirm('确定要重置游戏吗？这将清除所有进度！')) {
      resetGame();
    }
  };

  const handleExportSave = () => {
    try {
      // 获取完整的游戏状态
      const gameState = useGameStore.getState();
      const achievementState = useAchievementStore.getState();
      
      const saveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        gameState: {
          gameState: gameState.gameState,
          uiState: gameState.uiState,
          army: gameState.army,
          isRunning: gameState.isRunning,
          lastUpdateTime: gameState.lastUpdateTime
        },
        achievements: achievementState.achievements
      };
      
      const jsonString = JSON.stringify(saveData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `civilization-save-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('存档已导出成功！');
    } catch (error) {
      console.error('导出存档失败:', error);
      alert('导出存档失败，请重试。');
    }
  };

  const handleImportSave = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const saveData = JSON.parse(e.target?.result as string);
          
          // 验证存档格式
          if (!saveData.gameState || !saveData.version) {
            throw new Error('无效的存档格式');
          }
          
          if (window.confirm('确定要导入此存档吗？这将覆盖当前游戏进度！')) {
            // 恢复游戏状态
            useGameStore.setState({
              gameState: saveData.gameState.gameState,
              uiState: saveData.gameState.uiState,
              army: saveData.gameState.army || {},
              isRunning: saveData.gameState.isRunning || false,
              lastUpdateTime: saveData.gameState.lastUpdateTime || Date.now()
            });
            
            // 恢复成就状态
            if (saveData.achievements) {
              useAchievementStore.setState({
                achievements: saveData.achievements
              });
            }
            
            alert('存档导入成功！');
          }
        } catch (error) {
          console.error('导入存档失败:', error);
          alert('导入存档失败，请检查文件格式是否正确。');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">游戏设置</h2>
      
      {/* 存档管理 */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-100 mb-2">存档管理</h3>
          <p className="text-gray-400 text-sm mb-4">导出存档到本地文件，或从文件导入存档</p>
          <div className="flex gap-3">
            <button
              onClick={handleExportSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              导出存档
            </button>
            <button
              onClick={handleImportSave}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              导入存档
            </button>
          </div>
        </div>
      </div>
      
      {/* 游戏控制 */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-100 mb-2">游戏控制</h3>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            重置游戏
          </button>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-100 mb-2">游戏信息</h3>
          <p className="text-gray-400">版本: 0.1.0</p>
          <p className="text-gray-400">开发者: TheresMore Team</p>
        </div>
      </div>
    </div>
  );
};

// 主内容区域
const MainContent = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', name: '概览', icon: BarChart3 },
    { id: 'resources', name: '资源', icon: TrendingUp },
    { id: 'buildings', name: '建筑', icon: Users },
    { id: 'technology', name: '科技', icon: Beaker },
    { id: 'military', name: '军事', icon: Sword },
    { id: 'exploration', name: '探索', icon: Map },
    { id: 'settings', name: '设置', icon: Settings }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPanel />;
      case 'resources':
        return <ResourcesPanel />;
      case 'buildings':
        return <BuildingsPanel />;
      case 'technology':
        return <TechnologyPanel />;
      case 'military':
        return <MilitaryPanel />;
      case 'exploration':
        return <ExplorationPanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <OverviewPanel />;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* 标签栏 */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 p-6 overflow-y-auto">
        {renderTabContent()}
      </div>
    </div>
  );
};

// 侧边栏组件
const Sidebar = () => {
  const { gameState, isRunning, togglePause, startGame, isPaused, clickResource, showRebirthConfirmation, maxPopulation } = useGameStore();
  const { resources } = gameState;

  // 稳定度效果计算
  const getStabilityEffect = (stability: number): string => {
    if (stability >= 80) return '人口增长 +20%，资源产出 +10%';
    if (stability >= 60) return '人口增长 +10%，资源产出 +5%';
    if (stability >= 40) return '正常状态';
    if (stability >= 20) return '人口增长 -10%，资源产出 -5%';
    return '人口增长 -20%，资源产出 -10%';
  };

  // 腐败度效果计算
  const getCorruptionEffect = (corruption: number): string => {
    if (corruption >= 80) return '资源产出 -30%，建筑成本 +50%';
    if (corruption >= 60) return '资源产出 -20%，建筑成本 +30%';
    if (corruption >= 40) return '资源产出 -10%，建筑成本 +15%';
    if (corruption >= 20) return '资源产出 -5%，建筑成本 +10%';
    return '无负面影响';
  };

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* 文明发展标题 */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold text-gray-100">文明发展</h1>
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
          <Clock className="h-4 w-4" />
          <span>{formatTime(gameState.gameTime)}</span>
        </div>
      </div>

      {/* 游戏控制 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={!isRunning ? startGame : togglePause}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
              !isRunning || isPaused
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {!isRunning ? '开始' : isPaused ? '继续' : '暂停'}
          </button>
          <button 
            onClick={showRebirthConfirmation}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium"
          >
            转生
          </button>
        </div>
      </div>

      {/* 资源面板 */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">资源</h2>
        <div className="space-y-2">
          <ResourceItem
            name="食物"
            value={resources.food}
            limit={gameState.resourceLimits.food}
            rate={gameState.resourceRates.food}
            tooltipContent={`食物产出详情：\n• 基础产出: +0.1/s\n• 人口消耗: -${(resources.population * 0.1).toFixed(1)}/s\n• 建筑加成: +${(Object.values(gameState.buildings).reduce((sum, count) => sum + count * 0.05, 0)).toFixed(1)}/s\n\n点击可手动收集食物`}
            onClick={() => clickResource('food')}
          />
          <ResourceItem
            name="木材"
            value={resources.wood}
            limit={gameState.resourceLimits.wood}
            rate={gameState.resourceRates.wood}
            tooltipContent={`木材产出详情：\n• 基础产出: +0.05/s\n• 工人产出: +${(gameState.workerAllocations?.woodcutter || 0) * 0.2}/s\n• 建筑加成: +${(Object.values(gameState.buildings).reduce((sum, count) => sum + count * 0.03, 0)).toFixed(1)}/s\n\n点击可手动收集木材`}
            onClick={() => clickResource('wood')}
          />
          <ResourceItem
            name="石料"
            value={resources.stone}
            limit={gameState.resourceLimits.stone}
            rate={gameState.resourceRates.stone}
            tooltipContent={`石料产出详情：\n• 基础产出: +0.03/s\n• 工人产出: +${(gameState.workerAllocations?.miner || 0) * 0.15}/s\n• 建筑加成: +${(Object.values(gameState.buildings).reduce((sum, count) => sum + count * 0.02, 0)).toFixed(1)}/s\n\n点击可手动收集石料`}
            onClick={() => clickResource('stone')}
          />
          <ResourceItem
            name="人口"
            value={resources.population}
            limit={maxPopulation}
            tooltipContent={`当前人口: ${formatNumber(resources.population, 0)}\n最大人口: ${formatNumber(maxPopulation, 0)}\n\n人口增长受住房限制影响`}
          />
        </div>
      </div>

      {/* 人口分配 */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">人口分配</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">总人口</span>
            <span className="text-sm text-white">{formatNumber(resources.population, 0)}/{formatNumber(maxPopulation, 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">可用人口</span>
            <span className="text-sm text-green-400">{formatNumber(gameState.availableWorkers || resources.population, 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">已分配人口</span>
            <span className="text-sm text-red-400">{formatNumber(resources.population - (gameState.availableWorkers || resources.population), 0)}</span>
          </div>
        </div>
      </div>

      {/* 状态 */}
      <div className="p-4 flex-1">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">状态</h2>
        <div className="space-y-3">
          <StatusIndicator
            type="stability"
            value={gameState.stability}
            getEffectDescription={getStabilityEffect}
          />
          <StatusIndicator
            type="corruption"
            value={gameState.corruption || 0}
            getEffectDescription={getCorruptionEffect}
          />
        </div>
      </div>
    </div>
  );
};

// 主布局组件
const TheresMoreLayout = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="flex h-screen">
        <Sidebar />
        <MainContent />
      </div>
      <RebirthConfirmation />
    </div>
  );
};

export default TheresMoreLayout;