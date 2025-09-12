'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/game-store';

export default function TestPersistence() {
  const {
    resources,
    addResource,
    saveGame,
    loadGame,
    initializePersistence,
    gameStartTime
  } = useGameStore();
  
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    initializePersistence();
    setIsInitialized(true);
  }, [initializePersistence]);
  
  const handleAddGold = () => {
    addResource('gold', 100);
  };
  
  const handleSave = () => {
    saveGame();
    alert('游戏已保存！');
  };
  
  const handleLoad = () => {
    loadGame();
    alert('游戏已加载！');
  };
  
  if (!isInitialized) {
    return <div className="p-8">初始化中...</div>;
  }
  
  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">持久化功能测试</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">游戏状态</h2>
        <p>游戏开始时间: {gameStartTime}</p>
        <p>金币数量: {resources?.gold?.amount || 0}</p>
      </div>
      
      <div className="space-x-4">
        <button 
          onClick={handleAddGold}
          className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded"
        >
          添加100金币
        </button>
        
        <button 
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          手动保存
        </button>
        
        <button 
          onClick={handleLoad}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          手动加载
        </button>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">测试步骤：</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>点击"添加100金币"按钮几次</li>
          <li>刷新页面</li>
          <li>检查金币数量是否保持不变</li>
          <li>如果金币数量保持不变，说明自动保存/加载功能正常</li>
        </ol>
      </div>
    </div>
  );
}