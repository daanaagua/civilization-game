'use client';

import React, { useMemo } from 'react';
import { useGameStore } from '@/lib/game-store';
import type { PauseEvent } from '@/types/game';

export function EventModal() {
  const show = useGameStore(s => s.uiState.showEventModal);
  const current = useGameStore(s => s.uiState.currentEvent) as PauseEvent | undefined;
  const handleChoice = useGameStore(s => s.handlePauseEventChoice);
  const dismiss = useGameStore(s => s.dismissPauseEvent);

  const title = useMemo(() => {
    if (!current) return '';
    // 兼容 name/title
    return (current as any).title || (current as any).name || '事件';
  }, [current]);

  const description = useMemo(() => {
    if (!current) return '';
    return (current as any).description || '';
  }, [current]);

  if (!show || !current) return null;

  const hasOptions = Array.isArray(current.options) && current.options.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/60" />

      {/* 弹窗容器 */}
      <div className="relative max-h-[80vh] w-[min(720px,92vw)] overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow-xl">
        {/* 头部 */}
        <div className="border-b border-gray-700 px-5 py-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>

        {/* 内容 */}
        <div className="px-5 py-4">
          <p className="whitespace-pre-wrap text-gray-200">
            {description}
          </p>
        </div>

        {/* 选项/操作区 */}
        <div className="flex flex-wrap gap-3 border-t border-gray-700 px-5 py-4">
          {hasOptions ? (
            (current.options || []).map((opt, idx) => (
              <button
                key={opt.id || idx}
                onClick={() => handleChoice(current.id, idx)}
                className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {opt.text}
              </button>
            ))
          ) : (
            <button
              onClick={() => dismiss(current.id)}
              className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              知道了
            </button>
          )}
        </div>
      </div>
    </div>
  );
}