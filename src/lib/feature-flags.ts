export const FEATURE_FLAGS = {
  modules: {
    exploration: true,
    diplomacy: true,
    military: true,
    characters: true,
    events: true,
    registry: true
  },
  test: {
    giftScoutsAndScouting: true
  }
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;

// 测试开关持久化（localStorage）：自动研究侦察学 + 赠送3斥候
const TEST_FLAG_KEY = 'feature:test:giftScoutsAndScouting';

export function isTestScoutingEnabled(): boolean {
  try {
    if (typeof window !== 'undefined') {
      const v = localStorage.getItem(TEST_FLAG_KEY);
      if (v === 'true') return true;
      if (v === 'false') return false;
    }
  } catch {}
  // 默认取 FEATURE_FLAGS 中的默认值
  return FEATURE_FLAGS.test.giftScoutsAndScouting;
}

export function setTestScoutingEnabled(enabled: boolean) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TEST_FLAG_KEY, enabled ? 'true' : 'false');
    }
  } catch {}
}