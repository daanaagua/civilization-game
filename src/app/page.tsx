'use client';

import { useEffect } from 'react';
import TheresMoreLayout from '@/components/layout/theresmore-layout';
import { useGameLoop } from '@/hooks/use-game-loop';
import { useGameStore } from '@/lib/game-store';

export default function HomePage() {
  const { isRunning, lastUpdateTime, updateGameTime } = useGameStore();

  // 水合恢复：组件挂载时检查是否需要离线补偿（考虑持久化水合的先后顺序）
  useEffect(() => {
    const compensateAfterHydration = () => {
      const state = useGameStore.getState();
      const currentTime = Date.now();
      const storedLastUpdateTime = state.lastUpdateTime || currentTime;
      const offlineTimeSeconds = Math.max(0, (currentTime - storedLastUpdateTime) / 1000);

      if (offlineTimeSeconds > 5 && state.isRunning) {
        console.log(`离线时间: ${Math.floor(offlineTimeSeconds)}秒，正在补偿资源...`);
        updateGameTime(offlineTimeSeconds);
      }

      // 更新最后更新时间为当前时间
      useGameStore.setState({ lastUpdateTime: currentTime });
    };

    const persistApi: any = (useGameStore as any).persist;
    // 若已水合，直接补偿；否则在水合完成回调中进行
    if (persistApi?.hasHydrated?.()) {
      compensateAfterHydration();
      return;
    }

    if (persistApi?.onFinishHydration) {
      const unsub = persistApi.onFinishHydration(() => {
        compensateAfterHydration();
      });
      return () => {
        unsub?.();
      };
    }

    // 安全策略：无法确认水合状态时，不做任何写入，避免覆盖持久化数据
    return undefined;
  }, [updateGameTime]);
  
  // 页面卸载或隐藏时保存最后更新时间
  useEffect(() => {
    const handleBeforeUnload = () => {
      useGameStore.setState({ lastUpdateTime: Date.now() });
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时记录时间
        useGameStore.setState({ lastUpdateTime: Date.now() });
      } else {
        // 页面重新显示时计算离线时间并补偿
        const currentTime = Date.now();
        const state = useGameStore.getState();
        const offlineMs = currentTime - (state.lastUpdateTime || currentTime);
        const offlineSeconds = Math.max(0, offlineMs / 1000);
        
        if (offlineSeconds > 5 && state.isRunning) {
          console.log(`页面恢复显示，离线时间: ${Math.floor(offlineSeconds)}秒，正在补偿资源...`);
          updateGameTime(offlineSeconds);
        }
        
        useGameStore.setState({ lastUpdateTime: currentTime });
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateGameTime]);
  
  // 启动游戏循环
  useGameLoop();
  
  return <TheresMoreLayout />;
}