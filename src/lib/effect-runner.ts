/**
 * 统一事件效果应用器（最小实现）
 * 兼容两类效果格式：
 * - { type: 'resource', target: 'food', value: +10 }
 * - { type: 'resource_change', target: 'food', value: +10 }
 * - { type: 'stability' | 'stability_change', value: +/-number }
 * - { type: 'corruption' | 'corruption_change', value: +/-number }
 */
export type BasicEffect =
  | { type: 'resource' | 'resource_change'; target: string; value: number }
  | { type: 'stability' | 'stability_change'; value: number }
  | { type: 'corruption' | 'corruption_change'; value: number }
  | Record<string, any>; // 宽松兜底：忽略未知类型

type GameStateLike = {
  resources: Record<string, number>;
  stability: number;
  corruption: number;
  resourceLimits?: Record<string, number>;
};

export function applyEffectsToState(state: GameStateLike, effects: BasicEffect[] = []): GameStateLike {
  // 浅拷贝，避免原地修改
  const next: GameStateLike = {
    ...state,
    resources: { ...state.resources },
    stability: state.stability,
    corruption: state.corruption,
    resourceLimits: state.resourceLimits ? { ...state.resourceLimits } : state.resourceLimits
  };

  for (const eff of effects || []) {
    const t = String((eff as any)?.type || '').toLowerCase();
    if (t === 'resource' || t === 'resource_change') {
      const target = (eff as any)?.target;
      const value = Number((eff as any)?.value || 0);
      if (target && typeof next.resources[target] === 'number') {
        const limit = next.resourceLimits && typeof next.resourceLimits[target] === 'number'
          ? next.resourceLimits[target]
          : undefined;
        const after = next.resources[target] + value;
        next.resources[target] = Math.max(0, typeof limit === 'number' ? Math.min(limit, after) : after);
      }
      continue;
    }
    if (t === 'stability' || t === 'stability_change') {
      const value = Number((eff as any)?.value || 0);
      next.stability = Math.max(0, Math.min(100, next.stability + value));
      continue;
    }
    if (t === 'corruption' || t === 'corruption_change') {
      const value = Number((eff as any)?.value || 0);
      next.corruption = Math.max(0, Math.min(100, next.corruption + value));
      continue;
    }
    // 其他类型暂忽略（可在此扩展：军队、探索、Buff 等）
  }

  return next;
}