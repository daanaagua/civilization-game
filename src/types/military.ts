// 军队系统类型定义

export interface UnitType {
  id: string;
  name: string;
  description: string;
  unlockCondition: string;
  recruitmentCost: ResourceCost;
  trainingTime: number; // 天数
  maintenanceCost: MaintenanceCost;
  baseStats: UnitStats;
  combatTraits: string[];
  category: 'basic' | 'advanced' | 'elite' | 'special';
  isExplorer: boolean; // 是否为探索单位（侦察兵/冒险家）
}

export interface ResourceCost {
  food?: number;
  wood?: number;
  stone?: number;
  iron?: number;
  tools?: number;
  leather?: number;
  copper?: number;
  horses?: number;
  currency?: number;
}

export interface MaintenanceCost {
  food?: number; // 每天
  tools?: number; // 每月
  iron?: number; // 每月
  horseFeed?: number; // 每天（马匹饲料）
}

export interface UnitStats {
  health: number;
  attack: number;
  defense: number;
  morale: number;
  speed?: 'slow' | 'normal' | 'fast';
}

export interface MilitaryUnit {
  id: string;
  typeId: string;
  count: number;
  currentHealth: number;
  currentMorale: number;
  status: 'training' | 'defending' | 'exploring' | 'attacking';
  trainingProgress?: number; // 0-100
  assignedPopulation: number; // 占用的人口数量
}

export interface TrainingQueue {
  unitTypeId: string;
  quantity: number;
  startTime: number;
  endTime: number;
  assignedPopulation: number;
}

export interface MilitaryState {
  units: MilitaryUnit[];
  trainingQueue: TrainingQueue[];
  availableUnitTypes: string[]; // 已解锁的兵种
  isTraining: boolean; // 是否正在训练
  currentTrainingType?: string; // 当前训练的兵种
}

// 战斗相关类型
export interface CombatUnit {
  id: string;
  typeId: string;
  health: number;
  maxHealth: number;
  morale: number;
  maxMorale: number;
  attack: number;
  defense: number;
  status: 'active' | 'retreated' | 'dead';
}

export interface CombatResult {
  victory: boolean;
  survivingUnits: CombatUnit[];
  casualties: number; // 死亡数量
  retreated: number; // 溃退数量
  rewards?: ResourceCost;
  experience?: number;
}

// 探索相关类型
export interface ExplorationResult {
  type: 'dungeon' | 'nation' | 'event' | 'nothing';
  id?: string;
  name?: string;
  description?: string;
  discovered: boolean;
}

export interface DiscoveredLocation {
  id: string;
  type: 'dungeon' | 'nation';
  name: string;
  description: string;
  difficulty?: number;
  rewards?: ResourceCost;
  enemies?: EnemyUnit[];
  discoveredAt: number;
}

export interface EnemyUnit {
  name: string;
  count: number;
  health: number;
  attack: number;
  morale: number;
}

export interface ExplorationState {
  discoveredLocations: DiscoveredLocation[];
  explorationHistory: ExplorationResult[];
  availableExplorers: string[]; // 可用的探索者ID
}