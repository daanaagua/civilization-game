'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertCircle, Info } from 'lucide-react';
import { GameEvent, EventType } from '@/components/features/EventsPanel';

interface EventNotificationToastProps {
  event: GameEvent | null;
  onClose: () => void;
  onViewEvent: () => void;
}

export function EventNotificationToast({ event, onClose, onViewEvent }: EventNotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (event) {
      setIsVisible(true);
      setIsExiting(false);
      
      // 如果是无需选择的事件，5秒后自动关闭
      if (event.type !== EventType.CHOICE) {
        const timer = setTimeout(() => {
          handleClose();
        }, 5000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [event]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const handleViewEvent = () => {
    handleClose();
    onViewEvent();
  };

  if (!event || !isVisible) {
    return null;
  }

  const getNotificationContent = () => {
    if (event.type === EventType.CHOICE) {
      return {
        title: '有事件需要您确认',
        message: event.title,
        icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
        bgColor: 'bg-orange-50 border-orange-200',
        textColor: 'text-orange-800',
        buttonText: '查看事件'
      };
    } else {
      // 根据事件类型显示不同的消息
      let message = '';
      if (event.title.includes('冒险') || event.title.includes('探索') || event.title.includes('侦察')) {
        message = '冒险结束了';
      } else if (event.title.includes('境内') || event.title.includes('领土')) {
        message = '境内发生了新事件';
      } else if (event.title.includes('人物') || event.title.includes('角色')) {
        message = '人物发生了新事件';
      } else {
        message = '发生了新事件';
      }
      
      return {
        title: message,
        message: event.title,
        icon: <Info className="w-5 h-5 text-blue-500" />,
        bgColor: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-800',
        buttonText: '查看详情'
      };
    }
  };

  const content = getNotificationContent();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`
          ${content.bgColor} border-2 rounded-lg shadow-lg p-4 max-w-sm
          transform transition-all duration-300 ease-in-out
          ${
            isExiting
              ? 'translate-x-full opacity-0'
              : 'translate-x-0 opacity-100'
          }
        `}
      >
        <div className="flex items-start space-x-3">
          {content.icon}
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium ${content.textColor} text-sm`}>
              {content.title}
            </h4>
            <p className={`${content.textColor} text-xs mt-1 opacity-80`}>
              {content.message}
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`${content.textColor} hover:opacity-70 transition-opacity`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <button
            onClick={handleViewEvent}
            className="bg-white text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-50 transition-colors border"
          >
            {content.buttonText}
          </button>
          {event.type !== EventType.CHOICE && (
            <button
              onClick={handleClose}
              className="text-gray-500 px-3 py-1 rounded text-xs hover:text-gray-700 transition-colors"
            >
              忽略
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventNotificationToast;