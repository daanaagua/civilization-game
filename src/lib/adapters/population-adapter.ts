import type { PopulationProvider } from '../slices/population';

// 针对现有 GameStore 结构的零侵入适配器（只读）
// 约定：
// - current: state.gameState.resources.population
// - cap:     state.gameState.resourceLimits.housing（若无则回退 state.gameState.resourceLimits.population）
// - assigned: 汇总 state.gameState.buildings[*].assignedWorkers（缺失视为 0）
export function makeGameStorePopulationProvider<S = any>(): PopulationProvider<S> {
  const safeGet = (obj: any, path: string[], fallback?: any) => {
    let cur = obj;
    for (const key of path) {
      if (cur == null) return fallback;
      cur = cur[key];
    }
    return cur ?? fallback;
  };

  return {
    selectCurrent: (state: S) => {
      return Number(safeGet(state, ['gameState', 'resources', 'population'], 0));
    },
    selectCap: (state: S) => {
      const explicitCap = Number(safeGet(state, ['gameState', 'resourceLimits', 'population'], 0));
      const housingProvided = Number(safeGet(state, ['gameState', 'resources', 'housing'], 0));
      if (Number.isFinite(explicitCap) && explicitCap > 0) {
        return Math.max(1, explicitCap);
      }
      return Math.max(1, (Number.isFinite(housingProvided) ? housingProvided : 0) + 1);
    },
    selectAssigned: (state: S) => {
      const buildings = safeGet(state, ['gameState', 'buildings'], {});
      if (!buildings || typeof buildings !== 'object') return 0;
      const values: any[] = Object.values(buildings as Record<string, any>);
      let sum = 0;
      for (const b of values) {
        const v = Number(b?.assignedWorkers ?? 0);
        if (Number.isFinite(v) && v > 0) sum += v;
      }
      return sum;
    }
  };
}