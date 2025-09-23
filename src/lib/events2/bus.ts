// 轻量级事件总线

type Handler<T> = (payload: T) => void;

export class EventBus {
  private handlers: Record<string, Set<Handler<any>>> = {};

  on<T = any>(type: string, handler: Handler<T>) {
    if (!this.handlers[type]) this.handlers[type] = new Set();
    this.handlers[type].add(handler as Handler<any>);
    return () => this.off(type, handler);
  }

  off<T = any>(type: string, handler: Handler<T>) {
    this.handlers[type]?.delete(handler as Handler<any>);
  }

  emit<T = any>(type: string, payload: T) {
    this.handlers[type]?.forEach(h => {
      try {
        h(payload);
      } catch (e) {
        // 单个 handler 报错不影响其他订阅者
        // 可以在需要时扩展日志
      }
    });
  }
}