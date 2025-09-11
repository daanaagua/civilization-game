// 游戏核心类型定义

// 资源类型
export interface Resource {
  id: string;
  name: string;
  icon: string;
  description: string;
  amount: number;
  maxStorage: number;
  productionRate: number; // 每秒生产率
  canManualCollect: boolean;
}

// 建筑类型
export interface Building {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: BuildingCategory;
  cost: ResourceCost[];
  effects: BuildingEffect[];
  unlockRequirements: Requirement[];
  count: number;
  maxCount?: number;
}

export interface BuildingEffect {
  type: 'resource_production' | 'storage_increase' | 'population_capacity' | 'stability' | 'other';
  target?: string; // 资源ID或其他目标
  value: number;
  description: string;
}

export type BuildingCategory = 'housing' | 'production' | 'storage' | 'military' | 'culture' | 'special';

// 科技类型
export interface Technology {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: TechnologyCategory;
  cost: ResourceCost[];
  researchTime: number; // 研究时间（秒）
  effects: TechnologyEffect[];
  unlockRequirements: Requirement[];
  prerequisites: string[]; // 前置科技ID
  isResearched: boolean;
  isResearching: boolean;
  researchProgress: number;
}

export interface TechnologyEffect {
  type: 'unlock_building' | 'unlock_resource' | 'production_bonus' | 'storage_bonus' | 'other';
  target?: string;
  value: number;
  description: string;
}

export type TechnologyCategory = 'basic' | 'agriculture' | 'crafting' | 'military' | 'culture' | 'advanced';

// 人物类型
export interface Character {
  id: string;
  name: string;
  avatar: string;
  description: string;
  rarity: CharacterRarity;
  traits: CharacterTrait[];
  effects: CharacterEffect[];
  unlockRequirements: Requirement[];
  isUnlocked: boolean;
  isActive: boolean;
}

export interface CharacterTrait {
  id: string;
  name: string;
  description: string;
  effects: CharacterEffect[];
}

export interface CharacterEffect {
  type: 'resource_production' | 'research_speed' | 'building_efficiency' | 'stability' | 'other';
  target?: string;
  value: number;
  description: string;
}

export type CharacterRarity = 'common' | 'rare' | 'epic' | 'legendary';

// 事件类型
export interface GameEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  choices: EventChoice[];
  requirements: Requirement[];
  cooldown: number; // 冷却时间（秒）
  lastTriggered: number;
}

export interface EventChoice {
  id: string;
  text: string;
  description: string;
  effects: EventEffect[];
  requirements?: Requirement[];
}

export interface EventEffect {
  type: 'resource_change' | 'stability_change' | 'unlock_content' | 'buff' | 'other';
  target?: string;
  value: number;
  duration?: number; // 持续时间（秒），0表示永久
  description: string;
}

export type EventType = 'random' | 'milestone' | 'crisis' | 'opportunity';

// 成就类型
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirements: Requirement[];
  rewards: AchievementReward[];
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface AchievementReward {
  type: 'inheritance_points' | 'permanent_buff' | 'unlock_content';
  value: number;
  description: string;
}

export type AchievementCategory = 'development' | 'technology' | 'military' | 'culture' | 'special';

// Buff类型
export interface Buff {
  id: string;
  name: string;
  description: string;
  icon: string;
  effects: BuffEffect[];
  duration: number; // 持续时间（秒），0表示永久
  startTime: number;
  source: BuffSource;
}

export interface BuffEffect {
  type: 'resource_production' | 'building_efficiency' | 'research_speed' | 'stability' | 'other';
  target?: string;
  multiplier: number; // 倍数加成
  description: string;
}

export interface BuffSource {
  type: 'inheritance' | 'event' | 'character' | 'building' | 'technology';
  id: string;
}

// 通用类型
export interface ResourceCost {
  resourceId: string;
  amount: number;
}

export interface Requirement {
  type: 'resource' | 'building' | 'technology' | 'population' | 'stability' | 'time' | 'other';
  target?: string;
  value: number;
  operator: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
}

// 游戏状态类型
export interface GameState {
  // 基础信息
  gameStartTime: number;
  lastUpdateTime: number;
  isPaused: boolean;
  gameSpeed: number;
  
  // 资源
  resources: Record<string, Resource>;
  
  // 建筑
  buildings: Record<string, Building>;
  
  // 科技
  technologies: Record<string, Technology>;
  currentResearch: string | null;
  
  // 人物
  characters: Record<string, Character>;
  
  // 事件
  events: Record<string, GameEvent>;
  activeEvents: string[];
  
  // 成就
  achievements: Record<string, Achievement>;
  
  // Buff
  buffs: Record<string, Buff>;
  
  // 继承系统
  inheritancePoints: number;
  totalInheritancePoints: number;
  
  // 稳定度
  stability: number;
  maxStability: number;
  
  // 人口
  population: number;
  maxPopulation: number;
  
  // 统计数据
  statistics: GameStatistics;
}

export interface GameStatistics {
  totalPlayTime: number;
  totalResourcesCollected: Record<string, number>;
  totalBuildingsBuilt: Record<string, number>;
  totalTechnologiesResearched: number;
  totalEventsTriggered: number;
  totalAchievementsUnlocked: number;
  currentGeneration: number;
}

// UI相关类型
export interface TooltipData {
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
}