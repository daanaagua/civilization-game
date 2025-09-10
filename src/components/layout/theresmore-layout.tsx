'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/game-store';
import { formatNumber, formatTime } from '@/lib/utils';
import {
  Users, Clock, Trophy, Zap, Shield, Beaker, Sword, Map,
  Settings, BarChart3, TrendingUp, Star, Gift, AlertTriangle,
  ChevronRight, X, Info
} from 'lucide-react';

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
      value: formatNumber(gameState.population),
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
    },
    {
      name: '活跃效果',
      value: Object.values(buffSummary.totalEffects).filter(v => v !== 0).length.toString(),
      icon: Zap,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
      borderColor: 'border-purple-500/50'
    }
  ];

  const resourceStats = [
    {
      name: '建筑进度',
      current: Object.values(gameState.buildings).reduce((sum, building) => sum + building.count, 0),
      total: Object.keys(gameState.buildings).length * 10,
      color: 'text-amber-400'
    },
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
        })}
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

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">游戏设置</h2>
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

// 主布局组件
const TheresMoreLayout = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="flex h-screen">
        <MainContent />
      </div>
    </div>
  );
};

export default TheresMoreLayout;