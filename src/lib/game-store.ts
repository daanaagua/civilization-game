import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState, Resources, ResourceLimits, Technology, Building, GameEvent, UIState, Notification, Buff, BuffSummary, GameEventInstance, PauseEvent, NonPauseEvent, ResearchState } from '@/types/game';
import { Character, CharacterPosition, CharacterSystem } from '@/types/character';
import { BuildingInstance, BuildingCategory } from '@/types/building';
import { BUILDINGS, CHARACTERS, CORRUPTION_EVENTS, RANDOM_EVENTS, ACHIEVEMENTS, GAME_EVENTS } from './game-data';
import { BUILDING_DEFINITIONS, BUILDING_CATEGORIES, getBuildingDefinition, getBuildingsByCategory, isBuildingUnlocked, getAvailableBuildings } from './building-data';
import { BuildingSystem, BuildingUtils } from './building-system';
import { TECHNOLOGIES, getTechnologyPrerequisites, canResearchTechnology } from './technology-data';
import { getTriggeredEvents, canTriggerEvent, selectRandomEvent } from './events';
import { saveGameState, loadGameState, AutoSaveManager } from '@/lib/persistence';
import { saveGameStateEnhanced, loadGameStateEnhanced, getSaveInfoEnhanced, hasSavedGameEnhanced, clearAllSaveData } from '@/lib/enhanced-persistence';
import { ResourceManager, initializeResourceManager, getResourceManager } from './resource-manager';
import { globalEffectsSystem, Effect, EffectType, EffectSourceType } from './effects-system';
import { cleanupExpiredEffects } from './temporary-effects';
import { MilitarySystem } from './military-system';
import { ExplorationSystem } from './exploration-system';
import { CombatSystem } from './combat-system';
import { DiplomacySystem } from './diplomacy-system';
import { Country, Relationship, RelationshipLevel, MarketPrices, TradeRecord, GiftRecord, WarRecord, MercenaryUnit, SpecialTreasure, RaidEvent, DiplomaticEffect } from '@/types/diplomacy';
import { DIPLOMACY_CONFIG, COUNTRY_TEMPLATES, BASE_MARKET_PRICES } from './diplomacy-data';

// 初始游戏状态
const initialGameState: GameState = {
  civilizationName: '原始部落',
  currentAge: 'stone',
  gameTime: 0,
  isPaused: false,
  
  // 时间系统状态
  timeSystem: {
    startTime: Date.now(),
    currentDate: {
      year: 1,
      month: 1,
      day: 1
    }
  },
  
  resources: {
    food: 10,
    wood: 10,
    stone: 3,
    tools: 0,
    population: 1,
    housing: 0, // 初始无住房，有一个免费人口
    researchPoints: 0,
    copper: 0,
    iron: 0,
    horses: 0,
  },
  
  resourceRates: {
    food: 0,
    wood: 0,
    stone: 0,
    tools: 0,
    population: 1,
    researchPoints: 0,
    copper: 0,
    iron: 0,
    horses: 0,
  },
  
  resourceLimits: {
    food: 100,
    wood: 200,
    stone: 150,
    tools: 50,
    population: 1,
    housing: 0,
    researchPoints: 1000,
    copper: 500,
    iron: 300,
    horses: 100,
  },
  
  buildings: {} as Record<string, BuildingInstance>,
  
  // 使用新的科技数据结构
  technologies: Object.fromEntries(
    Object.values(TECHNOLOGIES).map(tech => [tech.id, { ...tech, researched: false, researchProgress: 0 }])
  ),
  
  // 科技研究状态
  researchState: {
    currentResearch: null,
    researchQueue: [],
    researchPoints: 0,
    researchPointsPerSecond: 0,
  } as ResearchState,
  
  characterSystem: {
    activeCharacters: {},
    availableCharacters: [],
    allCharacters: {},
    unlockedPositions: ['chief'] // 默认解锁酋长职位
  },
  
  stability: 50,
  corruption: 0, // 初始腐败度为0，需要解锁法律法典后显示
  
  achievements: [],
  
  inheritancePoints: 0,
  
  buffs: {},

  // 临时效果系统
  temporaryEffects: [],

  // 事件系统
  activeEvents: [], // 当前活跃的暂停事件
  events: [], // 历史事件记录
  recentEvents: [], // 最近的不暂停事件

  // 军队系统
  military: {
    units: [],
    trainingQueue: [],
    availableUnitTypes: ['tribal_militia'], // 默认解锁部落民兵
    isTraining: false
  },
  
  // 探索系统
  exploration: {
    discoveredLocations: {
      dungeons: [],
      countries: [],
      events: []
    },
    explorationHistory: []
  },
  
  // 外交系统初始状态
  diplomacy: {
    discoveredCountries: [],
    marketPrices: { ...BASE_MARKET_PRICES },
    relationships: {},
    tradeHistory: [],
    giftHistory: [],
    warHistory: [],
    mercenaryUnits: [],
    specialTreasures: [],
    raidEvents: []
  },

  settings: {
    autoSave: true,
    soundEnabled: true,
    animationsEnabled: true,
    gameSpeed: 1,
    eventsPollIntervalMs: 1000,
    eventsDebugEnabled: false,
  },

  // 统计数据
  statistics: {
    totalPlayTime: 0,
    totalResourcesCollected: {},
    totalBuildingsBuilt: {},
    totalTechnologiesResearched: 0,
    totalEventsTriggered: 0,
    totalAchievementsUnlocked: 0,
    currentGeneration: 1
  },

  // 游戏时间相关
  gameStartTime: Date.now(),
  lastUpdateTime: Date.now(),
  gameSpeed: 1,
};

const initialUIState: UIState = {
  activeTab: 'overview',
  showEventModal: false,
  notifications: [],
  
  // 转生系统UI状态
  showRebirthConfirmation: false,
  showInheritanceShop: false,
};

interface GameStore {
  // 游戏状态
  gameState: GameState;
  uiState: UIState;
  
  // 游戏控制
  isRunning: boolean;
  lastUpdateTime: number;
  isPaused: boolean;
  
  // 人口相关
  population: number;
  maxPopulation: number;
  
  // 游戏控制方法
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  togglePause: () => void;
  resetGame: () => void;
  updateGameTime: (deltaTime: number) => void;
  
  // 时间系统
  updateTimeSystem: () => void;
  resetTimeSystem: () => void;
  formatGameDate: () => string;
  
  // 资源管理
  addResources: (resources: Partial<Resources>) => void;
  spendResources: (resources: Partial<Resources>) => boolean;
  canAfford: (cost: Partial<Resources>) => boolean;
  
  // 新的资源管理器方法
  getResourceManager: () => ResourceManager;
  initializeResourceManager: () => void;
  getResourceRates: () => Partial<Resources>;
  getResourceRateDetails: (resource: keyof Resources) => any[];
  
  // 建筑管理
  buildStructure: (buildingId: string) => boolean;
  demolishBuilding: (buildingId: string) => boolean;
  getBuildingCount: (buildingId: string) => number;
  isBuildingUnlocked: (buildingId: string) => boolean;
  
  // 新建筑系统方法
  constructBuilding: (buildingId: string) => boolean;
  demolishBuildingNew: (instanceId: string) => boolean;
  assignWorkerToBuildingNew: (instanceId: string, count?: number) => boolean;
  removeWorkerFromBuildingNew: (instanceId: string, count?: number) => boolean;
  getBuildingInstances: (buildingId?: string) => BuildingInstance[];
  getBuildingsByCategory: (category: BuildingCategory) => BuildingInstance[];
  updateBuildingProduction: () => void;
  getBuildingProductionRates: () => Partial<Resources>;
  getBuildingStorageBonus: () => Partial<Resources>;
  canConstructBuilding: (buildingId: string) => { canBuild: boolean; reason?: string };
  getBuildingConstructionCost: (buildingId: string) => Partial<Resources>;
  
  // 科技管理
  startResearch: (technologyId: string) => boolean;
  completeResearch: (technologyId: string) => void;
  pauseResearch: () => void;
  updateResearchProgress: (deltaTime: number) => void;
  
  // 新的科技系统方法
  getTechnology: (technologyId: string) => Technology | undefined;
  getAvailableTechnologies: () => Technology[];
  getResearchedTechnologies: () => Technology[];
  canResearch: (technologyId: string) => boolean;
  addResearchPoints: (points: number) => void;
  spendResearchPoints: (points: number) => boolean;
  updateResearchPointsGeneration: () => void;
  applyTechnologyEffects: (technologyId: string) => void;
  removeTechnologyEffects: (technologyId: string) => void;
  
  // UI 管理
  setActiveTab: (tab: UIState['activeTab']) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  
  // 事件管理
  showEvent: (event: GameEvent) => void;
  hideEvent: () => void;
  triggerPauseEvent: (event: PauseEvent) => void;
  triggerNonPauseEvent: (event: NonPauseEvent) => void;
  handlePauseEventChoice: (eventId: string, choiceIndex: number) => void;
  dismissPauseEvent: (eventId: string) => void;
  clearRecentEvents: () => void;
  
  // 稳定度和腐败度管理
  updateStability: (change: number) => void;
  updateCorruption: (change: number) => void;
  calculatePopulationGrowth: () => void;
  checkPopulationLimits: () => void;

  // 腐败度系统
  calculateCorruptionIncrease: () => number;
  getCorruptionEfficiency: () => number;
  getCorruptionCostMultiplier: () => number;
  checkCorruptionEvents: () => void;
  triggerCorruptionEvent: (eventId: string) => void;

  // 随机事件系统
  checkRandomEvents: () => void;
  triggerRandomEvent: (eventId: string) => void;

  // 资源点击功能
  clickResource: (resourceType: 'food' | 'wood' | 'stone') => void;

  // 角色招募
  recruitCharacter: (type: string, cost: Partial<Resources>) => boolean;

  // 人口分配系统
  assignWorkerToBuilding: (buildingId: string, count?: number) => boolean;
  removeWorkerFromBuilding: (buildingId: string, count?: number) => boolean;
  getAvailableWorkers: () => number;
  getTotalAssignedWorkers: () => number;

  // 军队管理
  army: { [unitType: string]: number };
  addUnit: (unitType: string, count?: number) => void;
  removeUnit: (unitType: string, count?: number) => void;
  getUnitCount: (unitType: string) => number;

  // 游戏循环相关
  calculateResourceRates: () => void;
  checkAchievements: () => void;
  
  // Buff系统
  addBuff: (buff: Omit<Buff, 'id' | 'startTime' | 'isActive'>) => void;
  removeBuff: (buffId: string) => void;
  updateBuffs: () => void;
  getActiveBuffs: () => Buff[];
  getBuffSummary: () => BuffSummary;
  applyBuffEffects: () => void;
  
  // 继承点系统
  addInheritancePoints: (points: number) => void;
  spendInheritancePoints: (points: number) => boolean;
  getInheritancePoints: () => number;
  purchaseInheritanceBuff: (buffType: string) => boolean;
  
  // 事件系统
  addEvent: (event: Omit<GameEventInstance, 'timestamp'>) => void;
  resolveEvent: (eventId: string, choiceId?: string) => void;
  removeEvent: (eventId: string) => void;
  checkGameEvents: () => void;
  applyEventEffects: (effects: any[]) => void;
  handleEventChoice: (eventId: string, choiceIndex: number) => void;
  dismissEvent: (eventId: string) => void;
  toggleGamePause: () => void; // 空格键快捷键
  
  // 转生系统
  calculateRebirthRewards: () => number;
  performRebirth: () => void;
  showRebirthConfirmation: () => void;
  hideRebirthConfirmation: () => void;
  showInheritanceShop: () => void;
  hideInheritanceShop: () => void;
  clearStorage: () => void;

  // 持久化功能
  saveGame: () => void;
  loadGame: () => boolean;
  initializePersistence: () => void;

  // 统计数据管理
  updateStatistics: (updates: Partial<GameState['statistics']>) => void;
  incrementStatistic: (key: keyof GameState['statistics'], value?: number) => void;

  // 游戏速度控制
  setGameSpeed: (speed: number) => void;
  // 事件轮询频率控制
  setEventsPollIntervalMs: (ms: number) => void;
  // 事件调试日志开关
  setEventsDebugEnabled: (enabled: boolean) => void;

  // 效果系统
  effectsVersion: number;
  getEffectsSystem: () => typeof globalEffectsSystem;
  updateEffectsSystem: () => void;
  getActiveEffects: () => Effect[];
  getEffectsByType: (type: EffectType) => Effect[];
  getEffectsBySource: (sourceType: EffectSourceType, sourceId?: string) => Effect[];
  addEffect: (effect: Omit<Effect, 'id'>) => void;
  removeEffect: (effectId: string) => void;
  removeEffectsBySource: (sourceType: EffectSourceType, sourceId?: string) => void;
  calculateEffectTotal: (type: EffectType) => number;

  // 军队系统
  trainUnit: (unitType: string) => boolean;
  cancelTraining: () => void;
  setMilitaryStatus: (status: 'defending' | 'exploring') => void;
  disbandUnit: (unitId: string) => void;
  getMilitaryUnits: () => any[];
  getTrainingQueue: () => any[];
  updateMilitaryTraining: (deltaTime: number) => void;
  unlockUnitType: (unitType: string) => void;

  // 探索系统
  exploreWithUnits: (units: any[]) => any;
  attackDungeon: (dungeonId: string, units: any[]) => any;
  getDiscoveredLocations: () => any;
  getExplorationHistory: () => any[];
  addDiscoveredLocation: (location: any) => void;
  addExplorationRecord: (record: any) => void;

  // 人物系统方法
  generateCharacter: () => Character; // 返回生成的人物对象
  appointCharacter: (characterId: string, position: CharacterPosition) => boolean;
  dismissCharacter: (characterId: string) => boolean;
  getActiveCharacters: () => Character[];
  getAvailableCharacters: () => Character[];
  getCharacterById: (id: string) => Character | undefined;
  unlockCharacterPosition: (position: CharacterPosition) => void;
  getUnlockedPositions: () => CharacterPosition[];
  updateCharacterHealth: (characterId: string, change: number) => void;
  addCharacterBuff: (characterId: string, buff: any) => void;
  removeCharacterBuff: (characterId: string, buffId: string) => void;
  calculateCharacterEffects: () => any[];
  updateCharacterSystem: () => void;
  
  // 外交系统方法
  discoverCountry: (country: Country) => void;
  tradeWithCountry: (countryId: string, ourOffer: Partial<Resources>, theirOffer: Partial<Resources>) => void;
  giftToCountry: (countryId: string, gift: Partial<Resources>) => void;
  declareWar: (countryId: string) => void;
  hireMercenary: (mercenaryId: string) => void;
  updateDiplomacyRelationships: () => void;
  getCountryRelationship: (countryId: string) => Relationship | undefined;
  getDiscoveredCountries: () => Country[];
  updateMarketPrices: () => void;
  generateRaidEvent: () => void;
  getDiplomacyEffects: () => DiplomaticEffect[];
}

// 全局资源管理器实例
let resourceManager: ResourceManager | null = null;

export const useGameStore = create<GameStore>()(persist(
  (set, get) => ({
    gameState: initialGameState,
    uiState: initialUIState,
    isRunning: false,
    lastUpdateTime: Date.now(),
    army: {},
    effectsVersion: 0,
    
    get isPaused() {
      return get().gameState.isPaused;
    },
    
    get population() {
      return get().gameState.resources.population;
    },
    
    get maxPopulation() {
      // 0住房时有一个免费人口，之后每个住房容纳一个人口
      // 人口上限 = 住房资源 + 1（0住房时给予1点基础人口容量）
      return get().gameState.resources.housing + 1;
    },
    


    startGame: () => {
      set((state) => ({
        gameState: {
          ...state.gameState,
          isPaused: false,
          gameStartTime: state.gameState.gameStartTime === 0 ? Date.now() : state.gameState.gameStartTime
        },
        isRunning: true,
        lastUpdateTime: Date.now()
      }));
      
      // 初始化资源管理器
      get().initializeResourceManager();
      
      // 启动时根据已有建筑重算住房容量并钳制人口
      (() => {
        const s = get().gameState;
        let totalHousing = 0;
        Object.values(s.buildings).forEach((b: any) => {
          const def = getBuildingDefinition(b.buildingId);
          const eff = def?.effects || [];
          totalHousing += eff
            .filter((e: any) => e.type === 'population_capacity')
            .reduce((sum: number, e: any) => sum + (e.value || 0), 0);
        });
        set((state) => {
          const cap = totalHousing + 1;
          const newPop = Math.min(state.gameState.resources.population, cap);
          return {
            gameState: {
              ...state.gameState,
              resources: {
                ...state.gameState.resources,
                housing: totalHousing,
                population: newPop,
              },
            },
          };
        });
      })();
      
      // 计算初始资源速率
      get().calculateResourceRates();
    },
    
    pauseGame: () => {
      set((state) => ({
        gameState: {
          ...state.gameState,
          isPaused: true
        },
        // 不修改 isRunning，保持开始状态，由 isPaused 控制暂停
        lastUpdateTime: state.lastUpdateTime
      }));
    },
    
    resumeGame: () => {
      set((state) => ({
        gameState: {
          ...state.gameState,
          isPaused: false
        },
        // 不强制修改 isRunning，保持其语义：是否已开始
        lastUpdateTime: Date.now()
      }));
      
      // 计算资源速率
      get().calculateResourceRates();
    },

    togglePause: () => {
      set((state) => {
        const newPausedState = !state.gameState.isPaused;
        return {
          gameState: {
            ...state.gameState,
            isPaused: newPausedState
          },
          // 游戏开始后，isRunning应该始终为true，只通过isPaused控制暂停状态
          isRunning: true,
          lastUpdateTime: newPausedState ? state.lastUpdateTime : Date.now()
        };
      });
    },
    
    resetGame: () => {
      // 完全重置：不保留任何成就/存档/事件
      if (typeof window !== 'undefined') {
        try {
          // 清理增强存档
          try {
            clearAllSaveData();
          } catch (e) {
            // 兜底：即使函数不可用也继续清理下面的键
          }
          // 旧版键清理
          localStorage.removeItem('civilization-game-storage');
          localStorage.removeItem('civilization-achievements-storage');
          // 事件历史清理（use-events.ts 使用的键）
          localStorage.removeItem('civilization-game-events-history');
        } catch (err) {
          console.error('重置时清理本地存储失败:', err);
        }
      }

      // 清空成就（内存与持久化）
      try {
        const achievementStore = useAchievementStore.getState();
        achievementStore.clearAchievements();
      } catch (e) {
        console.warn('清空成就失败（可能未初始化成就存储）：', e);
      }
      
      const newGameState = { 
        ...initialGameState
      };
      
      set({
        gameState: newGameState,
        uiState: { ...initialUIState },
        isRunning: false,
        lastUpdateTime: Date.now(),
      });
      
      // 初始化资源管理器
      resourceManager = initializeResourceManager(newGameState.resources, newGameState.resourceLimits);
      
      // 重置并初始化效果系统
      globalEffectsSystem.clear();
      globalEffectsSystem.updateFromGameState(newGameState);
      set((s) => ({ ...s, effectsVersion: s.effectsVersion + 1 }));
      
      // 计算初始资源速率
      get().calculateResourceRates();
      
      get().resetTimeSystem();

      // 通知前端 Hook（如 useEvents）清空自身状态
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('GAME_RESET'));
        } catch {}
      }
    },
    
    updateGameTime: (deltaTime: number) => {
      const { gameState, isRunning } = get();
      if (!isRunning || gameState.isPaused) return;
      
      const gameSpeed = gameState.settings.gameSpeed;
      const adjustedDelta = deltaTime * gameSpeed;
      
      // 重新计算资源生产率（确保使用最新的数据）
      get().calculateResourceRates();
      
      // 计算天数变化
      const oldDays = Math.floor(gameState.gameTime / 86400);
      const newGameTime = gameState.gameTime + adjustedDelta;
      const newDays = Math.floor(newGameTime / 86400);
      const daysPassed = newDays - oldDays;
      
      // 清理过期的临时效果
      if (daysPassed > 0) {
        cleanupExpiredEffects(gameState);
      }
      
      // 获取腐败度效率影响
      const corruptionEfficiency = get().getCorruptionEfficiency();
      
      set((state) => {
        let newCorruption = state.gameState.corruption;
        let newStability = state.gameState.stability;
        
        // 如果过了一天或更多，应用每日更新
        if (daysPassed > 0) {
          // 腐败度增长
          const corruptionIncrease = get().calculateCorruptionIncrease();
          newCorruption = Math.max(0, Math.min(100, state.gameState.corruption + corruptionIncrease * daysPassed));
        }
        
        // 稳定度变化（每次更新都执行）
        const calculateTargetStability = () => {
          const { resources, technologies } = state.gameState;
          
          // 基础稳定度 = 50
          let baseStability = 50;
          
          // 政治制度加成
          let politicalBonus = 0;
          if (technologies['tribal_organization']?.researched) {
            politicalBonus += 5; // 部落组织
          }
          if (technologies['monarchy']?.researched) {
            politicalBonus += 15; // 君主制
          }
          if (technologies['feudalism']?.researched) {
            politicalBonus += 5; // 分封制
          }
          if (technologies['centralization']?.researched) {
            politicalBonus += 5; // 集权制
          }
          
          // 人口规模影响
          const population = resources.population;
          const researchedTechCount = Object.values(technologies).filter(tech => tech.researched).length;
          const softLimit = 10 * (1 + researchedTechCount * 0.1); // 软性上限
          
          let populationPenalty = 0;
          if (population > softLimit * 3.0) {
            populationPenalty = -40;
          } else if (population > softLimit * 2.5) {
            populationPenalty = -30;
          } else if (population > softLimit * 2.0) {
            populationPenalty = -25;
          } else if (population > softLimit * 1.5) {
            populationPenalty = -20;
          } else if (population > softLimit * 1.2) {
            populationPenalty = -15;
          }
          
          // 资源充足度影响（简化版本）
          const foodSufficiency = (resources.food / Math.max(1, population * 2)) * 100; // 假设每人需要2食物
          let resourceBonus = 0;
          if (foodSufficiency > 150) {
            resourceBonus = 8;
          } else if (foodSufficiency >= 100) {
            resourceBonus = 4;
          } else if (foodSufficiency >= 80) {
            resourceBonus = 0;
          } else if (foodSufficiency >= 50) {
            resourceBonus = -12;
          } else {
            resourceBonus = -30;
          }
          
          // 计算目标稳定度
          const targetStability = Math.max(0, Math.min(100, 
            baseStability + politicalBonus + populationPenalty + resourceBonus - newCorruption // 使用更新后的腐败度
          ));
          
          return targetStability;
        };

        const targetStability = calculateTargetStability();
        const stabilityDiff = targetStability - newStability;
        
        // 游戏中每天调整0.01，游戏中1天=现实0.5秒，所以现实1秒调整0.02
        const dailyAdjustmentRate = 0.01; // 游戏中每天的调整速率
        const adjustmentPerSecond = 0.02; // 现实中每秒的调整速率（游戏1天=0.5秒，所以1秒=0.02调整）
        const maxAdjustment = adjustmentPerSecond * adjustedDelta;
        const adjustment = Math.sign(stabilityDiff) * Math.min(Math.abs(stabilityDiff), maxAdjustment);
        newStability += adjustment;

        newStability = Math.max(0, Math.min(100, newStability));
        // 不在每次更新时进行舍入，保留高精度以便逐步累积；显示层再格式化数值

        // 更新游戏统计数据（兼容旧存档）
        const prevStats = state.gameState.statistics || {
          totalPlayTime: 0,
          totalResourcesCollected: {},
          totalBuildingsBuilt: {},
          totalTechnologiesResearched: 0,
          totalEventsTriggered: 0,
          totalAchievementsUnlocked: 0,
          currentGeneration: 1,
        };
        const updatedStatistics = {
          ...prevStats,
          totalPlayTime: (prevStats.totalPlayTime || 0) + adjustedDelta,
        };
        
        // 计算资源上限
        const calculateResourceLimits = () => {
          const baseLimit = {
            food: 100,
            wood: 200,
            stone: 150,
            tools: 50,
            population: 10,
            housing: 10,
          };
          
          // 储藏点上限基于人口：每10人口可以建造1个储藏点
          const population = state.gameState.resources.population;
          const maxStorageBuildings = Math.floor(population / 10);
          const actualStorageCount = Math.min(
            state.gameState.buildings.storage?.count || 0,
            maxStorageBuildings
          );
          const storageBonus = actualStorageCount * 100;
          
          return {
            food: baseLimit.food + storageBonus,
            wood: baseLimit.wood + storageBonus,
            stone: baseLimit.stone + storageBonus,
            tools: baseLimit.tools + storageBonus,
            population: state.gameState.resources.housing + 1, // 人口上限等于住房数量 + 1（0住房时有一个免费人口）
            housing: baseLimit.housing,
          };
        };
        
        const resourceLimits = calculateResourceLimits();
        
        // 计算食物腐烂（仅在未解锁保鲜技术时）
        let foodRotLoss = 0;
        const hasPreservation = state.gameState.technologies['food_preservation']?.researched;
        if (!hasPreservation && state.gameState.resources.food > 0) {
          foodRotLoss = state.gameState.resources.food * 0.001 * adjustedDelta; // 0.1%每秒腐烂
        }

        const updatedResources = {
          ...state.gameState.resources,
          food: Math.max(0, Math.min(resourceLimits.food, state.gameState.resources.food + state.gameState.resourceRates.food * adjustedDelta * corruptionEfficiency - foodRotLoss)),
          wood: Math.max(0, Math.min(resourceLimits.wood, state.gameState.resources.wood + state.gameState.resourceRates.wood * adjustedDelta * corruptionEfficiency)),
          stone: Math.max(0, Math.min(resourceLimits.stone, state.gameState.resources.stone + state.gameState.resourceRates.stone * adjustedDelta * corruptionEfficiency)),
          tools: Math.max(0, Math.min(resourceLimits.tools, state.gameState.resources.tools + state.gameState.resourceRates.tools * adjustedDelta * corruptionEfficiency)),
          population: Math.floor(Math.min(
            state.gameState.resources.housing + 1,
            state.gameState.resources.population + state.gameState.resourceRates.population * adjustedDelta
          )),
          researchPoints: Math.max(0, Math.min(
            state.gameState.resourceLimits.researchPoints,
            state.gameState.resources.researchPoints + state.gameState.resourceRates.researchPoints * adjustedDelta * corruptionEfficiency
          )),
          copper: Math.max(0, Math.min(
            state.gameState.resourceLimits.copper,
            state.gameState.resources.copper + state.gameState.resourceRates.copper * adjustedDelta * corruptionEfficiency
          )),
          iron: Math.max(0, Math.min(
            state.gameState.resourceLimits.iron,
            state.gameState.resources.iron + state.gameState.resourceRates.iron * adjustedDelta * corruptionEfficiency
          )),
          horses: Math.max(0, Math.min(
            state.gameState.resourceLimits.horses,
            state.gameState.resources.horses + state.gameState.resourceRates.horses * adjustedDelta * corruptionEfficiency
          )),
        };

        // 同步资源管理器状态
        if (resourceManager) {
          resourceManager.setResources(updatedResources, 'production');
          resourceManager.updateResourceLimits(resourceLimits);
        }

        return {
          gameState: {
            ...state.gameState,
            gameTime: newGameTime,
            corruption: newCorruption,
            stability: newStability,
            resourceLimits,
            resources: updatedResources,
            statistics: updatedStatistics,
          },
        };
      });
      
      // 检查腐败度事件（每天有概率触发）
      if (daysPassed > 0) {
        get().checkCorruptionEvents();
        get().checkRandomEvents();
      }
      
      // 更新研究进度
      get().updateResearchProgress(adjustedDelta);
      
      // 计算人口增长
      get().calculatePopulationGrowth();
      
      // 检查人口限制
      get().checkPopulationLimits();
      
      // 检查成就
      get().checkAchievements();
      
      // 更新buff状态（清理过期buff）
      get().updateBuffs();
      
      // 更新效果系统
      get().updateEffectsSystem();
      
      // 更新建筑生产
      get().updateBuildingProduction();
      
      // 更新时间系统
      get().updateTimeSystem();
    },

    updateTimeSystem: () => {
      set((state) => {
        const gameTime = state.gameState.gameTime;
        const totalDays = Math.floor(gameTime * 2); // 1秒 = 2天
        
        // 计算年、月、日（从1年1月1日开始）
        const year = Math.floor(totalDays / 360) + 1;
        const remainingDays = totalDays % 360;
        const month = Math.floor(remainingDays / 30) + 1;
        const day = (remainingDays % 30) + 1;
        
        return {
          ...state,
          gameState: {
            ...state.gameState,
            timeSystem: {
              ...state.gameState.timeSystem,
              currentDate: { year, month, day }
            }
          }
        };
      });
    },

    resetTimeSystem: () => {
      set((state) => ({
        ...state,
        gameState: {
          ...state.gameState,
          timeSystem: {
            startTime: Date.now(),
            currentDate: {
              year: 1,
              month: 1,
              day: 1
            }
          }
        }
      }));
    },

    // 格式化日期显示
    formatGameDate: () => {
      const state = get();
      const timeSystem = state.gameState.timeSystem;
      if (!timeSystem || !timeSystem.currentDate) {
        return '1年1月1日'; // 默认日期
      }
      const { year, month, day } = timeSystem.currentDate;
      return `${year}年${month}月${day}日`;
    },

    addResources: (resources: Partial<Resources>) => {
      set((state) => {
        const newResources = {
          ...state.gameState.resources,
          food: state.gameState.resources.food + (resources.food || 0),
          wood: state.gameState.resources.wood + (resources.wood || 0),
          stone: state.gameState.resources.stone + (resources.stone || 0),
          tools: state.gameState.resources.tools + (resources.tools || 0),
          population: Math.floor(Math.min(
            state.gameState.resources.housing + 1,
            state.gameState.resources.population + (resources.population || 0)
          )),
          housing: Math.floor(state.gameState.resources.housing + (resources.housing || 0)),
        };

        // 同步资源管理器状态
        if (resourceManager) {
          resourceManager.setResources(newResources, 'manual');
        }

        return {
          gameState: {
            ...state.gameState,
            resources: newResources,
          },
        };
      });
    },
    
    spendResources: (cost: Partial<Resources>) => {
      const { gameState } = get();
      
      // 检查是否有足够资源
      if (!get().canAfford(cost)) {
        return false;
      }
      
      const newResources = {
        ...gameState.resources,
        food: gameState.resources.food - (cost.food || 0),
        wood: gameState.resources.wood - (cost.wood || 0),
        stone: gameState.resources.stone - (cost.stone || 0),
        tools: gameState.resources.tools - (cost.tools || 0),
        population: gameState.resources.population - (cost.population || 0),
      };
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          resources: newResources,
        },
      }));
      
      // 同步资源管理器状态
      if (resourceManager) {
            resourceManager.setResources(newResources, 'consumption');
          }
      
      return true;
    },
    
    canAfford: (cost: Partial<Resources>) => {
      const { resources } = get().gameState;
      
      return (
        (cost.food || 0) <= resources.food &&
        (cost.wood || 0) <= resources.wood &&
        (cost.stone || 0) <= resources.stone &&
        (cost.tools || 0) <= resources.tools &&
        (cost.population || 0) <= resources.population
      );
    },

    // 资源管理器方法
    getResourceManager: () => {
      if (!resourceManager) {
        const { resources, resourceLimits } = get().gameState;
        resourceManager = initializeResourceManager(resources, resourceLimits);
      }
      return resourceManager;
    },

    initializeResourceManager: () => {
      const { resources, resourceLimits } = get().gameState;
      resourceManager = initializeResourceManager(resources, resourceLimits);
    },

    getResourceRates: () => {
      const manager = get().getResourceManager();
      return manager.getResourceRates();
    },

    getResourceRateDetails: (resource: keyof Resources) => {
      const manager = get().getResourceManager();
      return manager.getResourceRateDetails(resource);
    },
    
    buildStructure: (buildingId: string) => {
      const building = BUILDINGS[buildingId];
      if (!building || !get().isBuildingUnlocked(buildingId)) {
        return false;
      }
      
      // 应用腐败度对建筑成本的影响
      const corruptionMultiplier = get().getCorruptionCostMultiplier();
      const adjustedCost: Partial<Resources> = {
        food: Math.ceil((building.cost.food || 0) * corruptionMultiplier),
        wood: Math.ceil((building.cost.wood || 0) * corruptionMultiplier),
        stone: Math.ceil((building.cost.stone || 0) * corruptionMultiplier),
        tools: Math.ceil((building.cost.tools || 0) * corruptionMultiplier),
      };
      
      // 只有当建筑真正需要人口成本时才添加人口成本
      if (building.cost.population && building.cost.population > 0) {
        adjustedCost.population = building.cost.population;
      }
      
      if (!get().spendResources(adjustedCost)) {
        return false;
      }
      
      set((state) => {
        const currentBuilding = state.gameState.buildings[buildingId];
        const currentCount = currentBuilding?.count || 0;
        return {
          gameState: {
            ...state.gameState,
            buildings: {
              ...state.gameState.buildings,
              [buildingId]: {
                buildingId,
                count: currentCount + 1,
                level: currentBuilding?.level || 1,
                assignedWorkers: currentBuilding?.assignedWorkers || 0, // 保留原有工人分配
              },
            },
          },
        };
      });
      
      // 如果建筑提供住房，更新住房容量
      if (building.produces?.housing) {
        get().addResources({ housing: building.produces.housing });
      }
      
      get().addNotification({
        type: 'success',
        title: '建筑完成',
        message: `成功建造了${building.name}`,
        duration: 3000,
      });
      
      return true;
    },
    
    demolishBuilding: (buildingId: string) => {
      const { gameState } = get();
      const building = BUILDINGS[buildingId];
      const buildingInstance = gameState.buildings[buildingId];
      
      if (!building || !buildingInstance || buildingInstance.count <= 0) {
        return false;
      }
      
      // 住房拆除限制：不能低于当前人口需求
      if (building.type === 'housing') {
        const currentPopulation = gameState.resources.population;
        const minHousingNeeded = Math.ceil(currentPopulation / 2);
        const currentHousing = gameState.resources.housing;
        const housingFromThisBuilding = building.produces?.housing || 0;
        
        if (currentHousing - housingFromThisBuilding < minHousingNeeded) {
          get().addNotification({
            type: 'error',
            title: '拆除失败',
            message: `住房不能低于当前人口需求（至少需要${minHousingNeeded}个住房）`,
            duration: 3000,
          });
          return false;
        }
      }
      
      // 如果建筑有分配的工人，先移除工人
      if (buildingInstance.assignedWorkers && buildingInstance.assignedWorkers > 0) {
        get().removeWorkerFromBuilding(buildingId, buildingInstance.assignedWorkers);
      }
      
      // 返还部分资源（50%）
      const refundResources: Partial<Resources> = {};
      Object.entries(building.cost).forEach(([resource, cost]) => {
        if (resource in refundResources || resource === 'population') return;
        refundResources[resource as keyof Resources] = Math.floor(cost * 0.5);
      });
      
      get().addResources(refundResources);
      
      // 如果建筑提供住房，减少住房容量
      if (building.produces?.housing) {
        get().spendResources({ housing: building.produces.housing });
      }
      
      // 减少建筑数量
      set((state) => {
        const newCount = buildingInstance.count - 1;
        const newBuildings = { ...state.gameState.buildings };
        
        if (newCount <= 0) {
          delete newBuildings[buildingId];
        } else {
          newBuildings[buildingId] = {
            ...buildingInstance,
            count: newCount,
          };
        }
        
        return {
          gameState: {
            ...state.gameState,
            buildings: newBuildings,
          },
        };
      });
      
      get().addNotification({
        type: 'success',
        title: '拆除完成',
        message: `成功拆除了${building.name}`,
        duration: 3000,
      });
      
      return true;
    },

    getBuildingCount: (buildingId: string) => {
      const { buildings } = get().gameState;
      return buildings[buildingId]?.count || 0;
    },

    isBuildingUnlocked: (buildingId: string) => {
      const { gameState } = get();
      const building = BUILDINGS[buildingId];
      if (!building) return false;
      
      // 如果建筑没有前置要求，则默认解锁
      if (!building.requires || building.requires.length === 0) {
        return building.unlocked;
      }
      
      // 检查所有前置科技是否已研发
      return building.requires.every(techId => {
        const tech = gameState.technologies[techId];
        return tech && tech.researched;
      });
    },
    
    startResearch: (technologyId: string) => {
      const { gameState } = get();
      const technology = gameState.technologies[technologyId];
      
      if (!technology || technology.researched) {
        return false;
      }
      
      if (!get().canResearch(technologyId)) {
        return false;
      }
      
      if (gameState.researchState?.currentResearch) {
        return false; // 已经在研究其他科技
      }
      
      // 成本处理：支持普通资源与研究点并存
      const cost = technology.cost || {};
      const hasRP = typeof cost.researchPoints === 'number' && cost.researchPoints > 0;
      const basicCost: any = { ...cost };
      delete basicCost.researchPoints;
      // 先校验负担能力
      if (Object.keys(basicCost).length > 0 && !get().canAfford(basicCost)) {
        return false;
      }
      if (hasRP && get().gameState.resources.researchPoints < (cost.researchPoints as number)) {
        return false;
      }
      // 扣除成本
      if (Object.keys(basicCost).length > 0) {
        if (!get().spendResources(basicCost)) {
          return false;
        }
      }
      if (hasRP) {
        if (!get().spendResearchPoints(cost.researchPoints as number)) {
          return false;
        }
      }
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          researchState: {
            ...state.gameState.researchState,
            currentResearch: {
              technologyId,
              progress: 0,
              startTime: Date.now(),
            },
          },
        },
      }));
      
      get().addNotification({
        type: 'info',
        title: '开始研究',
        message: `开始研究${technology.name}`,
        duration: 3000,
      });
      
      return true;
    },
    
    completeResearch: (technologyId: string) => {
      const { gameState } = get();
      const technology = gameState.technologies[technologyId];
      
      if (!technology) return;
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          technologies: {
            ...state.gameState.technologies,
            [technologyId]: {
              ...technology,
              researched: true,
              researchProgress: technology.researchTime,
            },
          },
          researchState: {
            ...state.gameState.researchState,
            currentResearch: null,
          },
        },
      }));
      
      // 应用科技效果
      get().applyTechnologyEffects(technologyId);
      
      // 更新统计数据
      get().incrementStatistic('totalTechnologiesResearched');
      
      get().addNotification({
        type: 'success',
        title: '研究完成',
        message: `成功研究了${technology.name}`,
        duration: 5000,
      });
    },
    
    pauseResearch: () => {
      const { gameState } = get();
      
      if (!gameState.researchState?.currentResearch) {
        return;
      }
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          researchState: {
            ...state.gameState.researchState,
            currentResearch: null,
          },
        },
      }));
      
      get().addNotification({
        type: 'info',
        title: '暂停研究',
        message: '已暂停当前研究',
        duration: 3000,
      });
    },
    
    updateResearchProgress: (deltaTime: number) => {
      const { gameState } = get();
      const research = gameState.researchState?.currentResearch;
      
      if (!research) return;
      
      const technology = gameState.technologies[research.technologyId];
      if (!technology) return;
      
      // 计算稳定度和腐败度对研究速度的影响
      let researchSpeedMultiplier = 1;
      
      // 稳定度加成
      if (gameState.stability >= 75) researchSpeedMultiplier += 0.25; // +25%
      else if (gameState.stability >= 50) researchSpeedMultiplier += 0.15; // +15%
      else if (gameState.stability >= 25) researchSpeedMultiplier += 0.05; // +5%
      else if (gameState.stability < 20) researchSpeedMultiplier -= 0.1; // -10%
      
      // 腐败度惩罚
      const corruptionPenalty = Math.min(gameState.corruption * 0.005, 0.25); // 每点腐败度-0.5%，最多-25%
      researchSpeedMultiplier -= corruptionPenalty;
      
      // 确保速度不会为负
      researchSpeedMultiplier = Math.max(0.1, researchSpeedMultiplier);
      
      const adjustedDeltaTime = deltaTime * researchSpeedMultiplier;
      const newProgress = research.progress + adjustedDeltaTime;
      
      if (newProgress >= technology.researchTime) {
        get().completeResearch(research.technologyId);
      } else {
        set((state) => ({
          gameState: {
            ...state.gameState,
            researchState: {
              ...state.gameState.researchState,
              currentResearch: {
                ...research,
                progress: newProgress,
              },
            },
          },
        }));
      }
    },
    
    setActiveTab: (tab) => {
      set((state) => ({
        uiState: {
          ...state.uiState,
          activeTab: tab,
        },
      }));
    },
    
    addNotification: (notification) => {
      const id = Date.now().toString();
      const timestamp = Date.now();
      
      set((state) => ({
        uiState: {
          ...state.uiState,
          notifications: [
            ...state.uiState.notifications,
            { ...notification, id, timestamp },
          ],
        },
      }));
      
      // 向全局派发通知事件，供事件系统桥接到 UI Toast
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('GAME_NOTIFICATION', { detail: { ...notification, id, timestamp } }));
        } catch (e) {
          // ignore
        }
      }
      
      // 自动移除通知
      if (notification.duration) {
        setTimeout(() => {
          get().removeNotification(id);
        }, notification.duration);
      }
    },
    
    removeNotification: (id) => {
      set((state) => ({
        uiState: {
          ...state.uiState,
          notifications: state.uiState.notifications.filter(n => n.id !== id),
        },
      }));
    },
    
    showEvent: (event) => {
      set((state) => ({
        uiState: {
          ...state.uiState,
          showEventModal: true,
          currentEvent: event,
        },
      }));
    },
    
    hideEvent: () => {
      set((state) => ({
        uiState: {
          ...state.uiState,
          showEventModal: false,
          currentEvent: undefined,
        },
      }));
    },
    
    calculateResourceRates: () => {
      const { gameState } = get();
      const { buildings, resources } = gameState;
      
      let newRates = {
        food: 0,
        wood: 0,
        stone: 0,
        tools: 0,
        population: 0, // 人口增长通过专门函数处理
      };
      
      // 人口消耗资源 - 移除这里的计算，让resourceManager统一处理
      // 这里不再计算人口消耗，避免与resourceManager重复计算
      
      // 计算建筑提供的资源生产率
      Object.values(buildings).forEach((building) => {
        const buildingData = BUILDINGS[building.buildingId];
        if (buildingData?.produces) {
          Object.entries(buildingData.produces).forEach(([resource, rate]) => {
            if (resource in newRates) {
              let efficiency = 1;
              
              // 如果建筑可以分配工人，计算工人效率
              if (buildingData.canAssignWorkers && buildingData.maxWorkers) {
                const assignedWorkers = building.assignedWorkers || 0;
                const maxWorkers = buildingData.maxWorkers;
                // 效率 = 分配工人数 / 最大工人数，最低10%效率
                efficiency = Math.max(0.1, assignedWorkers / maxWorkers);
              }
              
              newRates[resource as keyof typeof newRates] += rate * building.count * efficiency;
            }
          });
        }
      });
      
      // 应用科技加成
      Object.values(gameState.technologies).forEach((tech) => {
        if (tech.researched && tech.effects) {
          tech.effects.forEach((effect) => {
            if (effect.type === 'resource_multiplier' && effect.target in newRates) {
              newRates[effect.target as keyof typeof newRates] *= effect.value;
            }
          });
        }
      });
      
      // 同步资源管理器的速率计算
      try {
        const manager = get().getResourceManager();
        manager.calculateResourceRates(gameState);
        // 使用resourceManager的计算结果更新gameState的resourceRates
        const managerRates = manager.getResourceRates();
        newRates = {
          food: managerRates.food || 0,
          wood: managerRates.wood || 0,
          stone: managerRates.stone || 0,
          tools: managerRates.tools || 0,
          population: newRates.population, // 人口增长仍由原逻辑处理
        };
      } catch (error) {
        console.warn('Resource manager not available for rate calculation:', error);
      }
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          resourceRates: newRates,
        },
      }));
    },
    
    updateStability: (change: number) => {
      set((state) => ({
        gameState: {
          ...state.gameState,
          stability: Math.max(0, Math.min(100, state.gameState.stability + change)),
        },
      }));
    },

    updateCorruption: (change: number) => {
      set((state) => ({
        gameState: {
          ...state.gameState,
          corruption: Math.max(0, Math.min(100, state.gameState.corruption + change)),
        },
      }));
    },

    // 计算腐败度每日增长
    calculateCorruptionIncrease: () => {
      const { gameState } = get();
      
      // 如果没有解锁法律法典，腐败度不增长
      if (!gameState.technologies.legal_code?.researched) {
        return 0;
      }
      
      // 计算官吏人口（在法院工作的人口）
      let administratorPopulation = 0;
      if (gameState.buildings.courthouse) {
        administratorPopulation = gameState.buildings.courthouse.workers || 0;
      }
      
      // 如果没有官吏，腐败度不增长
      if (administratorPopulation === 0) {
        return 0;
      }
      
      // 基础腐败增长：官吏人口 × 0.5
      let corruptionIncrease = administratorPopulation * 0.5;
      
      // 压制效果
      let suppressionEffects = 0;
      
      // 法院建筑的压制效果（每个法院 -0.3）
      if (gameState.buildings.courthouse) {
        suppressionEffects += gameState.buildings.courthouse.count * 0.3;
      }
      
      // 监察院的压制效果（每个监察院 -0.8）
      if (gameState.buildings.oversight_bureau) {
        suppressionEffects += gameState.buildings.oversight_bureau.count * 0.8;
      }
      
      // 官员角色的压制效果
      Object.values(gameState.characters).forEach(character => {
        if (character.isActive) {
          if (character.type === 'administrator') {
            suppressionEffects += 0.2; // 行政官减少腐败
          } else if (character.type === 'judge') {
            suppressionEffects += 0.4; // 法官减少腐败
          } else if (character.type === 'inspector') {
            suppressionEffects += 0.6; // 监察使减少腐败
          }
        }
      });
      
      // 科技效果
      if (gameState.technologies.centralization?.researched) {
        suppressionEffects += 0.2; // 集权制增加压制效果
      }
      
      // 最终腐败增长 = 基础增长 - 压制效果
      const totalIncrease = corruptionIncrease - suppressionEffects;
      
      return Math.max(0, totalIncrease);
    },

    // 处理腐败度对资源效率的影响
    getCorruptionEfficiency: () => {
      const { gameState } = get();
      const corruption = gameState.corruption;
      
      if (corruption <= 25) return 1.0;
      if (corruption <= 50) return 0.9;
      if (corruption <= 75) return 0.75;
      if (corruption <= 90) return 0.6;
      return 0.4;
    },

    // 获取腐败度对建筑成本的影响
    getCorruptionCostMultiplier: () => {
      const { gameState } = get();
      const corruption = gameState.corruption;
      
      if (corruption <= 50) return 1.0;
      if (corruption <= 75) return 1.2;
      if (corruption <= 90) return 1.5;
      return 2.0;
    },

    checkCorruptionEvents: () => {
      const { gameState } = get();
      
      // 只有解锁法律法典后才会触发腐败度事件
      if (!gameState.technologies.legal_code?.researched) {
        return;
      }

      // 检查每个腐败度事件的触发条件
      Object.values(CORRUPTION_EVENTS).forEach(event => {
        // 基础概率检查
        if (Math.random() > event.probability) {
          return;
        }

        // 检查触发条件
        let canTrigger = true;

        if (event.requirements.corruption) {
          const { min, max } = event.requirements.corruption;
          if (min && gameState.corruption < min) canTrigger = false;
          if (max && gameState.corruption > max) canTrigger = false;
        }

        if (event.requirements.population) {
          const { min, max } = event.requirements.population;
          if (min && gameState.resources.population < min) canTrigger = false;
          if (max && gameState.resources.population > max) canTrigger = false;
        }

        if (event.requirements.stability) {
          const { min, max } = event.requirements.stability;
          if (min && gameState.stability < min) canTrigger = false;
          if (max && gameState.stability > max) canTrigger = false;
        }

        if (event.requirements.buildings_count) {
          const buildingCount = Object.values(gameState.buildings).reduce(
            (sum, building) => sum + (building?.count || 0), 0
          );
          const { min, max } = event.requirements.buildings_count;
          if (min && buildingCount < min) canTrigger = false;
          if (max && buildingCount > max) canTrigger = false;
        }

        if (event.requirements.characters) {
          const { has } = event.requirements.characters;
          if (has) {
            const hasRequiredCharacters = has.some(charType => 
              Object.values(gameState.characters).some(char => char?.type === charType)
            );
            if (!hasRequiredCharacters) canTrigger = false;
          }
        }

        if (canTrigger) {
          get().triggerCorruptionEvent(event.id);
        }
      });
    },

    triggerCorruptionEvent: (eventId: string) => {
      const event = CORRUPTION_EVENTS[eventId];
      if (!event) return;

      const { effects } = event;
      
      set((state) => {
        const newState = { ...state };
        
        // 应用腐败度变化
        if (effects.corruption) {
          newState.gameState.corruption = Math.max(0, Math.min(100, 
            newState.gameState.corruption + effects.corruption
          ));
        }
        
        // 应用稳定度变化
        if (effects.stability) {
          newState.gameState.stability = Math.max(0, Math.min(100, 
            newState.gameState.stability + effects.stability
          ));
        }
        
        // 应用资源变化
        if (effects.resources) {
          Object.entries(effects.resources).forEach(([resource, change]) => {
            if (newState.gameState.resources[resource] !== undefined) {
              newState.gameState.resources[resource] = Math.max(0, 
                newState.gameState.resources[resource] + change
              );
            }
          });
        }
        
        return newState;
      });
      
      // 显示事件通知
      get().addNotification({
        type: event.type === 'positive' ? 'success' : 'warning',
        title: event.name,
        message: event.description,
      });
    },

    clickResource: (resourceType: 'food' | 'wood' | 'stone') => {
      const { isRunning } = get();
      
      // 只有在游戏运行时才能点击资源
      if (!isRunning) {
        get().addNotification({
          type: 'warning',
          title: '游戏未开始',
          message: '请先点击开始按钮启动游戏后再收集资源',
          duration: 3000,
        });
        return;
      }
      
      const { gameState } = get();
      const newResources = {
        ...gameState.resources,
        [resourceType]: gameState.resources[resourceType] + 1,
      };
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          resources: newResources,
        },
      }));
      
      // 同步资源管理器状态
      if (resourceManager) {
            resourceManager.setResources(newResources, 'manual');
          }
    },

    recruitCharacter: (type: string, cost: Partial<Resources>) => {
      const { canAfford, spendResources } = get();
      
      if (!canAfford(cost)) {
        return false;
      }
      
      const success = spendResources(cost);
      if (success) {
        const characterId = `${type}_${Date.now()}`;
        const newCharacter = {
          id: characterId,
          name: `${type === 'craftsman' ? '工匠' : type === 'warrior' ? '战士' : '长老'} ${Math.floor(Math.random() * 100) + 1}`,
          type: type as any,
          level: 1,
          experience: 0,
          isActive: true,
          skills: {},
          traits: [],
        };
        
        set((state) => ({
          gameState: {
            ...state.gameState,
            characters: {
              ...state.gameState.characters,
              [characterId]: newCharacter,
            },
          },
        }));
        
        return true;
      }
      
      return false;
    },

    calculatePopulationGrowth: () => {
      const { gameState } = get();
      const { resources, stability } = gameState;
      
      // 如果人口为0且有住房，自动增加1人口
      if (resources.population === 0 && resources.housing > 0) {
        get().addResources({ population: 1 });
        return;
      }
      
      // 如果没有人口，不进行增长计算
      if (resources.population === 0) {
        return;
      }
      
      // 基础条件：必须有空余住房和食物（人口上限 = housing + 1）
      const availableHousing = (resources.housing + 1) - resources.population;
      if (availableHousing <= 0 || resources.food <= 0) {
        return;
      }
      
      // 基础增长概率：每十天增长一个人口（约0.1%每秒）
      const baseGrowthChance = 0.001;
      
      // 根据稳定度等级调整增长倍率
      let stabilityMultiplier = 1.0;
      if (stability >= 90) {
        // 极度稳定：正常增长
        stabilityMultiplier = 1.0;
      } else if (stability >= 75) {
        // 高度稳定：正常增长
        stabilityMultiplier = 1.0;
      } else if (stability >= 60) {
        // 基本稳定：正常增长
        stabilityMultiplier = 1.0;
      } else if (stability >= 45) {
        // 轻度不稳：-25%增长率
        stabilityMultiplier = 0.75;
      } else if (stability >= 30) {
        // 中度不稳：-50%增长率
        stabilityMultiplier = 0.5;
      } else if (stability >= 15) {
        // 严重不稳：-75%增长率
        stabilityMultiplier = 0.25;
      } else {
        // 崩溃：-100%增长率（无增长）
        stabilityMultiplier = 0;
      }
      
      // 住房充足度影响
      const housingAbundance = availableHousing / resources.population;
      let housingMultiplier = 1.0;
      if (housingAbundance > 0.5) {
        housingMultiplier = 1.5;
      } else if (housingAbundance < 0.2) {
        housingMultiplier = 0.5;
      }
      
      // 计算最终增长概率
      const finalGrowthChance = baseGrowthChance * stabilityMultiplier * housingMultiplier;
      
      // 使用随机数决定是否增长
      if (Math.random() < finalGrowthChance) {
        get().addResources({ population: 1 });
        
        // 添加人口增长通知
        get().addNotification({
          type: 'success',
          title: '人口增长',
          message: `部落迎来了新成员！当前人口：${resources.population + 1}`,
          duration: 3000,
        });
      }
    },

    checkPopulationLimits: () => {
      const { gameState } = get();
      const { resources } = gameState;
      
      // 检查住房限制（人口上限 = housing + 1）
      const populationCap = resources.housing + 1;
      if (resources.population > populationCap) {
        get().updateStability(-5);
        get().addNotification({
          type: 'warning',
          title: '住房不足',
          message: '人口超过了住房容量，稳定度下降。',
        });
      }
      
      // 检查食物供应
      const foodPerPerson = resources.population > 0 ? (resources.food / resources.population) : 0;
      if (resources.population > 0 && foodPerPerson < 1) {
        get().updateStability(-3);
        get().addNotification({
          type: 'error',
          title: '食物短缺',
          message: '食物供应不足，人民开始挨饿。',
        });
      }
    },

    checkGameEvents: () => {
      const state = get().gameState;
      
      // 每次检查时有一定概率触发事件
      Object.values(GAME_EVENTS).forEach(event => {
        // 检查事件是否已经激活
        if (state.activeEvents.some(activeEvent => activeEvent.id === event.id)) {
          return;
        }
        
        // 检查触发条件
        let canTrigger = true;
        if (event.conditions) {
          for (const condition of event.conditions) {
            switch (condition.type) {
              case 'population_min':
                if (state.resources.population < condition.value) canTrigger = false;
                break;
              case 'technology':
                const tech = state.technologies[condition.value];
                if (!tech || !tech.researched) canTrigger = false;
                break;
              case 'building':
                if (!state.buildings[condition.value] || state.buildings[condition.value] === 0) canTrigger = false;
                break;
            }
          }
        }
        
        if (canTrigger && Math.random() < event.probability) {
          // 触发事件
          const activeEvent = {
            id: event.id,
            triggeredAt: Date.now(),
            ...event
          };
          
          set(state => ({
            gameState: {
              ...state.gameState,
              activeEvents: [...state.gameState.activeEvents, activeEvent],
              isPaused: event.pauseGame || state.gameState.isPaused
            }
          }));
          
          // 如果是非暂停事件且有直接效果，立即应用
          if (!event.pauseGame && event.effects) {
            get().applyEventEffects(event.effects);
          }
        }
      });
    },
    
    applyEventEffects: (effects) => {
      set(state => {
        const newState = { ...state.gameState };
        
        effects.forEach(effect => {
          switch (effect.type) {
            case 'resource':
              if (newState.resources[effect.target] !== undefined) {
                newState.resources[effect.target] += effect.value;
                if (newState.resources[effect.target] < 0) {
                  newState.resources[effect.target] = 0;
                }
              }
              break;
            case 'stability':
              newState.stability = Math.max(0, Math.min(100, newState.stability + effect.value));
              break;
          }
        });
        
        return { gameState: newState };
      });
    },
    
    handleEventChoice: (eventId, choiceIndex) => {
      const state = get().gameState;
      const event = state.activeEvents.find(e => e.id === eventId);
      
      if (event && event.choices && event.choices[choiceIndex]) {
        const choice = event.choices[choiceIndex];
        
        // 应用选择的效果
        if (choice.effects) {
          get().applyEventEffects(choice.effects);
        }
        
        // 移除事件
        get().dismissEvent(eventId);
      }
    },
    
    dismissEvent: (eventId) => {
      set(state => ({
        gameState: {
          ...state.gameState,
          activeEvents: state.gameState.activeEvents.filter(event => event.id !== eventId)
        }
      }));
    },
    
    checkAchievements: () => {
      const state = get().gameState;
      
      Object.values(ACHIEVEMENTS).forEach(achievement => {
        // 检查永久成就存储中是否已解锁
        if (typeof window !== 'undefined') {
          const achievementStore = useAchievementStore.getState();
          if (achievementStore.hasAchievement(achievement.id)) return;
        }
        
        let unlocked = false;
        
        // 检查成就条件
        switch (achievement.condition.type) {
          case 'population_size':
            unlocked = state.resources.population >= achievement.condition.value;
            break;
          case 'technology_count':
            if (achievement.condition.target) {
              // 检查特定技术是否已研究
              const tech = state.technologies[achievement.condition.target];
              unlocked = tech && tech.researched;
            } else {
              // 检查研究技术总数
              const researchedCount = Object.values(state.technologies).filter(tech => tech.researched).length;
              unlocked = researchedCount >= achievement.condition.value;
            }
            break;
          case 'gameTime':
            unlocked = state.gameTime >= achievement.condition.value;
            break;
          case 'resources':
            if (achievement.condition.target) {
              unlocked = state.resources[achievement.condition.target] >= achievement.condition.value;
            }
            break;
          case 'buildings_count':
            const buildingCount = Object.values(state.buildings).reduce((sum, count) => sum + count, 0);
            unlocked = buildingCount >= achievement.condition.value;
            break;
        }
        
        if (unlocked) {
          const achievementData = {
            id: achievement.id,
            unlockedAt: Date.now()
          };
          
          // 保存到永久成就存储
          if (typeof window !== 'undefined') {
            useAchievementStore.getState().addAchievement(achievementData);
          }
          
          // 同时保存到当前游戏状态（用于显示）
          set(state => ({
            gameState: {
              ...state.gameState,
              achievements: [...state.gameState.achievements, achievementData]
            }
          }));
          
          // 给予继承点奖励
          if (achievement.reward && achievement.reward.inheritancePoints) {
            get().addInheritancePoints(achievement.reward.inheritancePoints);
          }
          
          // 添加成就解锁通知
          get().addNotification({
            type: 'achievement',
            title: '成就解锁！',
            message: `获得成就：${achievement.name}${achievement.reward?.inheritancePoints ? ` (+${achievement.reward.inheritancePoints} 继承点)` : ''}`,
            duration: 5000
          });
        }
      });
    },

    // 人口分配系统
    assignWorkerToBuilding: (buildingId: string, count = 1) => {
      const { gameState } = get();
      const building = gameState.buildings[buildingId];
      
      if (!building || get().getAvailableWorkers() < count) {
        return false;
      }
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          buildings: {
            ...state.gameState.buildings,
            [buildingId]: {
              ...building,
              assignedWorkers: (building.assignedWorkers || 0) + count,
            },
          },
        },
      }));
      
      return true;
    },

    removeWorkerFromBuilding: (buildingId: string, count = 1) => {
      const { gameState } = get();
      const building = gameState.buildings[buildingId];
      
      if (!building || (building.assignedWorkers || 0) < count) {
        return false;
      }
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          buildings: {
            ...state.gameState.buildings,
            [buildingId]: {
              ...building,
              assignedWorkers: Math.max(0, (building.assignedWorkers || 0) - count),
            },
          },
        },
      }));
      
      return true;
    },

    getAvailableWorkers: () => {
      const { gameState } = get();
      const totalPopulation = gameState.resources.population;
      const assignedWorkers = get().getTotalAssignedWorkers();
      return Math.max(0, totalPopulation - assignedWorkers);
    },

    getTotalAssignedWorkers: () => {
      const { gameState } = get();
      return Object.values(gameState.buildings).reduce(
        (total, building) => total + (building.assignedWorkers || 0),
        0
      );
    },

    // 随机事件系统
    checkRandomEvents: () => {
      const state = get().gameState;
      
      // 遍历所有随机事件
      Object.values(RANDOM_EVENTS).forEach(event => {
        // 检查事件触发条件
        let canTrigger = true;
        
        // 检查资源需求
        if (event.requirements?.resources) {
          for (const [resource, amount] of Object.entries(event.requirements.resources)) {
            if (state.resources[resource as keyof Resources] < amount) {
              canTrigger = false;
              break;
            }
          }
        }
        
        // 检查建筑需求
        if (event.requirements?.buildings && canTrigger) {
          for (const [buildingId, count] of Object.entries(event.requirements.buildings)) {
            if (get().getBuildingCount(buildingId) < count) {
              canTrigger = false;
              break;
            }
          }
        }
        
        // 检查科技需求
        if (event.requirements?.technologies && canTrigger) {
          for (const techId of event.requirements.technologies) {
            if (!state.technologies[techId]?.researched) {
              canTrigger = false;
              break;
            }
          }
        }
        
        // 检查人口需求
        if (event.requirements?.population && canTrigger) {
          if (state.resources.population < event.requirements.population) {
            canTrigger = false;
          }
        }
        
        // 如果满足条件，按概率触发事件
        if (canTrigger && Math.random() < event.probability) {
          get().triggerRandomEvent(event.id);
        }
      });
    },

    triggerRandomEvent: (eventId: string) => {
      const event = RANDOM_EVENTS[eventId];
      if (!event) return;
      
      set((state) => {
        const newState = { ...state };
        
        // 应用事件效果
        if (event.effects) {
          // 资源变化
          if (event.effects.resources) {
            for (const [resource, change] of Object.entries(event.effects.resources)) {
              const currentValue = newState.gameState.resources[resource as keyof Resources];
              newState.gameState.resources[resource as keyof Resources] = Math.max(0, currentValue + change);
            }
          }
          
          // 稳定度变化
          if (event.effects.stability) {
            newState.gameState.stability = Math.max(0, Math.min(100, newState.gameState.stability + event.effects.stability));
          }
          
          // 腐败度变化
          if (event.effects.corruption) {
            newState.gameState.corruption = Math.max(0, newState.gameState.corruption + event.effects.corruption);
          }
        }
        
        return newState;
      });
      
      // 显示事件
      get().showEvent({
        id: event.id,
        title: event.name,
        description: event.description,
        type: event.type,
        timestamp: Date.now(),
        effects: event.effects
      });
      
      // 添加通知
      get().addNotification({
        type: event.type === 'positive' ? 'success' : event.type === 'negative' ? 'error' : 'info',
        title: event.name,
        message: event.description
      });
    },

    // 军队管理
    addUnit: (unitType: string, count = 1) => {
      set((state) => ({
        army: {
          ...state.army,
          [unitType]: (state.army[unitType] || 0) + count,
        },
      }));
    },

    removeUnit: (unitType: string, count = 1) => {
      set((state) => ({
        army: {
          ...state.army,
          [unitType]: Math.max(0, (state.army[unitType] || 0) - count),
        },
      }));
    },

    getUnitCount: (unitType: string) => {
      const { army } = get();
      return army[unitType] || 0;
    },

    // Buff系统实现
    addBuff: (buff) => {
      const buffId = `${buff.source.type}_${buff.source.id}_${Date.now()}`;
      const newBuff: Buff = {
        ...buff,
        id: buffId,
        startTime: Date.now(),
        isActive: true,
      };
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          buffs: {
            ...state.gameState.buffs,
            [buffId]: newBuff,
          },
        },
      }));
    },

    removeBuff: (buffId) => {
      set((state) => {
        const { [buffId]: removed, ...remainingBuffs } = state.gameState.buffs;
        return {
          gameState: {
            ...state.gameState,
            buffs: remainingBuffs,
          },
        };
      });
    },

    updateBuffs: () => {
      const currentTime = Date.now();
      set((state) => {
        const updatedBuffs: Record<string, Buff> = {};
        
        if (!state.gameState.buffs) {
          return {
            gameState: {
              ...state.gameState,
              buffs: {}
            }
          };
        }
        
        Object.entries(state.gameState.buffs).forEach(([id, buff]) => {
          if (buff.duration && currentTime - buff.startTime >= buff.duration * 1000) {
            // Buff已过期，不添加到更新后的buffs中
            return;
          }
          updatedBuffs[id] = buff;
        });
        
        return {
          gameState: {
            ...state.gameState,
            buffs: updatedBuffs,
          },
        };
      });
    },

    getActiveBuffs: () => {
      const { gameState } = get();
      if (!gameState.buffs) {
        return [];
      }
      return Object.values(gameState.buffs).filter(buff => buff.isActive);
    },

    getBuffSummary: () => {
      const activeBuffs = get().getActiveBuffs();
      const summary: BuffSummary = {
        totalEffects: {},
        sources: [],
      };
      
      // 按来源分组buff
      const sourceGroups: Record<string, Buff[]> = {};
      
      activeBuffs.forEach(buff => {
        const sourceKey = `${buff.source.type}_${buff.source.id}`;
        if (!sourceGroups[sourceKey]) {
          sourceGroups[sourceKey] = [];
        }
        sourceGroups[sourceKey].push(buff);
        
        // 累计效果
        Object.entries(buff.effects).forEach(([key, value]) => {
          if (!summary.totalEffects[key]) {
            summary.totalEffects[key] = 0;
          }
          summary.totalEffects[key] += value;
        });
      });
      
      // 生成来源信息
      Object.entries(sourceGroups).forEach(([sourceKey, buffs]) => {
        const firstBuff = buffs[0];
        summary.sources.push({
          type: firstBuff.source.type,
          id: firstBuff.source.id,
          name: firstBuff.source.name,
          buffs: buffs,
        });
      });
      
      return summary;
    },

    applyBuffEffects: () => {
      // 这个方法将在calculateResourceRates中调用
      // 用于将buff效果应用到资源生产率等计算中
    },
    
    // 继承点系统实现
    addInheritancePoints: (points: number) => {
      set((state) => ({
        gameState: {
          ...state.gameState,
          inheritancePoints: state.gameState.inheritancePoints + points,
        },
      }));
    },
    
    spendInheritancePoints: (points: number) => {
      const { gameState } = get();
      if (gameState.inheritancePoints >= points) {
        set((state) => ({
          gameState: {
            ...state.gameState,
            inheritancePoints: state.gameState.inheritancePoints - points,
          },
        }));
        return true;
      }
      return false;
    },
    
    getInheritancePoints: () => {
      return get().gameState.inheritancePoints;
    },
    
    purchaseInheritanceBuff: (buffId: string) => {
      const state = get().gameState;
      const { spendInheritancePoints, addBuff } = get();
      
      // 继承点商店物品定义
      const inheritanceBuffs: Record<string, { cost: number; buff: Omit<Buff, 'id' | 'startTime' | 'isActive'> }> = {
        'resource_boost': {
          cost: 3,
          buff: {
            name: '资源加成',
            description: '所有资源生产效率+20%',
            source: {
              type: 'inheritance',
              id: 'resource_boost',
              name: '继承点商店',
            },
            effects: [
              { type: 'resource_production', target: 'food', value: 0.2, isPercentage: true },
              { type: 'resource_production', target: 'wood', value: 0.2, isPercentage: true },
              { type: 'resource_production', target: 'stone', value: 0.2, isPercentage: true },
              { type: 'resource_production', target: 'tools', value: 0.2, isPercentage: true },
            ],
          },
        },
        'stability_boost': {
          cost: 2,
          buff: {
            name: '稳定加成',
            description: '稳定度+15，腐败度-10',
            source: {
              type: 'inheritance',
              id: 'stability_boost',
              name: '继承点商店',
            },
            effects: [
              { type: 'stability', target: 'stability', value: 15, isPercentage: false },
              { type: 'corruption', target: 'corruption', value: -10, isPercentage: false },
            ],
          },
        },
        'research_boost': {
          cost: 4,
          buff: {
            name: '研究加速',
            description: '研究速度+50%',
            source: {
              type: 'inheritance',
              id: 'research_boost',
              name: '继承点商店',
            },
            effects: [
              { type: 'research_speed', target: 'research', value: 0.5, isPercentage: true },
            ],
          },
        },
        'population_boost': {
          cost: 3,
          buff: {
            name: '人口增长',
            description: '人口增长速度+30%，人口上限+5',
            source: {
              type: 'inheritance',
              id: 'population_boost',
              name: '继承点商店',
            },
            effects: [
              { type: 'population_growth', target: 'population', value: 0.3, isPercentage: true },
              { type: 'resource_limit', target: 'population', value: 5, isPercentage: false },
            ],
          },
        },
        'building_boost': {
          cost: 5,
          buff: {
            name: '建筑效率',
            description: '所有建筑效率+25%',
            source: {
              type: 'inheritance',
              id: 'building_boost',
              name: '继承点商店',
            },
            effects: [
              { type: 'building_efficiency', target: 'all', value: 0.25, isPercentage: true },
            ],
          },
        },
      };
      
      const buffConfig = inheritanceBuffs[buffId];
      if (!buffConfig) {
        return false;
      }
      
      // 检查是否已拥有
      if (state.buffs[buffId]?.isActive) {
        return false;
      }
      
      // 检查继承点是否足够
      if (state.inheritancePoints < buffConfig.cost) {
        return false;
      }
      
      if (spendInheritancePoints(buffConfig.cost)) {
        addBuff(buffConfig.buff);
        return true;
      }
      
      return false;
    },
    
    // 事件系统方法
    addEvent: (event) => {
      const newEvent: GameEventInstance = {
        ...event,
        timestamp: Date.now()
      };
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          activeEvents: [...state.gameState.activeEvents, newEvent],
          // 如果是暂停事件且当前没有暂停事件，则设置为当前暂停事件并暂停游戏
          currentPausingEvent: event.pausesGame && !state.gameState.currentPausingEvent ? newEvent : state.gameState.currentPausingEvent
        },
        isRunning: event.pausesGame && !state.gameState.currentPausingEvent ? false : state.isRunning
      }));
    },
    
    resolveEvent: (eventId, choiceId) => {
      const state = get().gameState;
      const event = state.activeEvents.find(e => e.id === eventId);
      if (!event) return;
      
      // 应用事件效果
      if (choiceId && event.choices) {
        const choice = event.choices.find(c => c.id === choiceId);
        if (choice && choice.effects) {
          choice.effects.forEach(effect => {
            switch (effect.type) {
              case 'resource_change':
                get().addResources({ [effect.target]: effect.value });
                break;
              case 'stability_change':
                get().updateStability(effect.value);
                break;
              // 可以添加更多效果类型
            }
          });
        }
      } else if (event.effects) {
        event.effects.forEach(effect => {
          switch (effect.type) {
            case 'resource_change':
              get().addResources({ [effect.target]: effect.value });
              break;
            case 'stability_change':
              get().updateStability(effect.value);
              break;
            // 可以添加更多效果类型
          }
        });
      }
      
      // 移除事件
      get().removeEvent(eventId);
    },
    
    removeEvent: (eventId) => {
      set((state) => {
        const newActiveEvents = state.gameState.activeEvents.filter(e => e.id !== eventId);
        const wasPausingEvent = state.gameState.currentPausingEvent?.id === eventId;
        
        return {
          gameState: {
            ...state.gameState,
            activeEvents: newActiveEvents,
            currentPausingEvent: wasPausingEvent ? undefined : state.gameState.currentPausingEvent
          },
          // 如果移除的是暂停事件，恢复游戏运行
          isRunning: wasPausingEvent ? true : state.isRunning
        };
      });
    },
    
    checkGameEvents: () => {
      const state = get().gameState;
      
      // 获取所有可触发的事件
      const triggeredEvents = getTriggeredEvents(state);
      
      // 处理触发的事件
      triggeredEvents.forEach(event => {
        if (event.pausesGame) {
          // 暂停事件
          get().triggerPauseEvent(event as PauseEvent);
        } else {
          // 不暂停事件
          get().triggerNonPauseEvent(event as NonPauseEvent);
        }
      });
      
      // 随机事件检查（降低概率）
      if (Math.random() < 0.005) { // 0.5%概率
        const randomEvent = selectRandomEvent(state);
        if (randomEvent) {
          if (randomEvent.pausesGame) {
            get().triggerPauseEvent(randomEvent as PauseEvent);
          } else {
            get().triggerNonPauseEvent(randomEvent as NonPauseEvent);
          }
        }
      }
    },
    
    toggleGamePause: () => {
      const state = get();
      // 如果有暂停事件，不允许手动恢复
      if (state.gameState.activeEvents.length > 0) return;
      
      get().togglePause();
    },

    // 事件处理函数
    triggerPauseEvent: (event: PauseEvent) => {
      set((state) => ({
        gameState: {
          ...state.gameState,
          activeEvents: [...state.gameState.activeEvents, event],
        },
      }));
      // 暂停游戏
      get().pauseGame();
    },

    triggerNonPauseEvent: (event: NonPauseEvent) => {
      set((state) => ({
        gameState: {
          ...state.gameState,
          recentEvents: [...state.gameState.recentEvents, event].slice(-10), // 只保留最近10个事件
        },
      }));
    },

    handlePauseEventChoice: (eventId: string, choiceIndex: number) => {
      const state = get();
      const event = state.gameState.activeEvents.find(e => e.id === eventId);
      if (!event || !event.choices) return;

      const choice = event.choices[choiceIndex];
      if (choice && choice.effects) {
        get().applyEventEffects(choice.effects);
      }

      // 移除事件
      get().dismissPauseEvent(eventId);
    },

    dismissPauseEvent: (eventId: string) => {
      set((state) => ({
        gameState: {
          ...state.gameState,
          activeEvents: state.gameState.activeEvents.filter(e => e.id !== eventId),
        },
      }));
      
      // 如果没有更多暂停事件，可以恢复游戏
      const newState = get();
      if (newState.gameState.activeEvents.length === 0) {
        get().startGame();
      }
    },

    clearRecentEvents: () => {
      set((state) => ({
        gameState: {
          ...state.gameState,
          recentEvents: [],
        },
      }));
    },
    
    // 转生系统方法
    calculateRebirthRewards: () => {
      const state = get();
      const { gameState } = state;
      
      // 基于游戏进度计算继承点
      let points = 0;
      
      // 基于游戏时间（每小时1点）
      points += Math.floor(gameState.gameTime / 3600);
      
      // 基于人口（每10人口1点）
      points += Math.floor(gameState.resources.population / 10);
      
      // 基于已研究科技数量（每个科技2点）
      const researchedTechs = Object.values(gameState.technologies).filter(tech => tech.researched);
      points += researchedTechs.length * 2;
      
      // 基于建筑数量（每5个建筑1点）
      const totalBuildings = Object.values(gameState.buildings).reduce((sum, building) => sum + building.count, 0);
      points += Math.floor(totalBuildings / 5);
      
      // 基于成就数量（每个成就5点）
      points += gameState.achievements.length * 5;
      
      return Math.max(1, points); // 至少获得1点
    },
    
    performRebirth: () => {
      const state = get();
      const rebirthRewards = state.calculateRebirthRewards();
      
      set((state) => ({
        gameState: {
          ...initialGameState,
          inheritancePoints: state.gameState.inheritancePoints + rebirthRewards,
        },
        uiState: {
          ...initialUIState,
          showInheritanceShop: true, // 转生后显示继承点商店
        },
        isRunning: false,
        lastUpdateTime: Date.now(),
        army: {},
      }));
      
      // 清除成就存储
      const achievementStore = useAchievementStore.getState();
      achievementStore.clearAchievements();
    },
    
    showRebirthConfirmation: () => {
      set((state) => ({
        uiState: {
          ...state.uiState,
          showRebirthConfirmation: true,
        },
      }));
    },
    
    hideRebirthConfirmation: () => {
      set((state) => ({
        uiState: {
          ...state.uiState,
          showRebirthConfirmation: false,
        },
      }));
    },
    
    showInheritanceShop: () => {
      set((state) => ({
        uiState: {
          ...state.uiState,
          showInheritanceShop: true,
        },
      }));
    },
    
    hideInheritanceShop: () => {
      set((state) => ({
        uiState: {
          ...state.uiState,
          showInheritanceShop: false,
        },
      }));
    },

    clearStorage: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('civilization-game-storage');
        localStorage.removeItem('civilization-achievements-storage');
        // 清除存储后，页面刷新时会自动重新初始化为默认状态
        window.location.reload();
      }
    },

    // 持久化功能实现
    saveGame: () => {
      try {
        const state = get();
        // 使用增强的持久化系统
        const success = saveGameStateEnhanced(
          state.gameState,
          state.uiState,
          state.army
        );
        
        if (success) {
          state.addNotification({
            type: 'success',
            title: '游戏已保存',
            message: '游戏状态已成功保存到本地存储（包含备份）',
          });
        } else {
          state.addNotification({
            type: 'error',
            title: '保存失败',
            message: '无法保存游戏状态，请检查浏览器存储权限',
          });
        }
      } catch (error) {
        console.error('保存游戏状态失败:', error);
        const state = get();
        state.addNotification({
          type: 'error',
          title: '保存失败',
          message: '保存过程中发生错误，请重试',
        });
      }
    },

    loadGame: () => {
      try {
        // 首先尝试从增强持久化系统加载
        const enhancedData = loadGameStateEnhanced();
        if (enhancedData) {
          console.log('从增强持久化系统加载游戏状态');
          set((state) => ({
            ...state,
            gameState: {
              ...enhancedData.gameState,
              isPaused: true, // 确保加载后游戏为暂停状态
            },
            uiState: enhancedData.uiState || state.uiState,
            army: enhancedData.army || state.army,
            isRunning: false,
            lastUpdateTime: Date.now(),
          }));
          
          // 加载后立刻初始化效果系统
          get().updateEffectsSystem();
          
          const currentState = get();
          currentState.addNotification({
            type: 'success',
            title: '游戏已加载',
            message: '游戏状态已从本地存储恢复',
          });
          return true;
        }
        
        // 如果增强系统没有数据，尝试从zustand persist加载
        const savedData = localStorage.getItem('civilization-game-storage');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.state) {
            console.log('从zustand persist加载游戏状态');
            set((state) => ({
              ...state,
              gameState: {
                ...parsed.state.gameState,
                isPaused: true,
              },
              uiState: parsed.state.uiState || state.uiState,
              army: parsed.state.army || state.army,
              isRunning: false,
              lastUpdateTime: Date.now(),
            }));
            
            // 加载后立刻初始化效果系统
            get().updateEffectsSystem();
            
            const currentState = get();
            currentState.addNotification({
              type: 'info',
              title: '游戏已加载',
              message: '从旧版本存储恢复游戏状态',
            });
            return true;
          }
        }
        
        console.log('没有找到保存的游戏数据，使用默认状态');
        const currentState = get();
        currentState.addNotification({
          type: 'info',
          title: '新游戏',
          message: '没有找到保存数据，开始新游戏',
        });
        
        // 使用默认初始状态时，也初始化效果系统
        get().updateEffectsSystem();
        
        return false;
      } catch (error) {
        console.error('加载游戏状态失败:', error);
        const currentState = get();
        currentState.addNotification({
          type: 'error',
          title: '加载失败',
          message: '无法加载游戏状态，将使用默认设置',
        });
        return false;
      }
    },

    initializePersistence: () => {
      const state = get();
      
      // 初始化自动保存管理器
      const autoSaveManager = new AutoSaveManager();
      
      // 启动自动保存（每10秒保存一次）
      if (state.gameState.settings.autoSave) {
        autoSaveManager.start(() => {
          const currentState = get();
          console.log('自动保存触发 - 保存当前游戏状态');
          // 返回完整的状态用于保存
          return {
            gameState: currentState.gameState,
            uiState: currentState.uiState,
            army: currentState.army,
            isRunning: false, // 保存时确保游戏为暂停状态
            lastUpdateTime: currentState.lastUpdateTime
          };
        });
      }
      
      console.log('持久化功能已初始化 - 每10秒自动保存');
    },

    // 统计数据管理
    updateStatistics: (updates) => {
      set((state) => ({
        ...state,
        gameState: {
          ...state.gameState,
          statistics: {
            ...state.gameState.statistics,
            ...updates,
          },
        },
      }));
    },

    incrementStatistic: (key, value = 1) => {
      set((state) => {
        const currentValue = state.gameState.statistics[key];
        const newValue = typeof currentValue === 'number' ? currentValue + value : value;
        
        return {
          ...state,
          gameState: {
            ...state.gameState,
            statistics: {
              ...state.gameState.statistics,
              [key]: newValue,
            },
          },
        };
      });
    },

    // 游戏速度控制
    setGameSpeed: (speed) => {
      set((state) => ({
        ...state,
        gameState: {
          ...state.gameState,
          // 兼容旧字段：同步根级 gameSpeed
          gameSpeed: speed,
          // 正确更新设置中的速度
          settings: {
            ...state.gameState.settings,
            gameSpeed: speed,
          },
        },
      }));
    },

    // 事件轮询频率控制（200ms - 10000ms）
    setEventsPollIntervalMs: (ms) => {
      set((state) => {
        const clamped = Math.max(200, Math.min(10000, Math.floor(ms)));
        return {
          ...state,
          gameState: {
            ...state.gameState,
            settings: {
              ...state.gameState.settings,
              eventsPollIntervalMs: clamped,
            },
          },
        };
      });
    },

    // 事件调试日志开关
    setEventsDebugEnabled: (enabled) => {
      set((state) => ({
        ...state,
        gameState: {
          ...state.gameState,
          settings: {
            ...state.gameState.settings,
            eventsDebugEnabled: !!enabled,
          },
        },
      }));
    },

    // 效果系统实现
    getEffectsSystem: () => {
      return globalEffectsSystem;
    },

    updateEffectsSystem: () => {
      const state = get().gameState;
      globalEffectsSystem.updateFromGameState(state);
      set((s) => ({ ...s, effectsVersion: s.effectsVersion + 1 }));
    },

    getActiveEffects: () => {
      return globalEffectsSystem.getActiveEffects();
    },

    getEffectsByType: (type: EffectType) => {
      return globalEffectsSystem.getEffectsByType(type);
    },

    getEffectsBySource: (sourceType: EffectSourceType, sourceId?: string) => {
      return globalEffectsSystem.getEffectsBySource(sourceType, sourceId);
    },

    addEffect: (effect: Omit<Effect, 'id'>) => {
      globalEffectsSystem.addEffect(effect);
    },

    removeEffect: (effectId: string) => {
      globalEffectsSystem.removeEffect(effectId);
    },

    removeEffectsBySource: (sourceType: EffectSourceType, sourceId?: string) => {
      globalEffectsSystem.removeEffectsBySource(sourceType, sourceId);
    },

    calculateEffectTotal: (type: EffectType) => {
      return get().getEffectsSystem().calculateEffectTotal(type);
    },
    
    // 新的科技系统方法实现
    getTechnology: (technologyId: string) => {
      const { gameState } = get();
      return gameState.technologies[technologyId];
    },
    
    getAvailableTechnologies: () => {
      const { gameState } = get();
      return Object.values(gameState.technologies).filter(tech => 
        !tech.researched && get().canResearch(tech.id)
      );
    },
    
    getResearchedTechnologies: () => {
      const { gameState } = get();
      return Object.values(gameState.technologies).filter(tech => tech.researched);
    },
    
    canResearch: (technologyId: string) => {
      const { gameState } = get();
      const technology = gameState.technologies[technologyId];
      
      if (!technology || technology.researched) {
        return false;
      }
      
      // 获取已研究的科技集合
      const researchedTechs = new Set(
        Object.values(gameState.technologies)
          .filter(tech => tech.researched)
          .map(tech => tech.id)
      );
      
      return canResearchTechnology(technologyId, researchedTechs);
    },
    
    addResearchPoints: (points: number) => {
      set((state) => ({
        gameState: {
          ...state.gameState,
          resources: {
            ...state.gameState.resources,
            researchPoints: Math.min(
              state.gameState.resources.researchPoints + points,
              state.gameState.resourceLimits.researchPoints
            ),
          },
        },
      }));
    },
    
    spendResearchPoints: (points: number) => {
      const { gameState } = get();
      if (gameState.resources.researchPoints >= points) {
        set((state) => ({
          gameState: {
            ...state.gameState,
            resources: {
              ...state.gameState.resources,
              researchPoints: state.gameState.resources.researchPoints - points,
            },
          },
        }));
        return true;
      }
      return false;
    },
    
    updateResearchPointsGeneration: () => {
      const { gameState } = get();
      let researchPointsPerSecond = 0;
      
      // 基于建筑的研究点生成
      Object.entries(gameState.buildings).forEach(([buildingId, building]) => {
        if (building.effects) {
          building.effects.forEach(effect => {
            if (effect.type === 'research_points') {
              researchPointsPerSecond += effect.value * building.count;
            }
          });
        }
      });
      
      // 基于科技的研究点加成
      Object.values(gameState.technologies).forEach(tech => {
        if (tech.researched && tech.effects) {
          tech.effects.forEach(effect => {
            if (effect.type === 'research_points') {
              researchPointsPerSecond += effect.value;
            }
          });
        }
      });
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          researchState: {
            ...state.gameState.researchState,
            researchPointsPerSecond,
          },
        },
      }));
    },
    
    applyTechnologyEffects: (technologyId: string) => {
      const { gameState } = get();
      const technology = gameState.technologies[technologyId];
      
      if (!technology || !technology.effects) return;
      
      technology.effects.forEach(effect => {
        switch (effect.type) {
          case 'resource_rate':
            // 资源生产率效果通过动态计算实现
            break;
          case 'resource_limit':
            // 资源上限效果
            if (effect.resource) {
              set((state) => ({
                gameState: {
                  ...state.gameState,
                  resourceLimits: {
                    ...state.gameState.resourceLimits,
                    [effect.resource!]: state.gameState.resourceLimits[effect.resource! as keyof Resources] + effect.value,
                  },
                },
              }));
            }
            break;
          case 'building_unlock':
            // 建筑解锁通过动态检查实现
            break;
          case 'stability':
            get().updateStability(effect.value);
            break;
          case 'corruption':
            get().updateCorruption(effect.value);
            break;
        }
      });
      
      // 重新计算资源生产率
      get().calculateResourceRates();
      get().updateResearchPointsGeneration();
    },
    
    // 新建筑系统方法实现
    constructBuilding: (buildingId: string) => {
      const { gameState } = get();
      const buildingDef = getBuildingDefinition(buildingId);
      
      if (!buildingDef) {
        console.error(`Building definition not found: ${buildingId}`);
        return false;
      }
      
      // 检查是否可以建造
      const canBuild = get().canConstructBuilding(buildingId);
      if (!canBuild.canBuild) {
        get().addNotification({
          type: 'error',
          message: canBuild.reason || '无法建造此建筑'
        });
        return false;
      }
      
      // 扣除建造成本
      const cost = get().getBuildingConstructionCost(buildingId);
      if (!get().spendResources(cost)) {
        return false;
      }
      
      // 创建建筑实例
      const instanceId = `${buildingId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newBuilding: BuildingInstance = {
        id: instanceId,
        buildingId,
        name: buildingDef.name,
        level: 1,
        assignedWorkers: 0,
        constructionProgress: 100, // 立即完成建造
        isConstructed: true,
        constructionStartTime: Date.now(),
        lastProductionTime: Date.now(),
        effects: buildingDef.effects || {},
        upgrades: []
      };
      
      // 根据建筑效果提升住房资源（用于计算人口上限）
      const __housingIncrease = (buildingDef.effects || [])
        .filter(e => e.type === 'population_capacity')
        .reduce((sum, e) => sum + (e.value || 0), 0);

      set((state) => ({
        gameState: {
          ...state.gameState,
          buildings: {
            ...state.gameState.buildings,
            [instanceId]: newBuilding
          },
          resources: {
            ...state.gameState.resources,
            housing: (state.gameState.resources.housing || 0) + __housingIncrease,
          }
        }
      }));
      
      // 更新统计
      get().incrementStatistic('totalBuildingsBuilt');
      
      // 重新计算资源生产率
      get().calculateResourceRates();
      
      get().addNotification({
        type: 'success',
        message: `成功建造了${buildingDef.name}`
      });
      
      return true;
    },
    
    demolishBuildingNew: (instanceId: string) => {
      const { gameState } = get();
      const building = gameState.buildings[instanceId];
      
      if (!building) {
        return false;
      }
      
      // 移除建筑
      const newBuildings = { ...gameState.buildings };
      delete newBuildings[instanceId];

      // 折算住房容量减少
      const __def = getBuildingDefinition(building.buildingId);
      const __housingDecrease = (__def?.effects || [])
        .filter(e => e.type === 'population_capacity')
        .reduce((sum, e) => sum + (e.value || 0), 0);
      
      set((state) => {
        const newHousing = Math.max(0, (state.gameState.resources.housing || 0) - __housingDecrease);
        const newCap = newHousing + 1;
        const newPopulation = Math.min(state.gameState.resources.population, newCap);
        return {
          gameState: {
            ...state.gameState,
            buildings: newBuildings,
            resources: {
              ...state.gameState.resources,
              housing: newHousing,
              population: newPopulation,
            }
          }
        };
      });
      
      // 重新计算资源生产率
      get().calculateResourceRates();
      
      get().addNotification({
        type: 'info',
        message: `已拆除${building.name}`
      });
      
      return true;
    },
    
    assignWorkerToBuildingNew: (instanceId: string, count = 1) => {
      const { gameState } = get();
      const building = gameState.buildings[instanceId];
      const buildingDef = getBuildingDefinition(building?.buildingId || '');
      
      if (!building || !buildingDef) {
        return false;
      }
      
      const availableWorkers = get().getAvailableWorkers();
      const maxWorkers = buildingDef.maxWorkers || 1;
      const canAssign = Math.min(count, availableWorkers, maxWorkers - building.assignedWorkers);
      
      if (canAssign <= 0) {
        return false;
      }
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          buildings: {
            ...state.gameState.buildings,
            [instanceId]: {
              ...building,
              assignedWorkers: building.assignedWorkers + canAssign
            }
          }
        }
      }));
      
      // 重新计算资源生产率
      get().calculateResourceRates();
      
      return true;
    },
    
    removeWorkerFromBuildingNew: (instanceId: string, count = 1) => {
      const { gameState } = get();
      const building = gameState.buildings[instanceId];
      
      if (!building) {
        return false;
      }
      
      const canRemove = Math.min(count, building.assignedWorkers);
      
      if (canRemove <= 0) {
        return false;
      }
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          buildings: {
            ...state.gameState.buildings,
            [instanceId]: {
              ...building,
              assignedWorkers: building.assignedWorkers - canRemove
            }
          }
        }
      }));
      
      // 重新计算资源生产率
      get().calculateResourceRates();
      
      return true;
    },
    
    getBuildingInstances: (buildingId?: string) => {
      const { gameState } = get();
      const buildings = Object.values(gameState.buildings);
      
      if (buildingId) {
        return buildings.filter(building => building.buildingId === buildingId);
      }
      
      return buildings;
    },
    
    getBuildingsByCategory: (category: BuildingCategory) => {
      const { gameState } = get();
      const categoryBuildings = getBuildingsByCategory(category);
      const buildingIds = categoryBuildings.map(b => b.id);
      
      return Object.values(gameState.buildings).filter(building => 
        buildingIds.includes(building.buildingId)
      );
    },
    
    updateBuildingProduction: () => {
      const { gameState } = get();
      const now = Date.now();
      
      Object.values(gameState.buildings).forEach(building => {
        if (!building.isConstructed || building.assignedWorkers === 0) {
          return;
        }
        
        const buildingDef = getBuildingDefinition(building.buildingId);
        if (!buildingDef || !buildingDef.effects.production) {
          return;
        }
        
        const timeDiff = (now - building.lastProductionTime) / 1000; // 转换为秒
        const productionRates = BuildingUtils.calculateProductionRates(building, buildingDef, gameState.technologies);
        
        const producedResources: Partial<Resources> = {};
        Object.entries(productionRates).forEach(([resource, rate]) => {
          if (rate > 0) {
            producedResources[resource as keyof Resources] = rate * timeDiff;
          }
        });
        
        if (Object.keys(producedResources).length > 0) {
          get().addResources(producedResources);
        }
        
        // 更新最后生产时间
        set((state) => ({
          gameState: {
            ...state.gameState,
            buildings: {
              ...state.gameState.buildings,
              [building.id]: {
                ...building,
                lastProductionTime: now
              }
            }
          }
        }));
      });
    },
    
    getBuildingProductionRates: () => {
      const { gameState } = get();
      const totalRates: Partial<Resources> = {};
      
      Object.values(gameState.buildings).forEach(building => {
        if (!building.isConstructed || building.assignedWorkers === 0) {
          return;
        }
        
        const buildingDef = getBuildingDefinition(building.buildingId);
        if (!buildingDef) {
          return;
        }
        
        const rates = BuildingUtils.calculateProductionRates(building, buildingDef, gameState.technologies);
        Object.entries(rates).forEach(([resource, rate]) => {
          totalRates[resource as keyof Resources] = (totalRates[resource as keyof Resources] || 0) + rate;
        });
      });
      
      return totalRates;
    },
    
    getBuildingStorageBonus: () => {
      const { gameState } = get();
      const totalBonus: Partial<Resources> = {};
      
      Object.values(gameState.buildings).forEach(building => {
        if (!building.isConstructed) {
          return;
        }
        
        const buildingDef = getBuildingDefinition(building.buildingId);
        if (!buildingDef || !buildingDef.effects.storage) {
          return;
        }
        
        const bonus = BuildingUtils.calculateStorageBonus(building, buildingDef, gameState.technologies);
        Object.entries(bonus).forEach(([resource, amount]) => {
          totalBonus[resource as keyof Resources] = (totalBonus[resource as keyof Resources] || 0) + amount;
        });
      });
      
      return totalBonus;
    },
    
    canConstructBuilding: (buildingId: string) => {
      const { gameState } = get();
      const buildingDef = getBuildingDefinition(buildingId);
      
      if (!buildingDef) {
        return { canBuild: false, reason: '建筑定义未找到' };
      }
      
      // 检查科技前置条件
      const researchedTechs = new Set(
        Object.entries(gameState.technologies)
          .filter(([_, tech]) => tech.researched)
          .map(([id]) => id)
      );
      if (!isBuildingUnlocked(buildingId, researchedTechs)) {
        return { canBuild: false, reason: '需要先研究相关科技' };
      }
      
      // 检查建造限制
      if (buildingDef.buildLimit !== undefined) {
        const existingCount = get().getBuildingInstances(buildingId).length;
        if (existingCount >= buildingDef.buildLimit) {
          return { canBuild: false, reason: `已达到建造上限 (${buildingDef.buildLimit})` };
        }
      }
      
      // 检查资源
      const cost = get().getBuildingConstructionCost(buildingId);
      if (!get().canAfford(cost)) {
        return { canBuild: false, reason: '资源不足' };
      }
      
      return { canBuild: true };
    },
    
    getBuildingConstructionCost: (buildingId: string) => {
      const buildingDef = getBuildingDefinition(buildingId);
      if (!buildingDef) {
        return {};
      }
      
      // 这里可以根据已有建筑数量调整成本
      const existingCount = get().getBuildingInstances(buildingId).length;
      const costMultiplier = Math.pow(1.2, existingCount); // 每个额外建筑增加20%成本
      
      const adjustedCost: Partial<Resources> = {};
      Object.entries(buildingDef.cost).forEach(([resource, amount]) => {
        adjustedCost[resource as keyof Resources] = Math.ceil(amount * costMultiplier);
      });
      
      return adjustedCost;
    },
    
    removeTechnologyEffects: (technologyId: string) => {
      // 移除科技效果的逻辑（用于重置或调试）
      const { gameState } = get();
      const technology = gameState.technologies[technologyId];
      
      if (!technology || !technology.effects) return;
      
      technology.effects.forEach(effect => {
        switch (effect.type) {
          case 'resource_limit':
            if (effect.resource) {
              set((state) => ({
                gameState: {
                  ...state.gameState,
                  resourceLimits: {
                    ...state.gameState.resourceLimits,
                    [effect.resource!]: Math.max(0, state.gameState.resourceLimits[effect.resource! as keyof Resources] - effect.value),
                  },
                },
              }));
            }
            break;
          case 'stability':
            get().updateStability(-effect.value);
            break;
          case 'corruption':
            get().updateCorruption(-effect.value);
            break;
        }
      });
      
      get().calculateResourceRates();
      get().updateResearchPointsGeneration();
    },

    // 军队系统方法
    trainUnit: (unitType: string) => {
      const militarySystem = new MilitarySystem();
      const { gameState } = get();
      const result = militarySystem.trainUnit(gameState, unitType);
      
      if (result.success) {
        set((state) => ({
          gameState: {
            ...state.gameState,
            military: result.newMilitaryState!,
            resources: result.newResources!
          }
        }));
        return true;
      }
      return false;
    },

    cancelTraining: () => {
      const militarySystem = new MilitarySystem();
      const { gameState } = get();
      const result = militarySystem.cancelTraining(gameState);
      
      if (result.success) {
        set((state) => ({
          gameState: {
            ...state.gameState,
            military: result.newMilitaryState!,
            resources: result.newResources!
          }
        }));
      }
    },

    setMilitaryStatus: (status: 'defending' | 'exploring') => {
      const militarySystem = new MilitarySystem();
      const { gameState } = get();
      const result = militarySystem.setMilitaryStatus(gameState, status);
      
      if (result.success) {
        set((state) => ({
          gameState: {
            ...state.gameState,
            military: result.newMilitaryState!
          }
        }));
      }
    },

    disbandUnit: (unitId: string) => {
      const militarySystem = new MilitarySystem();
      const { gameState } = get();
      const result = militarySystem.disbandUnit(gameState, unitId);
      
      if (result.success) {
        set((state) => ({
          gameState: {
            ...state.gameState,
            military: result.newMilitaryState!,
            resources: result.newResources!
          }
        }));
      }
    },

    getMilitaryUnits: () => {
      const { gameState } = get();
      return gameState.military.units;
    },

    getTrainingQueue: () => {
      const { gameState } = get();
      return gameState.military.trainingQueue;
    },

    updateMilitaryTraining: (deltaTime: number) => {
      const militarySystem = new MilitarySystem();
      const { gameState } = get();
      const result = militarySystem.updateTraining(gameState, deltaTime);
      
      if (result.success) {
        set((state) => ({
          gameState: {
            ...state.gameState,
            military: result.newMilitaryState!
          }
        }));
      }
    },

    unlockUnitType: (unitType: string) => {
      set((state) => ({
        gameState: {
          ...state.gameState,
          military: {
            ...state.gameState.military,
            availableUnitTypes: [...state.gameState.military.availableUnitTypes, unitType]
          }
        }
      }));
    },

    // 探索系统方法
    exploreWithUnits: (units: any[]) => {
      const explorationSystem = new ExplorationSystem();
      const { gameState } = get();
      const result = explorationSystem.explore(gameState, units);
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          exploration: {
            ...state.gameState.exploration,
            explorationHistory: [...state.gameState.exploration.explorationHistory, result]
          },
          military: {
            ...state.gameState.military,
            units: state.gameState.military.units.map(unit => {
              const exploringUnit = units.find(u => u.id === unit.id);
              if (exploringUnit && result.casualties > 0) {
                return { ...unit, count: Math.max(0, unit.count - result.casualties) };
              }
              return unit;
            })
          }
        }
      }));
      
      if (result.discovery) {
        get().addDiscoveredLocation(result.discovery);
      }
      
      return result;
    },

    attackDungeon: (dungeonId: string, units: any[]) => {
      const combatSystem = new CombatSystem();
      const { gameState } = get();
      const dungeon = gameState.exploration.discoveredLocations.dungeons.find(d => d.id === dungeonId);
      
      if (!dungeon) return null;
      
      const result = combatSystem.simulateCombat(units, dungeon.enemies);
      
      // 应用战斗结果
      set((state) => ({
        gameState: {
          ...state.gameState,
          military: {
            ...state.gameState.military,
            units: state.gameState.military.units.map(unit => {
              const combatUnit = units.find(u => u.id === unit.id);
              if (combatUnit) {
                const casualties = result.playerCasualties.find(c => c.unitId === unit.id)?.casualties || 0;
                return { ...unit, count: Math.max(0, unit.count - casualties) };
              }
              return unit;
            })
          },
          resources: result.victory ? {
            ...state.gameState.resources,
            ...dungeon.rewards
          } : state.gameState.resources
        }
      }));
      
      return result;
    },

    getDiscoveredLocations: () => {
      const { gameState } = get();
      return gameState.exploration.discoveredLocations;
    },

    getExplorationHistory: () => {
      const { gameState } = get();
      return gameState.exploration.explorationHistory;
    },

    addDiscoveredLocation: (location: any) => {
      set((state) => {
        const newDiscoveredLocations = { ...state.gameState.exploration.discoveredLocations };
        
        if (location.type === 'dungeon') {
          newDiscoveredLocations.dungeons = [...newDiscoveredLocations.dungeons, location];
        } else if (location.type === 'country') {
          newDiscoveredLocations.countries = [...newDiscoveredLocations.countries, location];
        } else if (location.type === 'event') {
          newDiscoveredLocations.events = [...newDiscoveredLocations.events, location];
        }
        
        return {
          gameState: {
            ...state.gameState,
            exploration: {
              ...state.gameState.exploration,
              discoveredLocations: newDiscoveredLocations
            }
          }
        };
      });
    },

    addExplorationRecord: (record: any) => {
      set((state) => ({
        gameState: {
          ...state.gameState,
          exploration: {
            ...state.gameState.exploration,
            explorationHistory: [...state.gameState.exploration.explorationHistory, record]
          }
        }
      }));
    },

    // 人物系统方法
    generateCharacter: () => {
      const { generateRandomCharacter } = require('./character-system');
      const character = generateRandomCharacter();
      set((state) => ({
        gameState: {
          ...state.gameState,
          characterSystem: {
            ...state.gameState.characterSystem,
            availableCharacters: [...state.gameState.characterSystem.availableCharacters, character],
            allCharacters: {
              ...state.gameState.characterSystem.allCharacters,
              [character.id]: character
            }
          }
        }
      }));
      return character;
    },

    appointCharacter: (characterId: string, position: CharacterPosition) => {
      const state = get();
      const character = state.gameState.characterSystem.allCharacters[characterId];
      if (!character) return false;

      // 检查职位是否已解锁
      if (!state.gameState.characterSystem.unlockedPositions.includes(position)) {
        return false;
      }

      // 检查职位是否已被占用
      const currentHolder = Object.values(state.gameState.characterSystem.activeCharacters)
        .find(char => char.position === position);
      if (currentHolder) return false;

      // 任命人物
      const appointedCharacter = { ...character, position };
      set((state) => ({
        gameState: {
          ...state.gameState,
          characterSystem: {
            ...state.gameState.characterSystem,
            activeCharacters: {
              ...state.gameState.characterSystem.activeCharacters,
              [characterId]: appointedCharacter
            },
            availableCharacters: state.gameState.characterSystem.availableCharacters
              .filter(char => char.id !== characterId)
          }
        }
      }));

      // 更新效果系统
      get().updateCharacterSystem();
      return true;
    },

    dismissCharacter: (characterId: string) => {
      const state = get();
      const character = state.gameState.characterSystem.activeCharacters[characterId];
      if (!character) return false;

      const dismissedCharacter = { ...character, position: undefined };
      set((state) => ({
        gameState: {
          ...state.gameState,
          characterSystem: {
            ...state.gameState.characterSystem,
            activeCharacters: Object.fromEntries(
              Object.entries(state.gameState.characterSystem.activeCharacters)
                .filter(([id]) => id !== characterId)
            ),
            availableCharacters: [...state.gameState.characterSystem.availableCharacters, dismissedCharacter]
          }
        }
      }));

      // 更新效果系统
      get().updateCharacterSystem();
      return true;
    },

    updateCharacterHealth: (characterId: string, healthChange: number) => {
      set((state) => {
        const character = state.gameState.characterSystem.allCharacters[characterId];
        if (!character) return state;

        const newHealth = Math.max(0, Math.min(100, character.health + healthChange));
        const updatedCharacter = { ...character, health: newHealth };

        return {
          gameState: {
            ...state.gameState,
            characterSystem: {
              ...state.gameState.characterSystem,
              allCharacters: {
                ...state.gameState.characterSystem.allCharacters,
                [characterId]: updatedCharacter
              },
              activeCharacters: state.gameState.characterSystem.activeCharacters[characterId]
                ? { ...state.gameState.characterSystem.activeCharacters, [characterId]: updatedCharacter }
                : state.gameState.characterSystem.activeCharacters,
              availableCharacters: state.gameState.characterSystem.availableCharacters.map(char =>
                char.id === characterId ? updatedCharacter : char
              )
            }
          }
        };
      });
    },

    addCharacterBuff: (characterId: string, buff: any) => {
      set((state) => {
        const character = state.gameState.characterSystem.allCharacters[characterId];
        if (!character) return state;

        const updatedCharacter = {
          ...character,
          buffs: [...character.buffs, buff]
        };

        return {
          gameState: {
            ...state.gameState,
            characterSystem: {
              ...state.gameState.characterSystem,
              allCharacters: {
                ...state.gameState.characterSystem.allCharacters,
                [characterId]: updatedCharacter
              },
              activeCharacters: state.gameState.characterSystem.activeCharacters[characterId]
                ? { ...state.gameState.characterSystem.activeCharacters, [characterId]: updatedCharacter }
                : state.gameState.characterSystem.activeCharacters,
              availableCharacters: state.gameState.characterSystem.availableCharacters.map(char =>
                char.id === characterId ? updatedCharacter : char
              )
            }
          }
        };
      });

      // 更新效果系统
      get().updateCharacterSystem();
    },

    removeCharacterBuff: (characterId: string, buffId: string) => {
      set((state) => {
        const character = state.gameState.characterSystem.allCharacters[characterId];
        if (!character) return state;

        const updatedCharacter = {
          ...character,
          buffs: character.buffs.filter(buff => buff.id !== buffId)
        };

        return {
          gameState: {
            ...state.gameState,
            characterSystem: {
              ...state.gameState.characterSystem,
              allCharacters: {
                ...state.gameState.characterSystem.allCharacters,
                [characterId]: updatedCharacter
              },
              activeCharacters: state.gameState.characterSystem.activeCharacters[characterId]
                ? { ...state.gameState.characterSystem.activeCharacters, [characterId]: updatedCharacter }
                : state.gameState.characterSystem.activeCharacters,
              availableCharacters: state.gameState.characterSystem.availableCharacters.map(char =>
                char.id === characterId ? updatedCharacter : char
              )
            }
          }
        };
      });

      // 更新效果系统
      get().updateCharacterSystem();
    },

    unlockCharacterPosition: (position: CharacterPosition) => {
      set((state) => ({
        gameState: {
          ...state.gameState,
          characterSystem: {
            ...state.gameState.characterSystem,
            unlockedPositions: state.gameState.characterSystem.unlockedPositions.includes(position)
              ? state.gameState.characterSystem.unlockedPositions
              : [...state.gameState.characterSystem.unlockedPositions, position]
          }
        }
      }));
    },

    getActiveCharacters: () => {
      return Object.values(get().gameState.characterSystem.activeCharacters);
    },

    getAvailableCharacters: () => {
      return get().gameState.characterSystem.availableCharacters;
    },

    getCharacterById: (characterId: string) => {
      return get().gameState.characterSystem.allCharacters[characterId];
    },

    calculateCharacterEffects: () => {
      const { calculateCharacterEffects } = require('./character-system');
      const activeCharacters = get().getActiveCharacters();
      return calculateCharacterEffects(activeCharacters);
    },

    updateCharacterSystem: () => {
      const effects = get().calculateCharacterEffects();
      const effectsSystem = get().getEffectsSystem();
      
      // 移除旧的人物效果
      effectsSystem.removeEffectsBySource('character');
      
      // 添加新的人物效果
      effects.forEach(effect => {
        effectsSystem.addEffect({
          ...effect,
          sourceType: 'character',
          sourceId: effect.characterId
        });
      });
      
      // 更新效果系统版本
      set((state) => ({
        effectsVersion: state.effectsVersion + 1
      }));
    },

    // 外交系统方法
    discoverCountry: (country: Country) => {
      set((state) => ({
        gameState: {
          ...state.gameState,
          diplomacy: {
            ...state.gameState.diplomacy,
            discoveredCountries: [...state.gameState.diplomacy.discoveredCountries, country],
            relationships: {
              ...state.gameState.diplomacy.relationships,
              [country.id]: DiplomacySystem.generateInitialRelationship(state.gameState.diplomacy.discoveredCountries.length)
            }
          }
        }
      }));
    },

    tradeWithCountry: (countryId: string, ourOffer: Partial<Resources>, theirOffer: Partial<Resources>) => {
      const state = get().gameState;
      const result = DiplomacySystem.executeTrade(state, countryId, ourOffer, theirOffer);
      
      if (result.success) {
        set((gameState) => ({
          gameState: {
            ...gameState.gameState,
            resources: {
              ...gameState.gameState.resources,
              ...result.newResources
            },
            diplomacy: {
              ...gameState.gameState.diplomacy,
              relationships: {
                ...gameState.gameState.diplomacy.relationships,
                [countryId]: result.newRelationship
              },
              tradeHistory: [...gameState.gameState.diplomacy.tradeHistory, result.tradeRecord!]
            }
          }
        }));
        
        get().addNotification({
          type: 'success',
          message: `与${result.tradeRecord!.countryName}的贸易成功完成！`
        });
      } else {
        get().addNotification({
          type: 'error',
          message: result.error || '贸易失败'
        });
      }
    },

    giftToCountry: (countryId: string, gift: Partial<Resources>) => {
      const state = get().gameState;
      const result = DiplomacySystem.executeGift(state, countryId, gift);
      
      if (result.success) {
        set((gameState) => ({
          gameState: {
            ...gameState.gameState,
            resources: {
              ...gameState.gameState.resources,
              ...result.newResources
            },
            diplomacy: {
              ...gameState.gameState.diplomacy,
              relationships: {
                ...gameState.gameState.diplomacy.relationships,
                [countryId]: result.newRelationship
              },
              giftHistory: [...gameState.gameState.diplomacy.giftHistory, result.giftRecord!]
            }
          }
        }));
        
        get().addNotification({
          type: 'success',
          message: `成功向${result.giftRecord!.countryName}赠送礼物，关系得到改善！`
        });
      } else {
        get().addNotification({
          type: 'error',
          message: result.error || '赠礼失败'
        });
      }
    },

    declareWar: (countryId: string) => {
      const state = get().gameState;
      const country = state.diplomacy.discoveredCountries.find(c => c.id === countryId);
      
      if (country) {
        const warRecord: WarRecord = {
          id: `war_${Date.now()}`,
          countryId,
          countryName: country.name,
          startDate: state.gameTime,
          isActive: true,
          playerInitiated: true
        };
        
        set((gameState) => ({
          gameState: {
            ...gameState.gameState,
            diplomacy: {
              ...gameState.gameState.diplomacy,
              relationships: {
                ...gameState.gameState.diplomacy.relationships,
                [countryId]: {
                  ...gameState.gameState.diplomacy.relationships[countryId],
                  level: 'hostile',
                  value: -100,
                  atWar: true
                }
              },
              warHistory: [...gameState.gameState.diplomacy.warHistory, warRecord]
            }
          }
        }));
        
        get().addNotification({
          type: 'warning',
          message: `已向${country.name}宣战！`
        });
      }
    },

    hireMercenary: (mercenaryId: string) => {
      const state = get().gameState;
      const mercenary = state.diplomacy.mercenaryUnits.find(m => m.id === mercenaryId);
      
      if (mercenary && get().canAfford(mercenary.cost)) {
        get().spendResources(mercenary.cost);
        get().addUnit(mercenary.unitType, mercenary.count);
        
        set((gameState) => ({
          gameState: {
            ...gameState.gameState,
            diplomacy: {
              ...gameState.gameState.diplomacy,
              mercenaryUnits: gameState.gameState.diplomacy.mercenaryUnits.filter(m => m.id !== mercenaryId)
            }
          }
        }));
        
        get().addNotification({
          type: 'success',
          message: `成功雇佣${mercenary.count}个${mercenary.name}！`
        });
      }
    },

    updateMarketPrices: () => {
      const newPrices = DiplomacySystem.generateMarketPrices();
      set((state) => ({
        gameState: {
          ...state.gameState,
          diplomacy: {
            ...state.gameState.diplomacy,
            marketPrices: newPrices
          }
        }
      }));
    },

    updateDiplomacyRelationships: () => {
      const state = get().gameState;
      const updatedRelationships = { ...state.diplomacy.relationships };
      
      // 自然关系衰减
      Object.keys(updatedRelationships).forEach(countryId => {
        const relationship = updatedRelationships[countryId];
        if (!relationship.atWar) {
          const decay = DiplomacySystem.calculateRelationshipDecay(relationship);
          updatedRelationships[countryId] = {
            ...relationship,
            value: Math.max(-100, Math.min(100, relationship.value + decay)),
            level: DiplomacySystem.calculateRelationshipLevel(relationship.value + decay)
          };
        }
      });
      
      set((gameState) => ({
        gameState: {
          ...gameState.gameState,
          diplomacy: {
            ...gameState.gameState.diplomacy,
            relationships: updatedRelationships
          }
        }
      }));
    },

    generateRaidEvent: () => {
      const state = get().gameState;
      const hostileCountries = state.diplomacy.discoveredCountries.filter(country => {
        const relationship = state.diplomacy.relationships[country.id];
        return relationship && relationship.level === 'hostile';
      });
      
      if (hostileCountries.length > 0) {
        const raidEvent = DiplomacySystem.generateRaidEvent(hostileCountries);
        if (raidEvent) {
          set((gameState) => ({
            gameState: {
              ...gameState.gameState,
              diplomacy: {
                ...gameState.gameState.diplomacy,
                raidEvents: [...gameState.gameState.diplomacy.raidEvents, raidEvent]
              }
            }
          }));
          
          get().triggerPauseEvent({
            id: `raid_${raidEvent.id}`,
            type: 'raid',
            title: '敌国袭扰',
            description: `${raidEvent.countryName}的军队正在袭扰我们的边境！`,
            choices: [
              { text: '派兵抵御', effects: { stability: -5 } },
              { text: '加强防御', effects: { resources: { wood: -50, stone: -30 } } }
            ]
          });
        }
      }
    },

    getCountryRelationship: (countryId: string) => {
      const state = get().gameState;
      if (!state.diplomacy || !state.diplomacy.relationships) {
        return undefined;
      }
      return state.diplomacy.relationships[countryId];
    },

    getDiscoveredCountries: () => {
      const state = get().gameState;
      if (!state.diplomacy) {
        return [];
      }
      return state.diplomacy.discoveredCountries || [];
    },

    getDiplomacyEffects: () => {
      const state = get().gameState;
      if (!state.diplomacy) {
        return [];
      }
      return DiplomacySystem.getNationEffects ? DiplomacySystem.getNationEffects(state.diplomacy.discoveredCountries[0]) || [] : [];
    },
  }),
  {
    name: 'civilization-game-storage',
    version: 1,
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      gameState: state.gameState, // 保存完整的游戏状态
      uiState: state.uiState,
      army: state.army,
      // 不保存 isRunning 状态，让游戏总是以暂停状态加载
      // lastUpdateTime 也不保存，让它在每次加载时重新初始化
    }),
    migrate: (persistedState: any, version: number) => {
      // 处理版本迁移
      if (version === 0) {
        // 从旧版本迁移
        return {
          ...persistedState,
          uiState: persistedState.uiState || initialUIState,
        };
      }
      
      // 确保 researchState 存在
      if (persistedState?.gameState && !persistedState.gameState.researchState) {
        persistedState.gameState.researchState = {
          currentResearch: null,
          researchQueue: [],
          researchPoints: 0,
          researchPointsPerSecond: 0,
        };
      }
      
      // 确保 statistics 存在（兼容旧存档）
      if (persistedState?.gameState && !persistedState.gameState.statistics) {
        persistedState.gameState.statistics = {
          totalPlayTime: 0,
          totalResourcesCollected: {},
          totalBuildingsBuilt: {},
          totalTechnologiesResearched: 0,
          totalEventsTriggered: 0,
          totalAchievementsUnlocked: 0,
          currentGeneration: 1,
        };
      }

      // 回填缺失的设置字段（兼容旧存档）
      if (persistedState?.gameState) {
        persistedState.gameState.settings = {
          autoSave: true,
          soundEnabled: true,
          animationsEnabled: true,
          gameSpeed: persistedState.gameState?.settings?.gameSpeed ?? persistedState.gameState.gameSpeed ?? 1,
          eventsPollIntervalMs: persistedState.gameState?.settings?.eventsPollIntervalMs ?? 1000,
          eventsDebugEnabled: persistedState.gameState?.settings?.eventsDebugEnabled ?? false,
          ...persistedState.gameState.settings,
        };
      }
      
      return persistedState;
    },
    onRehydrateStorage: () => {
      return (state) => {
        if (state) {
          // 强制设置游戏为暂停状态，无论之前保存的状态如何
          state.gameState.isPaused = true;
          
          // 兼容旧存档：若缺少 statistics 则补齐默认值
          if (!state.gameState.statistics) {
            state.gameState.statistics = {
              totalPlayTime: 0,
              totalResourcesCollected: {},
              totalBuildingsBuilt: {},
              totalTechnologiesResearched: 0,
              totalEventsTriggered: 0,
              totalAchievementsUnlocked: 0,
              currentGeneration: 1,
            };
          }
          
          console.log('状态恢复完成 - 强制设置为暂停状态');
        }
      };
    },
  }
));

// 独立的成就存储
interface AchievementStore {
  achievements: Array<{ id: string; unlockedAt: number }>;
  addAchievement: (achievement: { id: string; unlockedAt: number }) => void;
  hasAchievement: (id: string) => boolean;
  getAllAchievements: () => Array<{ id: string; unlockedAt: number }>;
  clearAchievements: () => void;
}

export const useAchievementStore = create<AchievementStore>()(persist(
  (set, get) => ({
    achievements: [],
    
    addAchievement: (achievement) => {
      const { achievements } = get();
      if (!achievements.find(a => a.id === achievement.id)) {
        set({ achievements: [...achievements, achievement] });
      }
    },
    
    hasAchievement: (id) => {
      const { achievements } = get();
      return achievements.some(a => a.id === id);
    },
    
    getAllAchievements: () => {
      return get().achievements;
    },
    
    clearAchievements: () => {
      set({ achievements: [] });
    },
  }),
  {
    name: 'civilization-achievements-storage',
    storage: createJSONStorage(() => localStorage),
  }
));