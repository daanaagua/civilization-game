import { useGameStore } from '@/lib/game-store';
import { GameTimeSystem, Season } from '@/lib/time-system';

const timeSystem = new GameTimeSystem();

export function useGameTime() {
  const { gameState, formatGameDate } = useGameStore();
  const currentDate = gameState.timeSystem.currentDate;

  // 将 store 中 1-12 的月份转换为 0-11，避免季节计算偏移
  const normalizedDate = {
    year: currentDate.year,
    month: currentDate.month - 1,
    day: currentDate.day,
  };

  const season: Season = timeSystem.getSeason(normalizedDate);
  const seasonName = timeSystem.getSeasonName(season);

  // 依据全局 gameTime 计算总天数（1秒=2天）
  const totalDays = Math.floor(gameState.gameTime * 2);

  return {
    // 日期与时间
    currentDate,
    date: currentDate, // 兼容可能的旧用法
    season,
    seasonName,
    formattedDate: formatGameDate(),
    totalDays,
    time: { hours: 12, minutes: 0, seconds: 0 }, // 固定时间（如需实时可接入循环）
    formattedTime: '12:00:00',
  };
}