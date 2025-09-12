'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/game-store';
import { useGameLoop } from '@/hooks/use-game-loop';
import { GameHeader } from '@/components/layout/GameHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { OverviewPanel } from '@/components/features/OverviewPanel';

export default function Home() {
  const startGame = useGameStore(state => state.startGame);
  const gameStartTime = useGameStore(state => state.gameStartTime);
  const initializePersistence = useGameStore(state => state.initializePersistence);
  const loadGame = useGameStore(state => state.loadGame);
  const [activeTab, setActiveTab] = useState('overview');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 启动游戏循环
  useGameLoop();
  
  // 初始化游戏和持久化功能
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 等待一个tick确保persist中间件已经恢复状态
      const timer = setTimeout(() => {
        // 先尝试加载保存的游戏状态
        loadGame();
        // 然后启动游戏
        startGame();
        // 最后初始化持久化功能（自动保存等）
        initializePersistence();
        setIsInitialized(true);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [startGame, initializePersistence, loadGame]);
  
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
        return (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🏗️</div>
            <h2 className="text-2xl font-bold mb-2">建筑系统</h2>
            <p className="text-gray-400">建筑功能开发中，敬请期待...</p>
          </div>
        );
      case 'technology':
        return (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🔬</div>
            <h2 className="text-2xl font-bold mb-2">科技系统</h2>
            <p className="text-gray-400">科技功能开发中，敬请期待...</p>
          </div>
        );
      case 'military':
        return (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">⚔️</div>
            <h2 className="text-2xl font-bold mb-2">军队系统</h2>
            <p className="text-gray-400">军队功能开发中，敬请期待...</p>
          </div>
        );
      case 'exploration':
        return (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2">探索系统</h2>
            <p className="text-gray-400">探索功能开发中，敬请期待...</p>
          </div>
        );
      case 'characters':
        return (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">👥</div>
            <h2 className="text-2xl font-bold mb-2">人物系统</h2>
            <p className="text-gray-400">人物功能开发中，敬请期待...</p>
          </div>
        );
      case 'diplomacy':
        return (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🤝</div>
            <h2 className="text-2xl font-bold mb-2">外交系统</h2>
            <p className="text-gray-400">外交功能开发中，敬请期待...</p>
          </div>
        );
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