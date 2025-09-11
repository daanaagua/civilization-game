import { useState, useEffect } from 'react';
import { gameTimeSystem, GameTime, Season } from '@/lib/time-system';

/**
 * 游戏时间Hook
 * 提供实时更新的游戏时间和季节信息
 */
export function useGameTime() {
  const [gameTime, setGameTime] = useState<GameTime>(() => gameTimeSystem.getCurrentTime());
  const [season, setSeason] = useState<Season>(() => 
    gameTimeSystem.getSeason(gameTimeSystem.getCurrentTime().currentDate)
  );

  useEffect(() => {
    // 每100ms更新一次时间，确保日期快速替换的视觉效果
    const interval = setInterval(() => {
      const currentTime = gameTimeSystem.getCurrentTime();
      setGameTime(currentTime);
      setSeason(gameTimeSystem.getSeason(currentTime.currentDate));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const formatDate = (date = gameTime.currentDate) => {
    return gameTimeSystem.formatDate(date);
  };

  const getSeasonName = (currentSeason = season) => {
    return gameTimeSystem.getSeasonName(currentSeason);
  };

  const resetTime = () => {
    gameTimeSystem.reset();
    const newTime = gameTimeSystem.getCurrentTime();
    setGameTime(newTime);
    setSeason(gameTimeSystem.getSeason(newTime.currentDate));
  };

  return {
    gameTime,
    season,
    formatDate,
    getSeasonName,
    resetTime,
    // 便捷访问
    currentDate: gameTime.currentDate,
    totalDays: gameTime.totalDays,
    formattedDate: formatDate(),
    seasonName: getSeasonName()
  };
}