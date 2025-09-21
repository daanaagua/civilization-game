import { registry } from './index';
import { z } from 'zod';
import {
  BuildingItemSchema,
  TechItemSchema,
  UnitItemSchema,
  EventItemSchema,
  NationItemSchema,
  type BuildingItemInput,
  type TechItemInput,
  type UnitItemInput,
  type EventItemInput,
  type NationItemInput
} from './schemas';

// 轻量标准化：去除重复标签、去除空 requires
function normalizeArray(arr?: string[]) {
  if (!arr || arr.length === 0) return undefined;
  const s = new Set(arr.filter(Boolean));
  return s.size ? Array.from(s) : undefined;
}

function normalizeBase<T extends { tags?: string[]; requires?: string[] }>(item: T): T {
  return {
    ...item,
    tags: normalizeArray(item.tags),
    requires: normalizeArray(item.requires)
  };
}

export function safeRegisterBuilding(item: BuildingItemInput) {
  const parsed = BuildingItemSchema.parse(normalizeBase(item));
  registry.registerBuilding(parsed);
}

export function safeRegisterTech(item: TechItemInput) {
  const parsed = TechItemSchema.parse(normalizeBase(item));
  registry.registerTech(parsed);
}

export function safeRegisterUnit(item: UnitItemInput) {
  const parsed = UnitItemSchema.parse(normalizeBase(item));
  registry.registerUnit(parsed);
}

export function safeRegisterEvent(item: EventItemInput) {
  const parsed = EventItemSchema.parse(normalizeBase(item));
  registry.registerEvent(parsed);
}

export function safeRegisterNation(item: NationItemInput) {
  const parsed = NationItemSchema.parse(normalizeBase(item));
  registry.registerNation(parsed);
}

// 批量注册（遇错不中断）
export function safeBatchRegister({
  buildings = [],
  techs = [],
  units = [],
  events = [],
  nations = []
}: {
  buildings?: BuildingItemInput[];
  techs?: TechItemInput[];
  units?: UnitItemInput[];
  events?: EventItemInput[];
  nations?: NationItemInput[];
}) {
  for (const b of buildings) {
    try { safeRegisterBuilding(b); } catch (e) { console.warn('[registry] building invalid:', b?.id, e); }
  }
  for (const t of techs) {
    try { safeRegisterTech(t); } catch (e) { console.warn('[registry] tech invalid:', t?.id, e); }
  }
  for (const u of units) {
    try { safeRegisterUnit(u); } catch (e) { console.warn('[registry] unit invalid:', u?.id, e); }
  }
  for (const ev of events) {
    try { safeRegisterEvent(ev); } catch (e) { console.warn('[registry] event invalid:', ev?.id, e); }
  }
  for (const n of nations) {
    try { safeRegisterNation(n); } catch (e) { console.warn('[registry] nation invalid:', n?.id, e); }
  }
}