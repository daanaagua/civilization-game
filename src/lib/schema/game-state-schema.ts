/**
 * 轻量 schema 与版本迁移
 * - 为避免引入新依赖（zod），使用最小校验与默认值填充
 * - 保留 version 与 migrations 接口
 */

export interface GameStateV {
  version: number;
  resources?: Record<string, number>;
  stability?: number;
  corruption?: number;
  exploration?: {
    discoveredLocations?: {
      dungeons?: any[];
      countries?: any[];
      events?: any[];
    };
    explorationHistory?: any[];
    // 向后兼容：允许不存在 explorationPoints
    explorationPoints?: number;
  };
  diplomacy?: {
    relationships?: Record<string, any>;
    tradeHistory?: any[];
    giftHistory?: any[];
    discoveredCountries?: any[];
  };
  // 其他字段以宽松 any 形式存在，避免与现有类型强绑定
  [key: string]: any;
}

export type Migration = (state: GameStateV) => GameStateV;

export const DEFAULTS: Required<Pick<GameStateV, 'resources' | 'stability' | 'corruption' | 'exploration' | 'diplomacy'>> = {
  resources: {},
  stability: 0,
  corruption: 0,
  exploration: {
    discoveredLocations: { dungeons: [], countries: [], events: [] },
    explorationHistory: [],
    explorationPoints: 0
  },
  diplomacy: {
    relationships: {},
    tradeHistory: [],
    giftHistory: [],
    discoveredCountries: []
  }
};

export function fillDefaults(s: GameStateV): GameStateV {
  const out: GameStateV = { ...s };
  if (!out.resources) out.resources = {};
  if (typeof out.stability !== 'number') out.stability = 0;
  if (typeof out.corruption !== 'number') out.corruption = 0;
  if (!out.exploration) out.exploration = { ...DEFAULTS.exploration };
  else {
    out.exploration.discoveredLocations = out.exploration.discoveredLocations || { dungeons: [], countries: [], events: [] };
    out.exploration.explorationHistory = out.exploration.explorationHistory || [];
    if (typeof out.exploration.explorationPoints !== 'number') out.exploration.explorationPoints = 0;
  }
  if (!out.diplomacy) out.diplomacy = { ...DEFAULTS.diplomacy };
  else {
    out.diplomacy.relationships = out.diplomacy.relationships || {};
    out.diplomacy.tradeHistory = out.diplomacy.tradeHistory || [];
    out.diplomacy.giftHistory = out.diplomacy.giftHistory || [];
    out.diplomacy.discoveredCountries = out.diplomacy.discoveredCountries || [];
  }
  return out;
}

export function validateAndMigrate(input: any, currentVersion: number, migrations: Migration[]): GameStateV {
  const raw: GameStateV = typeof input === 'object' && input ? input : { version: currentVersion };
  let state = fillDefaults({ ...raw, version: raw.version ?? currentVersion });

  // 顺序执行迁移（若存档版本落后）
  const from = Number(state.version ?? 0);
  if (Number.isFinite(from) && from < currentVersion) {
    for (let v = from; v < currentVersion; v++) {
      const m = migrations[v];
      if (typeof m === 'function') {
        state = m(state);
        state.version = v + 1;
      }
    }
  }

  // 最终对齐版本
  state.version = currentVersion;
  return state;
}