/**
 * 游戏数据持久化工具
 * 负责游戏状态的保存和加载
 */

const STORAGE_KEY = 'civilization-game-storage';
const SAVE_INTERVAL = 10000; // 每10秒自动保存
const VERSION = 1;

export interface SaveData {
  version: number;
  timestamp: number;
  gameState: any;
}

/**
 * 保存游戏状态到localStorage
 */
export function saveGameState(gameState: any): boolean {
  try {
    const saveData: SaveData = {
      version: VERSION,
      timestamp: Date.now(),
      gameState: {
        ...gameState,
        // 确保不保存运行时状态
        isRunning: false
      }
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    console.log('游戏状态已保存', saveData.timestamp);
    return true;
  } catch (error) {
    console.error('保存游戏状态失败:', error);
    return false;
  }
}

/**
 * 从localStorage加载游戏状态
 */
export function loadGameState(): any | null {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
      console.log('没有找到保存的游戏数据');
      return null;
    }
    
    const parsed: SaveData = JSON.parse(savedData);
    
    // 版本检查
    if (parsed.version !== VERSION) {
      console.warn('保存数据版本不匹配，将使用默认状态');
      return null;
    }
    
    console.log('游戏状态已加载', new Date(parsed.timestamp).toLocaleString());
    return parsed.gameState;
  } catch (error) {
    console.error('加载游戏状态失败:', error);
    return null;
  }
}

/**
 * 清除保存的游戏数据
 */
export function clearSavedGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('保存的游戏数据已清除');
  } catch (error) {
    console.error('清除保存数据失败:', error);
  }
}

/**
 * 检查是否有保存的游戏数据
 */
export function hasSavedGame(): boolean {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    return savedData !== null;
  } catch (error) {
    console.error('检查保存数据失败:', error);
    return false;
  }
}

/**
 * 获取保存数据的信息
 */
export function getSaveInfo(): { timestamp: number; version: number } | null {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return null;
    
    const parsed: SaveData = JSON.parse(savedData);
    return {
      timestamp: parsed.timestamp,
      version: parsed.version
    };
  } catch (error) {
    console.error('获取保存信息失败:', error);
    return null;
  }
}

/**
 * 自动保存管理器
 */
export class AutoSaveManager {
  private intervalId: NodeJS.Timeout | null = null;
  private saveCallback: (() => any) | null = null;
  
  /**
   * 开始自动保存
   */
  start(saveCallback: () => any): void {
    this.saveCallback = saveCallback;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      if (this.saveCallback) {
        const gameState = this.saveCallback();
        saveGameState(gameState);
      }
    }, SAVE_INTERVAL);
    
    console.log('自动保存已启动，间隔:', SAVE_INTERVAL, 'ms');
  }
  
  /**
   * 停止自动保存
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('自动保存已停止');
  }
  
  /**
   * 立即保存一次
   */
  saveNow(): void {
    if (this.saveCallback) {
      const gameState = this.saveCallback();
      saveGameState(gameState);
    }
  }
}

// 页面卸载时保存游戏状态
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // 这里需要从store获取当前状态并保存
    // 具体实现在store中处理
  });
}