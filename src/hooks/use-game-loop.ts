import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

/**
 * 游戏主循环Hook
 * 负责管理游戏的时间更新和资源生产
 */
export const useGameLoop = () => {
  const { 
    isPaused,
    updateGame,
    pauseGame,
    resumeGame
  } = useGameStore();
  
  const toggleGamePause = () => {
    if (isPaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  };
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    const gameLoop = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTimeRef.current) / 1000; // 转换为秒
      
      if (!isPaused && deltaTime > 0) {
        updateGame(deltaTime);
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
  }, [isPaused, updateGame]);
  
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
  }, [isPaused, pauseGame, resumeGame]);
  
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