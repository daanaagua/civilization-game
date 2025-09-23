import { EffectDescriptor, GameStateLike } from './types';

// 最小可用效果应用器；可在后续扩展或替换
export function applyEffectsToGameState(state: GameStateLike, effects: EffectDescriptor[]) {
  if (!effects || effects.length === 0) return;
  for (const eff of effects) {
    switch (eff.type) {
      case 'resource_delta': {
        if (!eff.target) break;
        const curr = Number(state.resources?.[eff.target] ?? 0);
        if (!state.resources) state.resources = {};
        state.resources[eff.target] = Math.max(0, curr + Number(eff.value ?? 0));
        break;
      }
      case 'stability_delta': {
        const curr = Number(state.stability ?? 0);
        const v = curr + Number(eff.value ?? 0);
        state.stability = Math.max(0, Math.min(100, v));
        break;
      }
      default:
        break;
    }
  }
}