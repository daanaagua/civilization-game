'use client';

import { useGameStore } from '@/lib/game-store';

export function TechnologyPanel() {
  const { currentResearch, technologies } = useGameStore();

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">🔬</span>
        科技研发
      </h2>
      
      <div className="text-center text-gray-400 py-8">
        <div className="text-4xl mb-2">🚧</div>
        <div>科技系统开发中...</div>
        <div className="text-sm mt-2">即将推出更多科技选项</div>
      </div>
    </div>
  );
}