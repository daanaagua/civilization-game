export type CapabilityId = string; // e.g. 'cap:scouting'
export type TagId = string;        // e.g. 'tag:housing'

export type RequirementToken = string; // 'cap:xxx' | 'tag:xxx' | future: 'tech:xxx' (但尽量用 cap)

export type RegistryKind = 'building' | 'tech' | 'unit' | 'event' | 'nation';

export interface BaseRegistryItem {
  id: string;
  name: string;
  description?: string;
  tags?: TagId[];
  requires?: RequirementToken[]; // 条件仅表达式，不含流程
}

export interface BuildingItem extends BaseRegistryItem {
  kind: 'building';
  // 仅数据，不含流程；具体产出、存储、费用等，可作为任意键保持数据化
  data?: Record<string, unknown>;
}

export interface TechItem extends BaseRegistryItem {
  kind: 'tech';
  grantsCapabilities?: CapabilityId[]; // 科技授予能力
  data?: Record<string, unknown>;
}

export interface UnitItem extends BaseRegistryItem {
  kind: 'unit';
  data?: Record<string, unknown>;
}

export interface EventItem extends BaseRegistryItem {
  kind: 'event';
  probability?: number;
  // 完全数据化的条件/效果
  payload?: Record<string, unknown>;
}

export interface NationItem extends BaseRegistryItem {
  kind: 'nation';
  data?: Record<string, unknown>;
}

export type AnyRegistryItem = BuildingItem | TechItem | UnitItem | EventItem | NationItem;

export interface RegistrySnapshot {
  buildings: Record<string, BuildingItem>;
  techs: Record<string, TechItem>;
  units: Record<string, UnitItem>;
  events: Record<string, EventItem>;
  nations: Record<string, NationItem>;
}

export interface RegistryAPI {
  registerBuilding: (item: BuildingItem) => void;
  registerTech: (item: TechItem) => void;
  registerUnit: (item: UnitItem) => void;
  registerEvent: (item: EventItem) => void;
  registerNation: (item: NationItem) => void;

  getBuilding: (id: string) => BuildingItem | undefined;
  getTech: (id: string) => TechItem | undefined;
  getUnit: (id: string) => UnitItem | undefined;
  getEvent: (id: string) => EventItem | undefined;
  getNation: (id: string) => NationItem | undefined;

  listBuildings: () => BuildingItem[];
  listTechs: () => TechItem[];
  listUnits: () => UnitItem[];
  listEvents: () => EventItem[];
  listNations: () => NationItem[];

  snapshot: () => Readonly<RegistrySnapshot>;
}