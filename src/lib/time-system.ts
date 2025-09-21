/**
 * 游戏时间系统
 * 现实1秒 = 游戏2天
 * 开局：0年0月1日
 * 每月30天，每年12个月
 */

export interface GameDate {
  year: number;
  month: number; // 0-11 (0=1月, 11=12月)
  day: number;   // 1-30
}

export interface GameTime {
  startTime: number; // 游戏开始的真实时间戳
  currentDate: GameDate;
  totalDays: number;
}

export enum Season {
  SPRING = 'spring', // 春季 (3-5月)
  SUMMER = 'summer', // 夏季 (6-8月)
  AUTUMN = 'autumn', // 秋季 (9-11月)
  WINTER = 'winter'  // 冬季 (12-2月)
}

export class GameTimeSystem {
  private startTime: number;
  private readonly DAYS_PER_SECOND = 2; // 现实1秒 = 游戏2天
  private readonly DAYS_PER_MONTH = 30;
  private readonly MONTHS_PER_YEAR = 12;

  constructor(startTime?: number) {
    this.startTime = startTime || Date.now();
  }

  /**
   * 获取当前游戏时间
   */
  getCurrentTime(): GameTime {
    const realTimeElapsed = (Date.now() - this.startTime) / 1000; // 秒
    const totalDays = Math.floor(realTimeElapsed * this.DAYS_PER_SECOND);
    
    const currentDate = this.daysToDate(totalDays);
    
    return {
      startTime: this.startTime,
      currentDate,
      totalDays
    };
  }

  /**
   * 将总天数转换为年月日
   */
  private daysToDate(totalDays: number): GameDate {
    const year = Math.floor(totalDays / (this.DAYS_PER_MONTH * this.MONTHS_PER_YEAR));
    const remainingDays = totalDays % (this.DAYS_PER_MONTH * this.MONTHS_PER_YEAR);
    const month = Math.floor(remainingDays / this.DAYS_PER_MONTH);
    const day = (remainingDays % this.DAYS_PER_MONTH) + 1; // 日期从1开始
    
    return { year, month, day };
  }

  /**
   * 获取季节
   */
  getSeason(date: GameDate): Season {
    const month = date.month; // 0-11
    
    if (month >= 2 && month <= 4) return Season.SPRING; // 3-5月
    if (month >= 5 && month <= 7) return Season.SUMMER; // 6-8月
    if (month >= 8 && month <= 10) return Season.AUTUMN; // 9-11月
    return Season.WINTER; // 12-2月
  }

  /**
   * 格式化日期显示
   */
  formatDate(date: GameDate): string {
    return `${date.year}年${date.month + 1}月${date.day}日`;
  }

  /**
   * 获取季节中文名称
   */
  getSeasonName(season: Season): string {
    const seasonNames = {
      [Season.SPRING]: '春季',
      [Season.SUMMER]: '夏季',
      [Season.AUTUMN]: '秋季',
      [Season.WINTER]: '冬季'
    };
    return seasonNames[season];
  }

  /**
   * 重置游戏时间
   */
  reset(): void {
    this.startTime = Date.now();
  }

  /**
   * 设置游戏开始时间
   */
  setStartTime(startTime: number): void {
    this.startTime = startTime;
  }

  /**
   * 获取游戏开始时间
   */
  getStartTime(): number {
    return this.startTime;
  }
}

// 全局游戏时间系统实例
export const gameTimeSystem = new GameTimeSystem();

export const GAME_DAYS_PER_SECOND = 2; // 现实1秒 = 游戏2天
export const GAME_DAYS_PER_MONTH = 30; // 每月30天
export const GAME_MONTHS_PER_YEAR = 12; // 每年12个月

export function monthsToSeconds(months: number): number {
  // 1 游戏月 = 30 游戏天；1 游戏天 = 0.5 现实秒
  return months * GAME_DAYS_PER_MONTH / GAME_DAYS_PER_SECOND;
}