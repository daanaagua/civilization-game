// 建筑系统核心逻辑

import { 
  BuildingDefinition, 
  BuildingInstance, 
  BuildingManagementState,
  BuildingConstructionRequest,
  WorkerAssignmentRequest,
  BuildingProductionResult,
  BuildingCostResult,
  BuildingUnlockState,
  BuildingCategory
} from '../types/building';
import { Resources, GameState } from '../types/game';
import { BUILDING_DEFINITIONS, getBuildingDefinition, isBuildingUnlocked } from './building-data';
// Simple UUID generator to avoid external dependency issues
function generateId(): string {
  return 'building_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 建筑系统管理类
export class BuildingSystem {
  private gameState: GameState;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  // ===== 建筑解锁相关 =====
  
  /**
   * 检查建筑是否解锁
   */
  isBuildingUnlocked(buildingId: string): boolean {
    // 开发者模式：强制解锁
    if (this.gameState.settings?.devMode) return true;

    const researchedTechs = new Set(
      Object.entries(this.gameState.technologies)
        .filter(([_, tech]) => tech.researched)
        .map(([id, _]) => id)
    );
    return isBuildingUnlocked(buildingId, researchedTechs);
  }

  /**
   * 获取建筑解锁状态
   */
  getBuildingUnlockState(buildingId: string): BuildingUnlockState {
    const building = getBuildingDefinition(buildingId);
    if (!building) {
      throw new Error(`Building definition not found: ${buildingId}`);
    }

    const researchedTechs = new Set(
      Object.entries(this.gameState.technologies)
        .filter(([_, tech]) => tech.researched)
        .map(([id, _]) => id)
    );

    const isUnlocked = this.isBuildingUnlocked(buildingId);
    const technologyResearched = building.requiredTechnology ? 
      researchedTechs.has(building.requiredTechnology) : true;

    const unlockConditions = [];
    if (building.requiredTechnology) {
      unlockConditions.push({
        type: 'technology' as const,
        requirement: building.requiredTechnology,
        satisfied: technologyResearched
      });
    }

    return {
      buildingId,
      isUnlocked,
      requiredTechnology: building.requiredTechnology,
      technologyResearched,
      unlockConditions
    };
  }

  /**
   * 获取所有可用建筑
   */
  getAvailableBuildings(): BuildingDefinition[] {
    // 开发者模式：返回全部建筑定义
    if (this.gameState.settings?.devMode) {
      return Object.values(BUILDING_DEFINITIONS);
    }
    return Object.values(BUILDING_DEFINITIONS).filter(building =>
      this.isBuildingUnlocked(building.id)
    );
  }

  // ===== 建造相关 =====

  /**
   * 计算建筑建造成本
   */
  calculateBuildingCost(buildingId: string, quantity: number = 1): BuildingCostResult {
    const building = getBuildingDefinition(buildingId);
    if (!building) {
      throw new Error(`Building definition not found: ${buildingId}`);
    }

    const baseCost: Partial<Resources> = {};
    const finalCost: Partial<Resources> = {};
    const missingResources: Partial<Resources> = {};

    // 计算基础成本
    Object.entries(building.cost).forEach(([resource, cost]) => {
      const totalCost = cost * quantity;
      baseCost[resource as keyof Resources] = totalCost;
      finalCost[resource as keyof Resources] = totalCost;

      // 检查资源是否足够
      const currentAmount = this.gameState.resources[resource as keyof Resources] || 0;
      if (currentAmount < totalCost) {
        missingResources[resource as keyof Resources] = totalCost - currentAmount;
      }
    });

    const canAfford = Object.keys(missingResources).length === 0;

    return {
      baseCost,
      technologyDiscount: {}, // TODO: 实现科技折扣
      finalCost,
      canAfford,
      missingResources
    };
  }

  /**
   * 检查是否可以建造建筑
   */
  canBuildBuilding(buildingId: string, quantity: number = 1): {
    canBuild: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    
    // 检查建筑是否解锁
    if (!this.isBuildingUnlocked(buildingId)) {
      // 开发者模式放开
      if (!this.gameState.settings?.devMode) {
        reasons.push('建筑未解锁');
      }
    }

    // 检查建造限制
    const building = getBuildingDefinition(buildingId);
    if (building?.buildLimit) {
      const currentCount = this.getBuildingCount(buildingId);
      const maxCount = this.calculateBuildLimit(building);
      
      if (currentCount + quantity > maxCount) {
        reasons.push(`超出建造限制 (${currentCount + quantity}/${maxCount})`);
      }
    }

    // 检查资源
    const costResult = this.calculateBuildingCost(buildingId, quantity);
    if (!costResult.canAfford) {
      reasons.push('资源不足');
    }

    return {
      canBuild: reasons.length === 0,
      reasons
    };
  }

  /**
   * 计算建筑建造限制
   */
  private calculateBuildLimit(building: BuildingDefinition): number {
    if (!building.buildLimit) {
      return Infinity;
    }

    const { type, baseLimit = 0, populationRatio } = building.buildLimit;
    
    if (type === 'fixed') {
      return baseLimit;
    }
    
    if (type === 'population_based' && populationRatio) {
      const populationLimit = Math.floor(this.gameState.resources.population / populationRatio);
      return Math.max(baseLimit, populationLimit);
    }

    return baseLimit;
  }

  /**
   * 获取建筑数量
   */
  getBuildingCount(buildingId: string): number {
    return Object.values(this.gameState.buildings || {})
      .filter(instance => instance.buildingId === buildingId)
      .reduce((total, instance) => total + instance.count, 0);
  }

  /**
   * 建造建筑
   */
  constructBuilding(request: BuildingConstructionRequest): {
    success: boolean;
    message: string;
    instanceId?: string;
  } {
    const { buildingId, quantity = 1, assignWorkers = 0 } = request;
    
    // 检查是否可以建造
    const canBuild = this.canBuildBuilding(buildingId, quantity);
    if (!canBuild.canBuild) {
      return {
        success: false,
        message: `无法建造: ${canBuild.reasons.join(', ')}`
      };
    }

    // 扣除资源
    const costResult = this.calculateBuildingCost(buildingId, quantity);
    Object.entries(costResult.finalCost).forEach(([resource, cost]) => {
      this.gameState.resources[resource as keyof Resources] -= cost;
    });

    // 创建建筑实例
    const instanceId = generateId();
    const building = getBuildingDefinition(buildingId)!;
    
    const instance: BuildingInstance = {
      id: instanceId,
      buildingId,
      // 新增：实例数量以请求数量为初始值
      count: quantity,
      status: 'building',
      constructionProgress: 0,
      constructionStartTime: this.gameState.gameTime,
      assignedWorkers: Math.min(assignWorkers, building.maxWorkers),
      workerEfficiency: 1.0,
      level: 1,
      isActive: true,
      condition: 100,
      lastMaintenance: this.gameState.gameTime
    };

    // 添加到游戏状态
    if (!this.gameState.buildings) {
      this.gameState.buildings = {};
    }
    
    // 如果已存在相同建筑，增加数量；否则创建新实例
    const existingInstance = Object.values(this.gameState.buildings)
      .find(inst => inst.buildingId === buildingId && inst.status === 'completed');
    
    if (existingInstance) {
      existingInstance.count = (existingInstance.count || 1) + quantity;
    } else {
      this.gameState.buildings[instanceId] = { ...instance, count: quantity };
    }

    return {
      success: true,
      message: `开始建造 ${building.name} x${quantity}`,
      instanceId
    };
  }

  // ===== 工人分配相关 =====

  /**
   * 分配工人到建筑
   */
  assignWorkers(request: WorkerAssignmentRequest): {
    success: boolean;
    message: string;
  } {
    const { buildingInstanceId, workerCount } = request;
    
    const instance = this.gameState.buildings?.[buildingInstanceId];
    if (!instance) {
      return {
        success: false,
        message: '建筑实例不存在'
      };
    }

    const building = getBuildingDefinition(instance.buildingId);
    if (!building) {
      return {
        success: false,
        message: '建筑定义不存在'
      };
    }

    // 检查工人数量限制
    if (workerCount > building.maxWorkers) {
      return {
        success: false,
        message: `超出最大工人数限制 (${workerCount}/${building.maxWorkers})`
      };
    }

    // 检查可用工人数
    const availableWorkers = this.getAvailableWorkers();
    const additionalWorkers = workerCount - instance.assignedWorkers;
    
    if (additionalWorkers > availableWorkers) {
      return {
        success: false,
        message: `可用工人不足 (需要${additionalWorkers}, 可用${availableWorkers})`
      };
    }

    // 分配工人
    instance.assignedWorkers = workerCount;
    
    return {
      success: true,
      message: `成功分配 ${workerCount} 名工人到 ${building.name}`
    };
  }

  /**
   * 获取可用工人数
   */
  getAvailableWorkers(): number {
    const totalWorkers = this.gameState.resources.population;
    const assignedWorkers = Object.values(this.gameState.buildings || {})
      .reduce((total, instance) => total + instance.assignedWorkers, 0);
    
    return Math.max(0, totalWorkers - assignedWorkers);
  }

  /**
   * 获取工人分配统计
   */
  getWorkerAssignmentStats() {
    const totalWorkers = this.gameState.resources.population;
    const assignments: Record<string, number> = {};
    let assignedWorkers = 0;

    Object.values(this.gameState.buildings || {}).forEach(instance => {
      if (instance.assignedWorkers > 0) {
        const key = instance.id ?? instance.buildingId;
        assignments[key] = instance.assignedWorkers;
        assignedWorkers += instance.assignedWorkers;
      }
    });

    return {
      totalWorkers,
      assignedWorkers,
      availableWorkers: totalWorkers - assignedWorkers,
      assignments
    };
  }

  // ===== 生产计算相关 =====

  /**
   * 计算建筑生产
   */
  calculateBuildingProduction(instanceId: string): BuildingProductionResult {
    const instance = this.gameState.buildings?.[instanceId];
    if (!instance) {
      throw new Error(`Building instance not found: ${instanceId}`);
    }

    const building = getBuildingDefinition(instance.buildingId);
    if (!building || !building.production) {
      return {
        buildingInstanceId: instanceId,
        production: [],
        totalOutput: {}
      };
    }

    const production = building.production.map(prod => {
      const baseRate = prod.baseRate * instance.assignedWorkers;
      const efficiency = this.calculateBuildingEfficiency(instance);
      const actualRate = baseRate * efficiency;

      return {
        resource: prod.resource,
        baseRate: prod.baseRate,
        actualRate,
        efficiency
      };
    });

    const totalOutput: Partial<Resources> = {};
    production.forEach(prod => {
      totalOutput[prod.resource] = (totalOutput[prod.resource] || 0) + prod.actualRate;
    });

    return {
      buildingInstanceId: instanceId,
      production,
      totalOutput
    };
  }

  /**
   * 计算建筑效率
   */
  private calculateBuildingEfficiency(instance: BuildingInstance): number {
    const workerEff = instance.workerEfficiency ?? 1;
    const condition = instance.condition ?? 100;
    let efficiency = workerEff;
    
    // 建筑状况影响效率
    efficiency *= condition / 100;
    
    // TODO: 添加科技加成
    // TODO: 添加其他效率因子
    
    return Math.max(0, efficiency);
  }

  /**
   * 计算所有建筑的总生产
   */
  calculateTotalProduction(): Partial<Resources> {
    const totalProduction: Partial<Resources> = {};

    Object.keys(this.gameState.buildings || {}).forEach(instanceId => {
      const result = this.calculateBuildingProduction(instanceId);
      Object.entries(result.totalOutput).forEach(([resource, amount]) => {
        totalProduction[resource as keyof Resources] = 
          (totalProduction[resource as keyof Resources] || 0) + amount;
      });
    });

    return totalProduction;
  }

  // ===== 储存计算相关 =====

  /**
   * 计算建筑储存加成
   */
  calculateStorageBonus(): Partial<Resources> {
    const storageBonus: Partial<Resources> = {};

    Object.values(this.gameState.buildings || {}).forEach(instance => {
      if (instance.status !== 'completed') return;
      
      const building = getBuildingDefinition(instance.buildingId);
      if (!building?.storage) return;

      building.storage.forEach(storage => {
        const capacity = storage.capacity * (instance.count || 1);
        
        if (storage.resource === 'all') {
          // 对所有资源应用加成
          Object.keys(this.gameState.resources).forEach(resource => {
            if (storage.isPercentage) {
              const currentLimit = this.gameState.resourceLimits[resource as keyof Resources] || 0;
              storageBonus[resource as keyof Resources] = 
                (storageBonus[resource as keyof Resources] || 0) + (currentLimit * capacity / 100);
            } else {
              storageBonus[resource as keyof Resources] = 
                (storageBonus[resource as keyof Resources] || 0) + capacity;
            }
          });
        } else {
          // 对特定资源应用加成
          if (storage.isPercentage) {
            const currentLimit = this.gameState.resourceLimits[storage.resource] || 0;
            storageBonus[storage.resource] = 
              (storageBonus[storage.resource] || 0) + (currentLimit * capacity / 100);
          } else {
            storageBonus[storage.resource] = 
              (storageBonus[storage.resource] || 0) + capacity;
          }
        }
      });
    });

    return storageBonus;
  }

  // ===== 建筑管理状态 =====

  /**
   * 获取建筑管理状态
   */
  getBuildingManagementState(): BuildingManagementState {
    const buildings = this.gameState.buildings || {};
    const workerStats = this.getWorkerAssignmentStats();
    const totalProduction = this.calculateTotalProduction();
    const totalStorage = this.calculateStorageBonus();

    // 计算建筑统计
    const buildingsByCategory: Record<BuildingCategory, number> = {
      housing: 0,
      production: 0,
      storage: 0,
      functional: 0,
      military: 0,
      cultural: 0
    };

    Object.values(buildings).forEach(instance => {
      const building = getBuildingDefinition(instance.buildingId);
      if (building) {
        buildingsByCategory[building.category] += instance.count || 1;
      }
    });

    // 计算建造限制状态
    const buildLimits: Record<string, { current: number; maximum: number; canBuild: boolean }> = {};
    Object.values(BUILDING_DEFINITIONS).forEach(building => {
      if (building.buildLimit) {
        const current = this.getBuildingCount(building.id);
        const maximum = this.calculateBuildLimit(building);
        buildLimits[building.id] = {
          current,
          maximum,
          canBuild: current < maximum && (this.gameState.settings?.devMode ? true : this.isBuildingUnlocked(building.id))
        };
      }
    });

    return {
      buildings,
      constructionQueue: [], // TODO: 实现建造队列
      workerAssignment: {
        totalWorkers: workerStats.totalWorkers,
        assignedWorkers: workerStats.assignedWorkers,
        availableWorkers: workerStats.availableWorkers,
        assignments: workerStats.assignments
      },
      statistics: {
        totalBuildings: Object.values(buildings).reduce((total, instance) => total + (instance.count || 1), 0),
        buildingsByCategory,
        totalProduction,
        totalStorage,
        totalMaintenance: {} // TODO: 实现维护成本
      },
      buildLimits
    };
  }

  // ===== 建筑更新相关 =====

  /**
   * 更新建筑状态（每游戏循环调用）
   */
  updateBuildings(deltaTime: number): void {
    Object.values(this.gameState.buildings || {}).forEach(instance => {
      this.updateBuildingInstance(instance, deltaTime);
    });
  }

  /**
   * 更新单个建筑实例
   */
  private updateBuildingInstance(instance: BuildingInstance, deltaTime: number): void {
    const building = getBuildingDefinition(instance.buildingId);
    if (!building) return;

    // 更新建造进度
    if (instance.status === 'building') {
      const buildTimeInSeconds = building.buildTime * 24 * 60 * 60; // 转换为秒
      const progressIncrement = (deltaTime / buildTimeInSeconds) * 100;
      
      instance.constructionProgress = Math.min(100, (instance.constructionProgress || 0) + progressIncrement);
      
      if (instance.constructionProgress >= 100) {
        instance.status = 'completed';
        instance.constructionProgress = undefined;
        instance.constructionStartTime = undefined;
      }
    }

    // 更新建筑状况（随时间缓慢下降）
    if (instance.status === 'completed') {
      const conditionDecay = 0.01 * deltaTime / (24 * 60 * 60); // 每天下降0.01
      const currentCondition = instance.condition ?? 100;
      instance.condition = Math.max(0, currentCondition - conditionDecay);
    }
  }
}

// 建筑系统工具函数
export const BuildingUtils = {
  /**
   * 格式化建筑成本显示
   */
  formatBuildingCost(cost: Partial<Resources>): string {
    return Object.entries(cost)
      .map(([resource, amount]) => `${amount} ${resource}`)
      .join(', ');
  },

  /**
   * 获取建筑分类颜色
   */
  getBuildingCategoryColor(category: BuildingCategory): string {
    const colors = {
      housing: 'bg-blue-500',
      production: 'bg-green-500',
      storage: 'bg-yellow-500',
      functional: 'bg-purple-500',
      military: 'bg-red-500',
      cultural: 'bg-indigo-500'
    };
    return colors[category] || 'bg-gray-500';
  },

  /**
   * 计算建造时间显示
   */
  formatBuildTime(days: number): string {
    if (days < 30) {
      return `${days}天`;
    } else {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      return remainingDays > 0 ? `${months}月${remainingDays}天` : `${months}月`;
    }
  }
};