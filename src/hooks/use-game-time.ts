import { useGameStore } from '@/lib/game-store';
import { GameTimeSystem } from '@/lib/time-system';

const timeSystem = new GameTimeSystem();

export function useGameTime() {
  const { gameState } = useGameStore();
  const currentDate = gameState.timeSystem.currentDate;
  
  return {
    date: currentDate,
    season: timeSystem.getSeason(currentDate),
    formattedDate: timeSystem.formatDate(currentDate),
    time: { hours: 12, minutes: 0, seconds: 0 }, // 固定时间
    formattedTime: '12:00:00',
  };
}