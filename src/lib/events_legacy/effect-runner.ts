/**
 * 数据化 Effect 执行器
 * - 内置最小集
 * - 支持注册自定义处理器
 */

export type Effect = {
  kind: string;         // 如 'resources.add' | 'stability.add' | 'capability.grant' 等
  payload?: any;        // 完全数据化
};

export interface EffectContext {
  // 由调用方提供的最小写入接口，避免耦合到具体 store
  mutate: (fn: (draft: any) => void) => void;
  emit?: (type: string, payload: any) => void;
  hasCapability?: (capId: string) => boolean;
}

type EffectHandler = (ctx: EffectContext, effect: Effect) => void;

const handlers: Record<string, EffectHandler> = Object.create(null);

// 内置示例：资源增减（调用方需在 mutate 中实现 resources 写入）
registerEffect('resources.add', (ctx, eff) => {
  const bundle = (eff.payload || {}) as Record<string, number>;
  ctx.mutate((draft) => {
    draft.resources = draft.resources || {};
    for (const k of Object.keys(bundle)) {
      const delta = Number(bundle[k] ?? 0);
      const cur = Number(draft.resources[k] ?? 0);
      draft.resources[k] = Math.max(0, cur + delta);
    }
  });
});

 // 内置示例：稳定度增减
registerEffect('stability.add', (ctx, eff) => {
  const delta = Number(eff.payload ?? 0);
  ctx.mutate((draft) => {
    draft.stability = Number(draft.stability ?? 0) + delta;
  });
});

// 内置示例：腐败度增减
registerEffect('corruption.add', (ctx, eff) => {
  const delta = Number(eff.payload ?? 0);
  ctx.mutate((draft) => {
    const cur = Number(draft.corruption ?? 0);
    draft.corruption = Math.max(0, cur + delta);
  });
});

export function registerEffect(kind: string, handler: EffectHandler) {
  if (!kind) throw new Error('[effect-runner] kind required');
  handlers[kind] = handler;
}

export function runEffects(ctx: EffectContext, effects: Effect[] | undefined) {
  if (!effects || effects.length === 0) return;
  for (const eff of effects) {
    const fn = handlers[eff.kind];
    if (fn) fn(ctx, eff);
  }
}