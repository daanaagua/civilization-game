import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化数字显示，统一保留两位小数
 * 用于游戏中所有数值显示（人口等整数类型除外）
 * 包括资源数量、战斗数值、buff效果等
 */
export function formatNumber(num: number | undefined | null, decimals: number = 2): string {
  if (num == null || num === undefined) {
    return '0';
  }
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1000000000) {
    return sign + (absNum / 1000000000).toFixed(decimals) + 'B';
  } else if (absNum >= 1000000) {
    return sign + (absNum / 1000000).toFixed(decimals) + 'M';
  } else if (absNum >= 1000) {
    return sign + (absNum / 1000).toFixed(decimals) + 'K';
  } else {
    return sign + absNum.toFixed(decimals);
  }
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}