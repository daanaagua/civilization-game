import { EventPlugin, PluginContext, EventProposal } from '../types';

// 境内随机事件：5年保护期，之后每 1–3 年触发一次（按“天”为单位：1年=365天）
const YEAR_DAYS = 365;

export interface DomesticConfig {
  initialGraceYears?: number; // 默认 5
  minIntervalYears?: number;  // 默认 1
  maxIntervalYears?: number;  // 默认 3
}

export function createDomesticEventsPlugin(cfg?: DomesticConfig): EventPlugin {
  const graceDays = (cfg?.initialGraceYears ?? 5) * YEAR_DAYS;
  const minGap = (cfg?.minIntervalYears ?? 1) * YEAR_DAYS;
  const maxGap = (cfg?.maxIntervalYears ?? 3) * YEAR_DAYS;

  // 状态保存在闭包中（每局运行时）
  let nextDueDay = Number.POSITIVE_INFINITY;

  return {
    id: 'domestic/random',
    checkAndGenerate(ctx: PluginContext): EventProposal[] | void {
      const gs = ctx.getGameState();
      const start = Number(gs?.timeSystem?.startDay ?? 0);
      const now = ctx.nowDay;
      if (!Number.isFinite(now)) return;

      // 设置首次 Due：开局 grace 期后随机 1-3 年
      if (!Number.isFinite(nextDueDay)) {
        const first = start + graceDays + randomBetween(minGap, maxGap);
        nextDueDay = first;
        return;
      }

      if (now < nextDueDay) return;

      // 触发一次事件，并安排下一次
      nextDueDay = now + randomBetween(minGap, maxGap);

      const proposals: EventProposal[] = [
        {
          id: `domestic_${now}`,
          title: '境内状况变迁',
          description: '国内局势出现微妙变化，请做出决断。',
          priority: 'medium',
          category: 'domestic',
          pause: true,
          options: [
            { id: 'stabilize', text: '维稳为先' },
            { id: 'prosper', text: '发展经济' },
          ],
          onResolveEffects: (idx?: number) => {
            if (idx === 0) {
              return [{ type: 'stability_delta', value: +2 }];
            } else if (idx === 1) {
              return [{ type: 'resource_delta', target: 'currency', value: +50 }];
            }
            return [];
          },
        },
      ];
      return proposals;
    },
  };
}

function randomBetween(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}