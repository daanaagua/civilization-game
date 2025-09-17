'use client';

import { Home, Building, Beaker, Sword, Users, Map, Search } from 'lucide-react';
import type { GameTab } from '@/types/game';

interface TabNavigationProps {
  activeTab: GameTab;
  onTabChange: (tab: GameTab) => void;
  hasUnreadEvents?: boolean;
}

type MenuItem = { id: GameTab; label: string; icon: typeof Home; description: string };
const menuItems: MenuItem[] = [
  { id: 'overview', label: '概览', icon: Home, description: '游戏总览和基础信息' },
  { id: 'buildings', label: '建筑', icon: Building, description: '建造和管理建筑' },
  { id: 'technology', label: '科技', icon: Beaker, description: '研发科技树' },
  { id: 'military', label: '军队', icon: Sword, description: '军队和战争' },
  { id: 'exploration', label: '探索', icon: Search, description: '探索未知领域' },
  { id: 'characters', label: '人物', icon: Users, description: '管理角色和人物' },
  { id: 'diplomacy', label: '外交', icon: Map, description: '与其他文明交往' },
];

export function TabNavigation({ activeTab, onTabChange, hasUnreadEvents = false }: TabNavigationProps) {
  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="flex overflow-x-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                flex items-center space-x-2 px-6 py-4 whitespace-nowrap transition-colors border-b-2 relative
                ${isActive 
                  ? 'bg-gray-700 text-white border-blue-500' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white border-transparent'
                }
              `}
              title={item.description}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
              {/* 红点标记 - 仅在概览选项卡且有未读事件时显示 */}
              {item.id === 'overview' && hasUnreadEvents && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-800"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}