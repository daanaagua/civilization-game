'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameEvent, EventType, EventPriority, EventChoice } from '@/components/features/EventsPanel';
import { EventSystemManager, createEventSystem, EVENT_SYSTEM_VERSION } from '@/lib/event-system';
import { useGameStore } from '@/lib/game-store';
import { addTemporaryEffect, createTemporaryEffectFromEventChoice } from '@/lib/temporary-effects';
import { CharacterType, CharacterPosition, CharacterSystemState, Character } from '@/types/character';

// 历史事件存储键
const EVENTS_STORAGE_KEY = 'civilization-game-events-history';
const EVENTS_VERSION = 1;

interface EventsStorageData {
  version: number;
  timestamp: number;
  events: GameEvent[];
  eventIdCounter: number;
}

// 兼容两种后果表示：对象形式与字符串形式（如 "dice_check:martial+1d6_vs_8"）
interface ConsequenceObject {
  type: string;
  target?: string;
  value?: number;
}
function isConsequenceObject(c: unknown): c is ConsequenceObject {
  return typeof c === 'object' && c !== null && 'type' in (c as any);
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
  // 模态事件：队列 + 当前事件ID
  const [modalQueue, setModalQueue] = useState<GameEvent[]>([]);
  const [currentModalEventId, setCurrentModalEventId] = useState<string | null>(null);
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

  // 当事件或计数器变化时保存到本地存储，并同步全局 store
  useEffect(() => {
    if (isLoaded) {
      saveEventsToStorage(events, eventIdCounter);
      // 同步全局 store 的 events/recentEvents（双保险：即便不是通过 addEvent 改变）
      useGameStore.setState((state) => {
        const gs = (state as any).gameState as any;
        if (!gs) return state as any;
        const recent = events.slice(0, 10);
        return {
          gameState: {
            ...gs,
            events,
            recentEvents: recent
          }
        } as any;
      });
    }
  }, [events, eventIdCounter, isLoaded]);

  // 判定是否需要弹窗暂停：系统/通知/骰子检定不弹，其余弹
  const shouldPopupPause = (e: Omit<GameEvent, 'id' | 'timestamp'>): boolean => {
    const cat = String(e.category || '').toLowerCase();
    if (!cat || cat === 'notification' || cat === 'system' || cat === 'dice_check') return false;
    return true;
  };

  // 添加新事件（并同步到全局 store 的 gameState.events/recentEvents）
  const addEvent = useCallback((eventData: Omit<GameEvent, 'id' | 'timestamp'>) => {
    const popupPause = shouldPopupPause(eventData);
    const newEvent: GameEvent = {
      ...eventData,
      id: `event_${eventIdCounter}`,
      timestamp: Date.now(),
      isRead: false,
      // 不需要弹窗的通知型直接视为已处理；需要弹窗的由确认/选择后置为已处理
      isResolved: eventData.type === EventType.NOTIFICATION && !popupPause
    };

    setEvents(prev => {
      // 需要弹窗：仅入模态队列，不写入最新事件，等待玩家点击后再入栏
      if (popupPause) {
        setModalQueue(q => [...q, newEvent]);
        return prev;
      }
      // 不需要弹窗：直接入最新事件
      const next = [newEvent, ...prev];
      useGameStore.setState((state) => {
        const gs = (state as any).gameState as any;
        if (!gs) return state as any;
        const recent = next.slice(0, 10);
        return {
          gameState: {
            ...gs,
            events: next,
            recentEvents: recent
          }
        } as any;
      });
      return next;
    });
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
      const newGameState = { ...gameState } as any;
      
      // 1. 消耗资源
      if (choice.requirements?.resourceCost) {
        Object.entries(choice.requirements.resourceCost).forEach(([resourceKey, cost]) => {
          const currentAmount = newGameState.resources?.[resourceKey] ?? 0;
          newGameState.resources[resourceKey] = Math.max(0, currentAmount - cost);
        });
      }
      
      // 2. 应用即时效果（兼容对象与字符串后果）
      if (choice.consequences && choice.consequences.length > 0) {
        // 先扫描保底成功标记
        const hasGuaranteedSuccess = choice.consequences.some(c => typeof c === 'string' && /^(guaranteed_success)\s*:\s*true$/i.test(c));
        
        choice.consequences.forEach((consequence) => {
          if (!isConsequenceObject(consequence)) {
            // 解析字符串形式后果
            if (typeof consequence !== 'string') return;

            // 1) 资源调整：如 "currency:-100" 或 "food:+50"
            const resMatch = consequence.match(/^([a-zA-Z_]+)\s*:\s*([+-]?\d+)$/);
            if (resMatch) {
              const resKey = resMatch[1];
              const delta = Number(resMatch[2]);
              if (newGameState.resources && resKey in newGameState.resources) {
                const curr = Number(newGameState.resources[resKey] ?? 0);
                newGameState.resources[resKey] = Math.max(0, curr + delta);
              }
              return;
            }

            // 2) 骰子检定："dice_check:martial+1d6_vs_8"
            const diceMatch = consequence.match(/^dice_check\s*:\s*([a-zA-Z_]+)\s*\+\s*(\d+)d(\d+)\s*_vs_\s*(\d+)$/i);
            if (diceMatch) {
              const attrKeyRaw = diceMatch[1].toLowerCase();
              const diceCount = Number(diceMatch[2]);
              const diceSides = Number(diceMatch[3]);
              const target = Number(diceMatch[4]);

              // 属性映射
              const attrMap: Record<string, keyof Character['attributes']> = {
                martial: 'force',
                force: 'force',
                intelligence: 'intelligence',
                charisma: 'charisma',
              };
              const attrKey = attrMap[attrKeyRaw] ?? 'force';

              // 寻找相关人物
              const cs: CharacterSystemState | undefined = newGameState.characterSystem;
              let subject: Character | undefined;

              // 从事件元数据读取 characterRequired（事件系统可能携带该字段）
              const characterRequired: string | undefined = (event as any)?.characterRequired;
              if (cs && cs.characters) {
                if (characterRequired === 'judge') {
                  // 寻找职位为大法官的人物
                  subject = Object.values(cs.characters).find((ch) => ch.position === CharacterPosition.CHIEF_JUDGE);
                } else if (characterRequired === 'scholar') {
                  // 优先取在职科研领袖
                  const id = cs.activeCharacters?.[CharacterType.RESEARCH_LEADER] || null;
                  subject = id ? cs.characters[id] : undefined;
                  if (!subject) {
                    subject = Object.values(cs.characters).find((ch) => ch.type === CharacterType.RESEARCH_LEADER);
                  }
                }

                // 兜底：使用统治者，或任意一个人物
                if (!subject) {
                  const rulerId = cs.activeCharacters?.[CharacterType.RULER] || null;
                  subject = rulerId ? cs.characters[rulerId] : Object.values(cs.characters)[0];
                }
              }

              const baseAttr = subject?.attributes?.[attrKey] ?? 0;

              // 掷骰
              const rollOnce = (sides: number) => 1 + Math.floor(Math.random() * Math.max(1, sides));
              let diceSum = 0;
              for (let i = 0; i < diceCount; i++) diceSum += rollOnce(diceSides);

              const total = baseAttr + diceSum;
              const success = hasGuaranteedSuccess || total >= target;

              // 生成结果通知事件
              const title = '检定结果';
              const desc = hasGuaranteedSuccess
                ? `保底成功：判定视为成功（${attrKey}=${baseAttr}，骰子${diceCount}d${diceSides}未计算，对比目标${target}）`
                : `判定${success ? '成功' : '失败'}：${attrKey}=${baseAttr}，掷出${diceCount}d${diceSides}=${diceSum}，总计${total}，目标${target}`;

              addEvent({
                title,
                description: desc,
                type: EventType.NOTIFICATION,
                priority: success ? EventPriority.MEDIUM : EventPriority.LOW,
                duration: 5000,
                category: 'dice_check'
              });

              return;
            }

            // 3) 其他字符串后果（暂不处理）
            return;
          }
          const delta = Number(consequence.value ?? 0);
          switch (consequence.type) {
            case 'resource':
              if (consequence.target && newGameState.resources?.[consequence.target] !== undefined) {
                const curr = Number(newGameState.resources[consequence.target] ?? 0);
                newGameState.resources[consequence.target] = Math.max(0, curr + delta);
              }
              break;
            case 'stability':
              if (typeof newGameState.stability === 'number') {
                newGameState.stability = Math.max(0, Math.min(100, Number(newGameState.stability ?? 0) + delta));
              }
              break;
            default:
              // 其他类型暂不处理
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

  // 订阅来自全局的通知事件，将其转换为非选择事件并纳入事件流（加节流去重）
  useEffect(() => {
    const lastNotifRef = { key: '', ts: 0 }; // 简单节流：20 秒内相同 key 不重复
    const handler = (e: Event) => {
      const custom = e as CustomEvent<any>;
      const data = custom.detail || {};
      const title = data.title || '通知';
      const message = data.message || '';
      const key = `${title}::${message}`;
      const now = Date.now();
      if (lastNotifRef.key === key && now - lastNotifRef.ts < 20000) {
        return; // 丢弃短时间内重复的相同通知
      }
      lastNotifRef.key = key;
      lastNotifRef.ts = now;

      // 映射 Notification -> GameEvent
      const priorityMap: Record<string, EventPriority> = {
        info: EventPriority.LOW,
        success: EventPriority.MEDIUM,
        warning: EventPriority.HIGH,
        error: EventPriority.URGENT,
      };
      const type: EventType = EventType.NOTIFICATION;
      const eventData = {
        title,
        description: message,
        type,
        priority: priorityMap[data.type] ?? EventPriority.LOW,
        duration: data.duration ?? 5000,
        icon: data.type === 'success' ? '✅' : data.type === 'warning' ? '⚠️' : data.type === 'error' ? '⛔' : 'ℹ️',
        category: 'notification',
      } as Omit<GameEvent, 'id' | 'timestamp'>;
      addEvent(eventData);
    };
    window.addEventListener('GAME_NOTIFICATION' as any, handler as any);
    return () => window.removeEventListener('GAME_NOTIFICATION' as any, handler as any);
  }, [addEvent]);

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

  // ========= 模态事件：当前事件/暂停/确认/选择 =========
  const getCurrentModalEvent = useCallback((): GameEvent | null => {
    if (currentModalEventId) {
      // 先在已入栏事件中查找，若未入栏（需弹窗事件），再到队列中查找
      const inEvents = events.find(e => e.id === currentModalEventId);
      if (inEvents) return inEvents;
      const inQueue = modalQueue.find(e => e.id === currentModalEventId);
      if (inQueue) return inQueue;
      return null;
    }
    return modalQueue.length > 0 ? modalQueue[0] : null;
  }, [currentModalEventId, modalQueue, events]);

  // 队列出现时，锁定当前事件并暂停
  useEffect(() => {
    if (modalQueue.length > 0 && !currentModalEventId) {
      const first = modalQueue[0];
      setCurrentModalEventId(first.id);
      const { pauseGame } = useGameStore.getState();
      try { pauseGame(); } catch {}
    }
  }, [modalQueue.length, currentModalEventId]);

  // 关闭当前模态（用于无选项事件“知道了”）
  const acknowledgeCurrentModal = useCallback(() => {
    const current = getCurrentModalEvent();
    if (!current) return;
    // 若不在事件列表中，则在此时写入“最新事件”并标记为已读/已处理
    setEvents(prev => {
      const exists = prev.some(e => e.id === current.id);
      const entry = { ...current, isRead: true, isResolved: true };
      return exists ? prev.map(e => e.id === current.id ? entry : e) : [entry, ...prev];
    });
    // 出队并解锁
    setModalQueue(prev => prev.filter(e => e.id !== current.id));
    setCurrentModalEventId(null);
    // 若无后续，恢复游戏
    setTimeout(() => {
      if (modalQueue.filter(e => e.id !== current.id).length === 0) {
        const { resumeGame } = useGameStore.getState();
        try { resumeGame(); } catch {}
      }
    }, 0);
  }, [getCurrentModalEvent, modalQueue]);

  // 通过模态进行选择
  const chooseModalChoice = useCallback((eventId: string, choiceId: string) => {
    // 若事件尚未入“最新事件”，先插入并标记，再执行后果
    setEvents(prev => {
      const exists = prev.some(e => e.id === eventId);
      if (exists) {
        return prev.map(e => e.id === eventId ? { ...e, isRead: true, isResolved: true, selectedChoiceId: choiceId } : e);
      }
      const modal = modalQueue.find(e => e.id === eventId);
      if (!modal) return prev;
      const entry = { ...modal, isRead: true, isResolved: true, selectedChoiceId: choiceId };
      return [entry, ...prev];
    });
    // 等待一次事件入列后再应用后果，避免 handleChoice 查不到事件
    setTimeout(() => {
      try { handleChoice(eventId, choiceId); } catch {}
    }, 0);
    // 出队并恢复（若无后续）
    setModalQueue(prev => prev.filter(e => e.id !== eventId));
    setCurrentModalEventId(null);
    setTimeout(() => {
      if (modalQueue.filter(e => e.id !== eventId).length === 0) {
        const { resumeGame } = useGameStore.getState();
        try { resumeGame(); } catch {}
      }
    }, 0);
  }, [handleChoice, modalQueue]);

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
    isLoaded,
    // 模态接口导出
    modalEvent: getCurrentModalEvent(),
    acknowledgeCurrentModal,
    chooseModalChoice,
  };
}