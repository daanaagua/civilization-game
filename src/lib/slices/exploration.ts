// Exploration slice - 只读接口 + 安全选择器（不侵入 store）
export interface DiscoveredLocation {
  id: string;
  name?: string;
  data?: any;
}

export interface ExplorationState {
  discoveredLocations: {
    dungeons: DiscoveredLocation[];
    countries: DiscoveredLocation[];
    events: DiscoveredLocation[];
  };
  explorationHistory: any[];
  explorationPoints?: number; // 历史可能不存在
}

export interface ExplorationSelectors {
  getHistory: () => any[];
  getPoints: () => number;
  getDungeons: () => DiscoveredLocation[];
  getCountries: () => DiscoveredLocation[];
  getEventPlaces: () => DiscoveredLocation[];
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
    getEventPlaces: () => safe().discoveredLocations?.events ?? []
  };
}