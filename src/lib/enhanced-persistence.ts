/**
 * 增强的游戏数据持久化系统
 * 提供更可靠的保存和加载机制，包括数据验证、错误恢复和备份
 */

import { GameState, UIState } from '@/types/game';

const STORAGE_KEY = 'civilization-game-enhanced';
const BACKUP_KEY = 'civilization-game-backup';
const VERSION = 2;
const MAX_BACKUP_COUNT = 3;

export interface EnhancedSaveData {
  version: number;
  timestamp: number;
  checksum: string;
  gameState: GameState;
  uiState: UIState;
  army: { [unitType: string]: number };
}

export interface BackupEntry {
  timestamp: number;
  data: EnhancedSaveData;
}

/**
 * 计算数据校验和
 */
function calculateChecksum(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * 验证保存数据的完整性
 */
function validateSaveData(data: EnhancedSaveData): boolean {
  try {
    // 检查必要字段
    if (!data.version || !data.timestamp || !data.gameState) {
      console.warn('保存数据缺少必要字段');
      return false;
    }

    // 验证校验和
    const expectedChecksum = calculateChecksum({
      gameState: data.gameState,
      uiState: data.uiState,
      army: data.army
    });
    
    if (data.checksum !== expectedChecksum) {
      console.warn('保存数据校验和不匹配');
      return false;
    }

    // 验证游戏状态基本结构
    if (!data.gameState.resources || !data.gameState.timeSystem) {
      console.warn('游戏状态结构不完整');
      return false;
    }

    return true;
  } catch (error) {
    console.error('验证保存数据时出错:', error);
    return false;
  }
}

/**
 * 保存游戏状态（增强版）
 */
export function saveGameStateEnhanced(
  gameState: GameState,
  uiState: UIState,
  army: { [unitType: string]: number }
): boolean {
  try {
    // 创建备份
    createBackup();

    // 准备保存数据
    const saveData: EnhancedSaveData = {
      version: VERSION,
      timestamp: Date.now(),
      checksum: '',
      gameState: JSON.parse(JSON.stringify(gameState)), // 深拷贝
      uiState: JSON.parse(JSON.stringify(uiState)),
      army: JSON.parse(JSON.stringify(army))
    };

    // 计算校验和
    saveData.checksum = calculateChecksum({
      gameState: saveData.gameState,
      uiState: saveData.uiState,
      army: saveData.army
    });

    // 保存到localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    
    console.log('增强持久化：游戏状态已保存', new Date(saveData.timestamp).toLocaleString());
    return true;
  } catch (error) {
    console.error('增强持久化：保存失败', error);
    return false;
  }
}

/**
 * 加载游戏状态（增强版）
 */
export function loadGameStateEnhanced(): EnhancedSaveData | null {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
      console.log('增强持久化：没有找到保存数据');
      return null;
    }

    const parsed: EnhancedSaveData = JSON.parse(savedData);
    
    // 验证数据完整性
    if (!validateSaveData(parsed)) {
      console.warn('增强持久化：主保存数据损坏，尝试从备份恢复');
      return loadFromBackup();
    }

    // 版本检查
    if (parsed.version !== VERSION) {
      console.warn(`增强持久化：版本不匹配 (期望: ${VERSION}, 实际: ${parsed.version})`);
      // 可以在这里实现版本迁移逻辑
      return null;
    }

    console.log('增强持久化：游戏状态已加载', new Date(parsed.timestamp).toLocaleString());
    return parsed;
  } catch (error) {
    console.error('增强持久化：加载失败', error);
    return loadFromBackup();
  }
}

/**
 * 创建备份
 */
function createBackup(): void {
  try {
    const currentData = localStorage.getItem(STORAGE_KEY);
    if (!currentData) return;

    const backupsData = localStorage.getItem(BACKUP_KEY);
    let backups: BackupEntry[] = backupsData ? JSON.parse(backupsData) : [];

    // 添加新备份
    backups.unshift({
      timestamp: Date.now(),
      data: JSON.parse(currentData)
    });

    // 限制备份数量
    if (backups.length > MAX_BACKUP_COUNT) {
      backups = backups.slice(0, MAX_BACKUP_COUNT);
    }

    localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
    console.log('增强持久化：备份已创建');
  } catch (error) {
    console.error('增强持久化：创建备份失败', error);
  }
}

/**
 * 从备份恢复
 */
function loadFromBackup(): EnhancedSaveData | null {
  try {
    const backupsData = localStorage.getItem(BACKUP_KEY);
    if (!backupsData) {
      console.log('增强持久化：没有可用的备份');
      return null;
    }

    const backups: BackupEntry[] = JSON.parse(backupsData);
    
    // 尝试从最新的有效备份恢复
    for (const backup of backups) {
      if (validateSaveData(backup.data)) {
        console.log('增强持久化：从备份恢复成功', new Date(backup.timestamp).toLocaleString());
        // 将备份数据恢复为主数据
        localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.data));
        return backup.data;
      }
    }

    console.warn('增强持久化：所有备份都已损坏');
    return null;
  } catch (error) {
    console.error('增强持久化：从备份恢复失败', error);
    return null;
  }
}

/**
 * 获取保存信息
 */
export function getSaveInfoEnhanced(): {
  main: { timestamp: number; version: number; valid: boolean } | null;
  backups: Array<{ timestamp: number; valid: boolean }>;
} {
  const result = {
    main: null as any,
    backups: [] as Array<{ timestamp: number; valid: boolean }>
  };

  try {
    // 检查主保存
    const mainData = localStorage.getItem(STORAGE_KEY);
    if (mainData) {
      const parsed = JSON.parse(mainData);
      result.main = {
        timestamp: parsed.timestamp,
        version: parsed.version,
        valid: validateSaveData(parsed)
      };
    }

    // 检查备份
    const backupsData = localStorage.getItem(BACKUP_KEY);
    if (backupsData) {
      const backups: BackupEntry[] = JSON.parse(backupsData);
      result.backups = backups.map(backup => ({
        timestamp: backup.timestamp,
        valid: validateSaveData(backup.data)
      }));
    }
  } catch (error) {
    console.error('获取保存信息失败:', error);
  }

  return result;
}

/**
 * 清除所有保存数据
 */
export function clearAllSaveData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BACKUP_KEY);
    console.log('增强持久化：所有保存数据已清除');
  } catch (error) {
    console.error('增强持久化：清除数据失败', error);
  }
}

/**
 * 检查是否有保存数据
 */
export function hasSavedGameEnhanced(): boolean {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return false;
    
    const parsed = JSON.parse(savedData);
    return validateSaveData(parsed);
  } catch (error) {
    console.error('检查保存数据失败:', error);
    return false;
  }
}