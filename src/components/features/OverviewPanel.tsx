'use client';

import { GameStatsPanel } from './GameStatsPanel';
import { EffectsPanel } from './EffectsPanel';
import { EventsPanel, type GameEvent } from './EventsPanel';
import { useEffects } from '@/hooks/use-effects';

export interface OverviewPanelProps {
  events: GameEvent[];
  onMarkAsRead: (eventId: string) => void;
  onChoiceSelect: (eventId: string, choiceId: string) => void;
}

export function OverviewPanel({ events, onMarkAsRead, onChoiceSelect }: OverviewPanelProps) {
  const { activeEffects } = useEffects();
  
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-white mb-2">文明概览</h1>
          <p className="text-gray-400">管理你的文明，从原始部落发展到强大帝国</p>
        </div>
      </div>

      {/* 当前效果面板 */}
      <EffectsPanel effects={activeEffects} />
      
      {/* 事件面板 */}
      <EventsPanel 
        events={events}
        onMarkAsRead={onMarkAsRead}
        onChoiceSelect={onChoiceSelect}
      />
      
      {/* 主要信息面板：移除人口面板，统一在侧边栏展示人口 */}
      <div className="space-y-6">
        <GameStatsPanel />
      </div>
      
      {/* 游戏提示 */}
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-400 text-xl">💡</div>
          <div>
            <h3 className="text-blue-300 font-semibold mb-1">游戏提示</h3>
            <p className="text-blue-200 text-sm">
              建造更多建筑来扩展人口容量和发展文明。通过科技研发解锁新的建筑和功能。
              合理管理人口分配以提高文明效率。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}