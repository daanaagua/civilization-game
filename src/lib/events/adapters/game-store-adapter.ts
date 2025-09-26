import { EventsAdapter, ChoiceEvent } from '../types';

// 运行时注入，避免循环依赖：在初始化时传入 useGameStore.getState()/setState
export function createGameStoreAdapter(api: {
  getState: () => any;
  setState: (updater: (s: any) => any) => void;
}): EventsAdapter {
  return {
    isPaused() {
      return !!api.getState().gameState.isPaused;
    },
    getCurrentModalId() {
      try {
        return api.getState()?.uiState?.currentEvent?.id;
      } catch {
        return undefined;
      }
    },
    hasLegacyPauseQueue() {
      const s = api.getState();
      const arr = s?.gameState?.activeEvents;
      return Array.isArray(arr) && arr.length > 0;
    },
    getNow() {
      return Date.now();
    },
    pause() {
      const s = api.getState();
      s.pauseGame?.();
    },
    resume() {
      const s = api.getState();
      s.resumeGame?.();
    },
    showModal(ev: ChoiceEvent) {
      const dbg = (globalThis as any)?.eventsV2?.debug;
      if (dbg) console.log('[EventsV2][Adapter] showModal id=', ev.id);
      // 任意选项卡都弹：直接改 uiState
      api.setState((st) => ({
        uiState: {
          ...st.uiState,
          showEventModal: true,
          currentEvent: {
            id: ev.id,
            title: ev.title,
            description: ev.description,
            options: ev.options?.map(o => ({ id: o.id, text: o.text, effects: o.effects })) || []
          }
        }
      }));
    },
    updateModal(ev) {
      if (!ev) {
        this.hideModal();
        return;
      }
      this.showModal(ev as ChoiceEvent);
    },
    hideModal() {
      const dbg = (globalThis as any)?.eventsV2?.debug;
      if (dbg) console.log('[EventsV2][Adapter] hideModal');
      // 1) 关闭弹窗
      api.setState((st) => ({
        uiState: { ...st.uiState, showEventModal: false, currentEvent: undefined }
      }));
      // 2) 兜底：若存在“最终节点 pending”，在弹窗关闭瞬间直接结束冒险线
      try {
        api.setState((st) => {
          const ex = st.gameState.exploration || {};
          const run = ex.adventureV2;
          if (!run || !Array.isArray(run.nodes)) return st;
          const hasPendingFinal = run.nodes.some((n: any) => n?.kind === 'final' && n?.pending && !n?.resolved);
          if (!hasPendingFinal) return st;

          const nodes = run.nodes.map((n: any) => {
            if (n?.kind === 'final' && n?.pending && !n?.resolved) {
              return { ...n, resolved: true, pending: false };
            }
            return n;
          });

          if (dbg) console.log('[EventsV2][Adapter] finalize run on hideModal (pending final resolved)');
          return {
            gameState: {
              ...st.gameState,
              exploration: {
                ...ex,
                adventureV2: {
                  ...run,
                  nodes,
                  finished: true
                }
              }
            }
          };
        });
      } catch {
        // ignore
      }
    },
    appendHistory(item) {
      api.setState((st) => {
        const uniqueId = `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const entry = {
          id: uniqueId,
          title: item.title,
          description: item.description || '',
          type: (item as any).kind === 'choice' ? 'choice' : 'notification',
          priority: item.priority || 'medium',
          timestamp: item.timestamp ?? Date.now(),
          isRead: (item as any).kind === 'notification' ? true : !!item.isResolved,
          isResolved: !!item.isResolved
        };
        const prev = Array.isArray(st.gameState.events) ? st.gameState.events : [];
        // 去重：同 title + description 的旧记录只保留最新
        const filtered = prev.filter((e: any) => e.title !== entry.title || e.description !== entry.description);
        return {
          gameState: {
            ...st.gameState,
            events: [...filtered, entry]
          }
        };
      });
    },
    appendLatest(item) {
      api.setState((st) => {
        // 生成强唯一ID，避免 React 重复 key 警告
        const uniqueId = `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const entry = {
          id: uniqueId,
          title: item.title,
          description: item.description || '',
          type: (item as any).kind === 'choice' ? 'choice' : 'notification',
          priority: item.priority || 'medium',
          timestamp: item.timestamp ?? Date.now(),
          isRead: true,
          isResolved: true
        };
        // 若已有同源 id 的近况，则先去重（保留较新）
        const filtered = (st.gameState.recentEvents || []).filter((e: any) => e.title !== entry.title || e.description !== entry.description);
        const next = [...filtered, entry];
        while (next.length > 3) next.shift();
        return {
          gameState: { ...st.gameState, recentEvents: next }
        };
      });
    },
    applyEffects(effects) {
      // 允许 effects 为空：也要推进冒险节点的 resolved/finished
      if (!effects) effects = [];
      const store = api.getState();
      // 记录当前弹窗事件，用于推进冒险线节点状态
      const currentEv = store.uiState?.currentEvent;
      // 先应用通用效果（资源、稳定度等）
      store.applyEventEffects?.(effects);

      // 桥接：将带持续时间的事件选项转换为临时效果（显示在效果面板）
      try {
        const { addTemporaryEffect, createTemporaryEffectFromEventChoice, createTemporaryEffectFromChoice } = require('@/lib/temporary-effects');
        const gs = store.gameState;
        for (const e of effects) {
          if (!e || !e.type) continue;
          const evId = String(currentEv?.id || 'event');
          const evName = String(currentEv?.title || '事件');

          // 新格式：e.type==='buff' | 'income' | 'stability' with payload.durationDays
          if ((e.type === 'buff' || e.type === 'income' || e.type === 'stability') && e.payload?.durationDays > 0) {
            // 尝试统一走 createTemporaryEffectFromEventChoice
            const payload = e.payload;
            let te = null;

            if (e.type === 'buff') {
              // 识别 *_Rate 映射为 resource_production
              const key = Object.keys(payload).find(k => k.endsWith('Rate'));
              if (key) {
                const target = key.replace('Rate', '').toLowerCase(); // foodRate -> food
                te = createTemporaryEffectFromEventChoice(
                  'default',
                  evId,
                  evName,
                  { type: 'resource_production', target, modifier: Number(payload[key] || 0) },
                  Number(payload.durationDays || 0),
                  gs
                );
              }
            } else if (e.type === 'income' && payload.moneyPerMonth) {
              te = createTemporaryEffectFromEventChoice(
                'default',
                evId,
                evName,
                { type: 'resource_income', target: 'money', modifier: Number(payload.moneyPerMonth || 0) },
                Number(payload.durationDays || 0),
                gs
              );
            } else if (e.type === 'stability' && payload.delta) {
              te = createTemporaryEffectFromChoice(
                'default',
                evId,
                evName,
                'buff',
                Number(payload.durationDays || 0),
                [`stability:${Number(payload.delta)}`],
                gs
              );
            }

            if (te) {
              addTemporaryEffect(gs, te);
            }
          }

          // 旧格式兼容：effects:[{type:'buff', payload:{ durationDays, consequences:[...] }}]
          if ((e.type === 'buff' || e.type === 'mixed') && Array.isArray(e.payload?.consequences) && e.payload?.durationDays > 0) {
            const te = createTemporaryEffectFromChoice(
              'default',
              evId,
              evName,
              e.type,
              Number(e.payload.durationDays || 0),
              e.payload.consequences,
              gs
            );
            if (te) addTemporaryEffect(gs, te);
          }
        }
      } catch (err) {
        // 静默失败，避免打断主流程
        const dbg = (globalThis as any)?.eventsV2?.debug;
        if (dbg) console.warn('[EventsV2][Adapter] temporary-effects bridge failed:', err);
      }

      // 冒险线运行态推进（节点效果→SP与节点状态；兼容 currentEvent 缺失的兜底）
      {
        const evIdFromModal = (currentEv && typeof currentEv.id === 'string') ? String(currentEv.id) : undefined;
        api.setState((st) => {
          const ex = st.gameState.exploration || {};
          const run = ex.adventureV2;
          if (!run) return st;

          // 1) 处理 spDelta 效果
          let newSP = run.currentSP ?? run.totalSP ?? 0;
          if (Array.isArray(effects)) {
            for (const e of effects) {
              if (e && e.type === 'spDelta') {
                const delta = Number(e.payload?.delta || 0);
                newSP = Math.max(0, Math.floor((newSP as number) + delta));
              }
            }
          }

          // 2) 解析需标记的节点ID：优先使用弹窗ID；若无则兜底为“final 且 pending”的节点
          let targetNodeId = evIdFromModal;
          if (!targetNodeId) {
            const pendingFinal = Array.isArray(run.nodes) ? run.nodes.find((n: any) => n?.kind === 'final' && n?.pending && !n?.resolved) : undefined;
            const pendingNode = pendingFinal ?? (Array.isArray(run.nodes) ? run.nodes.find((n: any) => n?.pending && !n?.resolved) : undefined);
            if (pendingNode?.id) targetNodeId = String(pendingNode.id);
          }

          // 3) 标记节点 resolved，并清理 pending；若是 final 则 finished=true
          let finished = !!run.finished;
          let nodes: any[] | undefined = Array.isArray(run.nodes) ? run.nodes : undefined;

          if (nodes) {
            if (targetNodeId) {
              nodes = nodes.map((n: any) => {
                if (n && n.id === targetNodeId) {
                  const updatedResolved = { ...n, resolved: true, pending: false };
                  if (String(targetNodeId).endsWith('_final') || n.kind === 'final') {
                    finished = true;
                  }
                  return updatedResolved;
                }
                return n;
              });
            } else {
              // 最强兜底：找最终节点（即使不 pending）直接置 resolved 并结束
              const finalNode = nodes.find((n: any) => n?.kind === 'final');
              if (finalNode) {
                nodes = nodes.map((n: any) => (n && n.id === finalNode.id ? { ...n, resolved: true, pending: false } : n));
                finished = true;
              }
            }
          }

          return {
            gameState: {
              ...st.gameState,
              exploration: {
                ...ex,
                adventureV2: {
                  ...run,
                  nodes,
                  currentSP: newSP,
                  finished
                }
              }
            }
          };
        });
      }

      // 发现类效果（最小实现）：写入探索发现，避免依赖复杂外交对象
      if (Array.isArray(effects)) {
        for (const e of effects) {
          if (!e) continue;
          if (e.type === 'discoverNation') {
            const id = `nation_${Date.now()}`;
            api.setState((st) => {
              const ex = st.gameState.exploration || {};
              const list = Array.isArray(ex.discoveredLocations) ? ex.discoveredLocations : [];
              return {
                gameState: {
                  ...st.gameState,
                  exploration: {
                    ...ex,
                    discoveredLocations: [...list, { id, kind: 'nation', name: '陌生国家', at: Date.now() }]
                  }
                }
              };
            });
          } else if (e.type === 'discoverDungeon') {
            const id = `dungeon_${Date.now()}`;
            api.setState((st) => {
              const ex = st.gameState.exploration || {};
              const list = Array.isArray(ex.discoveredLocations) ? ex.discoveredLocations : [];
              return {
                gameState: {
                  ...st.gameState,
                  exploration: {
                    ...ex,
                    discoveredLocations: [...list, { id, kind: 'dungeon', name: '未知地牢', at: Date.now() }]
                  }
                }
              };
            });
          }
        }
      }
    }
  };
}