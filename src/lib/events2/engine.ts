'use client';

import { EventBus } from './bus';
import {
  EngineCallbacks,
  EngineConfig,
  EventData,
  EventPlugin,
  EventProposal,
  GameStateLike,
  PauseEventData,
  PluginContext,
  NotifyEventData,
  EventResolution,
} from './types';

export class EventEngine {
  private bus = new EventBus();
  private plugins: Map<string, EventPlugin> = new Map();
  private intervalId: any = null;
  private cfg: Required<EngineConfig>;
  private cb: EngineCallbacks;
  private getGameState: () => GameStateLike;

  constructor(getGameState: () => GameStateLike, callbacks: EngineCallbacks, config?: EngineConfig) {
    this.getGameState = getGameState;
    this.cb = callbacks;
    this.cfg = { pollIntervalMs: config?.pollIntervalMs ?? 1000 };
  }

  registerPlugin(plugin: EventPlugin) {
    if (this.plugins.has(plugin.id)) return;
    this.plugins.set(plugin.id, plugin);
    this.cb.log?.('[EventEngine] plugin registered', plugin.id);
  }

  unregisterPlugin(id: string) {
    this.plugins.delete(id);
  }

  on<T = any>(type: string, handler: (payload: T) => void) {
    return this.bus.on(type, handler);
  }

  start() {
    if (this.intervalId) return;
    this.cb.log?.('[EventEngine] start polling', { interval: this.cfg.pollIntervalMs });
    this.intervalId = setInterval(() => this.tick(), this.cfg.pollIntervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.cb.log?.('[EventEngine] stopped');
    }
  }

  private getNowDay(): number {
    const gs = this.getGameState();
    const day = Number(gs?.timeSystem?.currentDay ?? 0);
    return Number.isFinite(day) ? day : 0;
  }

  private tick() {
    const nowDay = this.getNowDay();
    const ctx: PluginContext = { nowDay, getGameState: this.getGameState };
    for (const plugin of this.plugins.values()) {
      try {
        const proposals = plugin.checkAndGenerate(ctx);
        if (proposals && proposals.length) {
          for (const p of proposals) this.acceptProposal(p);
        }
      } catch (e) {
        this.cb.log?.('[EventEngine] plugin error', { plugin: plugin.id, error: String(e) });
        // 插件报错被隔离
      }
    }
  }

  private acceptProposal(p: EventProposal) {
    const pause = !!p.pause || (p.options && p.options.length > 0);
    const base: EventData = pause
      ? {
          id: p.id,
          title: p.title,
          description: p.description,
          priority: p.priority,
          category: p.category,
          icon: p.icon,
          options: p.options,
          pause: true,
        }
      : {
          id: p.id,
          title: p.title,
          description: p.description,
          priority: p.priority,
          category: p.category,
          icon: p.icon,
          durationMs: 5000,
          pause: false,
        };

    if (pause) {
      const ev = base as PauseEventData;
      this.cb.onPauseEvent(ev);
      this.bus.emit('pause', ev);
    } else {
      const ev = base as NotifyEventData;
      this.cb.onNotifyEvent(ev);
      this.bus.emit('notify', ev);
    }

    // 在 bus 上附带存储 onResolveEffects 的映射
    if (p.onResolveEffects) {
      this.bus.emit('effectsMapSet', {
        id: p.id,
        onResolveEffects: p.onResolveEffects,
      });
    }
  }

  resolve(res: EventResolution) {
    // 允许外部在用户点击选项时回调此处，由引擎生成效果并应用
    const { eventId, choiceIndex } = res;
    let effects: any;
    // 让监听者（由 acceptProposal 设置）提供映射
    // 我们用一次性的请求-响应模式
    const tmpKey = `__ask_effects_${eventId}_${Date.now()}`;
    let handler: any;
    handler = (payload: any) => {
      if (!payload || payload.id !== eventId) return;
      const map = payload.onResolveEffects;
      try {
        if (Array.isArray(map)) effects = map;
        else if (typeof map === 'function') effects = map(choiceIndex);
      } finally {
        this.bus.off('effectsMapGet', handler);
      }
    };
    this.bus.on('effectsMapGet', handler);
    // 触发获取
    this.bus.emit('effectsMapGet', { id: eventId });

    if (effects && effects.length && this.cb.applyEffects) {
      try {
        this.cb.applyEffects(effects);
      } catch (e) {
        this.cb.log?.('[EventEngine] applyEffects error', e);
      }
    }
    this.bus.emit('resolved', { eventId, choiceIndex });
  }
}

// 单例初始化，避免多次创建
let singleton: EventEngine | null = null;

export function initEventEngine(
  getGameState: () => GameStateLike,
  callbacks: EngineCallbacks,
  config?: EngineConfig
) {
  if (typeof window !== 'undefined' && (window as any).__eventEngine) {
    singleton = (window as any).__eventEngine;
    return singleton!;
  }
  if (!singleton) {
    singleton = new EventEngine(getGameState, callbacks, config);
    if (typeof window !== 'undefined') (window as any).__eventEngine = singleton;
  }
  return singleton!;
}

export function getEventEngine() {
  return singleton;
}