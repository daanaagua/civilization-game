import type { EventSource, GameEventV2, ChoiceEvent } from '../types';
import { getEventEngineV2 } from '../core';
import { validateEvent } from '../event-schema';

// 采用游戏内“天”为单位的确定性调度：
// - 首次触发：开局后 5 年（≈ 5*365 天）
// - 后续触发：每次间隔 1~3 年（随机整数年）
// 状态存放：gameState.eventsV2.domesticV2 = { nextDueDay: number }

function randInt(a: number, b: number) {
  const rng = getEventEngineV2()?.random?.() ?? Math.random();
  return a + Math.floor(rng * (b - a + 1));
}

export function createDomesticV2Source(api: { getState: () => any; setState: (u: (s: any) => any) => void }): EventSource {
  // 条件检查工具：返回 { disabled: boolean, reason?: string }
  function canAfford(gs: any, cost: Record<string, number>) {
    const res = gs?.resources || {};
    const limits = gs?.resourceLimits || {};
    for (const k of Object.keys(cost || {})) {
      const need = Number(cost[k] || 0);
      const have = Number(res[k] || 0);
      if (have < need) return { disabled: true, reason: `需要${need}${k}` };
    }
    return { disabled: false };
  }
  function requireIdle(gs: any, count: number) {
    const idle = Number(gs?.military?.idlePopulation ?? gs?.resources?.idlePopulation ?? 0);
    if (idle < count) return { disabled: true, reason: `需要${count}空闲人口` };
    return { disabled: false };
  }
  function buildDomesticEventsPool(s: any) {
    const gs = s?.gameState || {};
    const mk = (base: any) => ({
      ...base,
      kind: 'choice' as const,
      meta: { pausesGame: true, recordInLatest: true, ...(base.meta || {}) },
      priority: base.priority || 'medium'
    });
    // 1 丰收
    const e1 = mk({
      id: 'domestic_harvest_bounty',
      title: '丰收',
      description: '农田产出增加',
      options: [
        { id:'sell', text:'出售多余粮食：获得200货币', effects:[{type:'resource', payload:{ money: +200 }}]},
        { id:'store', text:'储存粮食：未来三个月食物产出增加20%', effects:[{type:'buff', payload:{ foodRate:+0.20, durationDays:90, tag:'丰收加成'}}]}
      ]
    });
    // 2 干旱
    const e2 = mk({
      id: 'domestic_drought',
      title: '干旱',
      description: '连续数月降雨稀少',
      options: [
        { id:'soothe', text:'动用国库安抚民心：支出300货币', disabled: canAfford(gs,{money:300}).disabled, disabledReason: canAfford(gs,{money:300}).reason, effects:[{type:'resource', payload:{ money:-300 }},{type:'stability', payload:{ delta:+3, durationDays:30 }}]},
        { id:'ration', text:'实行配给制：民众不满导致稳定度-5', effects:[{type:'stability', payload:{ delta:-5, durationDays:365 }}]}
      ]
    });
    // 3 春季溪流充沛
    const e3 = mk({
      id:'domestic_spring_stream',
      title:'春季溪流充沛',
      description:'融雪带来充足水源',
      options:[
        { id:'dredge', text:'疏浚河道灌溉农田：食物产量+15%持续四个月', effects:[{type:'buff', payload:{ foodRate:+0.15, durationDays:120 }}]},
        { id:'watermill', text:'利用急流驱动原始水磨：工具制作速度+10%持续六个月', effects:[{type:'buff', payload:{ toolsRate:+0.10, durationDays:180 }}]}
      ]
    });
    // 4 蝗灾肆虐
    const e4 = mk({
      id:'domestic_locust',
      title:'蝗灾肆虐',
      description:'大量蝗虫吞噬农作物',
      options:[
        { id:'campaign', text:'组织灭蝗：消耗1空闲人力，挽回损失', disabled: requireIdle(gs,1).disabled, disabledReason: requireIdle(gs,1).reason, effects:[{type:'population', payload:{ idle:-1 }},{type:'buff', payload:{ foodRate:+0.10, durationDays:60 }}]},
        { id:'smoke', text:'使用草药烟熏驱赶：花费200木材', disabled: canAfford(gs,{wood:200}).disabled, disabledReason: canAfford(gs,{wood:200}).reason, effects:[{type:'resource', payload:{ wood:-200 }},{type:'buff', payload:{ foodRate:+0.08, durationDays:90 }}]},
        { id:'ignore', text:'不予理睬：一年内稳定度-5', effects:[{type:'stability', payload:{ delta:-5, durationDays:365 }}]}
      ]
    });
    // 5 寒潮预警
    const e5 = mk({
      id:'domestic_cold_warning',
      title:'寒潮预警',
      description:'极端低温即将来临',
      options:[
        { id:'fur', text:'分发兽皮御寒：花费120布革', disabled: canAfford(gs,{ cloth:120 }).disabled, disabledReason: canAfford(gs,{ cloth:120 }).reason, effects:[{type:'resource', payload:{ cloth:-120 }},{type:'stability', payload:{ delta:+2, durationDays:90 }}]},
        { id:'bonfire', text:'增加火堆取暖：三个月内木材生产-30%', effects:[{type:'buff', payload:{ woodRate:-0.30, durationDays:90 }}]}
      ]
    });
    // 6 暴雨成灾
    const e6 = mk({
      id:'domestic_flood',
      title:'暴雨成灾',
      description:'连续强降雨引发内涝',
      options:[
        { id:'reinforce', text:'加固堤坝排水：投入2人口空闲劳动力', disabled: requireIdle(gs,2).disabled, disabledReason: requireIdle(gs,2).reason, effects:[{type:'population', payload:{ idle:-2 }},{type:'stability', payload:{ delta:+2, durationDays:180 }}]},
        { id:'ignore', text:'不予理睬：一年内稳定度-5', effects:[{type:'stability', payload:{ delta:-5, durationDays:365 }}]}
      ]
    });
    // 7 暖冬现象
    const e7 = mk({
      id:'domestic_warm_winter',
      title:'暖冬现象',
      description:'冬季气温异常偏高',
      options:[
        { id:'expand', text:'扩大冬种面积：食物增加{目前储存量的20%}', effects:[{type:'resource', payload:{ food: Math.floor((gs?.resources?.food||0)*0.2) }}]},
        { id:'fallow', text:'休耕恢复地力：三个月内食物产出+25%', effects:[{type:'buff', payload:{ foodRate:+0.25, durationDays:90 }}]}
      ]
    });
    // 8 沙尘暴频发
    const e8 = mk({
      id:'domestic_sandstorm',
      title:'沙尘暴频发',
      description:'干旱地区扬尘严重',
      options:[
        { id:'mat', text:'编织草席遮挡：耗费100木材，保护作物', disabled: canAfford(gs,{wood:100}).disabled, disabledReason: canAfford(gs,{wood:100}).reason, effects:[{type:'resource', payload:{ wood:-100 }},{type:'stability', payload:{ delta:+1, durationDays:180 }}]},
        { id:'mask', text:'发放面罩：每人消耗1单位布革', disabled: canAfford(gs,{ cloth: Math.ceil(Number(gs?.resources?.population||0)) }).disabled, disabledReason: '布革不足', effects:[{type:'resource', payload:{ cloth: -(Math.ceil(Number(gs?.resources?.population||0))) }}]},
        { id:'ignore', text:'不予理睬：一年内稳定度-5', effects:[{type:'stability', payload:{ delta:-5, durationDays:365 }}]}
      ]
    });
    // 9 渔获大增
    const e9 = mk({
      id:'domestic_fish_boom',
      title:'渔获大增',
      description:'水域生态良好鱼类丰富',
      options:[
        { id:'sell', text:'大规模捕捞销售：一次性获得250货币，但三个月内食物减产10%', effects:[{type:'resource', payload:{ money:+250 }},{type:'buff', payload:{ foodRate:-0.10, durationDays:90 }}]},
        { id:'ban', text:'设立禁渔期养护：三个月内食物+15%', effects:[{type:'buff', payload:{ foodRate:+0.15, durationDays:90 }}]}
      ]
    });
    // 10 野火蔓延
    const e10 = mk({
      id:'domestic_wildfire',
      title:'野火蔓延',
      description:'干燥天气引发森林火灾',
      options:[
        { id:'extinguish', text:'组织灭火队伍：投入1空闲人力，木材储量减少10%', disabled: requireIdle(gs,1).disabled, disabledReason: requireIdle(gs,1).reason, effects:[{type:'population', payload:{ idle:-1 }},{type:'resourcePercent', payload:{ wood:-0.10 }}]},
        { id:'control', text:'控制燃烧范围：牺牲边缘林区，木材储量减少30%', effects:[{type:'resourcePercent', payload:{ wood:-0.30 }}]}
      ]
    });
    // 11 地下温泉涌现
    const e11 = mk({
      id:'domestic_hot_spring',
      title:'地下温泉涌现',
      description:'发现新的地热资源',
      options:[
        { id:'bath', text:'开发温泉沐浴：半年内每月+40货币收入，吸引游客', effects:[{type:'income', payload:{ moneyPerMonth:+40, durationDays:180 }}]},
        { id:'pottery', text:'用于陶器烧制：三个月内工具生产速度+20%', effects:[{type:'buff', payload:{ toolsRate:+0.20, durationDays:90 }}]}
      ]
    });
    // 12 冰雹灾害
    const e12 = mk({
      id:'domestic_hail',
      title:'冰雹灾害',
      description:'突发强对流天气',
      options:[
        { id:'pay', text:'花钱弭平灾祸：花费200货币', disabled: canAfford(gs,{money:200}).disabled, disabledReason: canAfford(gs,{money:200}).reason, effects:[{type:'resource', payload:{ money:-200 }}]},
        { id:'pray', text:'祈祷：祈求神明保佑，-50信仰', disabled: canAfford(gs,{faith:50}).disabled, disabledReason: canAfford(gs,{faith:50}).reason, effects:[{type:'resource', payload:{ faith:-50 }},{type:'stability', payload:{ delta:+1, durationDays:60 }}]},
        { id:'ignore', text:'不予理睬：一年内稳定度-5', effects:[{type:'stability', payload:{ delta:-5, durationDays:365 }}]}
      ]
    });
    // 13 候鸟迁徙路线改变
    const e13 = mk({
      id:'domestic_migratory_birds',
      title:'候鸟迁徙路线改变',
      description:'',
      options:[
        { id:'reed', text:'建造人工芦苇荡吸引：投资100木材，一年内稳定度+5', disabled: canAfford(gs,{wood:100}).disabled, disabledReason: canAfford(gs,{wood:100}).reason, effects:[{type:'resource', payload:{ wood:-100 }},{type:'stability', payload:{ delta:+5, durationDays:365 }}]},
        { id:'hunt', text:'利用机会狩猎采集：一次性获得120食物', effects:[{type:'resource', payload:{ food:+120 }}]}
      ]
    });
    // 14 井水干涸
    const e14 = mk({
      id:'domestic_well_dry',
      title:'井水干涸',
      description:'',
      options:[
        { id:'deepwell', text:'集体挖掘深井：一次性花费2空闲人口解决供水', disabled: requireIdle(gs,2).disabled, disabledReason: requireIdle(gs,2).reason, effects:[{type:'population', payload:{ idle:-2 }},{type:'stability', payload:{ delta:+2, durationDays:365 }}]},
        { id:'save', text:'实施节水措施：民众用水受限，稳定度-5', effects:[{type:'stability', payload:{ delta:-5, durationDays:180 }}]}
      ]
    });
    return [e1,e2,e3,e4,e5,e6,e7,e8,e9,e10,e11,e12,e13,e14];
  }
  function getNowDay(s: any) {
    const gs = s?.gameState || {};
    // 强制以“游戏内时钟”为准：gameTime(秒) * 2 = 游戏天数（1秒=2天，内置会受 gameSpeed 影响）
    const gameTimeSec = Number(gs?.gameTime);
    if (Number.isFinite(gameTimeSec) && gameTimeSec >= 0) {
      return Math.floor(gameTimeSec * 2);
    }
    // 回退：timeSystem.currentDay/totalDays
    let day = Number(gs?.timeSystem?.currentDay ?? gs?.timeSystem?.totalDays);
    if (Number.isFinite(day) && day >= 0) return Math.floor(day);
    // 最后兜底（极端情况下用 startTime 粗略推导）
    const startTime = Number(gs?.timeSystem?.startTime ?? 0);
    const speed = Number(gs?.settings?.gameSpeed ?? 1);
    if (startTime > 0) {
      const elapsedMs = Date.now() - startTime;
      const days = Math.floor(elapsedMs * (2 * Math.max(0.1, speed)) / 1000);
      return days >= 0 ? days : 0;
    }
    return 0;
  }
  const debugLog = (s: any, ...args: any[]) => {
    const dbg = !!s?.gameState?.settings?.eventsDebugEnabled;
    if (dbg) console.log('[EventsV2][Domestic]', ...args);
  };
  return {
    id: 'domestic-v2',
    async poll(): Promise<GameEventV2[]> {
      const s = api.getState();
      const gs = s.gameState;
      const nowDay = getNowDay(s);
      // 变量尚未声明，先仅打印 nowDay，完整状态日志在声明后输出
      debugLog(s, `nowDay=${nowDay}`);

      const v2 = (gs?.eventsV2 || {}) as any;
      const dom = (v2.domesticV2 || {}) as any;
      let nextDueDay = typeof dom.nextDueDay === 'number' ? dom.nextDueDay : undefined;
      const lastTriggeredDay = typeof dom.lastTriggeredDay === 'number' ? dom.lastTriggeredDay : undefined;
      const initialized = !!dom.initialized;
      const cooldownUntilDay = typeof dom.cooldownUntilDay === 'number' ? dom.cooldownUntilDay : undefined;

      // 声明后输出完整状态日志，便于排查调度
      debugLog(s, `state: nextDueDay=${nextDueDay}, lastTriggeredDay=${lastTriggeredDay}, cooldownUntilDay=${cooldownUntilDay}`);
      // 初始化 nextDueDay：开局 + 5 年（仅一次）
      if (!initialized || typeof nextDueDay !== 'number') {
        // 若已有 lastTriggeredDay（异常重载后），优先从其后至少一年开始，避免被立即触发
        const base = (typeof lastTriggeredDay === 'number') ? (lastTriggeredDay + 365) : (nowDay + 5 * 365);
        nextDueDay = Math.max(base, nowDay + 365);
        debugLog(s, `init: set initialized=true, nextDueDay=${nextDueDay}`);
        api.setState((st) => ({
          gameState: {
            ...st.gameState,
            eventsV2: {
              ...(st.gameState.eventsV2 || {}),
              domesticV2: { ...(st.gameState.eventsV2?.domesticV2 || {}), initialized: true, nextDueDay }
            }
          }
        }));
        return [];
      }

      // 尚未到达触发日
      if (nowDay < nextDueDay) {
        // 冷却防抖：触发后的次日内不再入队，避免轮询/热刷新竞态
        if (typeof cooldownUntilDay === 'number' && nowDay < cooldownUntilDay) {
          if ((cooldownUntilDay - nowDay) % 1 === 0) debugLog(s, `cooldown: now=${nowDay} < cooldownUntilDay=${cooldownUntilDay}`);
          return [];
        }
        // 周期性调试输出（每 180 天一次），避免刷屏
        if ((nextDueDay - nowDay) % 180 === 0) debugLog(s, `waiting: now=${nowDay} < due=${nextDueDay}`);
        return [];
      }
      // 再保险：同一“游戏日”只触发一次，防重复
      if (typeof lastTriggeredDay === 'number' && lastTriggeredDay === nowDay) {
        debugLog(s, `skip duplicate on day=${nowDay}`);
        return [];
      }

      // 事件池（前14个境内随机事件）
      const pool: ChoiceEvent[] = buildDomesticEventsPool(s);
      // 随机挑选一个事件
      const ev = pool[randInt(0, pool.length - 1)];
      // 数据校验：非法事件直接丢弃，避免脏数据进入队列
      const vRes = validateEvent(ev as any);
      if (!vRes.ok) {
        debugLog(s, `invalid event dropped: ${vRes.error}`);
        return [];
      }
      // 补充唯一ID（基于天数），避免重复
      ev.id = `${ev.id}_day_${nowDay}`;

      const nextGapYears = randInt(1, 3);
      const newNextDueDay = nowDay + nextGapYears * 365;
      debugLog(s, `trigger at day=${nowDay}, next in ${nextGapYears}y → due=${newNextDueDay}`);
      api.setState((st) => ({
        gameState: {
          ...st.gameState,
          eventsV2: {
            ...(st.gameState.eventsV2 || {}),
            domesticV2: { 
              ...(st.gameState.eventsV2?.domesticV2 || {}), 
              initialized: true,
              nextDueDay: newNextDueDay, 
              lastTriggeredDay: nowDay,
              cooldownUntilDay: nowDay + 1
            }
          }
        }
      }));

      return [ev];
    }
  };
}