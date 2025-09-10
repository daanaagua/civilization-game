// 游戏核心类型定义

// 资源类型
export interface Resources {
  food: number;
  wood: number;
  stone: number;
  tools: number;
  population: number;
  housing: number;
}

// 资源上限
export interface ResourceLimits {
  food: number;
  wood: number;
  stone: number;
  tools: number;
  population: number;
  housing: number;
}

// 资源生产率
export interface ResourceRates {
  food: number;
  wood: number;
  stone: number;
  tools: number;
  population: number;
}

// 建筑类型
export interface Building {
  id: string;
  name: string;
  description: string;
  type: BuildingType;
  cost: Partial<Resources>;
  produces?: Partial<ResourceRates>;
  requires?: string[]; // 前置科技
  maxCount?: number;
  unlocked: boolean;
  canAssignWorkers?: boolean; // 是否可以分配工人
  maxWorkers?: number; // 每个建筑最大工人数
}

export type BuildingType = 
  | 'housing'
  | 'production'
  | 'military'
  | 'cultural'
  | 'special'
  | 'storage';

// 建筑实例
export interface BuildingInstance {
  buildingId: string;
  count: number;
  level: number;
  assignedWorkers?: number; // 分配的工人数量
}

// 科技类型
export interface Technology {
  id: string;
  name: string;
  description: string;
  category: TechnologyCategory;
  cost: Partial<Resources>;
  researchTime: number; // 研究时间（秒）
  requires?: string[]; // 前置科技
  unlocks?: string[]; // 解锁的建筑或科技
  effects?: TechnologyEffect[];
  unlocked: boolean;
  researched: boolean;
}

export type TechnologyCategory = 
  | 'survival'
  | 'agriculture'
  | 'crafting'
  | 'construction'
  | 'military'
  | 'culture'
  | 'social'
  | 'knowledge'
  | 'metalworking'
  | 'production';

export interface TechnologyEffect {
  type: 'resource_multiplier' | 'building_unlock' | 'population_growth' | 'stability_bonus';
  target: string;
  value: number;
}

// 人物类型
export interface Character {
  id: string;
  name: string;
  type: CharacterType;
  level: number;
  experience: number;
  skills: CharacterSkills;
  traits: string[];
  isActive: boolean;
  description: string;
}

export type CharacterType = 
  | 'chief'
  | 'elder'
  | 'craftsman'
  | 'warrior'
  | 'farmer'
  | 'builder';

export interface CharacterSkills {
  leadership: number;
  crafting: number;
  farming: number;
  building: number;
  military: number;
  research: number;
}

// 游戏状态
export interface GameState {
  // 基础信息
  civilizationName: string;
  currentAge: GameAge;
  gameTime: number; // 游戏时间（秒）
  
  // 资源
  resources: Resources;
  resourceRates: ResourceRates;
  resourceLimits: ResourceLimits;
  
  // 建筑
  buildings: Record<string, BuildingInstance>;
  
  // 科技
  technologies: Record<string, Technology>;
  currentResearch?: {
    technologyId: string;
    progress: number;
    startTime: number;
  };
  
  // 人物
  characters: Record<string, Character>;
  
  // 核心系统
  stability: number;
  corruption: number;
  
  // 成就
  achievements: string[];
  
  // 继承点系统
  inheritancePoints: number;
  
  // Buff系统
  buffs: Record<string, Buff>;

  // 事件系统
  activeEvents: ActiveEvent[]; // 当前活跃的暂停事件
  events: GameEventInstance[]; // 历史事件记录（包括已处理的暂停事件和不暂停事件）
  recentEvents: NonPauseEvent[]; // 最近的不暂停事件（用于显示）
  // currentPausingEvent 已被 activeEvents 替代
  
  // 游戏设置
  settings: GameSettings;
}

export type GameAge = 
  | 'stone'
  | 'bronze'
  | 'iron'
  | 'classical'
  | 'medieval';

export interface GameSettings {
  autoSave: boolean;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  gameSpeed: number; // 游戏速度倍数
}

// 游戏事件


// 成就类型
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  condition: AchievementCondition;
  reward?: AchievementReward;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export type AchievementCategory = 
  | 'development'
  | 'technology'
  | 'military'
  | 'culture'
  | 'special';

export interface AchievementCondition {
  type: 'resource_total' | 'building_count' | 'technology_count' | 'population_size' | 'time_played';
  target: string;
  value: number;
}

export interface AchievementReward {
  type: 'inheritance_points' | 'resource_bonus' | 'technology_unlock';
  value?: number;
  inheritancePoints?: number;
  resources?: Partial<Resources>;
}

// UI 相关类型
export interface UIState {
  activeTab: GameTab;
  selectedBuilding?: string;
  selectedTechnology?: string;
  showEventModal: boolean;
  currentEvent?: PauseEvent;
  notifications: Notification[];
  
  // 转生系统UI状态
  showRebirthConfirmation: boolean;
  showInheritanceShop: boolean;
}

export type GameTab = 
  | 'overview'
  | 'buildings'
  | 'technology'
  | 'characters'
  | 'achievements';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
}

// Buff系统类型定义
export interface Buff {
  id: string;
  name: string;
  description: string;
  source: BuffSource;
  effects: BuffEffect[];
  duration?: number; // 持续时间（秒），undefined表示永久
  startTime: number; // 开始时间
  isActive: boolean;
}

export interface BuffSource {
  type: BuffSourceType;
  id: string; // 来源的具体ID（如事件ID、人物ID等）
  name: string; // 来源名称（如"丰收"、"酋长"等）
}

export type BuffSourceType = 
  | 'inheritance' // 继承点
  | 'event' // 游戏事件
  | 'character' // 人物特性
  | 'building' // 建筑
  | 'technology' // 科技
  | 'achievement' // 成就奖励
  | 'dungeon'; // 副本奖励

export interface BuffEffect {
  type: BuffEffectType;
  target: string; // 影响目标（如'food'、'stability'等）
  value: number; // 效果数值
  isPercentage: boolean; // 是否为百分比效果
}

export type BuffEffectType = 
  | 'resource_production' // 资源生产
  | 'resource_limit' // 资源上限
  | 'stability' // 稳定度
  | 'corruption' // 腐败度
  | 'population_growth' // 人口增长
  | 'building_efficiency' // 建筑效率
  | 'research_speed' // 研究速度
  | 'military_strength'; // 军事力量

// Buff摘要，用于UI显示
export interface BuffSummary {
  totalEffects: Record<string, number>; // 汇总的效果
  sources: BuffSource[]; // 所有buff来源
  activeBuffs: Buff[]; // 当前生效的buff列表
}

// 游戏事件实例
export interface GameEventInstance {
  id: string;
  name: string;
  description: string;
  timestamp: number;
  type: 'positive' | 'negative' | 'neutral';
  effects?: {
    resources?: Partial<Resources>;
    stability?: number;
    corruption?: number;
  };
}

// 事件选项
export interface EventOption {
  id: string;
  text: string;
  description?: string;
  requirements?: {
    attribute?: string; // 属性要求 (如 'leadership', 'intelligence')
    dice?: string; // 骰子要求 (如 '1D6', '1D8')
    difficulty?: number; // 难度值
    cost?: Partial<Resources>; // 资源消耗
  };
  outcomes: {
    success?: {
      description: string;
      effects: {
        resources?: Partial<Resources>;
        stability?: number;
        corruption?: number;
        characterEffects?: {
          characterId: string;
          attributeChanges?: Record<string, number>;
          healthChange?: number;
        }[];
        buffs?: {
          type: string;
          value: number;
          duration: number; // 持续时间（月）
        }[];
      };
    };
    failure?: {
      description: string;
      effects: {
        resources?: Partial<Resources>;
        stability?: number;
        corruption?: number;
        characterEffects?: {
          characterId: string;
          attributeChanges?: Record<string, number>;
          healthChange?: number;
        }[];
      };
    };
    guaranteed?: {
      description: string;
      effects: {
        resources?: Partial<Resources>;
        stability?: number;
        corruption?: number;
      };
    };
  };
}

// 暂停事件（需要玩家选择）
export interface PauseEvent {
  id: string;
  name: string;
  description: string;
  category: 'character' | 'diplomatic' | 'crisis';
  characterId?: string; // 相关角色ID
  options: EventOption[];
  probability: number;
  requirements?: {
    population?: { min?: number; max?: number };
    stability?: { min?: number; max?: number };
    corruption?: { min?: number; max?: number };
    resources?: Partial<Record<keyof Resources, { min?: number; max?: number }>>;
    technologies?: { has?: string[]; not?: string[] };
    buildings?: { has?: string[]; count?: number };
    characters?: { has?: string[]; not?: string[] };
  };
}

// 不暂停事件（自动处理）
export interface NonPauseEvent {
  id: string;
  name: string;
  description: string;
  category: 'discovery' | 'disaster' | 'exploration' | 'resource';
  type: 'positive' | 'negative' | 'neutral';
  probability: number;
  requirements?: {
    population?: { min?: number; max?: number };
    stability?: { min?: number; max?: number };
    corruption?: { min?: number; max?: number };
    resources?: Partial<Record<keyof Resources, { min?: number; max?: number }>>;
    technologies?: { has?: string[]; not?: string[] };
    buildings?: { has?: string[]; count?: number };
    characters?: { has?: string[]; not?: string[] };
  };
  effects: {
    resources?: Partial<Resources>;
    stability?: number;
    corruption?: number;
    discoveries?: string[]; // 发现的地点ID
    casualties?: {
      type: string; // 损失的单位类型
      count: number;
    }[];
  };
}

// 活跃事件（当前正在处理的暂停事件）
export interface ActiveEvent {
  event: PauseEvent;
  triggeredAt: number;
  characterInvolved?: Character;
}