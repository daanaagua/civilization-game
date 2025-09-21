// Centralized selectors for gating and visibility
// These utilities avoid touching game-store types and keep UI logic consistent.

import { MilitaryUnit } from '../types/military';

export type AnyGameState = any;

// Build researched tech set from the flexible gameState shape
export function getResearchedSet(gameState: AnyGameState): Set<string> {
  const techs = (gameState?.technologies) || {};
  const set = new Set<string>();
  Object.entries(techs).forEach(([id, t]: any) => {
    if (t && (t.researched === true || t.unlocked === true)) {
      set.add(id);
    }
  });
  return set;
}

export function isTechResearched(gameState: AnyGameState, techId: string): boolean {
  return getResearchedSet(gameState).has(techId);
}

// Minimal unit visibility based on requiredTech present on unitType (from getUnitType)
export function getVisibleUnits(gameState: AnyGameState, getUnitType: (id: string) => any): MilitaryUnit[] {
  const researched = getResearchedSet(gameState);
  const units: MilitaryUnit[] = gameState?.military?.units || [];
  return units.filter(u => {
    const def = getUnitType(u.typeId || u.id);
    const req = def?.unlockCondition || def?.requiredTech;
    if (!req) return true;
    return researched.has(req);
  });
}

// Buildings visibility (placeholder: if buildingDef.requiresTech exists, check it)
export function getVisibleBuildings<T extends { id: string; requiresTech?: string }>(
  gameState: AnyGameState,
  allBuildings: T[]
): T[] {
  const researched = getResearchedSet(gameState);
  return allBuildings.filter(b => !b.requiresTech || researched.has(b.requiresTech));
}

// Technologies visibility: simple filter if a technology has prereqs
export function getVisibleTechs<T extends { id: string; prereqs?: string[] }>(
  allTechs: T[],
  researchedSet: Set<string>
): T[] {
  return allTechs.filter(t => !t.prereqs || t.prereqs.every(p => researchedSet.has(p)));
}

/**
 * Exploration points helpers
 * - If unitType.explorationPointValue exists, use it
 * - Else if unitType.isExplorer is true, default 1
 * - Special-case: adventurer id gives 2, scout gives 1 (backward compatibility)
 */
export function getExplorationPointValue(getUnitType: (id: string) => any, unitTypeId: string): number {
  const def = getUnitType(unitTypeId);
  if (def?.explorationPointValue != null) return Number(def.explorationPointValue) || 0;
  if (def?.isExplorer) {
    if (def.id === 'adventurer') return 2;
    if (def.id === 'scout') return 1;
    return 1;
  }
  // fallback for unknown explorers
  if (unitTypeId === 'adventurer') return 2;
  if (unitTypeId === 'scout') return 1;
  return 0;
}

// Compute total available exploration points from units minus local ongoing mission costs
export function computeExplorationPoints(
  gameState: AnyGameState,
  getUnitType: (id: string) => any,
  ongoingMissions: { id: string; cost: number }[]
): number {
  const units: MilitaryUnit[] = gameState?.military?.units || [];
  const total = units.reduce((sum, u: any) => {
    const typeId = u.typeId || u.id;
    const per = getExplorationPointValue(getUnitType, typeId);
    return sum + per * (u.count || 0);
  }, 0);
  const used = (ongoingMissions || []).reduce((s, m) => s + (m.cost || 1), 0);
  return Math.max(0, total - used);
}