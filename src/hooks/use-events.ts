'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameEvent, EventType, EventPriority, EventChoice } from '@/components/features/EventsPanel';
import { EventSystemManager, createEventSystem } from '@/lib/event-system';
import { useGameStore } from '@/lib/game-store';

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
  const [eventSystem, setEventSystem] = useState<EventSystemManager | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const gameState = useGameStore(state => state.gameState);

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
    
    // 这里可以添加选择后果的处理逻辑
    const event = events.find(e => e.id === eventId);
    const choice = event?.choices?.find(c => c.id === choiceId);
    
    if (choice?.consequences) {
      // 可以触发相应的游戏状态变化
      console.log(`事件选择结果:`, choice.consequences);
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

  // 初始化事件系统
  useEffect(() => {
    if (gameState) {
      const newEventSystem = createEventSystem(gameState);
      setEventSystem(newEventSystem);
    }
  }, [gameState]);

  // 定期检查和生成事件
  useEffect(() => {
    if (!eventSystem) return;

    const interval = setInterval(() => {
      // 清理过期事件
      cleanupExpiredEvents();
      
      // 只有在游戏未暂停时才生成新事件
      if (!gameState.isPaused) {
        const newEvents = eventSystem.checkAndGenerateEvents();
        newEvents.forEach(eventData => {
          addEvent(eventData);
        });
      }
    }, 60000); // 每分钟检查一次

    return () => clearInterval(interval);
  }, [eventSystem, cleanupExpiredEvents, addEvent, gameState.isPaused]);

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
    eventSystem,
    isLoaded
  };
}