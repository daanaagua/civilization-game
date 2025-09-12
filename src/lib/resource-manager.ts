/**
 * 独立的资源管控系统
 * 负责所有资源的计算、更新和状态管理
 */

import { Resources, ResourceLimits } from '@/types/game';
import { BUILDINGS } from './game-data';

// 资源变化事件类型
export interface ResourceChangeEvent {
  type: 'production' | 'consumption' | 'manual' | 'building' | 'technology' | 'event';
  source: string;
  changes: Partial<Resources>;
  timestamp: number;
}

// 资源速率详情
export interface ResourceRateDetail {
  source: string;
  rate: number;
  color: string;
  category: 'production' | 'consumption' | 'other';
}

// 资源管理器类
export class ResourceManager {
  private resources: Resources;
  private resourceLimits: ResourceLimits;
  private resourceRates: Partial<Resources>;
  private rateDetails: { [key in keyof Resources]?: ResourceRateDetail[] };
  private changeHistory: ResourceChangeEvent[];
  private listeners: ((resources: Resources) => void)[];

  constructor(initialResources: Resources, initialLimits: ResourceLimits) {
    this.resources = { ...initialResources };
    this.resourceLimits = { ...initialLimits };
    this.resourceRates = {};
    this.rateDetails = {};
    this.changeHistory = [];
    this.listeners = [];
  }

  // 获取当前资源
  getResources(): Resources {
    return { ...this.resources };
  }

  // 获取资源上限
  getResourceLimits(): ResourceLimits {
    return { ...this.resourceLimits };
  }

  // 获取资源速率
  getResourceRates(): Partial<Resources> {
    return { ...this.resourceRates };
  }

  // 获取资源速率详情
  getResourceRateDetails(resource: keyof Resources): ResourceRateDetail[] {
    return this.rateDetails[resource] || [];
  }

  // 设置资源
  setResources(resources: Partial<Resources>, source: string = 'manual'): void {
    const changes: Partial<Resources> = {};
    
    Object.entries(resources).forEach(([key, value]) => {
      const resourceKey = key as keyof Resources;
      if (value !== undefined && this.resources[resourceKey] !== value) {
        changes[resourceKey] = value - this.resources[resourceKey];
        this.resources[resourceKey] = Math.max(0, Math.min(value, this.resourceLimits[resourceKey] || Infinity));
      }
    });

    if (Object.keys(changes).length > 0) {
      this.recordChange({
        type: 'manual',
        source,
        changes,
        timestamp: Date.now()
      });
      this.notifyListeners();
    }
  }

  // 添加资源
  addResources(resources: Partial<Resources>, source: string = 'production'): void {
    const changes: Partial<Resources> = {};
    
    Object.entries(resources).forEach(([key, value]) => {
      const resourceKey = key as keyof Resources;
      if (value !== undefined && value !== 0) {
        const oldValue = this.resources[resourceKey];
        const newValue = Math.max(0, Math.min(oldValue + value, this.resourceLimits[resourceKey] || Infinity));
        
        if (newValue !== oldValue) {
          changes[resourceKey] = newValue - oldValue;
          this.resources[resourceKey] = newValue;
        }
      }
    });

    if (Object.keys(changes).length > 0) {
      this.recordChange({
        type: 'production',
        source,
        changes,
        timestamp: Date.now()
      });
      this.notifyListeners();
    }
  }

  // 消耗资源
  consumeResources(resources: Partial<Resources>, source: string = 'consumption'): boolean {
    // 检查是否有足够资源
    for (const [key, value] of Object.entries(resources)) {
      const resourceKey = key as keyof Resources;
      if (value !== undefined && value > 0 && this.resources[resourceKey] < value) {
        return false; // 资源不足
      }
    }

    // 消耗资源
    const changes: Partial<Resources> = {};
    Object.entries(resources).forEach(([key, value]) => {
      const resourceKey = key as keyof Resources;
      if (value !== undefined && value > 0) {
        changes[resourceKey] = -value;
        this.resources[resourceKey] = Math.max(0, this.resources[resourceKey] - value);
      }
    });

    if (Object.keys(changes).length > 0) {
      this.recordChange({
        type: 'consumption',
        source,
        changes,
        timestamp: Date.now()
      });
      this.notifyListeners();
    }

    return true;
  }

  // 检查是否有足够资源
  canAfford(cost: Partial<Resources>): boolean {
    return Object.entries(cost).every(([key, value]) => {
      const resourceKey = key as keyof Resources;
      return value === undefined || value <= 0 || this.resources[resourceKey] >= value;
    });
  }

  // 更新资源上限
  updateResourceLimits(limits: Partial<ResourceLimits>): void {
    Object.assign(this.resourceLimits, limits);
    
    // 确保当前资源不超过新上限
    Object.entries(limits).forEach(([key, limit]) => {
      const resourceKey = key as keyof Resources;
      if (limit !== undefined && this.resources[resourceKey] > limit) {
        this.resources[resourceKey] = limit;
      }
    });
    
    this.notifyListeners();
  }

  // 计算资源速率
  calculateResourceRates(gameState: any): void {
    const rates: Partial<Resources> = {
      food: 0,
      wood: 0,
      stone: 0,
      tools: 0,
      population: 0
    };

    const details: { [key in keyof Resources]?: ResourceRateDetail[] } = {
      food: [],
      wood: [],
      stone: [],
      tools: [],
      population: []
    };

    const { buildings, technologies, stability, corruption, resources } = gameState;

    // 计算稳定度和腐败度影响
    let stabilityMultiplier = 1;
    if (stability >= 80) stabilityMultiplier = 1.1;
    else if (stability >= 60) stabilityMultiplier = 1.05;
    else if (stability < 40) stabilityMultiplier = 0.95;
    else if (stability < 20) stabilityMultiplier = 0.9;

    let corruptionMultiplier = 1;
    if (corruption > 90) corruptionMultiplier = 0.4;
    else if (corruption > 75) corruptionMultiplier = 0.6;
    else if (corruption > 50) corruptionMultiplier = 0.75;
    else if (corruption > 25) corruptionMultiplier = 0.9;

    // 人口消耗食物
    // 每人每天基础消耗为 0.05；由于 1 秒 = 2 天，所以折算为每秒 0.1
    if (resources.population > 0) {
      const baseConsumption = resources.population * 0.1; // 0.1 食物/秒/人
      const finalConsumption = baseConsumption * stabilityMultiplier;
      rates.food! -= finalConsumption;
      details.food!.push({
        source: '人口消耗',
        rate: -finalConsumption,
        color: 'text-red-400',
        category: 'consumption'
      });
    }

    // 建筑产出
    Object.values(buildings).forEach((building: any) => {
      const buildingData = BUILDINGS[building.buildingId];
      if (buildingData?.produces) {
        let efficiency = 1;
        
        // 计算工人效率
        if (buildingData.canAssignWorkers && buildingData.maxWorkers) {
          const assignedWorkers = building.assignedWorkers || 0;
          const maxWorkers = buildingData.maxWorkers;
          efficiency = Math.max(0.1, assignedWorkers / maxWorkers);
        }
        
        Object.entries(buildingData.produces).forEach(([resource, baseRate]) => {
          const resourceKey = resource as keyof Resources;
          if (rates[resourceKey] !== undefined) {
            let finalRate = (baseRate as number) * building.count * efficiency;
            
            // 应用科技加成
            Object.values(technologies).forEach((tech: any) => {
              if (tech.researched && tech.effects) {
                tech.effects.forEach((effect: any) => {
                  if (effect.type === 'resource_multiplier' && effect.target === resource) {
                    finalRate *= effect.value;
                  }
                });
              }
            });
            
            // 应用稳定度和腐败度影响
            finalRate *= stabilityMultiplier * corruptionMultiplier;
            
            if (finalRate > 0) {
              rates[resourceKey]! += finalRate;
              const workerInfo = buildingData.canAssignWorkers 
                ? ` (${building.assignedWorkers || 0}/${buildingData.maxWorkers}工人)`
                : '';
              
              details[resourceKey]!.push({
                source: `${buildingData.name}${workerInfo}`,
                rate: finalRate,
                color: 'text-green-400',
                category: 'production'
              });
            }
          }
        });
      }
    });

    // 食物腐烂
    if (resources.food > 0) {
      const hasPreservation = technologies['food_preservation']?.researched;
      if (!hasPreservation) {
        const rotRate = resources.food * 0.001;
        rates.food! -= rotRate;
        details.food!.push({
          source: '腐烂',
          rate: -rotRate,
          color: 'text-orange-400',
          category: 'consumption'
        });
      }
    }

    this.resourceRates = rates;
    this.rateDetails = details;
  }

  // 应用资源速率变化
  applyResourceRates(deltaTime: number): void {
    const changes: Partial<Resources> = {};
    
    Object.entries(this.resourceRates).forEach(([key, rate]) => {
      const resourceKey = key as keyof Resources;
      if (rate !== undefined && rate !== 0) {
        const change = rate * deltaTime;
        const oldValue = this.resources[resourceKey];
        const newValue = Math.max(0, Math.min(oldValue + change, this.resourceLimits[resourceKey] || Infinity));
        
        if (newValue !== oldValue) {
          changes[resourceKey] = newValue - oldValue;
          this.resources[resourceKey] = newValue;
        }
      }
    });

    if (Object.keys(changes).length > 0) {
      this.recordChange({
        type: 'production',
        source: 'automatic',
        changes,
        timestamp: Date.now()
      });
      this.notifyListeners();
    }
  }

  // 记录资源变化
  private recordChange(event: ResourceChangeEvent): void {
    this.changeHistory.push(event);
    // 保留最近1000条记录
    if (this.changeHistory.length > 1000) {
      this.changeHistory = this.changeHistory.slice(-1000);
    }
  }

  // 添加监听器
  addListener(listener: (resources: Resources) => void): void {
    this.listeners.push(listener);
  }

  // 移除监听器
  removeListener(listener: (resources: Resources) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 通知监听器
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.resources));
  }

  // 获取变化历史
  getChangeHistory(limit: number = 100): ResourceChangeEvent[] {
    return this.changeHistory.slice(-limit);
  }

  // 重置资源管理器
  reset(resources: Resources, limits: ResourceLimits): void {
    this.resources = { ...resources };
    this.resourceLimits = { ...limits };
    this.resourceRates = {};
    this.rateDetails = {};
    this.changeHistory = [];
    this.notifyListeners();
  }
}

// 全局资源管理器实例
let globalResourceManager: ResourceManager | null = null;

// 获取全局资源管理器
export function getResourceManager(): ResourceManager {
  if (!globalResourceManager) {
    throw new Error('Resource manager not initialized');
  }
  return globalResourceManager;
}

// 初始化全局资源管理器
export function initializeResourceManager(resources: Resources, limits: ResourceLimits): ResourceManager {
  globalResourceManager = new ResourceManager(resources, limits);
  return globalResourceManager;
}

// 重置全局资源管理器
export function resetResourceManager(): void {
  globalResourceManager = null;
}