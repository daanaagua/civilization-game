/**
 * 轻量 Typed EventBus
 * - 无外部依赖
 * - on/off/emit
 */

export type Handler<P = any> = (payload: P) => void;

export interface DefaultEventMap {
  'ExploreStarted': { partyId: string; at: number };
  'ExploreEnded': { partyId: string; at: number; result: any };
  'FoundNation': { nationId: string; at: number };
  'TriggeredEvent': { eventId: string; at: number; context?: any };
}

export class EventBus<M extends Record<string, any> = DefaultEventMap> {
  private handlers: { [K in keyof M]?: Handler<M[K]>[] } = {};

  on<K extends keyof M>(type: K, handler: Handler<M[K]>): () => void {
    const list = (this.handlers[type] ||= []);
    list.push(handler);
    return () => this.off(type, handler);
  }

  off<K extends keyof M>(type: K, handler: Handler<M[K]>): void {
    const list = this.handlers[type];
    if (!list) return;
    const idx = list.indexOf(handler);
    if (idx >= 0) list.splice(idx, 1);
  }

  emit<K extends keyof M>(type: K, payload: M[K]): void {
    const list = this.handlers[type];
    if (!list) return;
    // 复制一份，避免回调里增删影响当前派发
    [...list].forEach((h) => h(payload));
  }

  clearAll(): void {
    (Object.keys(this.handlers) as (keyof M)[]).forEach((k) => delete this.handlers[k]);
  }
}

// 单例总线（可选）
export const GlobalEventBus = new EventBus<DefaultEventMap>();