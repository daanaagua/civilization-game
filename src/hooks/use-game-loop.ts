import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/game-store';

/**
 * 游戏主循环Hook
 * 负责管理游戏的时间更新和资源生产
 */
export const useGameLoop = () => {
  const { 
    isRunning, 
    updateGameTime, 
    lastUpdateTime,
    calculatePopulationGrowth,
    checkPopulationLimits,
    checkGameEvents,
    toggleGamePause
  } = useGameStore();
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    const gameLoop = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTimeRef.current) / 1000; // 转换为秒
      
      if (isRunning && deltaTime > 0) {
        updateGameTime(deltaTime);
        
        // 人口和稳定度管理（每10秒检查一次）
        const currentGameTime = useGameStore.getState().gameState.gameTime;
        if (Math.floor(currentGameTime / 10000) > Math.floor((currentGameTime - deltaTime) / 10000)) {
          calculatePopulationGrowth();
          checkPopulationLimits();
        }
        
        // 事件检查（每5秒检查一次）
        if (Math.floor(currentGameTime / 5000) > Math.floor((currentGameTime - deltaTime) / 5000)) {
          checkGameEvents();
        }
      }
      
      lastTimeRef.current = currentTime;
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, updateGameTime]);
  
  // 空格键快捷键监听
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        toggleGamePause();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [toggleGamePause]);
  
  // 页面可见性变化时暂停/恢复游戏
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时记录时间
        lastTimeRef.current = Date.now();
      } else {
        // 页面显示时重置时间，避免大量时间跳跃
        lastTimeRef.current = Date.now();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};