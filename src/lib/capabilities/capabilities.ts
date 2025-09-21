export type CapabilityId = string; // 'cap:scouting' 等

export interface MinimalTechDef {
  id: string;
  grantsCapabilities?: CapabilityId[];
}

export type TechMap = Record<string, MinimalTechDef>;

export function buildCapabilities(ownedTechIds: string[] | Set<string>, techs: TechMap): Set<CapabilityId> {
  const caps = new Set<CapabilityId>();
  const has = (id: string) => (ownedTechIds instanceof Set ? ownedTechIds.has(id) : ownedTechIds.includes(id));
  for (const id in techs) {
    if (has(id)) {
      const g = techs[id]?.grantsCapabilities;
      if (Array.isArray(g)) g.forEach((c) => caps.add(c));
    }
  }
  return caps;
}

export function hasCapability(caps: Set<CapabilityId>, cap: CapabilityId): boolean {
  return caps.has(cap);
}

// 可选：从状态中派生（保持无侵入，参数形状由调用方提供）
export function getCapabilitiesFromState<S>(
  state: S,
  opts: {
    selectOwnedTechIds: (s: S) => string[] | Set<string>;
    selectTechMap: (s: S) => TechMap;
  }
): Set<CapabilityId> {
  const owned = opts.selectOwnedTechIds(state);
  const techs = opts.selectTechMap(state);
  return buildCapabilities(owned, techs);
}