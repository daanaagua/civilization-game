export {
  getVisibleBuildings,
  getVisibleTechs,
  getVisibleUnits,
  satisfiesRequires
} from './visibility';
export { buildCapsFromOwnedTechIds, makeTechMapFromRegistry } from './cap-helpers';
export { hasCapability } from '../capabilities';

/**
 * 统一获取“已研究科技”ID集合（兼容历史结构）
 * - 支持 state.gameState.technologies 和 state.technologies 两种位置
 * - 支持 state[.gameState].researchedTechIds 作为补充来源
 */
export function getResearchedSet(state: any): Set<string> {
  const gs = state?.gameState ?? state ?? {};
  const techRecord = (gs.technologies ?? {}) as Record<string, any>;
  const researchedFromRecord = Object.entries(techRecord)
    .filter(([, t]) => t && t.researched)
    .map(([id]) => id);

  const researchedList =
    Array.isArray(gs.researchedTechIds) ? (gs.researchedTechIds as string[]) : [];

  return new Set<string>([...researchedFromRecord, ...researchedList]);
}