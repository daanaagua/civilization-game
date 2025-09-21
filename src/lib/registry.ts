// Lightweight registry skeleton to enable future plug-in style extensions
// Non-invasive: not wired into existing systems yet.

export interface TechDef {
  id: string;
  name: string;
  description?: string;
  category?: string;
  prereqs?: string[];
  cost?: Record<string, number>;
  researchTimeDays?: number;
  grantsCapabilities?: string[]; // future capability system
}

export interface UnitDef {
  id: string;
  name: string;
  description?: string;
  requiredTech?: string;
  unlockCondition?: string; // alias to requiredTech
  isExplorer?: boolean;
  explorationPointValue?: number; // e.g., scout=1, adventurer=2
}

export interface BuildingDef {
  id: string;
  name: string;
  description?: string;
  category?: string;
  requiresTech?: string;
  cost?: Record<string, number>;
  buildTimeDays?: number;
}

type Dict<T> = Record<string, T>;

const techs: Dict<TechDef> = {};
const units: Dict<UnitDef> = {};
const buildings: Dict<BuildingDef> = {};

export function registerTech(def: TechDef) {
  techs[def.id] = def;
}

export function registerUnit(def: UnitDef) {
  units[def.id] = def;
}

export function registerBuilding(def: BuildingDef) {
  buildings[def.id] = def;
}

export function getTech(id: string): TechDef | undefined { return techs[id]; }
export function getUnit(id: string): UnitDef | undefined { return units[id]; }
export function getBuilding(id: string): BuildingDef | undefined { return buildings[id]; }

export function listTechs(): TechDef[] { return Object.values(techs); }
export function listUnits(): UnitDef[] { return Object.values(units); }
export function listBuildings(): BuildingDef[] { return Object.values(buildings); }

// No side effects here: wiring/migrations will be done incrementally later.