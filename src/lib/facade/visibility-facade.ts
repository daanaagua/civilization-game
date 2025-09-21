import { registry } from '../registry/index';
import { getVisibleBuildings, getVisibleTechs, getVisibleUnits } from '../selectors/index';
import { buildCapsFromOwnedTechIds } from '../selectors/index';
import type { CapabilityId } from '../capabilities';
import type { BuildingItem, TechItem, UnitItem } from '../registry/types';

export interface VisibilityInput {
  ownedTechIds: string[] | Set<string>;
  stateTags?: Set<string>;
}

export interface VisibilityOutput {
  capabilities: Set<CapabilityId>;
  buildings: BuildingItem[];
  techs: TechItem[];
  units: UnitItem[];
}

export function getVisibleFromRegistry(input: VisibilityInput): VisibilityOutput {
  const { ownedTechIds, stateTags } = input;

  // 显式使用我们注册中心的类型以避免旧模块干扰
  const techs: TechItem[] = registry.listTechs();
  const buildingsList: BuildingItem[] = registry.listBuildings();
  const unitsList: UnitItem[] = registry.listUnits();

  const caps = buildCapsFromOwnedTechIds(ownedTechIds, techs);

  const buildings = getVisibleBuildings({
    registryBuildings: buildingsList,
    capabilities: caps,
    stateTags,
    ownedTechIds: ownedTechIds instanceof Set ? ownedTechIds : new Set(Array.isArray(ownedTechIds) ? ownedTechIds : [])
  });

  const techList = getVisibleTechs({
    registryTechs: techs,
    capabilities: caps,
    stateTags,
    ownedTechIds: ownedTechIds instanceof Set ? ownedTechIds : new Set(Array.isArray(ownedTechIds) ? ownedTechIds : [])
  });

  const units = getVisibleUnits({
    registryUnits: unitsList,
    capabilities: caps,
    stateTags,
    ownedTechIds: ownedTechIds instanceof Set ? ownedTechIds : new Set(Array.isArray(ownedTechIds) ? ownedTechIds : [])
  });

  return {
    capabilities: caps,
    buildings,
    techs: techList,
    units
  };
}