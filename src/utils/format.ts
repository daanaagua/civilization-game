/**
 * 格式化数字显示
 * @param num 要格式化的数字
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number, decimals: number = 1): string {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1000000000) {
    return sign + (absNum / 1000000000).toFixed(decimals) + 'B';
  } else if (absNum >= 1000000) {
    return sign + (absNum / 1000000).toFixed(decimals) + 'M';
  } else if (absNum >= 1000) {
    return sign + (absNum / 1000).toFixed(decimals) + 'K';
  } else if (absNum >= 1) {
    return sign + Math.floor(absNum).toString();
  } else {
    return sign + absNum.toFixed(decimals);
  }
};

/**
 * 格式化时间显示
 * @param seconds 秒数
 * @returns 格式化后的时间字符串
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
};

/**
 * 格式化百分比
 * @param value 0-1之间的值
 * @param decimals 小数位数
 * @returns 格式化后的百分比字符串
 */
export const formatPercentage = (value: number, decimals: number = 0): string => {
  return (value * 100).toFixed(decimals) + '%';
};

/**
 * 格式化资源成本显示
 * @param cost 资源成本对象
 * @returns 格式化后的成本字符串数组
 */
export const formatResourceCost = (cost: Record<string, number>): string[] => {
  const resourceNames: Record<string, string> = {
    food: '食物',
    wood: '木材',
    stone: '石料',
    tools: '工具',
    population: '人口',
  };
  
  return Object.entries(cost)
    .filter(([_, amount]) => amount > 0)
    .map(([resource, amount]) => `${resourceNames[resource] || resource}: ${formatNumber(amount)}`);
};

/**
 * 计算两个时间点之间的差值（秒）
 * @param startTime 开始时间戳
 * @param endTime 结束时间戳（可选，默认为当前时间）
 * @returns 时间差（秒）
 */
export const getTimeDifference = (startTime: number, endTime: number = Date.now()): number => {
  return (endTime - startTime) / 1000;
};

/**
 * 将驼峰命名转换为可读的标题
 * @param str 驼峰命名字符串
 * @returns 格式化后的标题
 */
export const camelCaseToTitle = (str: string): string => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
};

/**
 * 生成随机ID
 * @param length ID长度
 * @returns 随机ID字符串
 */
export const generateId = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * 深度克隆对象
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  
  return obj;
};