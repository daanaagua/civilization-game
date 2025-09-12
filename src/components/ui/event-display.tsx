'use client';

import React from 'react';
import { useGameStore } from '@/lib/game-store';
import { GameEventInstance } from '@/types/game';
import { Clock, AlertTriangle, Compass, Zap } from 'lucide-react';

interface EventDisplayProps {
  className?: string;
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'exploration':
      return <Compass className="w-4 h-4" />;
    case 'disaster':
      return <AlertTriangle className="w-4 h-4" />;
    case 'discovery':
      return <Zap className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'exploration':
      return 'text-blue-400';
    case 'disaster':
      return 'text-red-400';
    case 'discovery':
      return 'text-yellow-400';
    default:
      return 'text-gray-400';
  }
};

const EventItem: React.FC<{ event: GameEventInstance }> = ({ event }) => {
  const { resolveEvent } = useGameStore();
  
  const handleChoice = (choiceId: string) => {
    resolveEvent(event.id, choiceId);
  };
  
  const handleDismiss = () => {
    resolveEvent(event.id);
  };
  
  return (
    <div className={`p-3 rounded-lg border ${
      event.pausesGame 
        ? 'bg-red-900/20 border-red-500/30' 
        : 'bg-slate-800/50 border-slate-600/30'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${getEventTypeColor(event.type)}`}>
          {getEventIcon(event.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-white">{event.name}</h4>
            {event.pausesGame && (
              <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                需要决策
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-300 mb-3">{event.description}</p>
          
          {event.choices ? (
            <div className="space-y-2">
              {event.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoice(choice.id)}
                  className="w-full text-left p-2 rounded bg-slate-700/50 hover:bg-slate-600/50 transition-colors text-sm text-gray-200"
                >
                  {choice.text}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={handleDismiss}
              className="px-3 py-1 text-xs bg-slate-600/50 hover:bg-slate-500/50 text-gray-300 rounded transition-colors"
            >
              确认
            </button>
          )}
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
        {activeEvents.map((event) => (
          <EventItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

export default EventDisplay;