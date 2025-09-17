'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/game-store';
import { saveGameState, loadGameState, hasSavedGame } from '@/lib/persistence';
import { saveGameStateEnhanced, loadGameStateEnhanced, hasSavedGameEnhanced, getSaveInfoEnhanced, clearAllSaveData } from '@/lib/enhanced-persistence';

export default function TestPersistence() {
  const gameStore = useGameStore();
  const {
    gameState,
    uiState,
    army,
    addResources,
    saveGame,
    loadGame,
    initializePersistence
  } = gameStore;
  
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  useEffect(() => {
    initializePersistence();
    setIsInitialized(true);
    addResult('🚀 持久化测试页面已加载');
    testHasSaved();
  }, [initializePersistence]);
  
  const handleAddGold = () => {
    addResources({ currency: 100 });
    addResult('💰 添加了100金币');
  };
  
  const handleSave = () => {
    saveGame();
    addResult('💾 调用了saveGame()方法');
  };
  
  const handleLoad = () => {
    const result = loadGame();
    addResult(`📂 调用了loadGame()方法，结果: ${result ? '成功' : '失败'}`);
  };
  
  const testDirectSave = async () => {
    setIsLoading(true);
    try {
      // 修改一些游戏状态
      addResources({ currency: 1000, food: 500 });
      
      // 直接保存到localStorage
      const success = saveGameState({
        gameState,
        uiState,
        army,
        isRunning: false,
        lastUpdateTime: Date.now()
      });
      
      if (success) {
        addResult('✅ 直接保存到localStorage成功');
      } else {
        addResult('❌ 直接保存到localStorage失败');
      }
    } catch (error) {
      addResult(`❌ 直接保存错误: ${error}`);
    }
    setIsLoading(false);
  };

  const testDirectLoad = async () => {
    setIsLoading(true);
    try {
      const savedData = loadGameState();
      if (savedData) {
        addResult('✅ 直接从localStorage加载成功');
        addResult(`数据: 金币=${savedData.gameState.resources.currency}, 食物=${savedData.gameState.resources.food}`);
      } else {
        addResult('❌ 直接从localStorage加载失败 - 没有找到保存的数据');
      }
    } catch (error) {
      addResult(`❌ 直接加载错误: ${error}`);
    }
    setIsLoading(false);
  };

  const testHasSaved = () => {
    const hasSaved = hasSavedGame();
    addResult(`检查保存状态: ${hasSaved ? '有保存数据' : '无保存数据'}`);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const clearSavedData = () => {
    localStorage.removeItem('civilization-game-save');
    addResult('🗑️ 已清除localStorage中的保存数据');
  };

  const testEnhancedPersistence = () => {
    addResult('开始测试增强持久化功能...');
    
    try {
      // 测试保存
      const success = saveGameStateEnhanced(gameState, uiState, army);
      addResult(`增强保存测试: ${success ? '成功' : '失败'}`);
      
      // 测试加载
      const loadedData = loadGameStateEnhanced();
      addResult(`增强加载测试: ${loadedData ? '成功' : '失败'}`);
      
      // 测试保存信息
      const saveInfo = getSaveInfoEnhanced();
      addResult(`保存信息: 主存储${saveInfo.main ? '存在' : '不存在'}, 备份数量: ${saveInfo.backups.length}`);
      
      // 测试检查功能
      const hasData = hasSavedGameEnhanced();
      addResult(`数据检查: ${hasData ? '有效数据存在' : '无有效数据'}`);
      
      addResult('增强持久化测试完成');
    } catch (error) {
      addResult(`增强持久化测试失败: ${error}`);
    }
  };

  const clearAllEnhancedData = () => {
    clearAllSaveData();
    addResult('🗑️ 已清除所有增强持久化数据');
  };

  const inspectLocalStorage = () => {
    const keys = Object.keys(localStorage);
    addResult(`🔍 localStorage中的所有键: ${keys.join(', ')}`);
    
    const gameData = localStorage.getItem('civilization-game-save');
    if (gameData) {
      try {
        const parsed = JSON.parse(gameData);
        addResult(`📊 保存数据大小: ${gameData.length} 字符`);
        addResult(`📊 保存数据结构: ${Object.keys(parsed).join(', ')}`);
      } catch (e) {
        addResult(`❌ 保存数据解析失败: ${e}`);
      }
    } else {
      addResult('📊 localStorage中没有游戏保存数据');
    }
  };
  
  if (!isInitialized) {
    return <div className="p-8">初始化中...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">持久化功能测试</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 游戏状态 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">当前游戏状态</h2>
            <div className="space-y-2 text-sm">
              <p>金币: {gameState.resources.currency}</p>
              <p>食物: {gameState.resources.food}</p>
              <p>木材: {gameState.resources.wood}</p>
              <p>石材: {gameState.resources.stone}</p>
              <p>人口: {gameState.resources.population}/{gameState.resourceLimits.population}</p>
            </div>
            
            <div className="mt-4 space-y-2">
              <button
                onClick={handleAddGold}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm"
              >
                添加100金币
              </button>
            </div>
          </div>
          
          {/* 测试控制 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">测试控制</h2>
            
            <div className="space-y-3">
              <div>
                <h3 className="font-medium mb-2">游戏Store方法</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleSave}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
                  >
                    saveGame()
                  </button>
                  
                  <button
                    onClick={handleLoad}
                    className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"
                  >
                    loadGame()
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">直接localStorage操作</h3>
                <div className="space-y-2">
                  <button
                    onClick={testDirectSave}
                    disabled={isLoading}
                    className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm"
                  >
                    直接保存
                  </button>
                  
                  <button
                    onClick={testDirectLoad}
                    disabled={isLoading}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm"
                  >
                    直接加载
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">增强持久化测试</h3>
                <div className="space-y-2">
                  <button
                    onClick={testEnhancedPersistence}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-sm"
                  >
                    测试增强持久化
                  </button>
                  
                  <button
                    onClick={clearAllEnhancedData}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
                  >
                    清除增强数据
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">工具方法</h3>
                <div className="space-y-2">
                  <button
                    onClick={testHasSaved}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm"
                  >
                    检查保存状态
                  </button>
                  
                  <button
                    onClick={inspectLocalStorage}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded text-sm"
                  >
                    检查localStorage
                  </button>
                  
                  <button
                    onClick={clearSavedData}
                    className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
                  >
                    清除保存数据
                  </button>
                  
                  <button
                    onClick={clearResults}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
                  >
                    清除测试结果
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* 测试结果 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">测试结果</h2>
            
            <div className="bg-black text-green-400 p-4 rounded font-mono text-xs h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-gray-500">等待测试结果...</div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg inline-block"
          >
            返回游戏
          </a>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">测试说明</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">持久化问题诊断步骤：</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>点击"添加100金币"按钮几次，观察金币数量变化</li>
                <li>点击"直接保存"按钮，检查是否成功保存到localStorage</li>
                <li>点击"检查localStorage"按钮，查看保存的数据</li>
                <li>刷新页面，观察游戏状态是否恢复</li>
                <li>如果状态没有恢复，点击"直接加载"按钮手动加载</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">预期行为：</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>每10秒应该自动保存游戏状态</li>
                <li>刷新页面后应该自动加载保存的状态</li>
                <li>localStorage中应该有'civilization-game-save'键</li>
                <li>保存的数据应该包含完整的游戏状态</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}