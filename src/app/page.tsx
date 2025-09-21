'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/game-store';
import { useGameLoop } from '@/hooks/use-game-loop';
import { useEvents } from '@/hooks/use-events';
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
import { EventNotificationToast } from '@/components/ui/event-notification-toast';
import { EventType, type GameEvent } from '@/components/features/EventsPanel';
import { isTestScoutingEnabled, setTestScoutingEnabled } from '@/lib/feature-flags';

export default function Home() {
  const startGame = useGameStore(state => state.startGame);
  // 移除不存在的 gameStartTime 选择器
  const loadGame = useGameStore(state => state.loadGame);
  const initializePersistence = useGameStore(state => state.initializePersistence);
  const pauseGame = useGameStore(state => state.pauseGame);
  const resumeGame = useGameStore(state => state.resumeGame);
  const gameState = useGameStore(state => state);
  // 新增：订阅设置值与对应的 setter，确保受控组件实时更新
  const pollIntervalMs = useGameStore(state => state.gameState.settings.eventsPollIntervalMs);
  const setPollIntervalMs = useGameStore(state => state.setEventsPollIntervalMs);
  const eventsDebugEnabled = useGameStore(state => state.gameState.settings.eventsDebugEnabled);
  const setEventsDebugEnabled = useGameStore(state => state.setEventsDebugEnabled);
  // 游戏速度
  const gameSpeed = useGameStore(state => state.gameState.settings.gameSpeed);
  const setGameSpeed = useGameStore(state => state.setGameSpeed);
  // 测试开关（localStorage 持久化）
  const [testScouting, setTestScouting] = useState<boolean>(isTestScoutingEnabled());
  const handleToggleTestScouting = (v: boolean) => {
    setTestScouting(v);
    setTestScoutingEnabled(v);
  };
  // 使用全局的 activeTab 与 setActiveTab，避免与其它组件（如 GameHeader）脱节
  const activeTab = useGameStore(state => state.uiState.activeTab);
  const setActiveTab = useGameStore(state => state.setActiveTab);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentNotificationEvent, setCurrentNotificationEvent] = useState<GameEvent | null>(null);
  const [hasUnreadEvents, setHasUnreadEvents] = useState(false);
  const [lastEventCount, setLastEventCount] = useState(0);
  
  // 使用事件系统（单例来源）
  const { events, markAsRead, handleChoice, getUnresolvedChoiceEvents, clearAllEvents } = useEvents();
  
  // 启动游戏循环
  useGameLoop();

  // 监听 GAME_RESET 清空历史事件与UI提示
  useEffect(() => {
    const handler = () => {
      try {
        clearAllEvents();
      } catch (e) {
        console.warn('清空事件时出错:', e);
      }
      setCurrentNotificationEvent(null);
      setHasUnreadEvents(false);
      setLastEventCount(0);
    };
    window.addEventListener('GAME_RESET' as any, handler as any);
    return () => window.removeEventListener('GAME_RESET' as any, handler as any);
  }, [clearAllEvents]);
  
  // 监听新事件并显示通知
  useEffect(() => {
    if (events.length > lastEventCount && isInitialized) {
      const newEvents = events.slice(0, events.length - lastEventCount);
      const latestEvent = newEvents[0];
      if (latestEvent) {
        setCurrentNotificationEvent(latestEvent);
        if (activeTab !== 'overview') setHasUnreadEvents(true);
        if (latestEvent.type === EventType.CHOICE) {
          pauseGame();
        }
      }
    }
    setLastEventCount(events.length);
  }, [events.length, lastEventCount, isInitialized, activeTab, pauseGame]);
  
  // 监听选择事件的解决状态，解决后允许用户继续
  useEffect(() => {
    const unresolvedChoiceEvents = getUnresolvedChoiceEvents();
    if (unresolvedChoiceEvents.length > 0 && !gameState.gameState.isPaused && isInitialized) {
      pauseGame();
    }
    // 如果没有未解决的选择事件且当前是暂停状态，则不强制保持暂停
    // 让用户点击继续按钮可以恢复
  }, [events, getUnresolvedChoiceEvents, gameState.gameState.isPaused, isInitialized, pauseGame]);

  // 新增：当当前通知事件被解决或从列表中移除时，自动关闭通知浮窗
  useEffect(() => {
    if (!currentNotificationEvent) return;
    const latest = events.find(e => e.id === currentNotificationEvent.id);
    // 事件被移除或已解决 -> 关闭通知
    if (!latest || (latest.type === EventType.CHOICE && latest.isResolved)) {
      setCurrentNotificationEvent(null);
    }
  }, [events, currentNotificationEvent]);
  // 切换到概览选项卡时清除红点
  useEffect(() => {
    if (activeTab === 'overview') {
      setHasUnreadEvents(false);
    }
  }, [activeTab]);
  
  // 初始化游戏和持久化功能
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
        console.log('游戏初始化完成 - 每10秒自动保存');
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
              resources: (gameState.gameState.resources as unknown) as Record<string, number>,
              population: gameState.gameState.resources.population,
              maxPopulation: gameState.gameState.resourceLimits.population,
              military: gameState.gameState.military,
              technologies: gameState.gameState.technologies,
            }}
            onUpdateGameState={() => {}}
          />
        );
      case 'exploration':
        return (
          <ExplorationTab
            gameState={{
              resources: (gameState.gameState.resources as unknown) as Record<string, number>,
              population: gameState.gameState.resources.population,
              maxPopulation: gameState.gameState.resourceLimits.population,
              military: gameState.gameState.military,
              exploration: gameState.gameState.exploration,
            }}
            onUpdateGameState={() => {}}
          />
        );
      case 'characters':
        return <CharacterTab />;
      case 'diplomacy':
        return <DiplomacyTab gameState={gameState.gameState} onUpdateGameState={() => {}} />;
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
              <p className="text-gray-400 text-xs mt-2">数值越小，检查频率越高（更实时，略增开销）；数值越大，检查频率越低（更省电）。</p>
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
              <p className="text-gray-400 text-xs mt-1">开启后将输出境内事件触发计算（概率、时间间隔）与实际触发记录，便于排查问题。</p>
            </div>

            {/* 游戏速度 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">游戏速度</label>
              <div className="flex items-center gap-2">
                {[1,5,10,50].map(sp => (
                  <button
                    key={sp}
                    onClick={() => setGameSpeed(sp)}
                    className={`px-3 py-1 rounded text-sm ${gameSpeed===sp ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
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
                <span className="text-sm text-gray-300">开局自动研究“侦察学”并赠送3名斥候（测试）</span>
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
      
      {/* 事件通知浮框 */}
      <EventNotificationToast
        event={currentNotificationEvent}
        onClose={() => setCurrentNotificationEvent(null)}
        onViewEvent={() => {
          setActiveTab('overview');
          setCurrentNotificationEvent(null);
          setHasUnreadEvents(false);
        }}
      />
    </div>
  );
}