import type { TechItem } from '../registry/types';
import { buildCapabilities, type TechMap, type CapabilityId } from '../capabilities/capabilities';

export function makeTechMapFromRegistry(techs: TechItem[]): TechMap {
  const map: TechMap = {};
  for (const t of techs) {
    map[t.id] = { id: t.id, grantsCapabilities: t.grantsCapabilities };
  }
  return map;
}

export function buildCapsFromOwnedTechIds(ownedTechIds: string[] | Set<string>, registryTechs: TechItem[]): Set<CapabilityId> {
  const techMap = makeTechMapFromRegistry(registryTechs);
  return buildCapabilities(ownedTechIds, techMap);
}