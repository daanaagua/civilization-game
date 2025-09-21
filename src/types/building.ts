// 建筑系统类型定义

import { Resources } from './game';

// 建筑分类
export type BuildingCategory = 
  | 'housing'     // 居住建筑
  | 'production'  // 生产建筑
  | 'storage'     // 储存建筑
  | 'functional'  // 功能建筑
  | 'military'    // 军事建筑
  | 'cultural';   // 文化建筑

// 建筑定义
export interface BuildingDefinition {
  id: string;
  name: string;
  description: string;
  category: BuildingCategory;
  
  // 建造需求
  cost: Partial<Resources>;
  buildTime: number; // 建造时间（天）
  requiredTechnology?: string; // 前置科技
  
  // 人口相关
  maxWorkers: number; // 最大工人数（0表示不可分配工人）
  
  // 建造限制
  buildLimit?: {
    type: 'fixed' | 'population_based'; // 固定数量 | 基于人口
    baseLimit?: number; // 基础限制数量
    populationRatio?: number; // 每N人口可建造1个
  };
  
  // 建筑效果
  effects?: BuildingEffect[];
  
  // 资源产出（仅生产建筑）
  production?: {
    resource: keyof Resources;
    baseRate: number; // 基础产出率（每工人每天）
    maxOutput?: number; // 最大产出限制
  }[];
  
  // 储存加成（仅储存建筑）
  storage?: {
    resource: keyof Resources | 'all';
    capacity: number; // 增加的储存容量
    isPercentage?: boolean; // 是否为百分比加成
  }[];
  
  // 特殊功能
  specialEffects?: {
    type: 'stability' | 'research_speed' | 'defense' | 'population_growth';
    value: number;
    description: string;
  }[];
}

// 建筑效果类型
export interface BuildingEffect {
  type: BuildingEffectType;
  target: string;
  value: number;
  description: string;
  isPercentage?: boolean;
}

export type BuildingEffectType = 
  | 'resource_production'  // 资源生产加成
  | 'resource_storage'     // 资源储存加成
  | 'stability_bonus'      // 稳定度加成
  | 'research_bonus'       // 研究加成
  | 'defense_bonus'        // 防御加成
  | 'population_capacity'  // 人口容量
  | 'worker_efficiency';   // 工人效率加成

// 建筑实例
export interface BuildingInstance {
  // 兼容旧聚合条目：id 可选
  id?: string; // 实例ID
  buildingId: string; // 建筑定义ID

  // 可选：显示/兼容字段（store 有写入）
  name?: string;

  // 实例数量（同类建筑的数量汇总）
  count: number; // 旧系统聚合，现系统可置为 1

  // 建造状态
  status?: 'building' | 'completed' | 'upgrading';
  constructionProgress?: number; // 建造进度（0-100）
  constructionStartTime?: number; // 建造开始时间

  // 兼容新建造路径：立即完成且有布尔标记
  isConstructed?: boolean;
  lastProductionTime?: number;

  // 工人分配
  assignedWorkers: number; // 当前分配的工人数（默认0）
  workerEfficiency?: number; // 工人效率（默认1.0）

  // 建筑等级和升级
  level: number; // 建筑等级（默认1）
  upgradeProgress?: number; // 升级进度（0-100）
  upgrades?: any[]; // 兼容 store 中数组写法

  // 生产状态（仅生产建筑）
  isActive?: boolean; // 是否激活生产
  currentProduction?: {
    resource: keyof Resources;
    rate: number; // 当前生产率
    totalProduced: number; // 累计产出
  }[];

  // 建筑效果（兼容 store 的对象写法）
  effects?: any;

  // 维护成本
  maintenanceCost?: Partial<Resources>; // 每天维护成本

  // 建筑状态
  condition?: number; // 建筑状况（0-100）
  lastMaintenance?: number; // 上次维护时间
}

// 建筑管理状态
export interface BuildingManagementState {
  // 所有建筑实例
  buildings: Record<string, BuildingInstance>;
  
  // 建造队列
  constructionQueue: {
    buildingId: string;
    priority: number;
    estimatedCompletion: number;
  }[];
  
  // 工人分配
  workerAssignment: {
    totalWorkers: number; // 总工人数
    assignedWorkers: number; // 已分配工人数
    availableWorkers: number; // 可用工人数
    assignments: Record<string, number>; // 建筑ID -> 分配的工人数
  };
  
  // 建筑统计
  statistics: {
    totalBuildings: number;
    buildingsByCategory: Record<BuildingCategory, number>;
    totalProduction: Partial<Resources>;
    totalStorage: Partial<Resources>;
    totalMaintenance: Partial<Resources>;
  };
  
  // 建筑限制状态
  buildLimits: Record<string, {
    current: number; // 当前数量
    maximum: number; // 最大数量
    canBuild: boolean; // 是否可以建造
  }>;
}

// 建筑建造请求
export interface BuildingConstructionRequest {
  buildingId: string;
  quantity?: number; // 建造数量（默认1）
  priority?: number; // 优先级（默认0）
  assignWorkers?: number; // 预分配工人数
}

// 工人分配请求
export interface WorkerAssignmentRequest {
  buildingInstanceId: string;
  workerCount: number;
}

// 建筑升级请求
export interface BuildingUpgradeRequest {
  buildingInstanceId: string;
  targetLevel: number;
}

// 建筑维护请求
export interface BuildingMaintenanceRequest {
  buildingInstanceId: string;
  maintenanceType: 'basic' | 'advanced' | 'complete';
}

// 建筑效率计算结果
export interface BuildingEfficiencyResult {
  baseEfficiency: number;
  workerBonus: number;
  technologyBonus: number;
  conditionPenalty: number;
  finalEfficiency: number;
}

// 建筑产出计算结果
export interface BuildingProductionResult {
  buildingInstanceId: string;
  production: {
    resource: keyof Resources;
    baseRate: number;
    actualRate: number;
    efficiency: number;
  }[];
  totalOutput: Partial<Resources>;
}

// 建筑成本计算结果
export interface BuildingCostResult {
  baseCost: Partial<Resources>;
  technologyDiscount: Partial<Resources>;
  finalCost: Partial<Resources>;
  canAfford: boolean;
  missingResources: Partial<Resources>;
}

// 建筑解锁状态
export interface BuildingUnlockState {
  buildingId: string;
  isUnlocked: boolean;
  requiredTechnology?: string;
  technologyResearched: boolean;
  unlockConditions: {
    type: 'technology' | 'population' | 'building' | 'resource';
    requirement: string | number;
    satisfied: boolean;
  }[];
}