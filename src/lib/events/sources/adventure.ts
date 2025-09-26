import type { EventSource, GameEventV2, ChoiceEvent } from '../types';
import { getEventEngineV2 } from '../core';
import { validateEvent } from '../event-schema';

// 事件权重与配置（可调）
const MIN_NODES = 3;
const MAX_NODES = 6;
const MIN_GAP_DAYS = 80;
const MAX_GAP_DAYS = 100;

// 节点类型
type NodeKind = 'minor' | 'final';

interface AdventureNode {
  id: string;
  order: number;
  kind: NodeKind;
  etaDay: number;
  resolved?: boolean;
  // 可选：预生成的事件模板 key
  tag?: string;
}

interface AdventureRunV2 {
  id: string;
  seed: number;
  totalSP: number;
  currentSP: number;
  startedAtDay: number;
  nodes: AdventureNode[];
  finished?: boolean;
}

export function createAdventureV2Source(api: {
  getState: () => any;
  setState: (updater: (s: any) => any) => void;
}): EventSource {
  return {
    id: 'adventure-v2',

    async poll(): Promise<GameEventV2[]> {
      const s = api.getState();
      const gs = s.gameState;
      const ex = gs.exploration || {};
      const nowDay = Number(gs?.timeSystem?.currentDay ?? gs?.timeSystem?.totalDays ?? 0);

      // 如果存在“启动标记”且当前还没有运行态，则初始化一次
      if (ex.adventureV2Start && !ex.adventureV2) {
        const { sp = 0 } = ex.adventureV2Start;
        const run = generateRun(nowDay, sp);
        console.log('[AdventureV2] run initialized:', { id: run.id, totalSP: run.totalSP, nodes: run.nodes.length, startDay: run.startedAtDay });
        api.setState((st: any) => ({
          gameState: {
            ...st.gameState,
            exploration: {
              ...st.gameState.exploration,
              adventureV2: run,
              adventureV2Start: undefined, // 清除一次性标记
            }
          }
        }));
        // 派发一个通知（不暂停），也可以不派发，仅作为记录
        return [{
          kind: 'notification',
          id: `adv2_start_${run.id}`,
          title: '冒险队已出发',
          description: undefined,
          meta: { recordInLatest: false, doNotRecordInLatest: true }
        }];
      }

      const run: AdventureRunV2 | undefined = ex.adventureV2;
      if (!run || run.finished) return [];

      // 查找最早的未解决节点，判断是否到达
      const next = run.nodes.find(n => !n.resolved);
      if (!next) {
        // 没有未解决节点，进入最终结算（保险）
        finalizeRun(api);
        return [];
      }

      if (nowDay < next.etaDay) {
        // 未到达下个节点
        console.log('[AdventureV2] waiting for node:', { nextId: next.id, etaDay: next.etaDay, nowDay });
        return [];
      }

      // 已到点，若该节点已处于发出待处理状态（pending），避免重复推送
      if ((next as any).pending) {
        return [];
      }

      // 到点：触发节点事件
      if (next.kind === 'minor') {
        const ev = buildMinorEvent(run, next);
        // 加“pending”锁，避免轮询期间重复推送，等玩家点击后由适配器标记 resolved
        api.setState((st: any) => {
          const ex = st.gameState.exploration || {};
          const r = ex.adventureV2;
          if (!r) return st;
          const nodes = (r.nodes || []).map((n: any) => n.id === next.id ? { ...n, pending: true } : n);
          return { gameState: { ...st.gameState, exploration: { ...ex, adventureV2: { ...r, nodes } } } };
        });
        // 校验，非法事件不入队
        if (!validateEvent(ev as any).ok) {
          return [];
        }
        console.log('[AdventureV2] minor node triggered:', { id: next.id, etaDay: next.etaDay });
        return [ev];
      } else {
        // 最终判定：使用剩余 SP
        const finalEv = buildFinalEvent(run);
        // 加“pending”锁，避免轮询期间重复推送（与途中节点一致），使用 next.id 以确保一致
        api.setState((st: any) => {
          const ex2 = st.gameState.exploration || {};
          const r2 = ex2.adventureV2;
          if (!r2) return st;
          const nodes2 = (r2.nodes || []).map((n: any) => n.id === next.id ? { ...n, pending: true } : n);
          return { gameState: { ...st.gameState, exploration: { ...ex2, adventureV2: { ...r2, nodes: nodes2 } } } };
        });
        if (!validateEvent(finalEv as any).ok) {
          return [];
        }
        console.log('[AdventureV2] final node triggered:', { id: `${run.id}_final`, sp: run.currentSP ?? run.totalSP });
        return [finalEv];
      }
    }
  };
}

function generateRun(nowDay: number, sp: number): AdventureRunV2 {
  const rng = () => getEventEngineV2().random();
  const id = `run_${nowDay}_${Math.floor(rng() * 1e6)}`;
  const seed = Math.floor(getEventEngineV2().random() * 1e9);
  const totalSP = Math.max(0, Number(sp) || 0);
  const currentSP = totalSP;

  // 节点数与间隔
  const count = clamp(MIN_NODES + Math.floor(getEventEngineV2().random() * (MAX_NODES - MIN_NODES + 1)), MIN_NODES, MAX_NODES);
  const nodes: AdventureNode[] = [];
  let day = nowDay;
  for (let i = 0; i < count; i++) {
    day += randInt(MIN_GAP_DAYS, MAX_GAP_DAYS);
    nodes.push({
      id: `${id}_n${i + 1}`,
      order: i + 1,
      kind: 'minor',
      etaDay: day
    });
  }
  // 最终大节点
  day += randInt(MIN_GAP_DAYS, MAX_GAP_DAYS);
  nodes.push({
    id: `${id}_final`,
    order: count + 1,
    kind: 'final',
    etaDay: day
  });

  return { id, seed, totalSP, currentSP, startedAtDay: nowDay, nodes };
}

function buildMinorEvent(run: AdventureRunV2, node: AdventureNode): ChoiceEvent {
  // 简化版：四类随机之一
  const roll = getEventEngineV2().random();
  let title = '旅途小事';
  let desc = '旅途中发生了一些事情。';
  let effects: any[] = [];
  if (roll < 0.4) {
    title = '发现资源';
    desc = '在途中发现了一些有用的资源。';
    // 效果交由 store 侧实现（resource += x）
    effects = [{ type: 'resource', payload: { food: randInt(5, 15) } }];
  } else if (roll < 0.75) {
    title = '遇到危险';
    desc = '队伍遭遇了危险，行进受阻。';
    effects = [{ type: 'spDelta', payload: { delta: -randInt(1, 3) } }];
  } else if (roll < 0.9) {
    title = '士气鼓舞';
    desc = '远景激励了队伍。';
    effects = [{ type: 'spDelta', payload: { delta: randInt(1, 2) } }];
  } else {
    title = '发现宝物';
    desc = '极少见的宝物出现了！';
    effects = [{ type: 'treasure', payload: { key: 'lucky_charm' } }];
  }

  return {
    kind: 'choice',
    id: node.id,
    title,
    description: desc,
    options: [
      { id: 'ok', text: '知道了', effects }
    ],
    meta: {
      pausesGame: true,
      doNotRecordInLatest: true
    },
    priority: 'medium'
  };
}

function buildFinalEvent(run: AdventureRunV2): ChoiceEvent {
  const sp = Math.max(0, run.currentSP ?? run.totalSP);
  const roll = getEventEngineV2().random();
  let title = '旅途终局';
  let desc = '长途跋涉后，总结你的收获。';
  let effects: any[] = [];

  if (sp >= 18 && roll < 0.55) {
    title = '发现新国家';
    desc = '你与一个陌生的国家取得了接触。';
    effects = [{ type: 'discoverNation' }];
  } else if (sp >= 14 && roll < 0.75) {
    title = '发现新地牢';
    desc = '探明了一个未知的地牢入口。';
    effects = [{ type: 'discoverDungeon' }];
  } else if (sp >= 10 && roll < 0.9) {
    title = '发现大量财富';
    desc = '满载而归。';
    effects = [{ type: 'resource', payload: { gold: randInt(50, 120) } }];
  } else {
    title = '无功而返';
    desc = '尽管付出努力，却没有特别的发现。';
  }

  return {
    kind: 'choice',
    id: `${run.id}_final`,
    title,
    description: desc,
    options: [{ id: 'ok', text: '知道了', effects }],
    meta: {
      pausesGame: true,
      recordInLatest: true
    },
    priority: 'high'
  };
}

// 结束运行（把 run.finished=true，并清空节点剩余）
function finalizeRun(api: { getState: () => any; setState: (u: (s: any) => any) => void }) {
  api.setState((st: any) => {
    const ex = st.gameState.exploration || {};
    const run = ex.adventureV2;
    if (!run) return st;
    return {
      gameState: {
        ...st.gameState,
        exploration: {
          ...ex,
          adventureV2: { ...run, finished: true }
        }
      }
    };
  });
}

// 同步：把节点状态推进、应用效果（由 adapter.applyEffects 调用 store 的 applyEventEffects）
// 由 store 的 applyEventEffects 负责处理 spDelta/treasure/resource 等效果
// 建议在 store 的 applyEventEffects 中附带：如果 effects 包含 spDelta，写入 exploration.adventureV2.currentSP += delta；
// 若是最终事件（id 包含 '_final'），调用 finalizeRun

// 工具
function randInt(a: number, b: number) {
  const r = getEventEngineV2().random();
  return a + Math.floor(r * (b - a + 1));
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}