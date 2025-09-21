import type { CapabilityId } from '../capabilities/capabilities';
import type { BuildingItem, TechItem, UnitItem } from '../registry/types';

type RequirementToken = string; // 'cap:xxx' | 'tag:xxx' | 'tech:xxx'

function parseRequirement(token: RequirementToken): { kind: 'cap' | 'tag' | 'tech'; value: string } | null {
  if (token.startsWith('cap:')) return { kind: 'cap', value: token.slice(4) };
  if (token.startsWith('tag:')) return { kind: 'tag', value: token.slice(4) };
  if (token.startsWith('tech:')) return { kind: 'tech', value: token.slice(5) };
  return null;
}

export function satisfiesRequires(
  requires: RequirementToken[] | undefined,
  caps: Set<CapabilityId>,
  tags: Set<string> = new Set(),
  ownedTechIds?: Set<string>
): boolean {
  if (!requires || requires.length === 0) return true;
  for (const tk of requires) {
    const parsed = parseRequirement(tk);
    if (!parsed) continue; // 未知前缀，忽略（或将来扩展）
    if (parsed.kind === 'cap' && !caps.has(parsed.value)) return false;
    if (parsed.kind === 'tag' && !tags.has(parsed.value)) return false;
    if (parsed.kind === 'tech') {
      if (!ownedTechIds || !ownedTechIds.has(parsed.value)) return false;
    }
  }
  return true;
}

export function getVisibleBuildings(params: {
  registryBuildings: BuildingItem[];
  capabilities: Set<CapabilityId>;
  stateTags?: Set<string>;
  ownedTechIds?: Set<string>;
}) {
  const { registryBuildings, capabilities, stateTags, ownedTechIds } = params;
  return registryBuildings.filter((b) => satisfiesRequires(b.requires, capabilities, stateTags, ownedTechIds));
}

export function getVisibleTechs(params: {
  registryTechs: TechItem[];
  capabilities: Set<CapabilityId>;
  stateTags?: Set<string>;
  ownedTechIds?: Set<string>;
}) {
  const { registryTechs, capabilities, stateTags, ownedTechIds } = params;
  // 科技本身也可有 requires，用以显示 gating（例如“先有某前置能力/标签/科技”）
  return registryTechs.filter((t) => satisfiesRequires(t.requires, capabilities, stateTags, ownedTechIds));
}

export function getVisibleUnits(params: {
  registryUnits: UnitItem[];
  capabilities: Set<CapabilityId>;
  stateTags?: Set<string>;
  ownedTechIds?: Set<string>;
}) {
  const { registryUnits, capabilities, stateTags, ownedTechIds } = params;
  return registryUnits.filter((u) => satisfiesRequires(u.requires, capabilities, stateTags, ownedTechIds));
}