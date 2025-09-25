export type EventPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface EventMeta {
  // 节流/记录策略
  doNotRecordInLatest?: boolean;   // 节点事件：不进“最新事件栏”
  recordInLatest?: boolean;        // 终局事件：进“最新事件栏”
  pausesGame?: boolean;            // 是否暂停游戏（Choice 默认 true）
}

export interface BaseEvent {
  id: string;
  title: string;
  description?: string;
  priority?: EventPriority;
  timestamp?: number;
  icon?: string;
  category?: string;
  meta?: EventMeta;
}

export interface ChoiceOption {
  id: string;
  text: string;                  // 按钮文本（允许只有一个“知道了”）
  effects?: any[];               // 统一效果结构，交给适配器应用
}

export interface ChoiceEvent extends BaseEvent {
  kind: 'choice';
  options: ChoiceOption[];       // 至少一个；允许只有一个“知道了”
}

export interface NotificationEvent extends BaseEvent {
  kind: 'notification';
  duration?: number;             // 仅 UI 提示，不暂停
}

export type GameEventV2 = ChoiceEvent | NotificationEvent;

export interface EventSource {
  id: string;
  // 由调度器调用，返回零个或多个事件（不要直接修改全局状态）
  poll(): Promise<GameEventV2[] | GameEventV2[]>;
}

export interface EventsAdapter {
  // 读
  isPaused(): boolean;
  getNow(): number;
  // 旧系统兼容：是否有旧系统的暂停事件在队列中
  hasLegacyPauseQueue(): boolean;
  // 当前正在显示的弹窗事件ID（可选）
  getCurrentModalId?(): string | undefined;
  // 写：暂停/恢复
  pause(): void;
  resume(): void;
  // 写：UI 弹窗（全局，不受当前选项卡影响）
  showModal(ev: ChoiceEvent): void;
  updateModal(ev: ChoiceEvent | undefined): void;
  hideModal(): void;
  // 写：记录
  appendHistory(item: BaseEvent & { isResolved: boolean }): void;
  appendLatest(item: BaseEvent & { isResolved: boolean }): void;
  // 写：应用效果
  applyEffects(effects: any[]): void;
}