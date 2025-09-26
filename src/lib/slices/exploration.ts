// Exploration slice - 只读接口 + 安全选择器（不侵入 store）
export interface DiscoveredLocation {
  id: string;
  name?: string;
  data?: any;
}

export interface AdventureNodeLite {
  id: string;
  order: number;
  kind: 'minor' | 'final';
  etaDay: number;
  resolved?: boolean;
}

export interface AdventureRunLite {
  id: string;
  totalSP: number;
  currentSP: number;
  startedAtDay: number;
  nodes: AdventureNodeLite[];
  finished?: boolean;
}

export interface ExplorationState {
  discoveredLocations: {
    dungeons: DiscoveredLocation[];
    countries: DiscoveredLocation[];
    events: DiscoveredLocation[];
  };
  explorationHistory: any[];
  explorationPoints?: number; // 历史可能不存在
  activeAdventureRun?: AdventureRunLite | null; // 新增：当前一次冒险运行态
}

export interface ExplorationSelectors {
  getHistory: () => any[];
  getPoints: () => number;
  getDungeons: () => DiscoveredLocation[];
  getCountries: () => DiscoveredLocation[];
  getEventPlaces: () => DiscoveredLocation[];
  getActiveAdventure: () => AdventureRunLite | null;
  getAdventureProgress: () => { totalNodes: number; resolved: number; finalEta?: number } | null;
}

export function createExplorationSelectors(stateProvider: () => { exploration?: ExplorationState }): ExplorationSelectors {
  const safe = () => stateProvider().exploration ?? {
    discoveredLocations: { dungeons: [], countries: [], events: [] },
    explorationHistory: [],
    explorationPoints: 0
  };

  return {
    getHistory: () => safe().explorationHistory ?? [],
    getPoints: () => Number(safe().explorationPoints ?? 0),
    getDungeons: () => safe().discoveredLocations?.dungeons ?? [],
    getCountries: () => safe().discoveredLocations?.countries ?? [],
    getEventPlaces: () => safe().discoveredLocations?.events ?? [],
    getActiveAdventure: () => {
      const ex: any = safe();
      return ex.adventureV2 ?? ex.activeAdventureRun ?? null;
    },
    getAdventureProgress: () => {
      const ex: any = safe();
      const run = ex.adventureV2 ?? ex.activeAdventureRun;
      if (!run) return null;
      const totalNodes = run.nodes?.length ?? 0;
      const resolved = run.nodes?.filter((n: any) => n?.resolved)?.length ?? 0;
      const finalEta = run.nodes?.find((n: any) => n?.kind === 'final')?.etaDay;
      return { totalNodes, resolved, finalEta };
    }
  };
}