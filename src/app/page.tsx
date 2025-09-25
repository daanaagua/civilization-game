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

import { EventModal } from '@/components/ui/event-modal';
import { isTestScoutingEnabled, setTestScoutingEnabled } from '@/lib/feature-flags';

// 新事件系统（已迁移至 '@/lib/events'）
import { enableEventsV2, pushEventV2, registerEventSourceV2 } from '@/lib/events/bootstrap';
import { getEventEngineV2 } from '@/lib/events/core';
import { createAdventureV2Source } from '@/lib/events/sources/adventure';
import { createDomesticV2Source } from '@/lib/events/sources/domestic';

export default function Home() {
  const loadGame = useGameStore(state => state.loadGame);
  const initializePersistence = useGameStore(state => state.initializePersistence);

  const gameStateStore = useGameStore(state => state);
  const activeTab = useGameStore(state => state.uiState.activeTab);
  const setActiveTab = useGameStore(state => state.setActiveTab);

  // 设置项
  const pollIntervalMs = useGameStore(state => state.gameState.settings.eventsPollIntervalMs);
  const setPollIntervalMs = useGameStore(state => state.setEventsPollIntervalMs);
  const eventsDebugEnabled = useGameStore(state => state.gameState.settings.eventsDebugEnabled);
  const setEventsDebugEnabled = useGameStore(state => state.setEventsDebugEnabled);
  const gameSpeed = useGameStore(state => state.gameState.settings.gameSpeed);
  const setGameSpeed = useGameStore(state => state.setGameSpeed);

  // 测试开关（localStorage 持久化）
  const [testScouting, setTestScouting] = useState<boolean>(isTestScoutingEnabled());
  const handleToggleTestScouting = (v: boolean) => {
    setTestScouting(v);
    setTestScoutingEnabled(v);
  };

  const [isInitialized, setIsInitialized] = useState(false);

  // 启动游戏循环
  useGameLoop();

  // 初始化事件系统 V2（一次）
  useEffect(() => {
    // 注入 zustand 的 getState/setState，保证在任何选项卡都能弹窗
    enableEventsV2(
      { getState: useGameStore.getState, setState: useGameStore.setState },
      pollIntervalMs
    );
    // 注册冒险事件源
    registerEventSourceV2(createAdventureV2Source({
      getState: useGameStore.getState,
      setState: useGameStore.setState
    }));
    // 注册境内事件源
    registerEventSourceV2(createDomesticV2Source({
      getState: useGameStore.getState,
      setState: useGameStore.setState
    }));

    // 暴露调试入口：window.eventsV2.push({kind:'choice'|'notification', ...})
    const w = (globalThis as any);
    if (w.eventsV2) {
      w.eventsV2.push = pushEventV2;
    } else {
      w.eventsV2 = {
        engine: getEventEngineV2(),
        push: pushEventV2
      };
    }
    // 这里不重启 scheduler，以保持最小侵入
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 初始化游戏与持久化（一次）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        const loaded = loadGame();
        if (loaded) {
          console.log('成功加载保存的游戏状态');
        } else {
          console.log('使用默认游戏状态');
        }
        initializePersistence();
        setIsInitialized(true);
        console.log('游戏初始化完成 —— 每 10 秒自动保存');
      }, 100);
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

  const events: any[] = [];
  const hasUnreadEvents = false;
  const markAsRead = () => {};
  const handleChoice = () => {};

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPanel events={events} onMarkAsRead={markAsRead} onChoiceSelect={handleChoice} />;
      case 'buildings':
        return <BuildingTab />;
      case 'technology':
        return <TechnologyTab />;
      case 'military':
        return (
          <MilitaryTab
            gameState={{
              resources: (gameStateStore.gameState.resources as unknown) as Record<string, number>,
              population: gameStateStore.gameState.resources.population,
              maxPopulation: gameStateStore.gameState.resourceLimits.population,
              military: gameStateStore.gameState.military,
              technologies: gameStateStore.gameState.technologies,
            }}
            onUpdateGameState={() => {}}
          />
        );
      case 'exploration':
        return (
          <ExplorationTab
            gameState={{
              resources: (gameStateStore.gameState.resources as unknown) as Record<string, number>,
              population: gameStateStore.gameState.resources.population,
              maxPopulation: gameStateStore.gameState.resourceLimits.population,
              military: gameStateStore.gameState.military,
              exploration: gameStateStore.gameState.exploration,
            }}
            onUpdateGameState={() => {}}
          />
        );
      case 'characters':
        return <CharacterTab />;
      case 'diplomacy':
        return <DiplomacyTab gameState={gameStateStore.gameState} onUpdateGameState={() => {}} />;
      case 'settings':
        return (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">⚙️</div>
              <div>
                <h2 className="text-2xl font-bold">游戏设置</h2>
                <p className="text-gray-400 text-sm">调整事件系统与运行参数</p>
              </div>
            </div>

            {/* 事件轮询频率设置 */}
            <div className="mb-8">
              <label htmlFor="poll-interval" className="block text-sm font-medium text-gray-300 mb-2">
                事件轮询频率（毫秒）
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="poll-interval"
                  type="range"
                  min={200}
                  max={10000}
                  step={100}
                  value={pollIntervalMs}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setPollIntervalMs(Number.isFinite(v) ? v : 1000);
                  }}
                  className="w-full accent-amber-500"
                />
                <input
                  type="number"
                  min={200}
                  max={10000}
                  step={100}
                  value={pollIntervalMs}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setPollIntervalMs(Number.isFinite(v) ? v : 1000);
                  }}
                  className="w-28 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-right"
                />
                <span className="text-gray-400 text-sm">200 - 10000</span>
              </div>
              <p className="text-gray-400 text-xs mt-2">数值越小检查频率越高（更实时，略增开销）；数值越大检查频率越低（更省电）。</p>
            </div>

            {/* 事件调试日志开关 */}
            <div className="mb-6">
              <label htmlFor="events-debug" className="inline-flex items-center gap-3 cursor-pointer select-none">
                <input
                  id="events-debug"
                  type="checkbox"
                  checked={eventsDebugEnabled}
                  onChange={(e) => setEventsDebugEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-300">启用事件系统调试日志</span>
              </label>
              <p className="text-gray-400 text-xs mt-1">开启后将输出境内事件触发计算与实际触发记录，便于排查问题。</p>
            </div>

            {/* 游戏速度 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">游戏速度</label>
              <div className="flex items-center gap-2">
                {[1, 5, 10, 50].map(sp => (
                  <button
                    key={sp}
                    onClick={() => setGameSpeed(sp)}
                    className={`px-3 py-1 rounded text-sm ${gameSpeed === sp ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                  >
                    {sp}x
                  </button>
                ))}
                <span className="text-gray-400 text-sm ml-2">当前：{gameSpeed}x</span>
              </div>
            </div>

            {/* 测试开关 */}
            <div className="mb-2">
              <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={testScouting}
                  onChange={(e) => handleToggleTestScouting(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-300">开局自动研究“侦察学”并赠送一名斥候（测试）</span>
              </label>
              <p className="text-gray-400 text-xs mt-1">此项需新开一局或重置后生效。</p>
            </div>
          </div>
        );
      default:
        return <OverviewPanel events={events} onMarkAsRead={markAsRead} onChoiceSelect={handleChoice} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 游戏头部 */}
      <GameHeader />

      {/* 选项卡导航 */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasUnreadEvents={hasUnreadEvents}
      />

      {/* 主要游戏区域 */}
      <div className="flex">
        {/* 侧边栏 */}
        <Sidebar />

        {/* 主内容区域 */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>

      {/* 中央暂停事件弹窗 */}
      <EventModal />
    </div>
  );
}