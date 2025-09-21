// Events slice - 只读接口 + 安全选择器（不侵入 store）
export interface ActiveEventLite {
  id: string;
  name?: string;
  type?: string;
  triggeredAt?: number;
  payload?: any;
}

export interface EventsState {
  activeEvents?: ActiveEventLite[];
  history?: any[];
}

export interface EventsSelectors {
  getActiveEvents: () => ActiveEventLite[];
  getHistory: () => any[];
}

export function createEventsSelectors(stateProvider: () => { events?: EventsState }): EventsSelectors {
  const safe = () => stateProvider().events ?? { activeEvents: [], history: [] };
  return {
    getActiveEvents: () => safe().activeEvents ?? [],
    getHistory: () => safe().history ?? []
  };
}