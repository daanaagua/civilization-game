import { EventSchedulerV2 } from './scheduler';
import { getEventEngineV2 } from './core';
import { createGameStoreAdapter } from './adapters/game-store-adapter';
import type { EventSource, GameEventV2 } from './types';

let scheduler: EventSchedulerV2 | null = null;
let enabled = false;
// 已注册源ID（引导层去重），防止多次调用 registerEventSourceV2
const registeredIds = new Set<string>();

export function enableEventsV2(api: { getState: () => any; setState: (updater: (s: any) => any) => void }, pollMs = 1000) {
  if (enabled) return;
  const engine = getEventEngineV2();
  engine.attachAdapter(createGameStoreAdapter(api));
  scheduler = new EventSchedulerV2(pollMs);
  scheduler.start();
  enabled = true;

  // 暴露全局桥接与调试开关，供旧UI按钮与调试使用
  if (typeof window !== 'undefined') {
    const engRef = getEventEngineV2();
    const w = (window as any);
    
    // 确保方法正确定义并暴露
    const chooseMethod = (optionId?: string) => { 
      console.log('[EventsV2][Bootstrap] choose called with optionId=', optionId);
      try { 
        engRef.choose(optionId); 
      } catch (err) {
        console.error('[EventsV2][Bootstrap] choose failed:', err);
      }
    };
    
    const dismissMethod = () => { 
      console.log('[EventsV2][Bootstrap] dismiss called');
      try { 
        engRef.dismiss(); 
      } catch (err) {
        console.error('[EventsV2][Bootstrap] dismiss failed:', err);
      }
    };
    
    const emergencyCleanupMethod = () => {
      console.log('[EventsV2][Bootstrap] EMERGENCY CLEANUP - clearing all queues');
      try {
        // 直接清空引擎队列
        (engRef as any).queue = [];
        (engRef as any).pausedByEngine = false;
        
        // 强制恢复游戏
        const store = w.useGameStore?.getState?.();
        if (store) {
          store.resumeGame?.();
          w.useGameStore?.setState?.((st: any) => ({
            uiState: { ...st.uiState, showEventModal: false, currentEvent: undefined }
          }));
        }
        
        console.log('[EventsV2][Bootstrap] Emergency cleanup completed');
      } catch (err) {
        console.error('[EventsV2][Bootstrap] Emergency cleanup failed:', err);
      }
    };
    
    w.eventsV2 = {
      engine: engRef,
      choose: chooseMethod,
      dismiss: dismissMethod,
      getHeadId: () => { try { return engRef.getHeadId?.(); } catch { return undefined; } },
      debug: !!w.eventsV2?.debug, // 保留已有值
      forceDismissCurrent: () => { try { engRef.dismiss(); } catch {} },
      emergencyCleanup: emergencyCleanupMethod
    };
    
    // 调试：验证方法是否正确暴露
    console.log('[EventsV2][Bootstrap] Global methods exposed:', {
      choose: typeof w.eventsV2.choose,
      dismiss: typeof w.eventsV2.dismiss,
      emergencyCleanup: typeof w.eventsV2.emergencyCleanup
    });
  }
}

export function disableEventsV2() {
  if (!enabled) return;
  if (scheduler) {
    scheduler.stop();
    scheduler = null;
  }
  enabled = false;
}

export function registerEventSourceV2(src: EventSource) {
  if (registeredIds.has(src.id)) return;
  if (!scheduler) {
    // 延迟注册：先确保引擎已存在
    getEventEngineV2().registerSource(src);
  } else {
    scheduler.addSource(src);
  }
  registeredIds.add(src.id);
}

export function unregisterEventSourceV2(id: string) {
  getEventEngineV2().unregisterSource(id);
  registeredIds.delete(id);
}

export function pushEventV2(ev: GameEventV2) {
  getEventEngineV2().push(ev);
}