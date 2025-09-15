import { GameState } from '@/types/game';
import { resourceConfig } from '@/lib/resource-config';
import type { EventChoice } from '@/components/features/EventsPanel';

/**
 * 检查资源是否已解锁
 * @param resourceKey 资源键名
 * @param gameState 游戏状态
 * @returns 是否已解锁
 */
export function isResourceUnlocked(resourceKey: string, gameState: GameState): boolean {
  const config = resourceConfig[resourceKey as keyof typeof resourceConfig];
  
  // 如果没有配置或没有科技要求，则认为已解锁
  if (!config || !config.requiresTech) {
    return true;
  }
  
  // 检查是否已研究所需科技
  return gameState.technologies.researched.includes(config.requiresTech);
}

/**
 * 检查是否有足够的资源
 * @param resourceCost 资源消耗需求
 * @param gameState 游戏状态
 * @returns 是否有足够资源
 */
export function hasEnoughResources(resourceCost: Record<string, number>, gameState: GameState): boolean {
  for (const [resourceKey, cost] of Object.entries(resourceCost)) {
    const currentAmount = gameState.resources[resourceKey as keyof typeof gameState.resources] || 0;
    if (currentAmount < cost) {
      return false;
    }
  }
  return true;
}

/**
 * 检查事件选项是否可用
 * @param choice 事件选项
 * @param gameState 游戏状态
 * @returns 选项状态信息
 */
export function checkChoiceAvailability(choice: EventChoice, gameState: GameState): {
  isUnlocked: boolean;
  hasResources: boolean;
  isDisabled: boolean;
  disabledReason?: string;
} {
  let isUnlocked = true;
  let hasResources = true;
  let disabledReason: string | undefined;
  
  // 检查资源解锁状态
  if (choice.requirements?.unlockedResources) {
    for (const resourceKey of choice.requirements.unlockedResources) {
      if (!isResourceUnlocked(resourceKey, gameState)) {
        isUnlocked = false;
        disabledReason = `暂未解锁该选项`;
        break;
      }
    }
  }
  
  // 检查资源充足性
  if (choice.requirements?.resourceCost && isUnlocked) {
    if (!hasEnoughResources(choice.requirements.resourceCost, gameState)) {
      hasResources = false;
      const missingResources = Object.entries(choice.requirements.resourceCost)
        .filter(([key, cost]) => {
          const current = gameState.resources[key as keyof typeof gameState.resources] || 0;
          return current < cost;
        })
        .map(([key, cost]) => {
          const current = gameState.resources[key as keyof typeof gameState.resources] || 0;
          const displayName = getResourceDisplayName(key);
          return `${displayName}: ${current}/${cost}`;
        })
        .join(', ');
      disabledReason = `资源不足: ${missingResources}`;
    }
  }
  
  const isDisabled = !isUnlocked || !hasResources;
  
  return {
    isUnlocked,
    hasResources,
    isDisabled,
    disabledReason
  };
}

/**
 * 获取资源的显示名称
 * @param resourceKey 资源键名
 * @returns 显示名称
 */
export function getResourceDisplayName(resourceKey: string): string {
  const displayNames: Record<string, string> = {
    food: '食物',
    wood: '木材',
    stone: '石材',
    currency: '货币',
    population: '人口',
    livestock: '牲畜',
    leather: '布革',
    faith: '信仰',
    tools: '工具',
    metal: '金属',
    knowledge: '知识'
  };
  
  return displayNames[resourceKey] || resourceKey;
}