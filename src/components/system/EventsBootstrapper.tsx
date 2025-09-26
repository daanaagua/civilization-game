'use client';

import { useEffect } from 'react';
import { enableEventsV2, registerEventSourceV2 } from '@/lib/events/bootstrap';
import { createAdventureV2Source } from '@/lib/events/sources/adventure';
import { useGameStore } from '@/lib/game-store';

export default function EventsBootstrapper() {
  useEffect(() => {
    try {
      const w = (typeof window !== 'undefined') ? (window as any) : null;
      // 防止多次初始化（例如 React 严格模式或路由热更新）
      if (w && w.__eventsV2_inited) {
        console.log('[EventsBootstrapper] already initialized (skip)');
        return;
      }

      const getState = useGameStore.getState;
      const setState = useGameStore.setState;
      // 暴露 store 供控制台调试
      if (w) w.useGameStore = useGameStore;

      console.log('[EventsBootstrapper] enabling events engine…');
      // 启动事件系统调度器
      enableEventsV2({ getState, setState }, 1000);

      // 注册冒险V2事件源
      registerEventSourceV2(createAdventureV2Source({ getState, setState }));
      console.log('[EventsBootstrapper] AdventureV2 source registered');

      if (w) {
        w.__eventsV2_inited = true;
        if (w?.eventsV2) {
          w.eventsV2.debug = true;
          console.log('[EventsBootstrapper] eventsV2 global ready:', {
            choose: typeof w.eventsV2.choose,
            dismiss: typeof w.eventsV2.dismiss,
            getHeadId: typeof w.eventsV2.getHeadId,
            engine: !!w.eventsV2.engine
          });
        } else {
          console.warn('[EventsBootstrapper] eventsV2 global not found after enable');
        }
      }
    } catch (err) {
      console.error('[EventsBootstrapper] initialization failed:', err);
    }
  }, []);

  return null;
}