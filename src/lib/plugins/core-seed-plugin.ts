import type { Plugin } from './registry-adapter';
import type { BuildingItem, TechItem, UnitItem, EventItem, NationItem, RegistryAPI } from '../registry/types';

// 演示用的最小种子定义（仅数据，不含流程）
// 注意：不会自动注册，需显式调用 applyPluginRegistrations(registry, [createCoreSeedPlugin()])

const demoBuildings: BuildingItem[] = [
  // 使用项目中真实存在的建筑 id，且不添加 requires，避免被 tag/cap gating 拦住
  {
    kind: 'building',
    id: 'housing',
    name: '住房',
    tags: ['housing'],
    data: { note: 'demo seed' }
  },
  {
    kind: 'building',
    id: 'logging_camp',
    name: '伐木场',
    tags: ['production'],
    data: { note: 'demo seed' }
  },
  {
    kind: 'building',
    id: 'quarry',
    name: '采石场',
    tags: ['production'],
    data: { note: 'demo seed' }
  },
  {
    kind: 'building',
    id: 'farm',
    name: '农田',
    tags: ['production'],
    data: { note: 'demo seed' }
  }
];

const demoTechs: TechItem[] = [
  {
    kind: 'tech',
    id: 'scouting_tech',
    name: '探险术',
    grantsCapabilities: ['scouting'], // grantsCapabilities: 'scouting'，选择器层使用 'cap:scouting' 作为 requires
    data: { description: '解锁探索相关特性' }
  },
  {
    kind: 'tech',
    id: 'diplomat_training',
    name: '外交训练',
    grantsCapabilities: ['diplomacy'],
    data: { description: '解锁外交相关特性' }
  }
];

const demoUnits: UnitItem[] = [
  {
    kind: 'unit',
    id: 'scout',
    name: '斥候',
    requires: ['cap:scouting'],
    data: { isExplorer: true, explorationPointValue: 1 }
  }
];

const demoEvents: EventItem[] = [
  {
    kind: 'event',
    id: 'find_small_cache',
    name: '发现小型补给',
    probability: 0.1,
    requires: ['cap:scouting'],
    payload: {
      conditions: [{ type: 'tag', value: 'outdoor' }],
      effects: [{ kind: 'resources.add', payload: { food: 10 } }]
    }
  }
];

const demoNations: NationItem[] = [
  {
    kind: 'nation',
    id: 'tribe_alpha',
    name: '阿尔法部族',
    tags: ['neighbor'],
    data: { temperament: 'neutral' }
  }
];

export function createCoreSeedPlugin(): Plugin {
  return {
    register(api: RegistryAPI) {
      // 幂等注册：已存在则跳过，避免 duplicate id 报错
      demoBuildings.forEach(item => {
        if (!api.getBuilding?.(item.id)) api.registerBuilding(item);
      });
      demoTechs.forEach(item => {
        if (!api.getTech?.(item.id)) api.registerTech(item);
      });
      demoUnits.forEach(item => {
        if (!api.getUnit?.(item.id)) api.registerUnit(item);
      });
      demoEvents.forEach(item => {
        if (!api.getEvent?.(item.id)) api.registerEvent(item);
      });
      demoNations.forEach(item => {
        if (!api.getNation?.(item.id)) api.registerNation(item);
      });
    }
  };
}