'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/game-store';
import { useGameLoop } from '@/hooks/use-game-loop';
import { GameHeader } from '@/components/layout/GameHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { OverviewPanel } from '@/components/features/OverviewPanel';
import TechnologyTab from '@/components/features/technology-tab';
import { BuildingTab } from '@/components/features/building-tab';
import { MilitaryTab } from '@/components/features/military-tab';
import { ExplorationTab } from '@/components/features/exploration-tab';
import { CharacterTab } from '@/components/features/character-tab';
import { DiplomacyTab } from '@/components/features/diplomacy-tab';

export default function Home() {
  const startGame = useGameStore(state => state.startGame);
  const gameStartTime = useGameStore(state => state.gameStartTime);
  const loadGame = useGameStore(state => state.loadGame);
  const initializePersistence = useGameStore(state => state.initializePersistence);
  const gameState = useGameStore(state => state);
  const [activeTab, setActiveTab] = useState('overview');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 更新游戏状态的函数
  const handleUpdateGameState = (updates: any) => {
    // 这里可以根据需要实现状态更新逻辑
    console.log('Game state updates:', updates);
  };
  
  // 启动游戏循环
  useGameLoop();
  
  // 初始化游戏和持久化功能
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 等待一个tick确保persist中间件已经恢复状态
      const timer = setTimeout(() => {
        // 尝试加载保存的游戏状态
        const loaded = loadGame();
        if (loaded) {
          console.log('成功加载保存的游戏状态');
        } else {
          console.log('使用默认游戏状态');
        }
        
        // 初始化持久化功能（自动保存）
        initializePersistence();
        setIsInitialized(true);
        console.log('游戏初始化完成 - 每10秒自动保存');
      }, 100); // 稍微增加延迟确保persist完全恢复

      return () => clearTimeout(timer);
    }
  }, [loadGame, initializePersistence]);
  
  // 在状态恢复前显示加载状态
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🏛️</div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">文明演进</h1>
          <p className="text-stone-600">正在加载游戏状态...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPanel />;
      case 'buildings':
        return <BuildingTab />;
      case 'technology':
        return <TechnologyTab />;
      case 'military':
        return <MilitaryTab gameState={gameState} onUpdateGameState={handleUpdateGameState} />;
      case 'exploration':
        return <ExplorationTab gameState={gameState} onUpdateGameState={handleUpdateGameState} />;
      case 'characters':
        return <CharacterTab />;
      case 'diplomacy':
        return <DiplomacyTab gameState={gameState} onUpdateGameState={handleUpdateGameState} />;
      case 'settings':
        return (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">⚙️</div>
            <h2 className="text-2xl font-bold mb-2">游戏设置</h2>
            <p className="text-gray-400">设置功能开发中，敬请期待...</p>
          </div>
        );
      default:
        return <OverviewPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 游戏头部 */}
      <GameHeader />
      
      {/* 选项卡导航 */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* 主要游戏区域 */}
      <div className="flex">
        {/* 侧边栏 */}
        <Sidebar />
        
        {/* 主内容区域 */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}