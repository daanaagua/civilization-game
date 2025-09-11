import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState, Resource, Building, Technology, Character, GameEvent, Achievement, Buff } from '@/types';
import { saveGameState, loadGameState, AutoSaveManager } from '@/lib/persistence';
// 移除错误的导入，使用本地定义的初始状态
// 移除 GameEngine 导入，使用内联实现

// 定义初始游戏数据
const initialGameData: GameState = {
  gameStartTime: Date.now(),
  lastUpdateTime: Date.now(),
  isPaused: true,
  gameSpeed: 1,
  resources: {},
  buildings: {},
  technologies: {},
  currentResearch: null,
  characters: {},
  events: {},
  activeEvents: [],
  achievements: {},
  buffs: {},
  inheritancePoints: 0,
  totalInheritancePoints: 0,
  stability: 50,
  maxStability: 100,
  population: 1,
  maxPopulation: 10,
  statistics: {
    totalPlayTime: 0,
    totalResourcesCollected: {},
    totalBuildingsBuilt: {},
    totalTechnologiesResearched: 0,
    totalEventsTriggered: 0,
    totalAchievementsUnlocked: 0,
    currentGeneration: 1
  }
};

interface GameStore extends GameState {
  // 游戏控制
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setGameSpeed: (speed: number) => void;
  resetGame: () => void;
  
  // 持久化控制
  saveGame: () => void;
  loadGame: () => void;
  initializePersistence: () => void;
  
  // 资源操作
  addResource: (resourceId: string, amount: number) => void;
  subtractResource: (resourceId: string, amount: number) => boolean;
  canAfford: (costs: Array<{ resourceId: string; amount: number }>) => boolean;
  manualCollectResource: (resourceId: string) => void;
  
  // 建筑操作
  buildBuilding: (buildingId: string) => boolean;
  getBuildingCount: (buildingId: string) => number;
  
  // 科技操作
  startResearch: (technologyId: string) => boolean;
  completeResearch: (technologyId: string) => void;
  
  // 人物操作
  unlockCharacter: (characterId: string) => void;
  activateCharacter: (characterId: string) => void;
  deactivateCharacter: (characterId: string) => void;
  
  // 事件操作
  triggerEvent: (eventId: string) => void;
  chooseEventOption: (eventId: string, choiceId: string) => void;
  
  // 成就操作
  checkAchievements: () => void;
  unlockAchievement: (achievementId: string) => void;
  
  // Buff操作
  addBuff: (buff: Buff) => void;
  removeBuff: (buffId: string) => void;
  
  // 游戏更新
  updateGame: (deltaTime: number) => void;
  
  // 继承系统
  calculateInheritancePoints: () => number;
  rebirth: () => void;
}

// 创建自动保存管理器实例
const autoSaveManager = new AutoSaveManager();

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      ...initialGameData,
      
      // 游戏控制
      startGame: () => {
        set((state) => ({
          ...state,
          gameStartTime: Date.now(),
          lastUpdateTime: Date.now(),
          isPaused: false,
        }));
        // 游戏开始时立即保存一次
        autoSaveManager.saveNow();
      },
      
      pauseGame: () => {
        set((state) => ({ ...state, isPaused: true }));
        // 暂停时立即保存
        autoSaveManager.saveNow();
      },
      
      resumeGame: () => {
        set((state) => ({
          ...state,
          isPaused: false,
          lastUpdateTime: Date.now(),
        }));
      },
      
      setGameSpeed: (speed: number) => {
        set((state) => ({ ...state, gameSpeed: speed }));
      },
      
      resetGame: () => {
        set(() => ({ ...initialGameData }));
        autoSaveManager.saveNow();
      },
      
      // 持久化方法
      saveGame: () => {
        const state = get();
        saveGameState(state);
      },
      
      loadGame: () => {
        const savedState = loadGameState();
        if (savedState) {
          set({ ...initialGameData, ...savedState });
          console.log('游戏状态已从存储加载');
        }
      },
      
      initializePersistence: () => {
        // 页面加载时自动加载游戏状态
        const savedState = loadGameState();
        if (savedState) {
          set({ ...initialGameData, ...savedState });
          console.log('游戏状态已自动加载');
        }
        
        // 启动自动保存
        autoSaveManager.start(() => get());
        
        // 页面卸载时保存
        if (typeof window !== 'undefined') {
          const handleBeforeUnload = () => {
            const state = get();
            saveGameState(state);
          };
          
          window.addEventListener('beforeunload', handleBeforeUnload);
          
          // 页面可见性变化时也保存
          const handleVisibilityChange = () => {
            if (document.hidden) {
              const state = get();
              saveGameState(state);
            }
          };
          
          document.addEventListener('visibilitychange', handleVisibilityChange);
        }
      },
      
      // 资源操作
      addResource: (resourceId: string, amount: number) => {
        set((state) => {
          const resource = state.resources[resourceId];
          if (!resource) return state;
          
          const newAmount = Math.min(
            resource.amount + amount,
            resource.maxStorage
          );
          
          return {
            ...state,
            resources: {
              ...state.resources,
              [resourceId]: {
                ...resource,
                amount: newAmount,
              },
            },
            statistics: {
              ...state.statistics,
              totalResourcesCollected: {
                ...state.statistics.totalResourcesCollected,
                [resourceId]: (state.statistics.totalResourcesCollected[resourceId] || 0) + amount,
              },
            },
          };
        });
      },
      
      subtractResource: (resourceId: string, amount: number) => {
        const state = get();
        const resource = state.resources[resourceId];
        
        if (!resource || resource.amount < amount) {
          return false;
        }
        
        set((state) => ({
          ...state,
          resources: {
            ...state.resources,
            [resourceId]: {
              ...resource,
              amount: resource.amount - amount,
            },
          },
        }));
        
        return true;
      },
      
      canAfford: (costs: Array<{ resourceId: string; amount: number }>) => {
        const state = get();
        return costs.every(cost => {
          const resource = state.resources[cost.resourceId];
          return resource && resource.amount >= cost.amount;
        });
      },
      
      manualCollectResource: (resourceId: string) => {
        const state = get();
        const resource = state.resources[resourceId];
        
        if (resource && resource.canManualCollect) {
          const collectAmount = Math.floor(Math.random() * 3) + 1; // 1-3随机收集
          get().addResource(resourceId, collectAmount);
        }
      },
      
      // 建筑操作
      buildBuilding: (buildingId: string) => {
        const state = get();
        const building = state.buildings[buildingId];
        
        if (!building) return false;
        
        // 检查是否可以建造
        if (building.maxCount && building.count >= building.maxCount) {
          return false;
        }
        
        // 检查资源是否足够
        if (!get().canAfford(building.cost)) {
          return false;
        }
        
        // 扣除资源
        building.cost.forEach(cost => {
          get().subtractResource(cost.resourceId, cost.amount);
        });
        
        // 增加建筑数量
        set((state) => ({
          ...state,
          buildings: {
            ...state.buildings,
            [buildingId]: {
              ...building,
              count: building.count + 1,
            },
          },
          statistics: {
            ...state.statistics,
            totalBuildingsBuilt: {
              ...state.statistics.totalBuildingsBuilt,
              [buildingId]: (state.statistics.totalBuildingsBuilt[buildingId] || 0) + 1,
            },
          },
        }));
        
        return true;
      },
      
      getBuildingCount: (buildingId: string) => {
        const state = get();
        return state.buildings[buildingId]?.count || 0;
      },
      
      // 科技操作
      startResearch: (technologyId: string) => {
        const state = get();
        const technology = state.technologies[technologyId];
        
        if (!technology || technology.isResearched || state.currentResearch) {
          return false;
        }
        
        // 检查前置条件
        // TODO: 实现需求检查逻辑
        // if (!checkRequirements(technology.unlockRequirements, state)) {
        //   return false;
        // }
        
        // 检查前置科技
        if (!technology.prerequisites.every(prereq => state.technologies[prereq]?.isResearched)) {
          return false;
        }
        
        // 检查资源
        if (!get().canAfford(technology.cost)) {
          return false;
        }
        
        // 扣除资源
        technology.cost.forEach(cost => {
          get().subtractResource(cost.resourceId, cost.amount);
        });
        
        set((state) => ({
          ...state,
          currentResearch: technologyId,
          technologies: {
            ...state.technologies,
            [technologyId]: {
              ...technology,
              isResearching: true,
              researchProgress: 0,
            },
          },
        }));
        
        return true;
      },
      
      completeResearch: (technologyId: string) => {
        set((state) => {
          const technology = state.technologies[technologyId];
          if (!technology) return state;
          
          return {
            ...state,
            currentResearch: null,
            technologies: {
              ...state.technologies,
              [technologyId]: {
                ...technology,
                isResearched: true,
                isResearching: false,
                researchProgress: technology.researchTime,
              },
            },
            statistics: {
              ...state.statistics,
              totalTechnologiesResearched: state.statistics.totalTechnologiesResearched + 1,
            },
          };
        });
      },
      
      // 人物操作
      unlockCharacter: (characterId: string) => {
        set((state) => ({
          ...state,
          characters: {
            ...state.characters,
            [characterId]: {
              ...state.characters[characterId],
              isUnlocked: true,
            },
          },
        }));
      },
      
      activateCharacter: (characterId: string) => {
        set((state) => ({
          ...state,
          characters: {
            ...state.characters,
            [characterId]: {
              ...state.characters[characterId],
              isActive: true,
            },
          },
        }));
      },
      
      deactivateCharacter: (characterId: string) => {
        set((state) => ({
          ...state,
          characters: {
            ...state.characters,
            [characterId]: {
              ...state.characters[characterId],
              isActive: false,
            },
          },
        }));
      },
      
      // 事件操作
      triggerEvent: (eventId: string) => {
        set((state) => ({
          ...state,
          activeEvents: [...state.activeEvents, eventId],
          events: {
            ...state.events,
            [eventId]: {
              ...state.events[eventId],
              lastTriggered: Date.now(),
            },
          },
          statistics: {
            ...state.statistics,
            totalEventsTriggered: state.statistics.totalEventsTriggered + 1,
          },
        }));
      },
      
      chooseEventOption: (eventId: string, choiceId: string) => {
        const state = get();
        const event = state.events[eventId];
        const choice = event?.choices.find(c => c.id === choiceId);
        
        if (!choice) return;
        
        // 应用选择效果
        // TODO: 实现事件效果应用逻辑
        // choice.effects.forEach(effect => {
        //   applyEventEffect(effect, set, get);
        // });
        
        // 移除活跃事件
        set((state) => ({
          ...state,
          activeEvents: state.activeEvents.filter(id => id !== eventId),
        }));
      },
      
      // 成就操作
      checkAchievements: () => {
        const state = get();
        Object.values(state.achievements).forEach(achievement => {
          // TODO: 实现成就需求检查逻辑
          // if (!achievement.isUnlocked && checkRequirements(achievement.requirements, state)) {
          //   get().unlockAchievement(achievement.id);
          // }
        });
      },
      
      unlockAchievement: (achievementId: string) => {
        set((state) => {
          const achievement = state.achievements[achievementId];
          if (!achievement || achievement.isUnlocked) return state;
          
          // 应用成就奖励
          // TODO: 实现成就奖励应用逻辑
          // achievement.rewards.forEach(reward => {
          //   applyAchievementReward(reward, set, get);
          // });
          
          return {
            ...state,
            achievements: {
              ...state.achievements,
              [achievementId]: {
                ...achievement,
                isUnlocked: true,
              },
            },
            statistics: {
              ...state.statistics,
              totalAchievementsUnlocked: state.statistics.totalAchievementsUnlocked + 1,
            },
          };
        });
      },
      
      // Buff操作
      addBuff: (buff: Buff) => {
        set((state) => ({
          ...state,
          buffs: {
            ...state.buffs,
            [buff.id]: buff,
          },
        }));
      },
      
      removeBuff: (buffId: string) => {
        set((state) => {
          const { [buffId]: removed, ...remainingBuffs } = state.buffs;
          return {
            ...state,
            buffs: remainingBuffs,
          };
        });
      },
      
      // 游戏更新
      updateGame: (deltaTime: number) => {
        const state = get();
        if (state.isPaused) return;
        
        const adjustedDeltaTime = deltaTime * state.gameSpeed;
        
        // 更新游戏引擎
        // TODO: 实现游戏更新逻辑
        // updateGameLogic(adjustedDeltaTime, set, get);
        
        // 更新统计数据
        set((state) => ({
          ...state,
          statistics: {
            ...state.statistics,
            totalPlayTime: state.statistics.totalPlayTime + deltaTime,
          },
          lastUpdateTime: Date.now(),
        }));
      },
      
      // 继承系统
      calculateInheritancePoints: () => {
        const state = get();
        // TODO: 实现继承点计算逻辑
        return 0; // 临时返回 0
      },
      
      rebirth: () => {
        const state = get();
        const inheritancePoints = get().calculateInheritancePoints();
        
        set(() => ({
          ...initialGameData,
          gameStartTime: Date.now(),
          lastUpdateTime: Date.now(),
          inheritancePoints: state.inheritancePoints + inheritancePoints,
          totalInheritancePoints: state.totalInheritancePoints + inheritancePoints,
          statistics: {
            totalPlayTime: 0,
            totalResourcesCollected: {},
            totalBuildingsBuilt: {},
            totalTechnologiesResearched: 0,
            totalEventsTriggered: 0,
            totalAchievementsUnlocked: 0,
            currentGeneration: state.statistics.currentGeneration + 1,
          },
        }));
      },
    }),
    {
      name: 'civilization-idle-game',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // 处理版本迁移，当前版本为1，直接返回状态
        return persistedState;
      },
      partialize: (state) => ({
        ...state,
        // 不保存这些临时状态
        isPaused: true,
      }),
    }
  )
);