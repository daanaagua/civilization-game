'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameEvent, EventType, EventPriority, EventChoice } from '@/components/features/EventsPanel';
import { EventSystemManager, createEventSystem, EVENT_SYSTEM_VERSION } from '@/lib/event-system';
import { useGameStore } from '@/lib/game-store';
import { addTemporaryEffect, createTemporaryEffectFromEventChoice } from '@/lib/temporary-effects';

// 历史事件存储键
const EVENTS_STORAGE_KEY = 'civilization-game-events-history';
const EVENTS_VERSION = 1;

interface EventsStorageData {
  version: number;
  timestamp: number;
  events: GameEvent[];
  eventIdCounter: number;
}

// 保存历史事件到localStorage
function saveEventsToStorage(events: GameEvent[], eventIdCounter: number): boolean {
  try {
    const storageData: EventsStorageData = {
      version: EVENTS_VERSION,
      timestamp: Date.now(),
      events: events,
      eventIdCounter: eventIdCounter
    };
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(storageData));
    console.log('历史事件已保存到本地存储');
    return true;
  } catch (error) {
    console.error('保存历史事件失败:', error);
    return false;
  }
}

// 从localStorage加载历史事件
function loadEventsFromStorage(): { events: GameEvent[], eventIdCounter: number } | null {
  try {
    const savedData = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!savedData) {
      console.log('没有找到保存的历史事件数据');
      return null;
    }
    
    const parsed: EventsStorageData = JSON.parse(savedData);
    
    // 版本检查
    if (parsed.version !== EVENTS_VERSION) {
      console.warn('历史事件数据版本不匹配，将使用默认状态');
      return null;
    }
    
    console.log('历史事件已从本地存储加载', new Date(parsed.timestamp).toLocaleString());
    return {
      events: parsed.events || [],
      eventIdCounter: parsed.eventIdCounter || 1
    };
  } catch (error) {
    console.error('加载历史事件失败:', error);
    return null;
  }
}

// 事件管理Hook
export function useEvents() {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [eventIdCounter, setEventIdCounter] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const gameState = useGameStore(state => state.gameState);
  // 新增：从设置读取事件轮询间隔（毫秒），默认 1000ms
  const pollInterval = useGameStore(state => state.gameState?.settings?.eventsPollIntervalMs ?? 1000);
  // 新增：调试日志开关
  const eventsDebugEnabled = useGameStore(state => !!state.gameState?.settings?.eventsDebugEnabled);
  // 事件系统实例持久化（避免重建导致触发状态丢失）
  const eventSystemRef = useRef<EventSystemManager | null>(null);
  // 记录事件系统版本，支持在 HMR 或逻辑升级后安全重建实例
  const eventSystemVersionRef = useRef<number>(0);

  // 初始化时加载历史事件
  useEffect(() => {
    if (!isLoaded) {
      const savedData = loadEventsFromStorage();
      if (savedData) {
        setEvents(savedData.events);
        setEventIdCounter(savedData.eventIdCounter);
      }
      setIsLoaded(true);
    }
  }, [isLoaded]);

  // 当事件或计数器变化时保存到本地存储
  useEffect(() => {
    if (isLoaded) {
      saveEventsToStorage(events, eventIdCounter);
    }
  }, [events, eventIdCounter, isLoaded]);

  // 添加新事件
  const addEvent = useCallback((eventData: Omit<GameEvent, 'id' | 'timestamp'>) => {
    const newEvent: GameEvent = {
      ...eventData,
      id: `event_${eventIdCounter}`,
      timestamp: Date.now(),
      isRead: false,
      isResolved: eventData.type === EventType.NOTIFICATION // 提示事件自动标记为已处理
    };

    setEvents(prev => [newEvent, ...prev]);
    setEventIdCounter(prev => prev + 1);
    
    return newEvent.id;
  }, [eventIdCounter]);

  // 标记事件为已读
  const markAsRead = useCallback((eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, isRead: true }
        : event
    ));
  }, []);

  // 处理选择事件
  const handleChoice = useCallback((eventId: string, choiceId: string) => {
    const { gameState, updateEffectsSystem, calculateResourceRates } = useGameStore.getState();
    
    setEvents(prev => prev.map(event => {
      if (event.id === eventId && event.type === EventType.CHOICE) {
        const selectedChoice = event.choices?.find(choice => choice.id === choiceId);
        return {
          ...event,
          isRead: true,
          isResolved: true,
          selectedChoiceId: choiceId,
          consequences: selectedChoice?.consequences || []
        };
      }
      return event;
    }));
    
    // 处理选择后果的逻辑
    const event = events.find(e => e.id === eventId);
    const choice = event?.choices?.find(c => c.id === choiceId);
    
    if (choice && gameState) {
      const newGameState = { ...gameState };
      
      // 1. 消耗资源
      if (choice.requirements?.resourceCost) {
        Object.entries(choice.requirements.resourceCost).forEach(([resourceKey, cost]) => {
          const currentAmount = newGameState.resources[resourceKey as keyof typeof newGameState.resources] || 0;
          (newGameState.resources as any)[resourceKey] = Math.max(0, currentAmount - cost);
        });
      }
      
      // 2. 应用即时效果
      if (choice.consequences) {
        choice.consequences.forEach(consequence => {
          switch (consequence.type) {
            case 'resource':
              if (newGameState.resources[consequence.target as keyof typeof newGameState.resources] !== undefined) {
                (newGameState.resources as any)[consequence.target] = 
                  Math.max(0, (newGameState.resources[consequence.target as keyof typeof newGameState.resources] || 0) + consequence.value);
              }
              break;
            case 'stability':
              newGameState.stability = Math.max(0, Math.min(100, newGameState.stability + consequence.value));
              break;
          }
        });
      }
      
      // 3. 添加临时效果
      if (choice.effects && choice.effectType === 'buff' && choice.duration && choice.duration > 0) {
        const temporaryEffect = createTemporaryEffectFromEventChoice(
          choice.id,
          event?.id || 'unknown',
          event?.title || '未知事件',
          choice.effects,
          choice.duration,
          newGameState
        );
        if (temporaryEffect) {
          addTemporaryEffect(newGameState, temporaryEffect);
        }
      }
      
      // 更新游戏状态（替换原先不存在的 updateGameState 调用）
      useGameStore.setState((state) => ({
        gameState: newGameState,
      }));
      
      // 更新效果系统并重算资源速率，避免显示不同步
      try {
        updateEffectsSystem();
      } catch (e) {
        console.warn('updateEffectsSystem 调用失败:', e);
      }
      try {
        calculateResourceRates();
      } catch (e) {
        console.warn('calculateResourceRates 调用失败:', e);
      }
      
      console.log(`事件选择结果:`, {
        resourceCost: choice.requirements?.resourceCost,
        consequences: choice.consequences,
        effects: choice.effects
      });
    }
  }, [events]);

  // 移除事件
  const removeEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  }, []);

  // 清理过期事件
  const cleanupExpiredEvents = useCallback(() => {
    const now = Date.now();
    setEvents(prev => prev.filter(event => {
      if (event.duration && event.timestamp + event.duration < now) {
        return false;
      }
      return true;
    }));
  }, []);

  // 获取未读事件
  const getUnreadEvents = useCallback(() => {
    return events.filter(event => !event.isRead);
  }, [events]);

  // 获取未处理的选择事件
  const getUnresolvedChoiceEvents = useCallback(() => {
    return events.filter(event => 
      event.type === EventType.CHOICE && !event.isResolved
    );
  }, [events]);

  // 获取特定类型的事件
  const getEventsByType = useCallback((type: EventType) => {
    return events.filter(event => event.type === type);
  }, [events]);

  // 获取特定优先级的事件
  const getEventsByPriority = useCallback((priority: EventPriority) => {
    return events.filter(event => event.priority === priority);
  }, [events]);

  // 初始化/重建事件系统（在版本变化时重建）
  useEffect(() => {
    if (gameState && (!eventSystemRef.current || eventSystemVersionRef.current !== EVENT_SYSTEM_VERSION)) {
      eventSystemRef.current = createEventSystem(gameState);
      eventSystemVersionRef.current = EVENT_SYSTEM_VERSION;
      console.log(`[Events] 事件系统实例已创建/重建，版本: ${EVENT_SYSTEM_VERSION}`);
    }
  }, [gameState]);

  // gameState 变化时更新事件系统内部引用，但不重建实例
  useEffect(() => {
    if (eventSystemRef.current && gameState) {
      eventSystemRef.current.updateGameState(gameState);
    }
  }, [gameState]);

  // 定期检查和生成事件
  useEffect(() => {
    if (eventsDebugEnabled) {
      console.log(`[Events] setInterval: pollIntervalMs=${pollInterval}, paused=${gameState.isPaused}`);
    }
    const interval = setInterval(() => {
      // 清理过期事件
      cleanupExpiredEvents();
      
      // 只有在游戏未暂停时才生成新事件
      if (!gameState.isPaused && eventSystemRef.current) {
        const newEvents = eventSystemRef.current.checkAndGenerateEvents();
        newEvents.forEach(eventData => {
          addEvent(eventData);
        });
        if (eventsDebugEnabled && newEvents.length > 0) {
          console.log(`[Events] generated ${newEvents.length} events at ${new Date().toLocaleTimeString()}`);
        }
      }
    }, pollInterval); // 使用设置中的轮询间隔

    return () => {
      if (eventsDebugEnabled) {
        console.log('[Events] clearInterval for poll loop');
      }
      clearInterval(interval);
    };
  }, [cleanupExpiredEvents, addEvent, gameState.isPaused, pollInterval, eventsDebugEnabled]);

  // 定期清理过期事件
  useEffect(() => {
    const interval = setInterval(cleanupExpiredEvents, 60000); // 每分钟检查一次
    return () => clearInterval(interval);
  }, [cleanupExpiredEvents]);

  // 清除所有历史事件
  const clearAllEvents = useCallback(() => {
    setEvents([]);
    setEventIdCounter(1);
    localStorage.removeItem(EVENTS_STORAGE_KEY);
  }, []);

  return {
    events,
    addEvent,
    markAsRead,
    handleChoice,
    removeEvent,
    cleanupExpiredEvents,
    getUnreadEvents,
    getUnresolvedChoiceEvents,
    getEventsByType,
    getEventsByPriority,
    clearAllEvents,
    eventSystem: eventSystemRef.current,
    isLoaded
  };
}