'use client';

import { useGameStore } from '@/lib/game-store';
import { globalEffectsSystem, EffectSourceType } from '@/lib/effects-system';

export function StabilityPanel() {
  const { gameState } = useGameStore();
  const stability = gameState.stability;
  const maxStability = 100;

  const stabilityPercentage = (stability / maxStability) * 100;
  
  const getStabilityColor = () => {
    if (stabilityPercentage >= 70) return 'bg-green-500';
    if (stabilityPercentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStabilityStatus = () => {
    if (stabilityPercentage >= 70) return '稳定';
    if (stabilityPercentage >= 40) return '一般';
    return '不稳定';
  };

  // 汇总人物来源的稳定度贡献
  const characterStabilityEffects = globalEffectsSystem
    .getEffectsBySourceType(EffectSourceType.CHARACTER)
    .filter((e: any) => e?.type === 'stability' || e?.type ===  'STABILITY');

  const ptContrib = new Map<string, number>();   // 点数类
  const pctContrib = new Map<string, number>();  // 百分比类

  characterStabilityEffects.forEach((e: any) => {
    const src = e?.source?.name || '人物';
    if (e?.isPercentage) {
      // 百分比：统一转为百分比数值
      const v = Number(e.value) * 100 || 0;
      pctContrib.set(src, (pctContrib.get(src) || 0) + v);
    } else {
      // 点数：直接累计
      const v = Number(e.value) || 0;
      ptContrib.set(src, (ptContrib.get(src) || 0) + v);
    }
  });

  const charPtEntries = Array.from(ptContrib.entries()).filter(([, v]) => Math.abs(v) > 0.0001);
  const charPctEntries = Array.from(pctContrib.entries()).filter(([, v]) => Math.abs(v) > 0.0001);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">⚖️</span>
        稳定度
      </h2>
      
      <div className="text-center">
        <div className="text-2xl font-bold mb-2">
          {stability.toFixed(2)}/{maxStability}
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${getStabilityColor()}`}
            style={{ width: `${Math.min(stabilityPercentage, 100)}%` }}
          />
        </div>
        
        <div className="text-sm text-gray-400 mb-4">
          状态: <span className={`font-semibold ${
            stabilityPercentage >= 70 ? 'text-green-400' :
            stabilityPercentage >= 40 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {getStabilityStatus()}
          </span>
        </div>
        
        <div className="text-xs text-gray-500">
          稳定度影响人口增长和资源生产效率
        </div>

        {(charPtEntries.length > 0 || charPctEntries.length > 0) && (
          <div className="mt-4 text-left">
            <div className="text-sm text-gray-300 mb-2">来源贡献</div>
            {/* 点数贡献 */}
            {charPtEntries.map(([src, val]) => (
              <div key={`stab-pt-${src}`} className="flex justify-between text-xs">
                <span className="text-gray-400">{src}:</span>
                <span className={val >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {val >= 0 ? `+${Math.round(val)}` : `${Math.round(val)}`}
                </span>
              </div>
            ))}
            {/* 百分比贡献 */}
            {charPctEntries.map(([src, val]) => (
              <div key={`stab-pct-${src}`} className="flex justify-between text-xs">
                <span className="text-gray-400">{src} (稳定度%):</span>
                <span className={val >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {val >= 0 ? `+${val.toFixed(2)}%` : `${val.toFixed(2)}%`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}