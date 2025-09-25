import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState, Resources, ResourceLimits, Technology, Building, UIState, Notification, Buff, BuffSummary, GameEventInstance, PauseEvent, NonPauseEvent, ResearchState } from '@/types/game';
import { GameEvent } from '@/types';
import { Character, CharacterPosition } from '@/types/character';
import { BuildingInstance, BuildingCategory } from '@/types/building';
import { BUILDINGS, CHARACTERS, CORRUPTION_EVENTS, RANDOM_EVENTS, ACHIEVEMENTS, GAME_EVENTS } from './game-data';
import { BUILDING_DEFINITIONS, BUILDING_CATEGORIES, getBuildingDefinition, getBuildingsByCategory, isBuildingUnlocked, getAvailableBuildings } from './building-data';
import { BuildingSystem, BuildingUtils } from './building-system';
import { TECHNOLOGIES, getTechnologyPrerequisites, canResearchTechnology } from './technology-data';
import { getTriggeredEvents, selectRandomEvent } from './events';
import { saveGameState, loadGameState, AutoSaveManager } from '@/lib/persistence';
import { saveGameStateEnhanced, loadGameStateEnhanced, getSaveInfoEnhanced, hasSavedGameEnhanced, clearAllSaveData } from '@/lib/enhanced-persistence';
import { ResourceManager, initializeResourceManager, getResourceManager } from './resource-manager';
import { globalEffectsSystem, Effect, EffectType, EffectSourceType } from './effects-system';
import { cleanupExpiredEffects } from './temporary-effects';
import { MilitarySystem } from './military-system';
import { ExplorationSystem } from './exploration-system';
import { CombatSystem } from './combat-system';
import { DiplomacySystem } from './diplomacy-system';
import { FEATURE_FLAGS, isTestScoutingEnabled } from './feature-flags';
import { applyEffectsToState } from './effect-runner';
import { Country, Relationship, RelationshipLevel, MarketPrices, TradeRecord, GiftRecord, WarRecord, MercenaryUnit, SpecialTreasure, RaidEvent, DiplomaticEffect } from '@/types/diplomacy';
import { BASE_MARKET_PRICES } from './diplomacy-data';

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
    livestock: 0,
    horses: 0,
    cloth: 0,
    weapons: 0,
    crystal: 0,
    magic: 0,
    faith: 0,
    currency: 0,
  },
  
  resourceRates: {
    food: 0,
    wood: 0,
    stone: 0,
    tools: 0,
    population: 0,
    researchPoints: 0,
    copper: 0,
    iron: 0,
    livestock: 0,
    horses: 0,
    cloth: 0,
    weapons: 0,
    crystal: 0,
    magic: 0,
    faith: 0,
    currency: 0,
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
    livestock: 100,
    horses: 100,
    cloth: 200,
    weapons: 200,
    crystal: 50,
    magic: 50,
    faith: 100,
    currency: 10000,
  },
  
  buildings: {} as Record<string, BuildingInstance>,

  // 逐行解锁的资源可见性
  unlockedResources: [],
  
  // 使用新的科技数据结构
  technologies: Object.fromEntries(
    Object.values(TECHNOLOGIES).map(tech => [tech.id, { ...tech, researched: false, researchProgress: 0 }])
  ),
  
  // 科技研究状态
  researchState: {
    currentResearch: null,
    researchQueue: [],
    researchSpeed: 1,
  } as ResearchState,
  
  characterSystem: {
    activeCharacters: {},
    availableCharacters: [],
    allCharacters: {},
    unlockedPositions: [] // 初始不解锁任何职位（避免重置后统治者卡片直接出现）
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
    explorationHistory: [],
    explorationPoints: 0
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
    devMode: false,
  },

  // 统计数据
  statistics: {
    totalPlayTime: 0,
    totalResourcesCollected: {},
    totalBuildingsBuilt: {},
    totalTechnologiesResearched: 0,
    totalEventsTriggered: 0,
    totalAchievementsUnlocked: 0,
    currentGeneration: 0
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
  // 资源解锁（根据已研究科技重算）
  recomputeUnlockedResourcesFromTechs: () => void;
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

  // 世代系统
  setGeneration: (n: number) => void;
  incrementGeneration: () => void;

  // 游戏速度控制
  setGameSpeed: (speed: number) => void;
  // 事件轮询频率控制
  setEventsPollIntervalMs: (ms: number) => void;
  // 事件调试日志开关
  setEventsDebugEnabled: (enabled: boolean) => void;

  // 开发者模式
  toggleDevMode: () => void;
  enableDevMode: () => void;

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
  // 新：将所选部队转为侦察点并启动冒险线（不做即时结算）
  startAdventureWithUnits: (units: any[]) => { started: boolean; sp: number };
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
  // 新增：按职位读取在职人物映射
  getActiveCharactersByPosition: () => Record<CharacterPosition, Character | null>;
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
// 人口增长累计器（单位：秒），用于确定性增长模型（基础10秒/人）
let popGrowthAccumSec = 0;

export const useGameStore = create<GameStore>()(persist(
  (set, get) => ({
    gameState: initialGameState,
    uiState: initialUIState,
    isRunning: false,
    lastUpdateTime: Date.now(),
    army: {},
    effectsVersion: 0,
    
    getUnlockedPositions() {
      const positions = get().gameState.characterSystem?.unlockedPositions || [];
      return positions as CharacterPosition[];
    },
    
    get isPaused() {
      return get().gameState.isPaused;
    },
    
    get population() {
      return get().gameState.resources.population;
    },
    
    get maxPopulation() {
      // 动态根据当前建筑聚合住房容量：1 + Σ(容量 × 数量)
      const state = get().gameState;
      let totalHousing = 0;

      Object.entries(state.buildings || {}).forEach(([key, entry]: [string, any]) => {
        if (!entry) return;
        // 如果有状态且未完成则不计
        if (typeof entry.status === 'string' && entry.status !== 'completed') return;

        // buildingId 以键为准（多数结构没有 entry.buildingId）
        const buildingId = entry.buildingId || key;
        const def = getBuildingDefinition(buildingId);
        const count = typeof entry.count === 'number' ? entry.count : 1;

        let capacityPerBuilding = 0;

        // 1) effects.population_capacity
        const effects: any[] = (def as any)?.effects || [];
        if (Array.isArray(effects) && effects.length > 0) {
          capacityPerBuilding = effects
            .filter((e: any) => e?.type === 'population_capacity')
            .reduce((sum: number, e: any) => sum + (Number(e?.value ?? e?.amount) || 0), 0);
        }

        // 2) produces.housing
        if (!capacityPerBuilding) {
          const prod = (def as any)?.produces;
          capacityPerBuilding = Number(prod?.housing) || 0;
        }

        // 3) 更宽松的兜底：按建筑ID/分类判断住房类（含中英文关键词），默认 +2/栋
        if (!capacityPerBuilding) {
          const idStr = String((def as any)?.id || buildingId || '');
          const cat = (def as any)?.category;
          const isHousing =
            cat === 'housing' ||
            /house|hut|home|residence|dorm|cabin|tent|shack|cottage|lodging|quarters|住房|房屋|小屋|住所|居所|棚屋|帐篷|营帐|营地/i.test(idStr);
          if (isHousing) capacityPerBuilding = 2;
        }

        totalHousing += capacityPerBuilding * count;
      });

      // 4) 若仍为 0，则回退到资源中的 housing 字段（兼容旧写入路径）
      if (!totalHousing) {
        totalHousing = Number((state.resources as any)?.housing) || 0;
      }

      return 1 + totalHousing;
    },
    


    startGame: () => {
      set((state) => {
        const hasActivePause = Array.isArray(state.gameState.activeEvents) && state.gameState.activeEvents.length > 0;
        return {
          gameState: {
            ...state.gameState,
            // 启动时：若没有暂停事件，则确保取消暂停
            isPaused: hasActivePause ? state.gameState.isPaused : false,
            gameStartTime: state.gameState.gameStartTime === 0 ? Date.now() : state.gameState.gameStartTime
          },
          // 没有暂停事件则关闭弹窗，避免脏状态阻塞启动
          uiState: hasActivePause ? state.uiState : {
            ...state.uiState,
            showEventModal: false,
            currentEvent: undefined
          },
          isRunning: true,
          lastUpdateTime: Date.now()
        };
      });
      
      // 初始化资源管理器
      get().initializeResourceManager();

      // 旧存档补发：为所有“无特性”的人物分配1-2个特性，并同步修正属性/健康
      try {
        const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
        const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
        const pick = <T,>(arr: T[]) => arr[rand(0, arr.length - 1)];
        const { characterSystem } = get().gameState;
        if (characterSystem && characterSystem.allCharacters) {
          // 与生成器中的 TRAIT_POOL 保持一致（轻量复刻最关键条目）
          const POOL = [
            { id: 'charming', dc: 2, type: 'positive', name: '风流倜傥', description: '魅力 +2（直接加属性）' },
            { id: 'ugly', dc: -2, type: 'negative', name: '丑陋不堪', description: '魅力 -2（直接减属性）' },
            { id: 'strong', df: 2, type: 'positive', name: '力大无穷', description: '武力 +2（直接加属性）' },
            { id: 'weakling', df: -2, type: 'negative', name: '瘦弱不堪', description: '武力 -2（直接减属性）' },
            { id: 'frail_health', dh: -15, type: 'negative', name: '体弱多病', description: '基础健康 -15（直接减生命上限）' },
            { id: 'clever', di: 2, type: 'positive', name: '足智多谋', description: '智力 +2（直接加属性）' },
            { id: 'private_stash', type: 'neutral', name: '小金库', description: '每年随机获得一笔货币（50~150）' },
          ] as any[];
          const positives = POOL.filter(t => t.type === 'positive');
          const others = POOL.filter(t => t.type !== 'positive');
          const weighted = [...positives, ...positives, ...others];

          const patched: any = {};
          Object.values(characterSystem.allCharacters).forEach((c: any) => {
            if (!c) return;
            if (!Array.isArray(c.traits) || c.traits.length === 0) {
              const count = Math.random() < 0.6 ? 2 : 1;
              const chosen: any[] = [];
              while (chosen.length < count && weighted.length > 0) {
                const t = pick(weighted);
                if (!chosen.find(x => x.id === t.id)) chosen.push(t);
              }
              let f = c.attributes?.force ?? 5;
              let i = c.attributes?.intelligence ?? 5;
              let ch = c.attributes?.charisma ?? 5;
              let hp = Math.max(10, Math.min(100, c.health ?? 100));
              chosen.forEach((t) => {
                if (typeof t.df === 'number') f = clamp(f + t.df, 0, 10);
                if (typeof t.di === 'number') i = clamp(i + t.di, 0, 10);
                if (typeof t.dc === 'number') ch = clamp(ch + t.dc, 0, 10);
                if (typeof t.dh === 'number') hp = clamp(hp + t.dh, 10, 100);
              });
              const normalized = chosen.map((t) => ({
                id: t.id, name: t.name, type: t.type, description: t.description, effects: []
              }));
              patched[c.id] = {
                ...c,
                attributes: { ...c.attributes, force: f, intelligence: i, charisma: ch },
                health: hp,
                traits: normalized
              };
            }
          });
          if (Object.keys(patched).length > 0) {
            set((state) => ({
              gameState: {
                ...state.gameState,
                characterSystem: {
                  ...state.gameState.characterSystem,
                  allCharacters: {
                    ...state.gameState.characterSystem.allCharacters,
                    ...patched
                  },
                  // 同步在职与候选
                  activeCharacters: Object.fromEntries(
                    Object.entries(state.gameState.characterSystem.activeCharacters || {}).map(([id, ch]: any) => {
                      const rep = patched[id];
                      return [id, rep ? rep : ch];
                    })
                  ) as any,
                  availableCharacters: (state.gameState.characterSystem.availableCharacters || []).map((c: any) => patched[c.id] || c),
                  activeByPosition: Object.fromEntries(
                    Object.entries((state.gameState.characterSystem as any).activeByPosition || {}).map(([pos, ch]: any) => {
                      if (!ch) return [pos, ch];
                      const rep = patched[ch.id];
                      return [pos, rep ? rep : ch];
                    })
                  ) as any
                }
              }
            }) as any);
          }
        }
      } catch {}
      
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

      // 测试放开：若开关开启且“侦察学”未研究，则直接完成研究
      if (isTestScoutingEnabled()) {
        try {
          const gs = get().gameState;
          if (!gs.technologies['scouting_tech']?.researched) {
            get().completeResearch('scouting_tech');
          }
        } catch {}
      }

      // 测试赠送：开关开启且没有探索单位时，赠送3名侦察兵
      if (isTestScoutingEnabled()) {
        try {
          const { getUnitType } = require('./military-data');
          const hasExplorer = (get().gameState.military.units || []).some((u: any) => {
            const ut = getUnitType(u.typeId);
            return ut?.isExplorer && (u.count || 0) > 0;
          });
          if (!hasExplorer) {
            const ut = getUnitType('scout');
            if (ut) {
              const newUnit = {
                id: `unit_${Date.now()}`,
                typeId: 'scout',
                count: 3,
                currentHealth: ut.baseStats.health,
                currentMorale: ut.baseStats.morale,
                status: 'defending' as const,
                assignedPopulation: 0
              };
              // 局部断言以隔离类型检查噪音，仅限测试赠送逻辑
              set((state) => ({
                gameState: {
                  ...state.gameState,
                  military: {
                    ...state.gameState.military,
                    units: [...(state.gameState.military.units || []), newUnit]
                  }
                }
              }) as any);
              get().addNotification({
                type: 'info',
                title: '测试赠送',
                message: '已赠送3名侦察兵用于探索测试'
              });
            }
          }
        } catch {}
      }
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
      get().updateEffectsSystem();
      
      // 计算初始资源速率
      get().calculateResourceRates();
      
      get().resetTimeSystem();

      // 测试放开：开关开启则重置后确保“侦察学”已研究
      if (isTestScoutingEnabled()) {
        try {
          const gs2 = get().gameState;
          if (!gs2.technologies['scouting_tech']?.researched) {
            get().completeResearch('scouting_tech');
          }
        } catch {}
      }

      // 测试赠送：开关开启且重置后若没有探索单位，则赠送3名侦察兵
      if (isTestScoutingEnabled()) {
        try {
          const { getUnitType } = require('./military-data');
          const hasExplorer = (get().gameState.military.units || []).some((u: any) => {
            const ut = getUnitType(u.typeId);
            return ut?.isExplorer && (u.count || 0) > 0;
          });
          if (!hasExplorer) {
            const ut = getUnitType('scout');
            if (ut) {
              const newUnit = {
                id: `unit_${Date.now()}`,
                typeId: 'scout',
                count: 3,
                currentHealth: ut.baseStats.health,
                currentMorale: ut.baseStats.morale,
                status: 'defending' as const,
                assignedPopulation: 0
              };
              // 局部断言以隔离类型检查噪音，仅限测试赠送逻辑
              set((state) => ({
                gameState: {
                  ...state.gameState,
                  military: {
                    ...state.gameState.military,
                    units: [...(state.gameState.military.units || []), newUnit]
                  }
                }
              }) as any);
              get().addNotification({
                type: 'info',
                title: '测试赠送',
                message: '已赠送3名侦察兵用于探索测试'
              });
            }
          }
        } catch {}
      }

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
      // 小金库年度结算：每满360天触发一次
      if (daysPassed > 0) {
        (globalThis as any).__privateStashDays = ((globalThis as any).__privateStashDays || 0) + daysPassed;
        if ((globalThis as any).__privateStashDays >= 360) {
          try {
            const stashHolders = (get().getActiveCharacters?.() || []).filter((c: any) =>
              Array.isArray(c?.traits) && c.traits.some((t: any) => t?.id === 'private_stash')
            );
            if (stashHolders.length > 0) {
              const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
              const total = stashHolders.reduce((sum: number) => sum + rand(50, 150), 0);
              if (total > 0) {
                get().addResources({ currency: total } as any);
                get().addNotification({
                  type: 'info',
                  title: '小金库入账',
                  message: `本年共有 ${stashHolders.length} 位人物的小金库入账，共 +${total} 货币。`
                });
              }
            }
          } catch {}
          (globalThis as any).__privateStashDays = 0;
        }
      }
      
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
          
          // 叠加“临时效果”的稳定度修正（效果栏中显示的持续效果）
          const getTempStabilityDelta = (): number => {
            try {
              const { getActiveTemporaryEffects } = require('./temporary-effects');
              const active = getActiveTemporaryEffects(state.gameState) || [];
              let total = 0;
              active.forEach((te: any) => {
                // 1) consequences 字符串数组，如 "stability:-5"
                if (Array.isArray(te.consequences)) {
                  te.consequences.forEach((c: any) => {
                    const m = String(c).match(/^stability\s*:\s*(-?\d+(?:\.\d+)?)/i);
                    if (m) total += Number(m[1]);
                  });
                }
                // 2) 结构化单一 effect 字段
                const eff: any = te.effect;
                if (eff && (String(eff.type).toLowerCase() === 'stability' || String(eff.type).toLowerCase() === 'stability_change')) {
                  const v = eff.value != null ? Number(eff.value) : (eff.modifier != null ? Number(eff.modifier) : 0);
                  total += v;
                }
                // 3) temporary-effects 的 effects 数组：{ target:'stability', type:'absolute', value:number }
                const mods: any[] = Array.isArray(te.effects) ? te.effects : [];
                mods.forEach((m: any) => {
                  if (String(m.target) === 'stability' && String(m.type) === 'absolute') {
                    total += Number(m.value || 0);
                  }
                });
              });
              return total;
            } catch {
              return 0;
            }
          };

          const tempStabilityDelta = getTempStabilityDelta();

          // 人物稳定度加成：来自效果系统的角色来源稳定度点数
          const getCharacterStabilityDelta = (): number => {
            try {
              const { globalEffectsSystem, EffectSourceType, EffectType } = require('./effects-system');
              const charEffects = globalEffectsSystem
                .getEffectsBySourceType(EffectSourceType.CHARACTER)
                .filter((e: any) => String(e?.type) === String(EffectType.STABILITY));
              return charEffects.reduce((sum: number, e: any) => sum + (Number(e?.value) || 0), 0);
            } catch {
              return 0;
            }
          };
          const characterStabilityDelta = getCharacterStabilityDelta();

          // 计算目标稳定度（叠加临时效果）
          const targetStability = Math.max(0, Math.min(100, 
            baseStability + politicalBonus + populationPenalty + resourceBonus + tempStabilityDelta + characterStabilityDelta - newCorruption
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
          currentGeneration: 0,
        };
        const updatedStatistics = {
          ...prevStats,
          totalPlayTime: (prevStats.totalPlayTime || 0) + adjustedDelta,
        };
        
        // 计算资源上限（基于已建储存建筑的 storage 定义聚合，无需工人即可生效）
        const calculateResourceLimits = () => {
          // 基础上限（可按需扩展）
          const baseLimit: Record<string, number> = {
            food: 100,
            wood: 200,
            stone: 150,
            tools: 50,
            researchPoints: 1000,
            copper: 500,
            iron: 300,
            livestock: 100,
            horses: 100,
            cloth: 200,
            weapons: 200,
            crystal: 50,
            magic: 50,
            faith: 100,
            currency: 10000,
            // 人口与住房单独处理
          };

          // 以当前状态中的上限为准，若不存在则回退到 baseLimit
          const currentLimitKeys = Object.keys(state.gameState.resourceLimits || {});
          const allKeys = new Set<string>([...Object.keys(baseLimit), ...currentLimitKeys]);

          // 聚合“百分比（all/单资源）”与“定值（all/单资源）”两类加成
          let percentAll = 0; // 对所有资源的百分比总加成（基于基础上限）
          const percentByRes: Record<string, number> = {};
          let flatAll = 0; // 对所有资源的定值总加成
          const flatByRes: Record<string, number> = {};

          // 遍历所有已建成的储存类建筑实例
          Object.values(state.gameState.buildings || {}).forEach((inst: any) => {
            if (!inst) return;
            // 仅对已完成/已建造的实例生效
            if ((inst.isConstructed === false) || (typeof inst.status === 'string' && inst.status !== 'completed')) return;

            const def = getBuildingDefinition(inst.buildingId);
            const storageArr = (def as any)?.storage as Array<any> | undefined;
            if (!storageArr || storageArr.length === 0) return;

            storageArr.forEach(s => {
              const isPct = !!s.isPercentage;
              const cap = Number(s.capacity || 0);
              if (!cap) return;

              if (String(s.resource) === 'all') {
                if (isPct) percentAll += cap;
                else flatAll += cap;
              } else {
                const res = String(s.resource);
                if (isPct) {
                  percentByRes[res] = (percentByRes[res] || 0) + cap;
                } else {
                  flatByRes[res] = (flatByRes[res] || 0) + cap;
                }
              }
            });
          });

          // 计算最终上限：base + base*(percentAll+percentRes)/100 + flatAll + flatRes
          const limits: Record<string, number> = {};
          allKeys.forEach((k) => {
            if (k === 'population' || k === 'housing') return; // 下面单独处理
            const base = (baseLimit as any)?.[k] ?? ((state.gameState.resourceLimits as any)?.[k] ?? 0);
            const pct = (percentAll + (percentByRes[k] || 0)) / 100;
            const extra = Math.floor(base * pct) + (flatAll + (flatByRes[k] || 0));
            limits[k] = Math.max(0, base + extra);
          });

          // 人口上限 = housing + 1（0住房时有一个免费人口）
          limits.population = (state.gameState.resources.housing || 0) + 1;
          // housing 本身当作统计值，不作为可用上限资源参与 all 的计算
          limits.housing = (state.gameState.resourceLimits.housing ?? 10);

          return limits as any;
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
            resourceLimits: {
              ...state.gameState.resourceLimits,
              ...resourceLimits
            },
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
      
      // 累计人口增长时间（用于确定性10秒/人模型）
      popGrowthAccumSec += adjustedDelta;
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
      // 开发者模式下强制解锁
      if (gameState.settings?.devMode) return true;

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
      
      // 成本处理：支持普通资源与研究点并存（若已有进度，则视为恢复，不再扣费）
      const cost = technology.cost || {};
      const hasRP = typeof cost.researchPoints === 'number' && cost.researchPoints > 0;
      const basicCost: any = { ...cost };
      delete basicCost.researchPoints;

      const savedProgress = Math.max(0, Number(technology.researchProgress || 0));
      const isResume = savedProgress > 0;

      if (!isResume) {
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
      }
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          researchState: {
            ...state.gameState.researchState,
            currentResearch: {
              technologyId,
              progress: savedProgress,
              startTime: Date.now(),
            },
          },
        },
      }));
      
      get().addNotification({
        type: 'info',
        title: '开始研究',
        message: `开始研究${technology.name}${isResume ? '（从已保存进度恢复）' : ''}`,
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

      // 解析本科技的解锁，处理职位/人物（自动生成并尝试上任）
      try {
        const techAfter = get().gameState.technologies[technologyId] as any;
        const unlocks: any[] = Array.isArray(techAfter?.unlocks) ? techAfter.unlocks : [];

        // 解锁职位
        unlocks
          .filter(u => u && u.type === 'character_position' && typeof u.id === 'string')
          .forEach(u => {
            try { get().unlockCharacterPosition(u.id as CharacterPosition); } catch {}
          });

        // 解锁人物：生成1名随机人物加入候选，并尝试自动任命到空缺职位
        const hasCharacterUnlock = unlocks.some(u => u && u.type === 'character');
        if (hasCharacterUnlock) {
          const ch = get().generateCharacter();
          const positions = get().getUnlockedPositions();
          const occupied = new Set(
            Object.values(get().gameState.characterSystem.activeCharacters || {})
              .map((c: any) => c?.position)
              .filter(Boolean)
          );
          const emptyPos = positions.find(p => !occupied.has(p));
          if (emptyPos) {
            try { get().appointCharacter(ch.id, emptyPos); } catch {}
          }
        }
      } catch {
        // 忽略异常，保证研究流程不中断
      }

      // 科技完成后，依据所有已研究科技重算解锁的资源行
      get().recomputeUnlockedResourcesFromTechs();
      
      // 更新统计数据
      get().incrementStatistic('totalTechnologiesResearched');
      
      get().addNotification({
        type: 'success',
        title: '研究完成',
        message: `成功研究了${technology.name}`,
        duration: 5000,
      });

      // 研究“部落组织”后，至少提升至第1代
      if (technologyId === 'tribal_organization') {
        set((state) => ({
          gameState: {
            ...state.gameState,
            statistics: {
              ...state.gameState.statistics,
              currentGeneration: Math.max(1, state.gameState.statistics?.currentGeneration || 0),
            },
          },
        }));
      }
    },
    
    pauseResearch: () => {
      const { gameState } = get();
      
      if (!gameState.researchState?.currentResearch) {
        return;
      }

      const current = gameState.researchState.currentResearch;
      const tech = gameState.technologies[current.technologyId];

      set((state) => ({
        gameState: {
          ...state.gameState,
          technologies: {
            ...state.gameState.technologies,
            [current.technologyId]: {
              ...tech,
              researchProgress: current.progress
            }
          },
          researchState: {
            ...state.gameState.researchState,
            currentResearch: null,
          },
        },
      }));
      
      get().addNotification({
        type: 'info',
        title: '暂停研究',
        message: '已暂停当前研究（进度已保存）',
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
        // 进行中：同步 currentResearch 与 technology.researchProgress，便于暂停/恢复与进度条滚动
        set((state) => ({
          gameState: {
            ...state.gameState,
            technologies: {
              ...state.gameState.technologies,
              [research.technologyId]: {
                ...technology,
                researchProgress: newProgress,
              },
            },
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
      const nowTs = Date.now();
      const id = `n_${nowTs}_${Math.random().toString(36).slice(2,8)}`;
      const timestamp = nowTs;

      // 将通知同步记录为“非暂停事件”，并做最近2秒内的标题+描述去重以避免重复
      set((state) => {
        const mappedType =
          notification.type === 'success' ? 'positive' :
          notification.type === 'error' ? 'negative' :
          notification.type === 'warning' ? 'warning' : 'notification';

        const title = notification.title || '通知';
        const description = notification.message || '';

        const recentHistory = state.gameState.events.slice(-5);
        const isDuplicate = recentHistory.some((e: any) =>
          e && e.title === title && e.description === description && (timestamp - (e.timestamp || 0)) < 2000
        );

        // 构造新的通知列表
        const newNotifications = [
          ...state.uiState.notifications,
          { ...notification, id, timestamp },
        ];

        // 构造历史与最新事件（若非重复）
        let newEvents = state.gameState.events;
        let newRecent = state.gameState.recentEvents;
        if (!isDuplicate) {
          const historyItem: any = {
            id: `notif_${id}`,
            title,
            description,
            type: mappedType,
            priority: 'low',
            timestamp,
            isRead: false,
            isResolved: true
          };
          newEvents = [...state.gameState.events, historyItem];
          const appended = [...state.gameState.recentEvents, historyItem];
          while (appended.length > 3) appended.shift();
          newRecent = appended;
        }

        return {
          uiState: {
            ...state.uiState,
            notifications: newNotifications,
          },
          gameState: {
            ...state.gameState,
            events: newEvents,
            recentEvents: newRecent,
          },
        };
      });

      // 向全局派发通知事件，供事件系统桥接到 UI Toast
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('GAME_NOTIFICATION', { detail: { ...notification, id, timestamp } }));
        } catch (e) {
          // ignore
        }
      }

      // 自动移除通知（仅影响 Toast 显示，不影响历史与“最新事件”的记录）
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
      // 非玩法提示：不打开中央弹窗，仅保留通知/历史的职责
      set((state) => ({
        uiState: {
          ...state.uiState,
          showEventModal: state.uiState.showEventModal,
          currentEvent: state.uiState.currentEvent,
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
                efficiency = assignedWorkers / maxWorkers;
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
            if (effect.type === 'resource_multiplier' && typeof effect.target === 'string' && (effect.target in newRates)) {
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
          resourceRates: {
            ...state.gameState.resourceRates,
            ...newRates
          },
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
      // 计算官吏人口（法院类建筑的已分配工人总和）
      const administratorPopulation = Object.values(gameState.buildings || {})
        .filter((b: any) => b?.buildingId === 'courthouse')
        .reduce((sum: number, b: any) => sum + (b.assignedWorkers || 0), 0);
      
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
      
      // 官员角色的压制效果（基于职位）
      Object.values(gameState.characterSystem.activeCharacters).forEach((character: any) => {
        if (!character) return;
        switch (character.position) {
          case 'administrator':
            suppressionEffects += 0.2; // 行政官减少腐败
            break;
          case 'judge':
            suppressionEffects += 0.4; // 法官减少腐败
            break;
          case 'inspector':
            suppressionEffects += 0.6; // 监察使减少腐败
            break;
          default:
            break;
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

        if ('corruption' in event.requirements && (event.requirements as any).corruption) {
          const { min, max } = (event.requirements as any).corruption as { min?: number; max?: number };
          if (min !== undefined && gameState.corruption < min) canTrigger = false;
          if (max !== undefined && gameState.corruption > max) canTrigger = false;
        }

        if ('population' in event.requirements && (event.requirements as any).population) {
          const { min, max } = (event.requirements as any).population as { min?: number; max?: number };
          if (min !== undefined && gameState.resources.population < min) canTrigger = false;
          if (max !== undefined && gameState.resources.population > max) canTrigger = false;
        }

        if ('stability' in event.requirements && (event.requirements as any).stability) {
          const { min, max } = (event.requirements as any).stability as { min?: number; max?: number };
          if (min !== undefined && gameState.stability < min) canTrigger = false;
          if (max !== undefined && gameState.stability > max) canTrigger = false;
        }

        if ('buildings_count' in event.requirements && (event.requirements as any).buildings_count) {
          const buildingCount = Object.values(gameState.buildings).reduce(
            (sum, building) => sum + (building?.count || 0), 0
          );
          const { min, max } = (event.requirements as any).buildings_count as { min?: number; max?: number };
          if (min !== undefined && buildingCount < min) canTrigger = false;
          if (max !== undefined && buildingCount > max) canTrigger = false;
        }

        if ('characters' in event.requirements && (event.requirements as any).characters) {
          const { has } = (event.requirements as any).characters as { has?: string[] };
          if (Array.isArray(has) && has.length > 0) {
            const hasRequiredCharacters = has.some((charType: string) =>
              Object.values(gameState.characterSystem.activeCharacters).some((char: any) => char?.type === charType)
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
      const event = CORRUPTION_EVENTS[eventId as keyof typeof CORRUPTION_EVENTS];
      if (!event) return;

      const effects: any = (event as any).effects;
      
      set((state) => {
        const base = {
          resources: state.gameState.resources,
          stability: state.gameState.stability,
          corruption: state.gameState.corruption,
          resourceLimits: state.gameState.resourceLimits
        } as any;

        const effectsArr: any[] = [];
        if (effects?.resources) {
          for (const [resource, change] of Object.entries(effects.resources as Record<string, number>)) {
            effectsArr.push({ type: 'resource_change', target: resource, value: Number(change) || 0 });
          }
        }
        if (typeof effects?.stability === 'number') {
          effectsArr.push({ type: 'stability_change', value: Number(effects.stability) || 0 });
        }
        if (typeof effects?.corruption === 'number') {
          effectsArr.push({ type: 'corruption_change', value: Number(effects.corruption) || 0 });
        }

        const next = applyEffectsToState(base, effectsArr);
        return {
          gameState: {
            ...state.gameState,
            resources: { ...state.gameState.resources, ...(next.resources as any) },
            stability: next.stability,
            corruption: next.corruption
          }
        };
      });
      
      // 显示事件通知
      get().addNotification({
        type: event.type === 'positive' ? 'success' : 'warning',
        title: event.name,
        message: event.description,
      });
    },

    clickResource: (resourceType: 'food' | 'wood' | 'stone') => {
      const { isRunning, gameState } = get();

      // 仅在“已开始且未暂停”时可点击收集
      if (!isRunning) {
        get().addNotification({
          type: 'warning',
          title: '游戏未开始',
          message: '请先点击开始按钮启动游戏后再收集资源',
          duration: 3000,
        });
        return;
      }
      if (gameState.isPaused) {
        get().addNotification({
          type: 'warning',
          title: '游戏已暂停',
          message: '请先恢复游戏再收集资源',
          duration: 3000,
        });
        return;
      }
      
      const state = get();
      const newResources = {
        ...state.gameState.resources,
        [resourceType]: state.gameState.resources[resourceType] + 1,
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
            characterSystem: {
              ...state.gameState.characterSystem,
              allCharacters: {
                ...state.gameState.characterSystem.allCharacters,
                [characterId]: newCharacter as any
              },
              availableCharacters: [
                ...state.gameState.characterSystem.availableCharacters,
                newCharacter as any
              ]
            }
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
      
      // 必须有空余住房和食物（人口上限 = housing + 1）
      const availableHousing = (resources.housing + 1) - resources.population;
      if (availableHousing <= 0 || resources.food <= 0) {
        // 条件不满足时清零累计，避免条件恢复瞬间暴涨
        popGrowthAccumSec = 0;
        return;
      }
      
      // 基础耗时：每10秒 +1 人
      const baseSecondsPerPerson = 10;
      
      // 稳定度倍率（影响速度，最低为0表示不增长）
      let stabilityMultiplier = 1.0;
      if (stability >= 90) {
        stabilityMultiplier = 1.1;
      } else if (stability >= 75) {
        stabilityMultiplier = 1.0;
      } else if (stability >= 60) {
        stabilityMultiplier = 1.0;
      } else if (stability >= 45) {
        stabilityMultiplier = 0.75;
      } else if (stability >= 30) {
        stabilityMultiplier = 0.5;
      } else if (stability >= 15) {
        stabilityMultiplier = 0.25;
      } else {
        stabilityMultiplier = 0;
      }
      
      // 住房充足度倍率（影响速度）
      const housingAbundance = availableHousing / Math.max(1, resources.population);
      let housingMultiplier = 1.0;
      if (housingAbundance > 0.5) {
        housingMultiplier = 1.5;
      } else if (housingAbundance < 0.2) {
        housingMultiplier = 0.5;
      }
      
      const speedMultiplier = stabilityMultiplier * housingMultiplier;
      if (speedMultiplier <= 0) return;
      
      const secondsNeeded = Math.max(2, baseSecondsPerPerson / speedMultiplier);
      
      if (popGrowthAccumSec >= secondsNeeded) {
        // 计算本次可增长人数（不超过空余住房）
        const births = Math.min(availableHousing, Math.floor(popGrowthAccumSec / secondsNeeded));
        if (births > 0) {
          popGrowthAccumSec -= births * secondsNeeded;
          get().addResources({ population: births });
          
          // 通知与事件（合并一条）
          get().addNotification({
            type: 'success',
            title: '人口增长',
            message: `部落迎来了${births}名新成员！当前人口：${resources.population + births}`,
            duration: 3000,
          });
          get().triggerNonPauseEvent({
            id: `population_growth_${Date.now()}`,
            title: '人口增长',
            description: `部落迎来了${births}名新成员！当前人口：${resources.population + births}`,
            type: 'positive'
          } as any);
        }
      }
    },

    checkPopulationLimits: () => {
      const { gameState } = get();
      const { resources } = gameState;
      
      // 检查住房限制（人口上限 = housing + 1）
      const populationCap = resources.housing + 1;
      if (resources.population > populationCap) {
        // 稳定度惩罚进入目标值计算，不做即时扣减；仅通知
        get().addNotification({
          type: 'warning',
          title: '住房不足',
          message: '人口超过了住房容量，稳定度下降。',
        });
      }
      
      // 检查食物供应
      const foodPerPerson = resources.population > 0 ? (resources.food / resources.population) : 0;
      if (resources.population > 0 && foodPerPerson < 1) {
        // 稳定度惩罚进入目标值计算，不做即时扣减；仅通知
        get().addNotification({
          type: 'error',
          title: '食物短缺',
          message: '食物供应不足，人民开始挨饿。',
        });
      }
    },

    
    
    applyEventEffects: (effects) => {
      // 统一规范化多种事件效果格式，再应用到状态
      const normalizeEffects = (effs: any[]): any[] => {
        const out: any[] = [];
        (effs || []).forEach((e) => {
          if (!e) return;
          const type = String(e.type || '').toLowerCase();

          // 资源变更：target/value 或 payload.resources 或 resource_bulk.changes
          if ((type === 'resource' || type === 'resource_change') && e.target != null) {
            out.push({ type: 'resource_change', target: String(e.target), value: Number(e.value || 0) });
            return;
          }
          if ((type === 'resource' || type === 'resource_change') && e.payload?.resources) {
            Object.entries(e.payload.resources as Record<string, number>).forEach(([k, v]) => {
              out.push({ type: 'resource_change', target: String(k), value: Number(v) || 0 });
            });
            return;
          }
          if (type === 'resource_bulk' && e.changes) {
            Object.entries(e.changes as Record<string, number>).forEach(([k, v]) => {
              out.push({ type: 'resource_change', target: String(k), value: Number(v) || 0 });
            });
            return;
          }

          // 稳定度事件不做即时改动：统一改为临时影响标签（在规范化后单独创建）
          if (type === 'stability' || type === 'stability_change') {
            // 跳过即时应用，后续创建 TemporaryEffect
            return;
          }
          if (type === 'corruption' || type === 'corruption_change') {
            const val = e.value != null ? Number(e.value) : (e.payload?.delta != null ? Number(e.payload.delta) : 0);
            out.push({ type: 'corruption_change', value: val });
            return;
          }

          // 旧格式 mixed/buff + consequences: ["stability:-5", "wood:-100"]
          // 即时只应用资源与腐败；稳定度改由后续“临时效果创建”处理，避免瞬间扣值与重复标签
          if ((type === 'mixed' || type === 'buff') && Array.isArray(e.payload?.consequences)) {
            (e.payload.consequences as any[]).forEach((c) => {
              const m = String(c).match(/^(\w+)\s*:\s*(-?\d+(?:\.\d+)?)/i);
              if (m) {
                const key = m[1].toLowerCase();
                const val = Number(m[2]);
                if (key === 'corruption') out.push({ type: 'corruption_change', value: val });
                else if (key !== 'stability') out.push({ type: 'resource_change', target: key, value: val });
                // stability 在此不入队
              }
            });
            return;
          }

          // 兜底：直接透传已兼容格式
          out.push(e);
        });
        return out;
      };

      const normalized = normalizeEffects(effects);

      // 将稳定度事件统一登记为“临时影响标签”，用于目标稳定度计算与缓慢变化
      try {
        const { addTemporaryEffect, createTemporaryEffectFromChoice } = require('./temporary-effects');
        const gs = (typeof get === 'function') ? get().gameState : undefined;
        if (gs) {
          (effects || []).forEach((e: any) => {
            if (!e) return;
            const t = String(e.type || '').toLowerCase();
            if (t === 'stability' || t === 'stability_change') {
              const val = e.value != null ? Number(e.value) : (e.payload?.delta != null ? Number(e.payload.delta) : 0);
              if (!val || isNaN(val)) return;
              const days = Number(e.payload?.durationDays || 360); // 默认一年
              const te = createTemporaryEffectFromChoice(
                'default',
                String((get().uiState?.currentEvent?.id) || `ev_${Date.now()}`),
                String((((get().uiState?.currentEvent as any)?.title) || ((get().uiState?.currentEvent as any)?.name) || '事件影响')),
                'buff',
                days,
                [`stability:${val}`],
                gs
              );
              if (te) addTemporaryEffect(gs, te);
            }
          });
        }
      } catch {}

      set(state => {
        const base = {
          resources: state.gameState.resources,
          stability: state.gameState.stability,
          corruption: state.gameState.corruption,
          resourceLimits: state.gameState.resourceLimits
        } as any;
        const next = applyEffectsToState(base, normalized as any);
        // 同步资源管理器（确保 UI 速率计算使用最新资源）
        if (resourceManager) {
          try { resourceManager.setResources(next.resources, 'event'); } catch {}
        }
        return {
          gameState: {
            ...state.gameState,
            resources: { ...state.gameState.resources, ...(next.resources as any) },
            stability: next.stability,
            corruption: next.corruption
          }
        };
      });
    },
    
    handleEventChoice: (eventId, choiceIndex) => {
      const state = get().gameState;
      const active = state.activeEvents.find(e => e.event.id === eventId);
      const options = (active?.event as any)?.options;
      
      if (active && Array.isArray(options) && options[choiceIndex]) {
        const choice = options[choiceIndex];
        
        // 应用选择的效果
        if ((choice as any).effects) {
          get().applyEventEffects((choice as any).effects);
        }
        
        // 移除事件
        get().dismissEvent(eventId);
      }
    },
    
    dismissEvent: (eventId) => {
      set((state) => {
        const remaining = state.gameState.activeEvents.filter(e => e.event.id !== eventId);
        const nextEvent = remaining.length > 0 ? remaining[0].event : undefined;
        return {
          gameState: {
            ...state.gameState,
            activeEvents: remaining,
            // 队列清空则恢复
            isPaused: remaining.length > 0 ? state.gameState.isPaused : false
          },
          uiState: {
            ...state.uiState,
            showEventModal: !!nextEvent,
            currentEvent: nextEvent as any
          }
        };
      });
      // 队列清空则强制恢复与关闭弹窗（双保险）
      if (get().gameState.activeEvents.length === 0) {
        get().resumeGame();
        set((s) => ({
          uiState: { ...s.uiState, showEventModal: false, currentEvent: undefined }
        }));
      }
      // 微任务级一致性守护，防竞态
      setTimeout(() => {
        const s = get();
        const hasActive = Array.isArray(s.gameState.activeEvents) && s.gameState.activeEvents.length > 0;
        if (!hasActive) {
          if (s.gameState.isPaused) s.resumeGame();
          (useGameStore as any).setState((st: any) => ({
            uiState: { ...st.uiState, showEventModal: false, currentEvent: undefined }
          }));
        }
      }, 0);
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
          case 'time_played':
            unlocked = state.gameTime >= achievement.condition.value;
            break;
          case 'resource_total':
            if (achievement.condition.target) {
              unlocked = (state.resources as any)[achievement.condition.target] >= achievement.condition.value;
            }
            break;
          case 'building_count':
            // 新建筑系统下，buildings 为实例字典，数量即为实例个数
            {
              const buildingCount = Object.keys(state.buildings).length;
              unlocked = buildingCount >= achievement.condition.value;
            }
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
            type: 'success',
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
      // 开局5年保护；之后每隔1~3年，仅在新年(1月1日)触发一次“境内随机事件”（排除角色专属）
      const s = get().gameState;
      const { year, month, day } = s.timeSystem.currentDate || { year: 1, month: 1, day: 1 };

      // 读取/初始化事件调度器
      const sched: any = (s as any).eventSchedule || {};
      let nextYear = typeof sched.nextDomesticEventYear === 'number' ? sched.nextDomesticEventYear : undefined;

      // 初次设定（过了保护期后）
      if (!nextYear && year >= 6) {
        nextYear = year + (Math.floor(Math.random() * 3) + 1); // 1~3年后
        set((state) => ({
          gameState: {
            ...state.gameState,
            eventSchedule: { ...(state.gameState as any).eventSchedule, nextDomesticEventYear: nextYear }
          }
        }) as any);
      }

      // 到点触发：仅在新年第一天
      if (nextYear && year >= nextYear && month === 1 && day === 1) {
        const pool = Object.values(RANDOM_EVENTS).filter((e: any) => !e?.requirements?.characters);
        if (pool.length > 0) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          if (pick) {
            get().triggerRandomEvent(pick.id);
          }
        }
        // 设定下一次
        const nxt = year + (Math.floor(Math.random() * 3) + 1);
        set((state) => ({
          gameState: {
            ...state.gameState,
            eventSchedule: { ...(state.gameState as any).eventSchedule, nextDomesticEventYear: nxt }
          }
        }) as any);
      }
    },

    triggerRandomEvent: (eventId: string) => {
      const event = (RANDOM_EVENTS as any)[eventId];
      if (!event) return;
      
      // 先应用效果
      set((state) => {
        const base = {
          resources: state.gameState.resources,
          stability: state.gameState.stability,
          corruption: state.gameState.corruption,
          resourceLimits: state.gameState.resourceLimits
        } as any;

        // 仅即时应用资源与腐败；稳定度改为临时影响标签（见后续创建）
        let effectsArr: any[] = [];
        if (event.effects && typeof event.effects === 'object' && !Array.isArray(event.effects)) {
          const e = event.effects;
          if (e.resources) {
            for (const [resource, change] of Object.entries(e.resources as Record<string, number>)) {
              effectsArr.push({ type: 'resource_change', target: resource, value: Number(change) || 0 });
            }
          }
          // 稳定度不进入即时应用
          if (typeof e.corruption === 'number') {
            effectsArr.push({ type: 'corruption_change', value: Number(e.corruption) || 0 });
          }
        } else if (Array.isArray(event.effects)) {
          // 规范化数组：只保留资源/腐败的即时应用，其余（稳定度）由后续临时效果创建
          effectsArr = (event.effects as any[]).filter((eff: any) => {
            const t = String(eff?.type || '').toLowerCase();
            if (t === 'resource' || t === 'resource_change') return true;
            if (t === 'corruption' || t === 'corruption_change') return true;
            return false;
          });
        }

        const next = applyEffectsToState(base, effectsArr);
        return {
          gameState: {
            ...state.gameState,
            resources: { ...state.gameState.resources, ...(next.resources as any) },
            stability: next.stability,
            corruption: next.corruption
          }
        };
      });

      // 为事件中的稳定度增减创建“临时影响标签”，用于目标稳定度计算与缓慢趋近
      try {
        const { addTemporaryEffect, createTemporaryEffectFromChoice } = require('./temporary-effects');
        const gs = get().gameState;
        const evId = String((get().uiState?.currentEvent as any)?.id || event.id || `ev_${Date.now()}`);
        const evName = String(((get().uiState?.currentEvent as any)?.title) || ((get().uiState?.currentEvent as any)?.name) || event.name || '事件影响');

        const pushTempStability = (val: number, days?: number) => {
          if (!val || isNaN(val)) return;
          const d = Number(days || (event as any)?.durationDays || 360);
          const te = createTemporaryEffectFromChoice('default', evId, evName, 'buff', d, [`stability:${val}`], gs);
          if (te) addTemporaryEffect(gs, te);
        };

        if (event.effects && typeof event.effects === 'object' && !Array.isArray(event.effects)) {
          const e: any = event.effects;
          if (typeof e.stability === 'number') {
            pushTempStability(Number(e.stability));
          }
        } else if (Array.isArray(event.effects)) {
          (event.effects as any[]).forEach((eff: any) => {
            const t = String(eff?.type || '').toLowerCase();
            if (t === 'stability' || t === 'stability_change') {
              const val = eff.value != null ? Number(eff.value) : (eff.payload?.delta != null ? Number(eff.payload.delta) : 0);
              const dur = eff.payload?.durationDays;
              pushTempStability(val, dur);
            }
            // 旧格式 consequences: ["stability:-5"]
            if ((t === 'mixed' || t === 'buff') && Array.isArray(eff.payload?.consequences)) {
              (eff.payload.consequences as any[]).forEach((c: any) => {
                const m = String(c).match(/^stability\s*:\s*(-?\d+(?:\.\d+)?)/i);
                if (m) pushTempStability(Number(m[1]));
              });
            }
          });
        }
      } catch {}

      // 标准化历史项
      const historyItem: any = {
        id: event.id,
        title: event.name,
        description: event.description || '',
        type: event.type || 'notification',
        priority: event.priority || 'medium',
        timestamp: Date.now(),
        isRead: false,
        isResolved: !Array.isArray(event.options) // 有 options 认为是暂停事件
      };

      // 写入历史 + 最近（若为非暂停）
      set((state) => {
        const nextState: any = {
          gameState: {
            ...state.gameState,
            events: [...state.gameState.events, historyItem],
          }
        };
        if (!Array.isArray(event.options)) {
          const newRecent = [...state.gameState.recentEvents, historyItem];
          while (newRecent.length > 3) newRecent.shift();
          nextState.gameState.recentEvents = newRecent;
        }
        return nextState;
      });
      
      // 暂停类：进入 activeEvents；非暂停类：仅展示卡片（不弹模态）
      if (Array.isArray(event.options)) {
        get().triggerPauseEvent({
          id: event.id,
          title: event.name,
          description: event.description,
          options: event.options
        } as any);
      } else {
        // 非暂停走信息卡片 + 通知（保持原行为）
        get().showEvent({
          id: event.id,
          title: event.name,
          description: event.description,
          type: event.type,
          timestamp: Date.now(),
          effects: event.effects
        } as any);
      }

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
        activeBuffs
      };
      
      // 按来源分组buff
      const sourceGroups: Record<string, Buff[]> = {};
      
      activeBuffs.forEach(buff => {
        const sourceKey = `${buff.source.type}_${buff.source.id}`;
        if (!sourceGroups[sourceKey]) {
          sourceGroups[sourceKey] = [];
        }
        sourceGroups[sourceKey].push(buff);
        // 为避免类型错配，totalEffects 的具体聚合放到后续（选项B）完善
      });
      
      // 生成来源信息（仅保留类型中存在的字段）
      Object.entries(sourceGroups).forEach(([_, buffs]) => {
        const firstBuff = buffs[0];
        summary.sources.push({
          type: firstBuff.source.type,
          id: firstBuff.source.id,
          name: firstBuff.source.name
        } as any);
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
      
      // 旧版事件接口最小修正：仅记录到事件历史；若为“暂停型”则暂停游戏
      set((state) => ({
        gameState: {
          ...state.gameState,
          events: [...state.gameState.events, newEvent]
        }
      }));
      if ((event as any)?.pausesGame) {
        get().pauseGame();
      }
    },
    
    resolveEvent: (eventId, choiceId) => {
      const state = get().gameState;
      const active = state.activeEvents.find(e => (e as any).event?.id === eventId) as any;
      if (!active) return;
      
      const effs =
        choiceId && active.event?.options
          ? (active.event.options.find((c: any) => c.id === choiceId)?.effects as any[]) || []
          : ((active.event?.effects as any[]) || []);
      if (effs && effs.length) {
        get().applyEventEffects(effs);
      }
      get().removeEvent(eventId);
    },
    
    removeEvent: (eventId) => {
      set((state) => {
        const newActiveEvents = state.gameState.activeEvents.filter(e => e.event.id !== eventId);
        const hasNext = newActiveEvents.length > 0;
        return {
          gameState: {
            ...state.gameState,
            activeEvents: newActiveEvents,
          },
          uiState: {
            ...state.uiState,
            showEventModal: hasNext,
            currentEvent: hasNext ? (newActiveEvents[0].event as any) : undefined
          }
        };
      });
      // 队列清空则自动恢复
      if (get().gameState.activeEvents.length === 0) {
        get().resumeGame();
      }
    },
    
    checkGameEvents: () => {
      const state = get().gameState;
      
      // 获取所有可触发的事件
      const triggeredEvents = getTriggeredEvents(state);
      
      // 处理触发的事件（通过结构守卫判断是否为暂停事件）
      triggeredEvents.forEach(event => {
        if ('options' in (event as any)) {
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
          if ('options' in (randomEvent as any)) {
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
      const pauseEvent = event as PauseEvent;
      const ts = Date.now();
      set((state) => ({
        gameState: {
          ...state.gameState,
          activeEvents: [...state.gameState.activeEvents, { event: pauseEvent, triggeredAt: ts }],
        },
        uiState: {
          ...state.uiState,
          showEventModal: true,
          currentEvent: pauseEvent as any,
        },
      }));
      // 暂停游戏
      get().pauseGame();
    },

    triggerNonPauseEvent: (event: NonPauseEvent) => {
      // 标准化历史事件条目（用于 UI 展示）
      const historyItem: any = {
        id: (event as any).id,
        title: (event as any).title || (event as any).name || '事件',
        description: (event as any).description || '',
        type: (event as any).type || 'notification',
        priority: (event as any).priority || 'medium',
        timestamp: Date.now(),
        isRead: false,
        isResolved: true // 非暂停事件默认视为已处理
      };
      set((state) => {
        const newRecent = [...state.gameState.recentEvents, historyItem];
        // 只保留最近3条
        while (newRecent.length > 3) newRecent.shift();
        return {
          gameState: {
            ...state.gameState,
            // 历史累积
            events: [...state.gameState.events, historyItem],
            // 最近展示
            recentEvents: newRecent,
          },
        };
      });
    },

    handlePauseEventChoice: (eventId: string, choiceIndex: number) => {
      // V2桥接：若全局引擎存在且当前有队首事件/当前modal来自V2，则直接转发选择并返回
      const w: any = (typeof window !== 'undefined') ? (window as any) : undefined;
      const headId = w?.eventsV2?.getHeadId?.();
      const currentId = (() => { try { return get().uiState?.currentEvent?.id; } catch { return undefined; } })();
      if (w?.eventsV2 && (headId || currentId)) {
        try { w.eventsV2.choose?.(undefined); } catch {}
        // 强保险：清空旧队列、关闭弹窗、恢复运行
        set((st) => ({
          gameState: { 
            ...st.gameState, 
            activeEvents: [], 
            isPaused: false 
          },
          uiState: { 
            ...st.uiState, 
            showEventModal: false, 
            currentEvent: undefined 
          }
        }));
        try { get().resumeGame?.(); } catch {}
        return;
      }
      const state = get();
      let active = state.gameState.activeEvents.find(e => e.event.id === eventId);
      // 保险：若找不到对应ID，则退化为取队首事件
      if (!active && state.gameState.activeEvents.length > 0) {
        active = state.gameState.activeEvents[0];
      }
      if (!active || !active.event) return;

      const ev: any = active.event;
      const choice = Array.isArray(ev.options) ? ev.options[choiceIndex] : undefined;

      // 1) 应用效果
      if (choice && (choice as any).effects) {
        get().applyEventEffects((choice as any).effects);
      }

      // 2) 写入历史与“最新事件”
      const timestamp = Date.now();
      set((s) => {
        const historyItem: any = {
          id: `${ev.id}_${timestamp}`,
          title: ev.title || ev.name || '事件',
          description: choice?.text ? `已选择：${choice.text}` : (ev.description || ''),
          type: 'choice',
          priority: ev.priority || 'medium',
          timestamp,
          isRead: false,
          isResolved: true
        };
        const newRecent = [...s.gameState.recentEvents, historyItem];
        while (newRecent.length > 3) newRecent.shift();
        return {
          gameState: {
            ...s.gameState,
            events: [...s.gameState.events, historyItem],
            recentEvents: newRecent
          }
        };
      });

      // 3) 关闭当前事件（从活跃移除），并根据队列决定是否继续显示或恢复游戏
      get().dismissPauseEvent(eventId);

      // 4) 兜底：若没有任何剩余暂停事件，确保恢复游戏并关闭弹窗（防止边缘态卡死）
      if (get().gameState.activeEvents.length === 0) {
        get().resumeGame();
        set((s) => ({
          uiState: {
            ...s.uiState,
            showEventModal: false,
            currentEvent: undefined
          }
        }));
      }
    },

    dismissPauseEvent: (eventId: string) => {
      // V2桥接：若全局引擎存在且当前有队首事件/当前modal来自V2，则直接转发dismiss并返回
      const w: any = (typeof window !== 'undefined') ? (window as any) : undefined;
      const headId = w?.eventsV2?.getHeadId?.();
      const currentId = (() => { try { return get().uiState?.currentEvent?.id; } catch { return undefined; } })();
      if (w?.eventsV2 && (headId || currentId)) {
        try { w.eventsV2.dismiss?.(); } catch {}
        // 强保险：清空旧队列、关闭弹窗、恢复运行
        set((st) => ({
          gameState: { 
            ...st.gameState, 
            activeEvents: [], 
            isPaused: false 
          },
          uiState: { 
            ...st.uiState, 
            showEventModal: false, 
            currentEvent: undefined 
          }
        }));
        try { get().resumeGame?.(); } catch {}
        return;
      }
      // 先尝试按ID移除
      set((state) => {
        const before = state.gameState.activeEvents;
        let remaining = before.filter(e => e.event.id !== eventId);
        // 保险：若未移除任何事件且仍有事件滞留，则移除队首
        if (remaining.length === before.length && before.length > 0) {
          remaining = before.slice(1);
        }
        const nextEvent = remaining.length > 0 ? remaining[0].event : undefined;
        return {
          gameState: {
            ...state.gameState,
            activeEvents: remaining,
          },
          uiState: {
            ...state.uiState,
            showEventModal: !!nextEvent,
            currentEvent: nextEvent as any
          }
        };
      });
      
      // 队列清空后恢复游戏
      if (get().gameState.activeEvents.length === 0) {
        get().resumeGame();
      }

      // 微任务级一致性守护：处理竞态，确保UI与暂停状态一致
      setTimeout(() => {
        const s = get();
        const hasActive = Array.isArray(s.gameState.activeEvents) && s.gameState.activeEvents.length > 0;
        if (!hasActive) {
          if (s.gameState.isPaused) s.resumeGame();
          (useGameStore as any).setState((st: any) => ({
            uiState: { ...st.uiState, showEventModal: false, currentEvent: undefined }
          }));
        } else {
          const first = s.gameState.activeEvents[0]?.event;
          (useGameStore as any).setState((st: any) => ({
            uiState: { ...st.uiState, showEventModal: true, currentEvent: first }
          }));
          if (!s.gameState.isPaused) s.pauseGame();
        }
      }, 0);
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

    // 世代系统
    setGeneration: (n: number) => {
      set((state) => ({
        ...state,
        gameState: {
          ...state.gameState,
          statistics: {
            ...state.gameState.statistics,
            currentGeneration: Math.max(0, Math.floor(n)),
          },
        },
      }));
    },

    incrementGeneration: () => {
      set((state) => ({
        ...state,
        gameState: {
          ...state.gameState,
          statistics: {
            ...state.gameState.statistics,
            currentGeneration: Math.max(0, (state.gameState.statistics?.currentGeneration || 0) + 1),
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

    // 开发者模式：开启后解锁全部科技、资源与人口拉满
    enableDevMode: () => {
      set((state) => {
        // 1) 全科技解锁
        const newTechs: any = {};
        Object.entries(state.gameState.technologies).forEach(([id, tech]: any) => {
          newTechs[id] = {
            ...tech,
            researched: true,
            researchProgress: tech.researchTime || tech.researchProgress || 0
          };
        });

        // 2) 先写入科技再更新效果系统，确保上限/效率等先就位
        const midState: any = {
          ...state,
          gameState: {
            ...state.gameState,
            technologies: newTechs,
            // 开发者模式下先设置 devMode，再全量放开资源可视
            settings: {
              ...state.gameState.settings,
              devMode: true
            },
            unlockedResources: Object.keys(state.gameState.resources || {})
          }
        };

        return midState;
      });

      // 刷新效果系统与速率
      get().updateEffectsSystem();
      get().calculateResourceRates();

      // 3) 将资源设置为各自上限（人口=住房+1）
      set((state) => {
        const limits = state.gameState.resourceLimits;
        const cur = state.gameState.resources;

        // 若资源管理器未初始化，先初始化
        if (!resourceManager) {
          resourceManager = initializeResourceManager(state.gameState.resources, state.gameState.resourceLimits);
        }

        const newResources: any = { ...cur };
        Object.entries(limits).forEach(([k, cap]) => {
          if (k === 'housing') {
            // housing 保持当前统计值
            return;
          }
          if (k === 'population') {
            // 人口设为住房上限 + 1
            newResources.population = (state.gameState.resources.housing || 0) + 1;
          } else {
            // 其他资源设为上限
            if (typeof newResources[k] === 'number') {
              newResources[k] = cap as number;
            }
          }
        });

        // 同步资源管理器
        if (resourceManager) {
          resourceManager.setResources(newResources, 'manual');
          resourceManager.updateResourceLimits(limits);
        }

        return {
          ...state,
          gameState: {
            ...state.gameState,
            resources: newResources
          }
        };
      });

      // 终态再算一次速率
      get().calculateResourceRates();

      // 同步一次（若后续新资源键加入资源对象，也确保可视）
      set((state) => ({
        gameState: {
          ...state.gameState,
          unlockedResources: Array.from(new Set([
            ...(state.gameState.unlockedResources || []),
            ...Object.keys(state.gameState.resources || {})
          ]))
        }
      }));

      // 4) 解锁全部职位并“按类型-职位”一对一定向生成与任命（避免类型与职位错配导致面板空缺）
      try {
        // 类型→初始职位映射（与 character-system 的 getInitialPosition 一致）
        const typeToPos: Array<{ type: any; pos: CharacterPosition }> = [
          { type: (require('@/types/character') as any).CharacterType.RULER,            pos: CharacterPosition.CHIEF },
          { type: (require('@/types/character') as any).CharacterType.RESEARCH_LEADER, pos: CharacterPosition.ELDER },
          { type: (require('@/types/character') as any).CharacterType.FAITH_LEADER,    pos: CharacterPosition.HIGH_PRIEST },
          { type: (require('@/types/character') as any).CharacterType.MAGE_LEADER,     pos: CharacterPosition.ARCHMAGE },
          { type: (require('@/types/character') as any).CharacterType.CIVIL_LEADER,    pos: CharacterPosition.CHIEF_JUDGE },
          { type: (require('@/types/character') as any).CharacterType.GENERAL,         pos: CharacterPosition.GENERAL },
          { type: (require('@/types/character') as any).CharacterType.DIPLOMAT,        pos: CharacterPosition.DIPLOMAT },
        ];

        // 标记：记录本次因开发者模式而临时解锁的职位与任命的人物，便于关闭时回滚
        const devUnlocked = new Set<string>();
        const devAppointed = new Set<string>();

        // 解锁所有映射中的职位
        typeToPos.forEach(({ pos }) => {
          try {
            const before = (get().gameState.characterSystem.unlockedPositions || []) as any[];
            if (!before.includes(pos)) {
              get().unlockCharacterPosition(pos);
              devUnlocked.add(String(pos));
            }
          } catch {}
        });

        // 已占用职位集合
        const active = get().gameState.characterSystem.activeCharacters || {};
        const occupied = new Set(
          Object.values(active)
            .map((c: any) => c?.position)
            .filter(Boolean)
        );

        // 对每个映射：若该职位空缺，则生成该“类型”的人物并任命到该“职位”
        const { generateRandomCharacterOfType } = (() => {
          try {
            const m = require('./character-system');
            // 若没有定向生成函数，则回退到 generateRandomCharacter 并覆盖 type
            return {
              generateRandomCharacterOfType: (t: any) => {
                const ch = m.generateRandomCharacter();
                return { ...ch, type: t };
              }
            };
          } catch {
            return {
              generateRandomCharacterOfType: (t: any) => {
                const id = `dev_${t}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
                return {
                  id,
                  name: '临时候选',
                  type: t,
                  position: CharacterPosition.CHIEF,
                  age: 30,
                  health: 100,
                  healthStatus: 'good',
                  attributes: { force: 5, intelligence: 5, charisma: 5 },
                  traits: [],
                  buffs: [],
                  isUnlocked: true,
                  unlockConditions: {},
                  experience: 0,
                  loyalty: 80
                } as any;
              }
            };
          }
        })();

        typeToPos.forEach(({ type, pos }) => {
          if (!occupied.has(pos)) {
            // 生成指定类型人物，放入可用池/allCharacters
            const ch = generateRandomCharacterOfType(type);
            set((state) => ({
              gameState: {
                ...state.gameState,
                characterSystem: {
                  ...state.gameState.characterSystem,
                  availableCharacters: [...state.gameState.characterSystem.availableCharacters, ch],
                  allCharacters: {
                    ...state.gameState.characterSystem.allCharacters,
                    [ch.id]: ch
                  }
                }
              }
            }));
            // 任命到指定职位
            try {
              if (get().appointCharacter(ch.id, pos)) {
                devAppointed.add(ch.id);
              }
            } catch {}
          }
        });

        // 将记录保存到 state 以便关闭时回滚
        set((state) => ({
          gameState: {
            ...state.gameState,
            characterSystem: {
              ...state.gameState.characterSystem,
              // 用非破坏性可选字段记录
              devUnlockedPositions: Array.from(devUnlocked) as any,
              devAppointedIds: Array.from(devAppointed) as any
            } as any
          }
        }) as any);
      } catch {
        // 忽略异常以避免影响其它 devMode 流程
      }

      // 最终兜底：确保所有已解锁职位均有人就任（防止个别路径未任命导致空缺）
      try {
        const { CharacterType } = require('@/types/character');
        const posToType: Record<string, any> = {
          chief: CharacterType.RULER,
          elder: CharacterType.RESEARCH_LEADER,
          high_priest: CharacterType.FAITH_LEADER,
          archmage: CharacterType.MAGE_LEADER,
          chief_judge: CharacterType.CIVIL_LEADER,
          general: CharacterType.GENERAL,
          diplomat: CharacterType.DIPLOMAT,
          king: CharacterType.RULER,
          emperor: CharacterType.RULER,
          president: CharacterType.RULER,
          grand_scholar: CharacterType.RESEARCH_LEADER,
          academy_head: CharacterType.RESEARCH_LEADER,
          archbishop: CharacterType.FAITH_LEADER,
          pope: CharacterType.FAITH_LEADER,
          royal_archmage: CharacterType.MAGE_LEADER,
          speaker: CharacterType.CIVIL_LEADER,
          grand_marshal: CharacterType.GENERAL
        };
        const positions = get().getUnlockedPositions();
        positions.forEach((pos) => {
          const cs: any = get().gameState.characterSystem || {};
          const byPos = (cs.activeByPosition || {}) as Record<string, any>;
          if (!byPos[pos]) {
            let ch = get().generateCharacter();
            const targetType = posToType[String(pos)];
            if (targetType && ch && ch.type !== targetType) {
              ch = { ...ch, type: targetType };
              set((state) => ({
                gameState: {
                  ...state.gameState,
                  characterSystem: {
                    ...state.gameState.characterSystem,
                    allCharacters: { ...state.gameState.characterSystem.allCharacters, [ch.id]: ch },
                    availableCharacters: state.gameState.characterSystem.availableCharacters.map((c: any) => c.id === ch.id ? ch : c)
                  }
                }
              }));
            }
            try { get().appointCharacter(ch.id, pos); } catch {}
          }
        });
      } catch {}
      
      // 通知
      get().addNotification({
        type: 'success',
        title: '开发者模式',
        message: '已解锁全部科技/资源并将人口拉满；职位与人物已自动填充'
      });
    },

    // 根据已研究科技重算资源解锁（依赖 Technology.unlocks 中的 { type: 'resource', id }）
    recomputeUnlockedResourcesFromTechs: () => {
      const state = get().gameState;
      const unlocked = new Set<string>(state.unlockedResources || []);
      Object.values(state.technologies || {}).forEach((tech: any) => {
        if (!tech?.researched) return;
        const unlocks = Array.isArray(tech.unlocks) ? tech.unlocks : [];
        unlocks.forEach((u: any) => {
          if (u && (u.type === 'resource') && typeof u.id === 'string') {
            unlocked.add(u.id);
          }
        });
      });

      // 兼容：如资源已有非零数值/速率，也纳入显示
      const res = state.resources || ({} as any);
      const rates = state.resourceRates || ({} as any);
      Object.keys(res).forEach((k) => {
        if ((res as any)[k] !== 0 || (rates as any)[k] !== 0) {
          unlocked.add(k);
        }
      });

      set((s) => ({
        gameState: {
          ...s.gameState,
          unlockedResources: Array.from(unlocked)
        }
      }));
    },

    toggleDevMode: () => {
      const current = !!get().gameState.settings?.devMode;
      if (!current) {
        get().enableDevMode();
      } else {
        // 关闭开发者模式：回滚“仅由开发者模式带来的职位解锁与任命”
        try {
          const cs: any = get().gameState.characterSystem || {};
          const devUnlocked: string[] = Array.isArray(cs.devUnlockedPositions) ? cs.devUnlockedPositions : [];
          const devAppointed: string[] = Array.isArray(cs.devAppointedIds) ? cs.devAppointedIds : [];

          // 解除任命并清空对应职位
          devAppointed.forEach((id) => {
            const act = get().gameState.characterSystem.activeCharacters[id];
            const pos = act?.position;
            if (act) {
              // 从 active 映射中移除
              set((state) => ({
                gameState: {
                  ...state.gameState,
                  characterSystem: {
                    ...state.gameState.characterSystem,
                    activeCharacters: Object.fromEntries(
                      Object.entries(state.gameState.characterSystem.activeCharacters)
                        .filter(([cid]) => cid !== id)
                    ),
                    activeByPosition: {
                      ...(state.gameState.characterSystem as any).activeByPosition,
                      ...(pos ? { [pos]: null } : {})
                    },
                    // 放回候选池
                    availableCharacters: [...state.gameState.characterSystem.availableCharacters, { ...(act as any) }]
                  }
                }
              }));
            }
          });

          // 撤销开发者临时解锁的职位
          if (devUnlocked.length > 0) {
            set((state) => ({
              gameState: {
                ...state.gameState,
                characterSystem: {
                  ...state.gameState.characterSystem,
                  unlockedPositions: (state.gameState.characterSystem.unlockedPositions || []).filter(
                    (p: any) => !devUnlocked.includes(String(p))
                  ),
                  devUnlockedPositions: [],
                  devAppointedIds: []
                } as any
              }
            }) as any);
          } else {
            // 清空记录
            set((state) => ({
              gameState: {
                ...state.gameState,
                characterSystem: {
                  ...state.gameState.characterSystem,
                  devUnlockedPositions: [],
                  devAppointedIds: []
                } as any
              }
            }) as any);
          }
        } catch {}

        // 最后仅切换标志为关闭
        set((state) => ({
          ...state,
          gameState: {
            ...state.gameState,
            settings: {
              ...state.gameState.settings,
              devMode: false
            }
          }
        }));

        get().addNotification({
          type: 'info',
          title: '开发者模式',
          message: '已关闭开发者模式（已回滚由开发者模式临时解锁/任命的人物与职位）'
        });
      }
    },

    // 效果系统实现
    getEffectsSystem: () => {
      return globalEffectsSystem;
    },

    updateEffectsSystem: () => {
      // 先用当前状态重建基础/科技/建筑等效果，再下沉人物效果，避免被后续重建覆盖
      const state = get().gameState;
      globalEffectsSystem.updateFromGameState(state);
      try {
        get().updateCharacterSystem();
      } catch {}
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
      const es: any = get().getEffectsSystem();
      const fn = es?.calculateTotalEffect || es?.calculateEffectTotal;
      return typeof fn === 'function' ? fn.call(es, type) : 0;
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
          (building as any).effects.forEach((effect: any) => {
            if ((effect as any).type === 'research_points') {
              researchPointsPerSecond += Number((effect as any).value || 0) * Number((building as any).count || 1);
            }
          });
        }
      });
      
      // 基于科技的研究点加成
      Object.values(gameState.technologies).forEach(tech => {
        if (tech.researched && tech.effects) {
          tech.effects.forEach((effect: any) => {
            if ((effect as any).type === 'research_points') {
              researchPointsPerSecond += Number((effect as any).value || 0);
            }
          });
        }
      });
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          resourceRates: {
            ...state.gameState.resourceRates,
            researchPoints: researchPointsPerSecond,
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
            // 改为临时效果：不即时改当前稳定度
            try {
              const { addTemporaryEffect, createTemporaryEffectFromChoice } = require('./temporary-effects');
              const gs = get().gameState;
              const ev = (get().uiState?.currentEvent as any) || {};
              const evId = String(ev.id || `ev_${Date.now()}`);
              const evName = String(ev.title || ev.name || '事件影响');
              const te = createTemporaryEffectFromChoice(
                'choice',
                evId,
                evName,
                'buff',
                Number(((get().uiState?.currentEvent as any)?.durationDays || (event as any)?.durationDays || 360)),
                [`stability:${Number(effect.value || 0)}`],
                gs
              );
              if (te) addTemporaryEffect(gs, te);
            } catch {}
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
          title: '无法建造',
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
        count: 1,
        constructionProgress: 100, // 立即完成建造
        isConstructed: true,
        constructionStartTime: Date.now(),
        lastProductionTime: Date.now(),
        effects: buildingDef.effects || {},
        upgrades: []
      };
      
      // 根据建筑效果与产出提升住房资源（用于计算人口上限）
      const __housingIncreaseFromEffects = (buildingDef.effects || [])
        .filter(e => e.type === 'population_capacity')
        .reduce((sum, e) => sum + (e.value || 0), 0);
      // 为兼容类型定义未包含 produces，使用宽松读取
      const __bdAny = buildingDef as any;
      const __housingIncreaseFromProduces = __bdAny?.produces?.housing ? Number(__bdAny.produces.housing) : 0;
      const __housingIncrease = __housingIncreaseFromEffects + __housingIncreaseFromProduces;

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
        title: '建造完成',
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

      // 折算住房容量减少（effects.population_capacity + produces.housing）
      const __def = getBuildingDefinition(building.buildingId);
      const __housingDecreaseFromEffects = (__def?.effects || [])
        .filter(e => e.type === 'population_capacity')
        .reduce((sum, e) => sum + (e.value || 0), 0);
      // 为兼容类型定义未包含 produces，使用宽松读取
      const __defAny = __def as any;
      const __housingDecreaseFromProduces = __defAny?.produces?.housing ? Number(__defAny.produces.housing) : 0;
      const __housingDecrease = __housingDecreaseFromEffects + __housingDecreaseFromProduces;
      
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
        title: '建筑已拆除',
        message: `已拆除${building.buildingId}`
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
        if (!(building as any).isConstructed || (building as any).assignedWorkers === 0) {
          return;
        }
        
        const buildingDef = getBuildingDefinition(building.buildingId);
        const effectsArr = ((buildingDef as any)?.effects || []) as any[];
        const prodArr = effectsArr.filter(e => (e as any)?.type === 'production');
        if (!buildingDef || prodArr.length === 0) {
          return;
        }
        
        const timeDiff = (now - (building as any).lastProductionTime) / 1000; // 转换为秒
        const productionRates = prodArr.reduce((acc: Record<string, number>, e: any) => {
          const res = String(e.resource || '');
          const rate = Number(e.ratePerWorker ? e.ratePerWorker * (building as any).assignedWorkers : (e.rate || 0));
          if (res) acc[res] = (acc[res] || 0) + rate;
          return acc;
        }, {} as Record<string, number>);
        
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
              [String((building as any).id)]: {
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
        if (!(building as any).isConstructed || (building as any).assignedWorkers === 0) {
          return;
        }
        
        const buildingDef = getBuildingDefinition(building.buildingId);
        if (!buildingDef) {
          return;
        }
        
        const effectsArr2 = ((buildingDef as any)?.effects || []) as any[];
        const prodArr2 = effectsArr2.filter(e => (e as any)?.type === 'production');
        const rates = prodArr2.reduce((acc: Record<string, number>, e: any) => {
          const res = String(e.resource || '');
          const rate = Number(e.ratePerWorker ? e.ratePerWorker * (building as any).assignedWorkers : (e.rate || 0));
          if (res) acc[res] = (acc[res] || 0) + rate;
          return acc;
        }, {} as Record<string, number>);
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
        if (!(building as any).isConstructed) {
          return;
        }
        
        const buildingDef = getBuildingDefinition(building.buildingId);
        const effectsArr3 = ((buildingDef as any)?.effects || []) as any[];
        const storageArr = effectsArr3.filter(e => (e as any)?.type === 'storage');
        if (!buildingDef || storageArr.length === 0) {
          return;
        }
        
        const bonus = storageArr.reduce((acc: Record<string, number>, e: any) => {
          const res = String(e.resource || '');
          const amt = Number(e.amount || 0);
          if (res) acc[res] = (acc[res] || 0) + amt;
          return acc;
        }, {} as Record<string, number>);
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

      // 开发者模式：跳过解锁判定
      if (!gameState.settings?.devMode) {
        // 检查科技前置条件（普通模式）
        const researchedTechs = new Set(
          Object.entries(gameState.technologies)
            .filter(([_, tech]) => tech.researched)
            .map(([id]) => id)
        );
        if (!isBuildingUnlocked(buildingId, researchedTechs)) {
          return { canBuild: false, reason: '需要先研究相关科技' };
        }
      }
      
      // 检查建造限制
      if (buildingDef.buildLimit !== undefined) {
        const existingCount = get().getBuildingInstances(buildingId).length;
        const limit = typeof buildingDef.buildLimit === 'number'
          ? buildingDef.buildLimit
          : (buildingDef.buildLimit?.type === 'fixed'
              ? (buildingDef.buildLimit.baseLimit || 0)
              : Math.max(buildingDef.buildLimit?.baseLimit || 0, Math.floor(gameState.resources.population / (buildingDef.buildLimit?.populationRatio || Infinity))));
        if (existingCount >= limit) {
          return { canBuild: false, reason: `已达到建造上限 (${limit})` };
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
            // 改为临时效果：不即时改当前稳定度
            try {
              const { addTemporaryEffect, createTemporaryEffectFromChoice } = require('./temporary-effects');
              const gs = get().gameState;
              const ev = (get().uiState?.currentEvent as any) || {};
              const evId = String(ev.id || `ev_${Date.now()}`);
              const evName = String(ev.title || ev.name || '事件影响');
              const te = createTemporaryEffectFromChoice(
                'choice',
                evId,
                evName,
                'buff',
                Number(((get().uiState?.currentEvent as any)?.durationDays || (event as any)?.durationDays || 360)),
                [`stability:${-Number(effect.value || 0)}`],
                gs
              );
              if (te) addTemporaryEffect(gs, te);
            } catch {}
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
        // 训练成功后，若为探索单位则+1隐藏探险点
        try {
          const { getUnitType } = require('./military-data');
          const ut = getUnitType(unitType);
          const isExplorer = !!ut?.isExplorer;
          set((state) => ({
            gameState: {
              ...state.gameState,
              military: result.newMilitaryState!,
              resources: result.newResources!,
              exploration: {
                ...state.gameState.exploration,
                explorationPoints: (state.gameState.exploration?.explorationPoints || 0) + (isExplorer ? 1 : 0),
                discoveredLocations: state.gameState.exploration.discoveredLocations,
                explorationHistory: state.gameState.exploration.explorationHistory
              }
            }
          }));
        } catch {
          // 回退：若动态导入失败，仅应用原更新
          set((state) => ({
            gameState: {
              ...state.gameState,
              military: result.newMilitaryState!,
              resources: result.newResources!
            }
          }));
        }
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
    // 新：把所选部队转换为侦察点并写入状态，用于驱动“冒险节点线”流程
    startAdventureWithUnits: (units: any[]) => {
      try {
        const { getUnitType } = require('./military-data');
        let sp = 0;
        (units || []).forEach((u: any) => {
          const ut = getUnitType(u.typeId);
          const cnt = Number(u?.count || 0);
          // 侦察兵=+1/人；冒险家=+2/人；其他探索类（isExplorer）默认+1/人
          if (u.typeId === 'scout' || (ut && ut.id === 'scout')) sp += cnt * 1;
          else if (u.typeId === 'adventurer' || (ut && ut.id === 'adventurer')) sp += cnt * 2;
          else if (ut?.isExplorer) sp += cnt * 1;
        });
        if (sp <= 0) {
          return { started: false, sp: 0 };
        }
        set((state) => ({
          gameState: {
            ...state.gameState,
            exploration: {
              ...state.gameState.exploration,
              explorationPoints: (state.gameState.exploration?.explorationPoints || 0) + sp,
              discoveredLocations: state.gameState.exploration.discoveredLocations,
              explorationHistory: state.gameState.exploration.explorationHistory
            }
          }
        }));
        // 提示：仅通知，不写入“暂停事件”，由节点线自己触发暂停弹窗
        get().addNotification({
          type: 'info',
          title: '冒险队已出发',
          message: '冒险队已出发'
        });
        // 触发 V2 冒险事件源：写入一次性启动标记与 SP
        set((state) => ({
          gameState: {
            ...state.gameState,
            exploration: {
              ...state.gameState.exploration,
              adventureV2Start: { sp }
            }
          }
        }));
        return { started: true, sp };
      } catch {
        return { started: false, sp: 0 };
      }
    },
    // 兼容旧接口：保留但不推荐使用（仍执行旧即时结算）
    exploreWithUnits: (units: any[]) => {
      const explorationSystem = new ExplorationSystem();
      const { gameState } = get();
      const result = explorationSystem.explore(units);
      
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
              const loss = Number((result as any).casualties || 0);
              if (exploringUnit && loss > 0) {
                return { ...unit, count: Math.max(0, unit.count - loss) };
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
      
      const result = combatSystem.simulateCombat(units, dungeon as any);
      
      // 应用战斗结果
      set((state) => ({
        gameState: {
          ...state.gameState,
          military: {
            ...state.gameState.military,
            units: state.gameState.military.units.map(unit => {
              const combatUnit = units.find(u => u.id === unit.id);
              if (combatUnit) {
                const casualties = ((result as any).playerCasualties?.find((c: any) => c.unitId === unit.id)?.casualties) || 0;
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
      // 内置安全生成器（避免依赖不存在的外部函数）
      const { CharacterType, CharacterPosition, HealthStatus } = require('@/types/character');

      // 工具
      const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
      const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
      const pick = <T,>(arr: T[]) => arr[rand(0, arr.length - 1)];

      // ID 与姓名
      const id = `char_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const familyNames = ['阿', '巴', '卡', '达', '伊', '法', '格', '赫', '吉', '卡', '拉', '马', '那', '欧', '帕', '奇', '瑞', '萨', '塔', '乌', '维', '沃', '希', '伊', '泽'];
      const givenNamesMale = ['图', '鲁', '卡', '纳', '米', '若', '哈', '亚', '索', '凯', '良', '昂', '岳', '宁'];
      const givenNamesFemale = ['雅', '娜', '薇', '琳', '娅', '茜', '琪', '芙', '莎', '莲', '瑶', '雪', '朵', '馨'];
      const gender: 'male' | 'female' = Math.random() < 0.5 ? 'male' : 'female';
      const given = gender === 'male' ? pick(givenNamesMale) : pick(givenNamesFemale);
      const name = `${pick(familyNames)}${given}`;

      // 随机类型与其初始职位映射
      const typeValues: any[] = Object.values(CharacterType);
      const type = typeValues[rand(0, typeValues.length - 1)];

      const typeToPos: Record<string, any> = {
        [CharacterType.RULER]: CharacterPosition.CHIEF,
        [CharacterType.RESEARCH_LEADER]: CharacterPosition.ELDER,
        [CharacterType.FAITH_LEADER]: CharacterPosition.HIGH_PRIEST,
        [CharacterType.MAGE_LEADER]: CharacterPosition.ARCHMAGE,
        [CharacterType.CIVIL_LEADER]: CharacterPosition.CHIEF_JUDGE,
        [CharacterType.GENERAL]: CharacterPosition.GENERAL,
        [CharacterType.DIPLOMAT]: CharacterPosition.DIPLOMAT
      };
      const position = typeToPos[type] || CharacterPosition.CHIEF;

      // 年龄规则：
      // - 默认上任年龄：26–40
      // - 若已解锁“国王”职位，且类型为 RULER，视作可能的继承人：18–40
      const unlocked = (get().gameState.characterSystem?.unlockedPositions || []) as any[];
      const kingUnlocked = unlocked.includes(CharacterPosition.KING);
      const ageMin = type === CharacterType.RULER && kingUnlocked ? 18 : 26;
      const ageMax = 40;
      const age = rand(ageMin, ageMax);

      // 基础属性
      let force = rand(3, 9);
      let intelligence = rand(3, 9);
      let charisma = rand(3, 9);

      // 特性池（包含加减属性与功能特性）
      type TraitTpl = {
        id: string;
        name: string;
        type: 'positive'|'negative'|'neutral';
        description: string;
        // 直接改属性：Δ武/智/魅
        df?: number; di?: number; dc?: number;
        // 直接改基础健康（0-100）
        dh?: number;
        // 功能标记，用于循环结算
        flag?: 'private_stash';
      };
      const TRAIT_POOL: TraitTpl[] = [
        { id: 'charming', name: '风流倜傥', type: 'positive', description: '魅力 +2（直接加属性）', dc: 2 },
        { id: 'ugly', name: '丑陋不堪', type: 'negative', description: '魅力 -2（直接减属性）', dc: -2 },
        { id: 'strong', name: '力大无穷', type: 'positive', description: '武力 +2（直接加属性）', df: 2 },
        { id: 'weakling', name: '瘦弱不堪', type: 'negative', description: '武力 -2（直接减属性）', df: -2 },
        { id: 'frail_health', name: '体弱多病', type: 'negative', description: '基础健康 -15（直接减生命上限）', dh: -15 },
        { id: 'clever', name: '足智多谋', type: 'positive', description: '智力 +2（直接加属性）', di: 2 },
        { id: 'bookish', name: '学究气重', type: 'neutral', description: '智力 +1，生产效率 -4%', di: 1 },
        { id: 'industrious', name: '勤勉有序', type: 'positive', description: '全局生产效率 +5%' },
        { id: 'wasteful', name: '浪费成性', type: 'negative', description: '产出 +5%，消耗 +8%' },
        { id: 'private_stash', name: '小金库', type: 'neutral', description: '每年随机获得一笔货币（50~150）', flag: 'private_stash' },
      ];

      // 权重：正面略高
      const positives = TRAIT_POOL.filter(t => t.type === 'positive');
      const others = TRAIT_POOL.filter(t => t.type !== 'positive');
      const poolWeighted = [...positives, ...positives, ...others];

      // 抽取1-2个不重复特性
      const traitCount = Math.random() < 0.6 ? 2 : 1;
      const picked: TraitTpl[] = [];
      while (picked.length < traitCount && poolWeighted.length > 0) {
        const t = pick(poolWeighted);
        if (!picked.find(x => x.id === t.id)) picked.push(t);
      }

      // 应用属性与健康修正
      let baseHealth = 100;
      picked.forEach(t => {
        force = clamp(force + (t.df || 0), 0, 10);
        intelligence = clamp(intelligence + (t.di || 0), 0, 10);
        charisma = clamp(charisma + (t.dc || 0), 0, 10);
        if (typeof t.dh === 'number') baseHealth = clamp(baseHealth + t.dh, 10, 100);
      });

      const character: any = {
        id,
        name,
        type,
        position,
        gender,
        age,
        health: baseHealth,
        healthStatus: HealthStatus.GOOD,
        attributes: {
          force,
          intelligence,
          charisma
        },
        traits: picked.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          type: t.type,
          effects: [] // 属性已直接体现在数值上，效果系统可按需映射
        })),
        buffs: [],
        isUnlocked: true,
        unlockConditions: {},
        experience: 0,
        loyalty: rand(60, 95)
      };

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

      return character as any;
    },

    appointCharacter: (characterId: string, position: CharacterPosition) => {
      const state = get();
      const character = state.gameState.characterSystem.allCharacters[characterId];
      if (!character) return false;

      // 职位是否解锁
      if (!state.gameState.characterSystem.unlockedPositions.includes(position)) {
        return false;
      }

      // 职位是否已被占用（优先用按职位映射判断）
      const currentByPos = (state.gameState.characterSystem as any).activeByPosition || {};
      if (currentByPos[position]) {
        return false;
      }

      // 任命人物：同时更新按ID与按职位两份索引
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
            activeByPosition: {
              ...(state.gameState.characterSystem as any).activeByPosition,
              [position]: appointedCharacter
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

      const pos = (character as any).position;

      // 从在职移除（两份索引），并放回可选列表
      set((state) => ({
        gameState: {
          ...state.gameState,
          characterSystem: {
            ...state.gameState.characterSystem,
            activeCharacters: Object.fromEntries(
              Object.entries(state.gameState.characterSystem.activeCharacters)
                .filter(([id]) => id !== characterId)
            ),
            activeByPosition: {
              ...(state.gameState.characterSystem as any).activeByPosition,
              ...(pos ? { [pos]: null } : {})
            },
            availableCharacters: [...state.gameState.characterSystem.availableCharacters, { ...character }]
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
      // 1) 写入解锁列表（去重）
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
      // 2) 若该职位当前为空缺，则立刻生成人物并自动任命，避免出现“职位空缺”
      try {
        const cs: any = get().gameState.characterSystem || {};
        const activeByPos = (cs.activeByPosition || {}) as Record<CharacterPosition, any>;
        if (!activeByPos[position]) {
          // 职位 -> 类型 映射（与 UI/character-tab 逻辑一致）
          const { CharacterType } = require('@/types/character');
          const posToType: Record<string, any> = {
            chief: CharacterType.RULER,
            elder: CharacterType.RESEARCH_LEADER,
            high_priest: CharacterType.FAITH_LEADER,
            archmage: CharacterType.MAGE_LEADER,
            chief_judge: CharacterType.CIVIL_LEADER,
            general: CharacterType.GENERAL,
            diplomat: CharacterType.DIPLOMAT,
            king: CharacterType.RULER,
            emperor: CharacterType.RULER,
            president: CharacterType.RULER,
            grand_scholar: CharacterType.RESEARCH_LEADER,
            academy_head: CharacterType.RESEARCH_LEADER,
            archbishop: CharacterType.FAITH_LEADER,
            pope: CharacterType.FAITH_LEADER,
            royal_archmage: CharacterType.MAGE_LEADER,
            speaker: CharacterType.CIVIL_LEADER,
            grand_marshal: CharacterType.GENERAL
          };
          const targetType = posToType[String(position)];
          // 生成一名候选人（若无法定向生成，则用通用生成并覆盖类型）
          let ch = get().generateCharacter();
          if (targetType && ch && ch.type !== targetType) {
            ch = { ...ch, type: targetType };
            set((state) => ({
              gameState: {
                ...state.gameState,
                characterSystem: {
                  ...state.gameState.characterSystem,
                  allCharacters: { ...state.gameState.characterSystem.allCharacters, [ch.id]: ch },
                  availableCharacters: state.gameState.characterSystem.availableCharacters.map((c: any) => c.id === ch.id ? ch : c)
                }
              }
            }));
          }
          try {
            get().appointCharacter(ch.id, position);
          } catch {}
        }
      } catch {
        // 忽略异常，保证主流程
      }
    },

    getActiveCharacters: () => {
      return Object.values(get().gameState.characterSystem.activeCharacters);
    },
    // 新增：按职位读取在职人物映射
    getActiveCharactersByPosition: () => {
      const cs: any = get().gameState.characterSystem || {};
      return cs.activeByPosition || {};
    },

    getAvailableCharacters: () => {
      return get().gameState.characterSystem.availableCharacters;
    },

    getCharacterById: (characterId: string) => {
      return get().gameState.characterSystem.allCharacters[characterId];
    },

    calculateCharacterEffects: () => {
      const activeList = (get().getActiveCharacters?.() || []) as any[];
      // 动态加载常量，避免顶部改动 imports
      const { CHARACTER_ATTRIBUTE_EFFECTS } = require('./character-data');
      const effects: any[] = [];
      
      activeList.forEach((character: any) => {
        if (!character) return;
        const attrEffects = CHARACTER_ATTRIBUTE_EFFECTS?.[character.type];
        const attrs = character.attributes || {};
        
        // 属性效果：武力/智力/魅力
        if (attrEffects?.force && typeof attrs.force === 'number' && attrs.force > 0) {
          const e = attrEffects.force;
          effects.push({
            type: e.type,
            target: e.target,
            value: e.value * attrs.force,
            isPercentage: e.value < 1,
            description: `${character.name}: ${String(e.description || '').replace('/点', ` x${attrs.force}`)}`
          });
        }
        if (attrEffects?.intelligence && typeof attrs.intelligence === 'number' && attrs.intelligence > 0) {
          const e = attrEffects.intelligence;
          effects.push({
            type: e.type,
            target: e.target,
            value: e.value * attrs.intelligence,
            isPercentage: e.value < 1,
            description: `${character.name}: ${String(e.description || '').replace('/点', ` x${attrs.intelligence}`)}`
          });
        }
        if (attrEffects?.charisma && typeof attrs.charisma === 'number' && attrs.charisma > 0) {
          const e = attrEffects.charisma;
          effects.push({
            type: e.type,
            target: e.target,
            value: e.value * attrs.charisma,
            isPercentage: e.value < 1,
            description: `${character.name}: ${String(e.description || '').replace('/点', ` x${attrs.charisma}`)}`
          });
        }
        
        // 特性效果
        (character.traits || []).forEach((trait: any) => {
          (trait?.effects || []).forEach((eff: any) => effects.push(eff));
        });
        // Buff 效果
        (character.buffs || []).forEach((buff: any) => {
          (buff?.effects || []).forEach((eff: any) => effects.push(eff));
        });
      });
      
      return effects;
    },

    updateCharacterSystem: () => {
      const state = get().gameState;
      const effectsSystem = get().getEffectsSystem();

      // 清除旧的人物效果
      effectsSystem.removeEffectsBySource('character' as any);

      // 读取在职人物（按职位）
      const activeByPos: Record<string, any> = (state.characterSystem as any)?.activeByPosition || {};

      // 映射：职位 -> 中文标签（用于效果来源名）
      const posLabel: Record<string, string> = {
        chief: '酋长',
        king: '国王',
        emperor: '皇帝',
        president: '总统',
        elder: '长老',
        grand_scholar: '大学士',
        academy_head: '学院院长',
        high_priest: '大祭司',
        archbishop: '大主教',
        pope: '教宗',
        archmage: '大法师',
        royal_archmage: '御用大法师',
        chief_judge: '大法官',
        speaker: '议长',
        general: '将军',
        grand_marshal: '大元帅',
        diplomat: '外交官'
      };

      // 加载属性折算映射
      let ATTR_MAP: any = null;
      try {
        ATTR_MAP = (require('@/lib/character-data') as any).CHARACTER_ATTRIBUTE_EFFECTS || null;
      } catch {
        ATTR_MAP = null;
      }

      // 特性效果映射（只列出数值类；属性/健康直接体现在数值中不重复记）
      const pushTraitEffects = (traits: any[], sink: any[]) => {
        (traits || []).forEach((t: any) => {
          switch (t?.id) {
            case 'industrious': // 勤勉有序：全局生产效率 +5%
              sink.push({ type: 'resource_production_bonus', target: 'all', value: 0.05, isPercentage: true, name: '生产效率' });
              break;
            case 'bookish': // 学究气重：生产效率 -4%
              sink.push({ type: 'resource_production_bonus', target: 'all', value: -0.04, isPercentage: true, name: '生产效率' });
              break;
            case 'wasteful': // 浪费成性：产出 +5%（消耗+8%暂不写入全局，避免未知类型）
              sink.push({ type: 'resource_production_bonus', target: 'all', value: 0.05, isPercentage: true, name: '生产效率' });
              break;
            default:
              // 其他特性：若自身带 effects 数组，也并入
              (t?.effects || []).forEach((eff: any) => sink.push(eff));
              break;
          }
        });
      };

      // 遍历职位，聚合每个职位的人物效果
      Object.entries(activeByPos).forEach(([pos, ch]) => {
        if (!ch) return;
        const srcId = String(pos);
        const srcName = posLabel[srcId] || srcId;

        const local: any[] = [];

        // 1) 属性折算
        if (ATTR_MAP && ch.type && ATTR_MAP[ch.type]) {
          const attrs = ch.attributes || {};
          const m = ATTR_MAP[ch.type];
          const apply = (key: 'force'|'intelligence'|'charisma') => {
            const def = m[key];
            const pts = Number(attrs?.[key] || 0);
            if (def && pts > 0) {
              const val = Number(def.value || 0) * pts;
              local.push({
                type: def.type,
                target: def.target,
                value: val,
                isPercentage: def.value < 1,
                name: def.name || def.target || '效果'
              });
            }
          };
          apply('force'); apply('intelligence'); apply('charisma');
        }

        // 2) 特性效果
        pushTraitEffects(ch.traits || [], local);

        // 3) Buff 效果
        (ch.buffs || []).forEach((b: any) => (b?.effects || []).forEach((eff: any) => local.push(eff)));

        // 将本职位的效果写入全局效果系统（逐条写入，便于“全部效果”正确累计）
        local.forEach((eff) => {
          // 规范化字段
          const effectPayload: any = {
            ...eff,
            sourceType: 'character',
            sourceId: srcId,
            source: { type: 'character', id: srcId, name: srcName }
          };
          effectsSystem.addEffect(effectPayload);
        });
      });

      // 更新效果系统版本
      set((s) => ({ effectsVersion: s.effectsVersion + 1 }));
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
                ...(result.newRelationship ? { [countryId]: result.newRelationship } : {})
              },
              tradeHistory: [...gameState.gameState.diplomacy.tradeHistory, result.tradeRecord!]
            }
          }
        }));
        
        get().addNotification({
          type: 'success',
          title: '贸易成功',
          message: `与${result.tradeRecord!.countryName}的贸易成功完成！`
        });
      } else {
        get().addNotification({
          type: 'error',
          title: '贸易失败',
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
              relationships: result.newRelationship
                ? { ...gameState.gameState.diplomacy.relationships, [countryId]: result.newRelationship }
                : gameState.gameState.diplomacy.relationships,
              giftHistory: [...gameState.gameState.diplomacy.giftHistory, result.giftRecord!]
            }
          }
        }));
        
        get().addNotification({
          type: 'success',
          title: '赠礼成功',
          message: `成功向${result.giftRecord!.countryName}赠送礼物，关系得到改善！`
        });
      } else {
        get().addNotification({
          type: 'error',
          title: '赠礼失败',
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
                  value: 0,
                  atWar: true
                }
              },
              warHistory: [...gameState.gameState.diplomacy.warHistory, warRecord]
            }
          }
        }));
        
        get().addNotification({
          type: 'warning',
          title: '战争宣告',
          message: `已向${country.name}宣战！`
        });
      }
    },

    hireMercenary: (mercenaryId: string) => {
      const state = get().gameState;
      const mercenary = state.diplomacy.mercenaryUnits.find(m => m.id === mercenaryId);
      
      if (mercenary && get().canAfford({ currency: mercenary.cost as any })) {
        get().spendResources({ currency: mercenary.cost as any });
        get().addUnit((mercenary as any).unitType, (mercenary as any).count);
        
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
          title: '雇佣成功',
          message: `成功雇佣${(mercenary as any).count}个${mercenary.name}！`
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
          const newValue = Math.max(0, Math.min(100, relationship.value + decay));
          updatedRelationships[countryId] = {
            ...relationship,
            value: newValue,
            level: DiplomacySystem.getRelationshipLevel(newValue)
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
        // 随机挑选一个敌对国家，生成袭扰事件
        const idx = Math.floor(Math.random() * hostileCountries.length);
        const source = hostileCountries[idx];
        const raidEvent = DiplomacySystem.generateRaidEvent(source as any, state.gameTime, 1);
        
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
          title: '敌国袭扰',
          description: `${source.name}的军队正在袭扰我们的边境！`,
          options: [
            { id: 'defend', text: '派兵抵御', effects: [{ type: 'stability_change', value: -5 }] },
            { id: 'fortify', text: '加强防御', effects: [{ type: 'resource_change', target: 'wood', value: -50 }, { type: 'resource_change', target: 'stone', value: -30 }] }
          ]
        } as any);
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
      return DiplomacySystem.getNationEffects ? DiplomacySystem.getNationEffects(state.diplomacy.discoveredCountries[0] as any) || [] : [];
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
      
      // 确保 researchState 存在并兼容新结构
      if (persistedState?.gameState && !persistedState.gameState.researchState) {
        persistedState.gameState.researchState = {
          currentResearch: null,
          researchQueue: [],
          researchSpeed: 1,
        };
      } else if (persistedState?.gameState?.researchState) {
        const rs: any = persistedState.gameState.researchState;
        if (typeof rs.researchSpeed !== 'number') rs.researchSpeed = 1;
        if ('researchPoints' in rs) delete rs.researchPoints;
        if ('researchPointsPerSecond' in rs) delete rs.researchPointsPerSecond;
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
          currentGeneration: 0,
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
              currentGeneration: 0,
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