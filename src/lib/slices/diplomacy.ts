// Diplomacy slice - 只读接口 + 安全选择器（不侵入 store）
export interface Relationship {
  attitude?: string;
  value?: number;
  [k: string]: any;
}

export interface DiplomacyState {
  relationships: Record<string, Relationship>;
  tradeHistory: any[];
  giftHistory: any[];
  discoveredCountries: any[];
  raidEvents?: any[];
}

export interface DiplomacySelectors {
  getRelationship: (nationId: string) => Relationship | undefined;
  listRelationships: () => Array<{ nationId: string; rel: Relationship }>;
  getTradeHistory: () => any[];
  getGiftHistory: () => any[];
  getDiscoveredCountries: () => any[];
}

export function createDiplomacySelectors(stateProvider: () => { diplomacy?: DiplomacyState }): DiplomacySelectors {
  const safe = () => stateProvider().diplomacy ?? {
    relationships: {},
    tradeHistory: [],
    giftHistory: [],
    discoveredCountries: [],
    raidEvents: []
  };

  return {
    getRelationship: (nationId: string) => safe().relationships?.[nationId],
    listRelationships: () => Object.entries(safe().relationships ?? {}).map(([nationId, rel]) => ({ nationId, rel })),
    getTradeHistory: () => safe().tradeHistory ?? [],
    getGiftHistory: () => safe().giftHistory ?? [],
    getDiscoveredCountries: () => safe().discoveredCountries ?? []
  };
}