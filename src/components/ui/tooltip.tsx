'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  className = '',
  delay = 500 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const target = event.currentTarget;
    timeoutRef.current = setTimeout(() => {
      if (target) {
        const rect = target.getBoundingClientRect();
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
        setIsVisible(true);
      }
    }, 300);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={hideTooltip}
        className={className}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className="fixed z-50 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl max-w-xs pointer-events-none"
          style={{
            left: position.x,
            top: position.y - 10,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="text-white text-sm whitespace-pre-line">
            {content.split('\n').map((line, index) => {
              if (line.startsWith('•')) {
                return (
                  <div key={index} className="text-green-400 flex items-start mt-1">
                    <span className="mr-1">•</span>
                    <span>{line.substring(1).trim()}</span>
                  </div>
                );
              }
              return (
                <div key={index} className={index === 0 ? 'font-semibold mb-2' : 'text-gray-300'}>
                  {line}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default Tooltip;