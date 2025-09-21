'use client';

import React from 'react';
import { useGameStore } from '@/lib/game-store';
import { CountryCard } from './country-card';
import { Users as Handshake } from 'lucide-react';

interface DiplomacyTabProps {
  gameState: any;
  onUpdateGameState: (updates: any) => void;
}

export function DiplomacyTab({ gameState, onUpdateGameState }: DiplomacyTabProps) {
  const {
    getDiscoveredCountries,
    getCountryRelationship,
    tradeWithCountry,
    giftToCountry,
    declareWar,
    hireMercenary,
    canAfford
  } = useGameStore();

  // 统一选择器：获取已研究科技集合
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getResearchedSet, hasCapability } = require('@/lib/selectors');
  const researchedSet: Set<string> = getResearchedSet(gameState);
  

  const discoveredCountries = getDiscoveredCountries();

  // 渲染国家卡片列表
  const renderCountriesList = () => {
    if (discoveredCountries.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">
          <Handshake className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">还没有发现任何国家</h3>
          <p className="text-sm">通过探索来发现其他文明，开启外交关系</p>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {discoveredCountries.map((country) => {
          const relationship = getCountryRelationship(country.id);
          return (
            <CountryCard
              key={country.id}
              country={country}
              relationship={relationship}
              gameState={gameState}
              onTrade={tradeWithCountry}
              onGift={giftToCountry}
              onDeclareWar={declareWar}
              onHireMercenary={hireMercenary}
              canAfford={canAfford}
            />
          );
        })}
      </div>
    );
  };

  const diplomatUnlocked = hasCapability(gameState, 'cap.diplomacy') || researchedSet.has('diplomat_training');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Handshake className="w-6 h-6" />
        <h2 className="text-2xl font-bold">外交系统</h2>
      </div>

      {!diplomatUnlocked ? (
        <div className="bg-blue-900/30 border border-blue-700 text-blue-200 p-4 rounded">
          需要研究“外交官训练”后才能与已发现国家进行贸易、赠礼和宣战等互动
        </div>
      ) : (
        renderCountriesList()
      )}
    </div>
  );
}

export default DiplomacyTab;