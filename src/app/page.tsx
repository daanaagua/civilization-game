'use client';

import { useEffect } from 'react';
import TheresMoreLayout from '@/components/layout/theresmore-layout';
import { useGameLoop } from '@/hooks/use-game-loop';
import { useGameStore } from '@/lib/game-store';

export default function HomePage() {
  const { initializeGame } = useGameStore();
  
  // 初始化游戏
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);
  
  // 启动游戏循环
  useGameLoop();
  
  return <TheresMoreLayout />;
}