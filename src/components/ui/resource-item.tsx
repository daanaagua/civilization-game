'use client';

import React from 'react';
import { Tooltip } from '@/components/ui/tooltip';
import { formatNumber } from '@/lib/utils';

interface ResourceItemProps {
  name: string;
  value: number;
  limit?: number;
  rate?: number;
  tooltipContent: string;
  onClick?: () => void;
  className?: string;
}

export const ResourceItem: React.FC<ResourceItemProps> = ({
  name,
  value,
  limit,
  rate,
  tooltipContent,
  onClick,
  className = ''
}) => {
  const hasLimit = limit !== undefined;
  const hasRate = rate !== undefined;
  const isClickable = onClick !== undefined;

  return (
    <Tooltip content={tooltipContent}>
      <div 
        className={`flex justify-between items-center p-1 rounded transition-colors ${
          isClickable ? 'cursor-pointer hover:bg-gray-700' : ''
        } ${className}`}
        onClick={onClick}
      >
        <div className="flex flex-col">
          <span className="text-sm text-gray-400">{name}</span>
          {hasRate && (
            <span className="text-xs text-gray-500">
              {rate >= 0 ? '+' : ''}{rate.toFixed(1)}/s
            </span>
          )}
        </div>
        <span className="text-sm text-yellow-400 font-medium">
          {formatNumber(value)}{hasLimit ? `/${formatNumber(limit)}` : ''}
        </span>
      </div>
    </Tooltip>
  );
};