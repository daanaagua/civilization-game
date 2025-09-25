import { ChoiceEvent, EventSource, EventsAdapter, GameEventV2, NotificationEvent } from './types';

type QueueItem = { ev: ChoiceEvent };

export class EventEngineV2 {
  private static _inst: EventEngineV2 | null = null;
  static get instance(): EventEngineV2 {
    if (!this._inst) this._inst = new EventEngineV2();
    return this._inst;
  }

  private sources: Map<string, EventSource> = new Map();
  private queue: QueueItem[] = [];
  private adapter: EventsAdapter | null = null;
  // 引擎自身触发暂停的标记：仅当为 true 时，空队列才会自动恢复
  private pausedByEngine = false;
  // 防抖：记录最近一次处理的事件ID与时间，避免同ID在极短时间内重复入队/展示
  private lastProcessedId: string | null = null;
  private lastProcessedAt = 0;
  // 通知防抖：避免同ID通知在极短时间内重复记录
  private lastNotificationId: string | null = null;
  private lastNotificationAt = 0;
  // 通知批处理缓冲
  private notifBuffer: NotificationEvent[] = [];
  private notifBatchTimer: any = null;
  private notifBatchWindowMs = 500;

  // RNG（雏形）：可设种子与记录抽样，后续可用于冒险事件线生成重放
  private seed: number = Date.now() & 0xffffffff;
  private rngState: number = (this.seed ^ 0x9e3779b9) >>> 0;
  private draws: number[] = [];

  attachAdapter(adapter: EventsAdapter) {
    this.adapter = adapter;
  }

  registerSource(src: EventSource) {
    this.sources.set(src.id, src);
  }

  unregisterSource(id: string) {
    this.sources.delete(id);
  }

  // 调度：并行拉取事件源，按优先级简单排序后依次入队/即时显示
  async tick() {
    const adapter = this.adapter;
    if (!adapter) return;

    const dbg = (globalThis as any)?.eventsV2?.debug;
    if (dbg) console.log('[EventsV2][Engine] tick:start sources=', this.sources.size, 'queueLen=', this.queue.length);

    // 并行拉取
    const sourceList = Array.from(this.sources.values());
    const results = await Promise.all(
      sourceList.map(async (s) => {
        try {
          const r = await s.poll();
          if (dbg) console.log('[EventsV2][Engine] polled:', s.id, 'count=', r?.length || 0);
          return r;
        } catch (e) {
          if (dbg) console.warn('[EventsV2][Engine] poll error:', s.id, e);
          return [];
        }
      })
    );

    const flat: GameEventV2[] = ([] as GameEventV2[]).concat(...results);

    // 同一次 tick 内按 id 去重
    const uniqueMap = new Map<string, GameEventV2>();
    for (const ev of flat) {
      const id = (ev as any)?.id;
      if (id && !uniqueMap.has(id)) uniqueMap.set(id, ev);
    }
    const unique = Array.from(uniqueMap.values());

    // 优先级排序：urgent > high > medium > low
    const prioRank: Record<string, number> = { urgent: 3, high: 2, medium: 1, low: 0 };
    unique.sort((a, b) => (prioRank[(a.priority || 'low')] ?? 0) - (prioRank[(b.priority || 'low')] ?? 0)).reverse();

    if (dbg) console.log('[EventsV2][Engine] tick:unique ids=', unique.map(u => (u as any).id));

    for (const ev of unique) {
      if (ev.kind === 'notification') {
        // 进入批处理缓冲
        this.bufferNotification(ev as NotificationEvent);
      } else {
        this.enqueueChoice(ev as ChoiceEvent);
      }
    }

    // 立即尝试展示 Choice 事件（受 backpressure 控制）
    this.showHeadIfIdle();

    // 刷新通知批处理（如果没有计时器，启动一个）
    this.flushNotificationBufferMaybe();

    // 如果当前无暂停事件在处理，且队列非空，立即展示首个
    this.showHeadIfIdle();

    if (dbg) console.log('[EventsV2][Engine] tick:end queueLen=', this.queue.length, 'pausedByEngine=', this.pausedByEngine, 'isPaused=', adapter.isPaused());
  }

  // 处理提示类（不暂停）
  private bufferNotification(ev: NotificationEvent) {
    const now = Date.now();
    // 简单防抖：1秒内相同ID的通知不重复入缓冲
    if (this.lastNotificationId && ev.id === this.lastNotificationId && (now - this.lastNotificationAt) < 1000) {
      return;
    }
    this.lastNotificationId = ev.id;
    this.lastNotificationAt = now;
    this.notifBuffer.push(ev);
  }

  private flushNotificationBufferMaybe() {
    if (this.notifBatchTimer) return;
    // 在批处理窗口结束后统一输出
    this.notifBatchTimer = setTimeout(() => {
      this.flushNotificationBuffer();
    }, this.notifBatchWindowMs);
  }

  private flushNotificationBuffer() {
    const adapter = this.adapter!;
    const batch = this.notifBuffer.splice(0, this.notifBuffer.length);
    this.notifBatchTimer && clearTimeout(this.notifBatchTimer);
    this.notifBatchTimer = null;
    if (batch.length === 0) return;

    if (batch.length === 1) {
      // 单条直接记录
      const ev = batch[0];
      const base = { ...ev, isResolved: true, timestamp: ev.timestamp ?? Date.now() };
      adapter.appendHistory(base);
      if (ev.meta?.recordInLatest && !ev.meta?.doNotRecordInLatest) {
        adapter.appendLatest(base);
      }
      return;
    }

    // 多条合并为摘要
    const titles = batch.map(b => b.title).filter(Boolean);
    const summary: NotificationEvent = {
      kind: 'notification',
      id: `batch_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      title: `近期事件 (${batch.length} 条)`,
      description: titles.slice(0, 5).join('、') + (titles.length > 5 ? ' 等' : ''),
      priority: 'medium',
      timestamp: Date.now(),
      meta: { recordInLatest: true }
    };
    const base = { ...summary, isResolved: true };
    adapter.appendHistory(base);
    adapter.appendLatest(base);
  }

  private enqueueChoice(ev: ChoiceEvent) {
    const adapter = this.adapter!;
    const dbg = (globalThis as any)?.eventsV2?.debug;

    // 防抖：1秒内同ID不再入队（解决“点掉后又瞬间弹回”的竞态）
    const now = Date.now();
    if (this.lastProcessedId && ev.id === this.lastProcessedId && (now - this.lastProcessedAt) < 1000) {
      if (dbg) console.log('[EventsV2][Engine] drop duplicate within 1s id=', ev.id);
      return;
    }

    // 队列化
    this.queue.push({ ev });
    if (dbg) console.log('[EventsV2][Engine] enqueue id=', ev.id, 'queueLen=', this.queue.length);

    // 记录历史（未解决）
    adapter.appendHistory({ ...ev, isResolved: false, timestamp: ev.timestamp ?? Date.now() });
  }

  private showHeadIfIdle() {
    const adapter = this.adapter!;
    const dbg = (globalThis as any)?.eventsV2?.debug;

    if (this.queue.length === 0) {
      // 兼容旧系统接口仍在时：不干预
      if (typeof (adapter as any).hasLegacyPauseQueue === 'function' && adapter.hasLegacyPauseQueue()) {
        if (dbg) console.log('[EventsV2][Engine] idle but legacy queue exists → skip resume/hide');
        return;
      }
      // 仅当由引擎自身触发的暂停才恢复；若用户手动暂停则保持
      if (this.pausedByEngine && adapter.isPaused()) {
        if (dbg) console.log('[EventsV2][Engine] resume (pausedByEngine=true)');
        adapter.resume();
      }
      this.pausedByEngine = false;
      adapter.hideModal();
      return;
    }

    // Backpressure：如果当前已处于暂停（说明有弹窗正在显示），则不切换/重显下一条，等待当前关闭
    if (adapter.isPaused()) {
      if (dbg) console.log('[EventsV2][Engine] backpressure: paused → wait');
      return;
    }

    const head = this.queue[0].ev;

    // 若未暂停 → 由引擎触发暂停并显示
    this.pausedByEngine = true;
    if (dbg) console.log('[EventsV2][Engine] pause (show head) id=', head.id);
    adapter.pause();

    // 若当前弹窗已显示同一个事件 → 不重复 show，避免“连跳”视觉
    const currentId = (adapter as any).getCurrentModalId?.();
    if (currentId === head.id) {
      if (dbg) console.log('[EventsV2][Engine] skip re-show same head id=', head.id);
      return;
    }

    if (dbg) console.log('[EventsV2][Engine] show head id=', head.id);
    adapter.showModal(head);
  }

  // 用户选择选项（包括仅一个“知道了”的情况）
  choose(optionId?: string) {
    const adapter = this.adapter!;
    const dbg = (globalThis as any)?.eventsV2?.debug;
    if (this.queue.length === 0) return;
    const head = this.queue.shift()!.ev;

    // 记录最近一次处理，用于防抖
    this.lastProcessedId = head.id;
    this.lastProcessedAt = Date.now();
    if (dbg) console.log('[EventsV2][Engine] choose id=', head.id, 'queueLen=', this.queue.length);

    // 找到对应选项（如果未传或找不到，就选第一个，兼容“知道了”）
    const opts = Array.isArray(head.options) && head.options.length > 0 ? head.options : [];
    const sel = (optionId ? opts.find(o => o.id === optionId) : undefined) || opts[0];

    if (sel?.effects?.length) {
      adapter.applyEffects(sel.effects);
    }

    // 将已解决记录回写（不一定进入“最新事件栏”）
    const resolved = { ...head, isResolved: true, timestamp: Date.now() };
    adapter.appendHistory(resolved);
    if (head.meta?.recordInLatest && !head.meta?.doNotRecordInLatest) {
      adapter.appendLatest(resolved);
    }

    // 展示下一个或恢复：仅当未处于暂停时再尝试展示，避免在弹窗未关闭时“连跳”
    if (!adapter.isPaused()) {
      this.showHeadIfIdle();
      // 微任务级一致性守护
      setTimeout(() => this.showHeadIfIdle(), 0);
    }
  }

  // 外部直接推送事件（支持 Choice 与 Notification）
  push(ev: GameEventV2) {
    if (!this.adapter) return;
    if (ev.kind === 'notification') {
      this.handleNotification(ev);
      return;
    }
    this.enqueueChoice(ev);
    this.showHeadIfIdle();
    setTimeout(() => this.showHeadIfIdle(), 0);
  }

  dismiss() {
    // 等价于选择了默认选项
    const dbg = (globalThis as any)?.eventsV2?.debug;
    if (dbg) console.log('[EventsV2][Engine] dismiss → choose default');
    this.choose(undefined);
  }

  // RNG 接口（雏形）：线性同余发生器，记录抽样用于重放
  setSeed(seed: number) {
    this.seed = seed >>> 0;
    this.rngState = (this.seed ^ 0x9e3779b9) >>> 0;
    this.draws = [];
  }
  random(): number {
    // LCG: X_{n+1} = (a*X_n + c) mod 2^32
    this.rngState = (1664525 * this.rngState + 1013904223) >>> 0;
    const v = this.rngState / 0x100000000;
    this.draws.push(v);
    return v;
  }
  getRngLog() {
    return { seed: this.seed, draws: [...this.draws] };
  }

  // 提供当前队首事件ID（用于桥接判定）
  getHeadId(): string | undefined {
    return this.queue.length > 0 ? this.queue[0].ev?.id : undefined;
  }
}

// 工厂/单例导出
export function getEventEngineV2() {
  return EventEngineV2.instance;
}