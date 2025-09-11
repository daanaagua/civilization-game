'use client';

import { Home, Building, Beaker, Sword, Users, Map, Settings, Search } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'overview', label: '概览', icon: Home, description: '游戏总览和基础信息' },
  { id: 'buildings', label: '建筑', icon: Building, description: '建造和管理建筑' },
  { id: 'technology', label: '科技', icon: Beaker, description: '研发科技树' },
  { id: 'military', label: '军队', icon: Sword, description: '军队和战争' },
  { id: 'exploration', label: '探索', icon: Search, description: '探索未知领域' },
  { id: 'characters', label: '人物', icon: Users, description: '管理角色和人物' },
  { id: 'diplomacy', label: '外交', icon: Map, description: '与其他文明交往' },
  { id: 'settings', label: '设置', icon: Settings, description: '游戏设置' },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
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
                flex items-center space-x-2 px-6 py-4 whitespace-nowrap transition-colors border-b-2
                ${isActive 
                  ? 'bg-gray-700 text-white border-blue-500' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white border-transparent'
                }
              `}
              title={item.description}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}