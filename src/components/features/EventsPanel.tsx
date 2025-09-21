'use client';

import React, { useState } from 'react';
import { Clock, History, AlertCircle, HelpCircle, ChevronRight, X } from 'lucide-react';
import { useGameStore } from '@/lib/game-store';
import { checkChoiceAvailability, getResourceDisplayName } from '@/lib/event-utils';

// 事件类型枚举
export enum EventType {
  NOTIFICATION = 'notification', // 提示性事件
  CHOICE = 'choice' // 选择性事件
}

// 事件优先级
export enum EventPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 事件选项接口
export interface EventChoice {
  id: string;
  text: string;
  description?: string;
  consequences?: string[];
  requirements?: {
    unlockedResources?: string[]; // 需要解锁的资源
    resourceCost?: Record<string, number>; // 资源消耗需求
  };
  disabled?: boolean;
  effectType?: 'immediate' | 'buff' | 'mixed'; // 效果类型
  duration?: number; // buff效果持续时间（天）
  // 新增：与事件系统保持一致的可选效果负载
  effects?: {
    type: 'resource_production' | 'resource_income' | 'resource_percentage' | 'resource_per_population';
    target?: string;
    modifier?: number;
    duration?: number;
  } | null;
}

// 事件接口
export interface GameEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  priority: EventPriority;
  timestamp: number;
  duration?: number; // 事件持续时间（毫秒），用于自动消失
  choices?: EventChoice[]; // 选择性事件的选项
  consequences?: string[]; // 事件后果
  isRead?: boolean; // 是否已读
  isResolved?: boolean; // 是否已处理
  selectedChoiceId?: string; // 已选择的选项ID
  icon?: string;
  category?: string; // 事件分类
}

type DisplayEvent = {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  type?: string; // 'notification' | 'choice' | 'positive' | 'negative' | 'neutral' | ...
  priority?: string; // 'low' | 'medium' | 'high' | 'urgent' | ...
  timestamp?: number;
  duration?: number;
  choices?: any[];
  consequences?: string[];
  isRead?: boolean;
  isResolved?: boolean;
  selectedChoiceId?: string;
  icon?: string;
  category?: string;
};

// 事件项组件
interface EventItemProps {
  event: DisplayEvent;
  onChoiceSelect?: (eventId: string, choiceId: string) => void;
  onMarkAsRead?: (eventId: string) => void;
  isCompact?: boolean;
}

function EventItem({ event, onChoiceSelect, onMarkAsRead, isCompact = false }: EventItemProps) {
  // 选择事件默认展开，通知事件默认不展开
  const [isExpanded, setIsExpanded] = useState(event.type === 'choice' && !event.isResolved);
  const gameState = useGameStore(state => state.gameState);

  const getPriorityColor = (priority: EventPriority) => {
    switch (priority) {
      case EventPriority.URGENT:
        return 'border-red-500 bg-red-900/20';
      case EventPriority.HIGH:
        return 'border-orange-500 bg-orange-900/20';
      case EventPriority.MEDIUM:
        return 'border-yellow-500 bg-yellow-900/20';
      case EventPriority.LOW:
        return 'border-blue-500 bg-blue-900/20';
      default:
        return 'border-gray-500 bg-gray-900/20';
    }
  };

  const getEventIcon = () => {
    if (event.icon) return event.icon;
    return event.type === 'choice' ? '❓' : 'ℹ️';
  };

  const formatTimestamp = (timestamp: number) => {
    // 使用游戏时间而不是系统时间
    const gameStartTime = gameState.timeSystem.startTime;
    const currentGameTime = gameState.gameTime * 1000; // 转换为毫秒
    const eventGameTime = timestamp - gameStartTime; // 事件发生时的游戏时间偏移
    const diff = currentGameTime - eventGameTime; // 游戏时间差
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  const handleChoiceSelect = (choiceId: string) => {
    onChoiceSelect?.(event.id, choiceId);
  };

  const handleMarkAsRead = () => {
    if (!event.isRead) {
      onMarkAsRead?.(event.id);
    }
  };

  return (
    <div 
      className={`border rounded-lg p-3 transition-all duration-200 hover:shadow-lg ${
        getPriorityColor(event.priority)
      } ${!event.isRead ? 'ring-2 ring-blue-400/50' : ''} ${
        isCompact ? 'text-sm' : ''
      }`}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{getEventIcon()}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-semibold text-white truncate ${
              isCompact ? 'text-sm' : 'text-base'
            }`}>
              {event.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock size={12} />
              <span>{formatTimestamp(event.timestamp)}</span>
            </div>
          </div>
          
          <p className={`text-gray-300 mb-2 ${
            isCompact ? 'text-xs line-clamp-2' : 'text-sm'
          }`}>
            {event.description}
          </p>
          
          {event.type === 'choice' && event.choices && (
            <div className="space-y-2">
              {!event.isResolved ? (
                // 未解决的选择事件 - 显示所有选项（默认展开）
                <>
                  <div className="text-xs text-gray-400 mb-2">请选择你的行动：</div>
                  <div className="space-y-1">
                    {event.choices.map((choice) => {
                      const availability = checkChoiceAvailability(choice, gameState);
                      const isDisabled = availability.isDisabled || choice.disabled;
                      
                      return (
                        <button
                          key={choice.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isDisabled) {
                              handleChoiceSelect(choice.id);
                            }
                          }}
                          disabled={isDisabled}
                          className={`w-full text-left p-2 rounded border transition-colors ${
                            isDisabled
                              ? 'border-gray-600 bg-gray-800 text-gray-500 cursor-not-allowed'
                              : 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm">
                              {!availability.isUnlocked ? '【暂未解锁该选项】' : choice.text}
                            </span>
                            {!isDisabled && <ChevronRight size={14} />}
                          </div>
                          {choice.description && (
                            <p className="text-xs text-gray-400 mt-1">{choice.description}</p>
                          )}
                          {availability.disabledReason && (
                            <p className="text-xs text-red-400 mt-1">{availability.disabledReason}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                // 已解决的选择事件 - 只显示已选择的选项
                event.selectedChoiceId && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-400 mb-2">已选择的行动：</div>
                    {(() => {
                      const selectedChoice = event.choices.find(choice => choice.id === event.selectedChoiceId);
                      return selectedChoice ? (
                        <div className="p-2 rounded border border-green-600 bg-green-900/20 text-white">
                          <div className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            <span className="text-sm">{selectedChoice.text}</span>
                          </div>
                          {selectedChoice.description && (
                            <p className="text-xs text-gray-400 mt-1 ml-6">{selectedChoice.description}</p>
                          )}
                        </div>
                      ) : null;
                    })()} 
                  </div>
                )
              )}
            </div>
          )}
          
          {event.isResolved && (
            <div className="text-xs text-green-400 flex items-center gap-1">
              <span>✓</span>
              <span>已处理</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 历史事件弹窗组件
interface EventHistoryModalProps {
  events: DisplayEvent[];
  isOpen: boolean;
  onClose: () => void;
  onChoiceSelect?: (eventId: string, choiceId: string) => void;
  onMarkAsRead?: (eventId: string) => void;
}

function EventHistoryModal({ 
  events, 
  isOpen, 
  onClose, 
  onChoiceSelect, 
  onMarkAsRead 
}: EventHistoryModalProps) {
  const [filter, setFilter] = useState<'all' | EventType | 'unresolved'>('all');
  const [sortBy, setSortBy] = useState<'time' | 'priority'>('time');

  if (!isOpen) return null;

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'unresolved') return !event.isResolved && event.type === 'choice';
    if (filter === EventType.CHOICE) return event.type === 'choice';
    if (filter === EventType.NOTIFICATION) return event.type === 'notification';
    return true;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === 'time') {
      return b.timestamp - a.timestamp;
    } else {
      const priorityOrder = {
        [EventPriority.URGENT]: 4,
        [EventPriority.HIGH]: 3,
        [EventPriority.MEDIUM]: 2,
        [EventPriority.LOW]: 1
      };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">历史事件</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex items-center gap-4 p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">筛选：</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            >
              <option value="all">全部</option>
              <option value={EventType.NOTIFICATION}>提示事件</option>
              <option value={EventType.CHOICE}>选择事件</option>
              <option value="unresolved">未处理</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">排序：</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            >
              <option value="time">时间</option>
              <option value="priority">优先级</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-400">
            共 {sortedEvents.length} 条事件
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {sortedEvents.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                onChoiceSelect={onChoiceSelect}
                onMarkAsRead={onMarkAsRead}
              />
            ))}
          </div>
          
          {sortedEvents.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <AlertCircle size={48} className="mx-auto mb-2 opacity-50" />
              <p>没有找到符合条件的事件</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 主要的事件面板组件
interface EventsPanelProps {
  onChoiceSelect?: (eventId: string, choiceId: string) => void;
  onMarkAsRead?: (eventId: string) => void;
  className?: string;
}

export function EventsPanel({ 
  onChoiceSelect, 
  onMarkAsRead, 
  className 
}: EventsPanelProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // 统一从 store 读取事件数据源
  const gameState = useGameStore(s => s.gameState);
  const events = (gameState.events as unknown as DisplayEvent[]) || [];
  const recentEvents = (gameState.recentEvents as unknown as DisplayEvent[]) || [];

  // 未读事件数量（字段可能不存在，按可选处理）
  const unreadCount = events.filter(event => !event.isRead).length;
  
  // 未处理的选择事件数量（按字符串类型判断）
  const unresolvedChoiceCount = events.filter(
    event => event.type === 'choice' && !event.isResolved
  ).length;



  return (
    <>
      <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className || ''}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-blue-400" size={20} />
            <h2 className="text-lg font-bold text-white">最新事件</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <History size={16} />
            <span>历史事件</span>
            {unresolvedChoiceCount > 0 && (
              <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
                {unresolvedChoiceCount}
              </span>
            )}
          </button>
        </div>
        
        <div className="p-4">
          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <EventItem
                  key={event.id}
                  event={event}
                  onChoiceSelect={onChoiceSelect}
                  onMarkAsRead={onMarkAsRead}
                  isCompact
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <AlertCircle size={48} className="mx-auto mb-2 opacity-50" />
              <p>暂无事件</p>
              <p className="text-sm mt-1">你的文明正在平静发展中...</p>
            </div>
          )}
        </div>
      </div>
      
      <EventHistoryModal
        events={events}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onChoiceSelect={onChoiceSelect}
        onMarkAsRead={onMarkAsRead}
      />
    </>
  );
}