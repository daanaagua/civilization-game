"use client";

import React from 'react';
import { useGameStore } from '@/lib/game-store';
import { ActiveEvent } from '@/types/game';
import { Clock, AlertTriangle, Compass, Zap } from 'lucide-react';

interface EventDisplayProps {
  className?: string;
}

const getEventIcon = (category: string) => {
  switch (category) {
    case 'diplomatic':
      return <Compass className="w-4 h-4" />;
    case 'crisis':
      return <AlertTriangle className="w-4 h-4" />;
    case 'character':
      return <Zap className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const getEventTypeColor = (category: string) => {
  switch (category) {
    case 'diplomatic':
      return 'text-blue-400';
    case 'crisis':
      return 'text-red-400';
    case 'character':
      return 'text-yellow-400';
    default:
      return 'text-gray-400';
  }
};

const EventItem: React.FC<{ event: ActiveEvent }> = ({ event }) => {
  const { handlePauseEventChoice } = useGameStore();

  const onChoose = (index: number) => {
    handlePauseEventChoice(event.event.id, index);
  };

  return (
    <div className={`p-3 rounded-lg border bg-red-900/20 border-red-500/30`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${getEventTypeColor(event.event.category)}`}>
          {getEventIcon(event.event.category)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-white">{event.event.name}</h4>
            <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
              需要决策
            </span>
          </div>

          <p className="text-sm text-gray-300 mb-3">{event.event.description}</p>

          <div className="space-y-2">
            {event.event.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => onChoose(index)}
                className="w-full text-left p-2 rounded bg-slate-700/50 hover:bg-slate-600/50 transition-colors text-sm text-gray-200"
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const EventDisplay: React.FC<EventDisplayProps> = ({ className = '' }) => {
  const { gameState } = useGameStore();
  const { activeEvents } = gameState;

  if (activeEvents.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">当前事件</h3>
        </div>

        <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-600/30">
          <p className="text-gray-400 text-center">暂无活跃事件</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">当前事件</h3>
        <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">
          {activeEvents.length}
        </span>
      </div>

      <div className="space-y-3">
        {activeEvents.map((ev) => (
          <EventItem key={ev.event.id} event={ev} />
        ))}
      </div>
    </div>
  );
};

export default EventDisplay;