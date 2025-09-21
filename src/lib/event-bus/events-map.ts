import { EventBus, type DefaultEventMap } from './index';

// 可扩展事件映射：不修改默认总线，提供工厂以自定义事件类型
export interface ExtendedEventMap extends DefaultEventMap {
  'Exploration.PointsGained': { amount: number; at: number; reason?: string };
  'Diplomacy.RelationshipChanged': { nationId: string; delta: number; at: number };
  'Building.Built': { buildingId: string; at: number };
  'Event.Fired': { eventId: string; at: number; context?: any };
}

export function createExtendedEventBus() {
  return new EventBus<ExtendedEventMap>();
}