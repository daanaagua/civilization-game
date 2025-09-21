import { BuildingItem, TechItem, UnitItem, EventItem, NationItem, RegistryAPI, RegistrySnapshot } from './types';

const buildings: Record<string, BuildingItem> = Object.create(null);
const techs: Record<string, TechItem> = Object.create(null);
const units: Record<string, UnitItem> = Object.create(null);
const events: Record<string, EventItem> = Object.create(null);
const nations: Record<string, NationItem> = Object.create(null);

function ensureIdUnique<T extends { id: string }>(bucket: Record<string, T>, item: T, kind: string) {
  if (!item.id) throw new Error(`[registry] ${kind} missing id`);
  if (bucket[item.id]) throw new Error(`[registry] duplicate ${kind} id: ${item.id}`);
}

export const registry: RegistryAPI = {
  registerBuilding: (item) => {
    ensureIdUnique(buildings, item, 'building');
    buildings[item.id] = Object.freeze({ ...item });
  },
  registerTech: (item) => {
    ensureIdUnique(techs, item, 'tech');
    techs[item.id] = Object.freeze({ ...item });
  },
  registerUnit: (item) => {
    ensureIdUnique(units, item, 'unit');
    units[item.id] = Object.freeze({ ...item });
  },
  registerEvent: (item) => {
    ensureIdUnique(events, item, 'event');
    events[item.id] = Object.freeze({ ...item });
  },
  registerNation: (item) => {
    ensureIdUnique(nations, item, 'nation');
    nations[item.id] = Object.freeze({ ...item });
  },

  getBuilding: (id) => buildings[id],
  getTech: (id) => techs[id],
  getUnit: (id) => units[id],
  getEvent: (id) => events[id],
  getNation: (id) => nations[id],

  listBuildings: () => Object.values(buildings),
  listTechs: () => Object.values(techs),
  listUnits: () => Object.values(units),
  listEvents: () => Object.values(events),
  listNations: () => Object.values(nations),

  snapshot: () => {
    const snap: RegistrySnapshot = {
      buildings: { ...buildings },
      techs: { ...techs },
      units: { ...units },
      events: { ...events },
      nations: { ...nations }
    };
    return Object.freeze(snap);
  }
};

// 只读导出，禁止外部直接改写内部容器
Object.freeze(registry);