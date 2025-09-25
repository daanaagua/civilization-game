import { EventSource } from './types';
import { getEventEngineV2 } from './core';

export class EventSchedulerV2 {
  private intervalId: any = null;
  private pollMs = 1000;
  // 已注册源ID，防止重复注册导致连续触发
  private registeredIds: Set<string> = new Set();

  constructor(pollMs?: number) {
    if (typeof pollMs === 'number') {
      this.pollMs = Math.max(200, Math.min(10000, Math.floor(pollMs)));
    }
  }

  setPollMs(ms: number) {
    this.pollMs = Math.max(200, Math.min(10000, Math.floor(ms)));
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }

  addSource(src: EventSource) {
    if (this.registeredIds.has(src.id)) return;
    getEventEngineV2().registerSource(src);
    this.registeredIds.add(src.id);
  }

  removeSource(id: string) {
    getEventEngineV2().unregisterSource(id);
    this.registeredIds.delete(id);
  }

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      getEventEngineV2().tick();
    }, this.pollMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}