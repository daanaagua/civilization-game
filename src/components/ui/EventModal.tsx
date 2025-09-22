'use client';

import React from 'react';
import { X } from 'lucide-react';
import { EventType } from '@/components/features/EventsPanel';
import type { GameEvent } from '@/components/features/EventsPanel';

interface EventModalProps {
  event: GameEvent | null;
  onClose: () => void; // 关闭并继续游戏（用于无选项事件或单按钮“知道了”）
  onSelectChoice?: (eventId: string, choiceId: string) => void; // 选择类事件的回调
}

export function EventModal({ event, onClose, onSelectChoice }: EventModalProps) {
  if (!event) return null;

  const isChoice = event.type === EventType.CHOICE && Array.isArray(event.choices) && event.choices.length > 0;

  // 紧凑视觉 + 居中布局
  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white truncate">{event.title || '事件'}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-5 py-4">
          <p className="text-gray-300 whitespace-pre-wrap leading-snug">{event.description || ''}</p>
        </div>

        {/* 选项（居中排列） */}
        <div className="px-5 pb-5">
          {isChoice ? (
            <div className="flex flex-col items-center gap-2">
              {event.choices!.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => onSelectChoice?.(event.id, choice.id)}
                  className="min-w-[220px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
                >
                  {choice.text}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <button
                onClick={onClose}
                className="min-w-[180px] px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors text-sm"
              >
                知道了
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventModal;