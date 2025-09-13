// 人物系统类型定义

// 人物类型枚举
export enum CharacterType {
  RULER = 'ruler',           // 统治者
  RESEARCH_LEADER = 'research_leader',  // 科研领袖
  FAITH_LEADER = 'faith_leader',        // 信仰领袖
  MAGE_LEADER = 'mage_leader',          // 法师领袖
  CIVIL_LEADER = 'civil_leader',        // 文官领袖
  GENERAL = 'general',                  // 将领
  DIPLOMAT = 'diplomat'                 // 外交官
}

// 人物职位枚举
export enum CharacterPosition {
  // 初始职位
  CHIEF = 'chief',                    // 酋长
  ELDER = 'elder',                    // 长老
  HIGH_PRIEST = 'high_priest',        // 大祭司
  ARCHMAGE = 'archmage',              // 大法师
  CHIEF_JUDGE = 'chief_judge',        // 大法官
  GENERAL = 'general',                // 将军
  DIPLOMAT = 'diplomat',              // 外交官
  
  // 后续职位
  KING = 'king',                      // 国王
  EMPEROR = 'emperor',                // 皇帝
  PRESIDENT = 'president',            // 总统
  GRAND_SCHOLAR = 'grand_scholar',    // 大学者
  ACADEMY_HEAD = 'academy_head',      // 皇家科学院长
  ARCHBISHOP = 'archbishop',          // 大主教
  POPE = 'pope',                      // 教皇
  ROYAL_ARCHMAGE = 'royal_archmage',  // 皇家大法师
  SPEAKER = 'speaker',                // 议长
  GRAND_MARSHAL = 'grand_marshal'     // 大元帅
}

// 人物属性
export interface CharacterAttributes {
  force: number;      // 武力 (0-10)
  intelligence: number; // 智力 (0-10)
  charisma: number;   // 魅力 (0-10)
}

// 人物健康状态
export enum HealthStatus {
  GOOD = 'good',      // 好 (健康度 > 70)
  FAIR = 'fair',      // 中 (40 < 健康度 ≤ 70)
  POOR = 'poor'       // 差 (健康度 ≤ 40)
}

// 人物特性
export interface CharacterTrait {
  id: string;
  name: string;
  description: string;
  type: 'positive' | 'negative';
  effects: CharacterEffect[];
}

// 人物Buff
export interface CharacterBuff {
  id: string;
  name: string;
  description: string;
  source: 'event' | 'item' | 'building' | 'technology';
  duration: number; // -1 表示永久
  effects: CharacterEffect[];
  remainingTurns?: number;
}

// 人物效果
export interface CharacterEffect {
  type: 'attribute' | 'global' | 'military' | 'economic' | 'research' | 'stability' | 'corruption';
  target: string; // 效果目标
  value: number;  // 效果数值
  isPercentage: boolean; // 是否为百分比效果
  description: string;
}

// 人物解锁条件
export interface CharacterUnlockCondition {
  requiredTechnology?: string[];
  requiredBuilding?: string[];
  requiredPopulation?: number;
  requiredStability?: number;
  requiredAge?: number;
}

// 人物数据
export interface Character {
  id: string;
  name: string;
  type: CharacterType;
  position: CharacterPosition;
  age: number;
  health: number;           // 后台数据，玩家不可见
  healthStatus: HealthStatus; // 玩家可见的健康状态
  attributes: CharacterAttributes;
  traits: CharacterTrait[];
  buffs: CharacterBuff[];
  isUnlocked: boolean;
  unlockConditions: CharacterUnlockCondition;
  appointmentDate?: Date;   // 任命日期
  experience: number;       // 经验值
  loyalty: number;          // 忠诚度 (0-100)
}

// 人物系统状态
export interface CharacterSystemState {
  characters: Record<string, Character>;
  activeCharacters: Record<CharacterType, string | null>; // 当前在职的人物ID
  availableCharacters: string[]; // 可任命的人物ID列表
  characterPool: string[];       // 人物池，包含所有可能出现的人物
  lastHealthCheck: number;       // 上次健康检查时间
}

// 人物事件
export interface CharacterEvent {
  id: string;
  type: 'appointment' | 'death' | 'retirement' | 'trait_gained' | 'buff_applied' | 'health_change';
  characterId: string;
  timestamp: number;
  data: any;
  description: string;
}