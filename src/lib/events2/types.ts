// 基础类型定义，事件系统对外统一接口

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface EventChoice {
  id: string;
  text: string;
  description?: string;
}

export interface BaseEventData {
  id: string;
  title: string;
  description: string;
  priority?: Priority;
  category?: string;
  icon?: string;
}

export interface PauseEventData extends BaseEventData {
  options?: EventChoice[]; // 缺省或空数组时，视为单按钮“知道了”
  pause: true;
}

export interface NotifyEventData extends BaseEventData {
  pause?: false;
  durationMs?: number;
}

export type EventData = PauseEventData | NotifyEventData;

export interface EffectDescriptor {
  // 简化的效果描述，后续可扩展
  type: 'resource_delta' | 'stability_delta';
  target?: string;      // 资源键
  value: number;        // 变化值（资源可为正负；稳定度限定0-100）
}

export interface EventResolution {
  eventId: string;
  choiceIndex?: number; // 当有多选项时需要
  effects?: EffectDescriptor[]; // 解析后要应用的效果
}

export interface GameStateLike {
  // 仅抽象出本系统需要读取的字段，避免强耦合
  timeSystem?: {
    // 游戏当前“天”为单位
    currentDay?: number;
    // 起始日
    startDay?: number;
  };
  // 资源与稳定度用于最小可用的效果应用
  resources?: Record<string, number>;
  stability?: number;
}

export interface PluginContext {
  nowDay: number;
  getGameState: () => GameStateLike;
}

export interface EventProposal extends BaseEventData {
  pause?: boolean;
  options?: EventChoice[];
  // 插件可附带建议效果，最终解析时由引擎或外部 effectRunner 应用
  onResolveEffects?: EffectDescriptor[] | ((choiceIndex?: number) => EffectDescriptor[] | undefined);
}

export interface EventPlugin {
  id: string;
  // 周期性检查是否生成事件
  checkAndGenerate(ctx: PluginContext): EventProposal[] | void;
}

export interface EngineCallbacks {
  // 引擎判定为暂停事件时调用
  onPauseEvent: (e: PauseEventData) => void;
  // 普通通知
  onNotifyEvent: (e: NotifyEventData) => void;
  // 应用效果（可由 store 或外部效果系统实现）
  applyEffects?: (effects: EffectDescriptor[]) => void;
  // 日志钩子（可选）
  log?: (msg: string, extra?: any) => void;
}

export interface EngineConfig {
  pollIntervalMs?: number; // 默认 1000ms
}