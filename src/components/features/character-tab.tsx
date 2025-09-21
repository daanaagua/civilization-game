'use client';

import React, { useState, useEffect } from 'react';
import { Character, CharacterType, HealthStatus, CharacterPosition } from '../../types/character';
import { useGameStore } from '@/lib/game-store';

interface CharacterTabProps {
  // 可以添加props如果需要
}

export function CharacterTab({}: CharacterTabProps) {
  const { getActiveCharacters, getAvailableCharacters, appointCharacter, dismissCharacter } = useGameStore();
  const gameState = useGameStore((s) => s.gameState);
  const [selectedCharacterType, setSelectedCharacterType] = useState<CharacterType | null>(null);
  const [showAppointment, setShowAppointment] = useState(false);
 
  // 属性以金色五角星显示（0-10星，取整且钳制）
  const renderStars = (n: number) => {
    const count = Math.max(0, Math.min(10, Math.round(n || 0)));
    return '★'.repeat(count);
  };
 
  // 以“职位”为驱动渲染，直接读取按职位在职映射，避免出现“职位空缺”占位
  const byPosition = useGameStore((s) => (s.gameState.characterSystem as any)?.activeByPosition || {}) as Record<string, Character | null>;

  // 职位→类型映射（保持与 store 一致）
  const posToType: Record<string, CharacterType> = {
    chief: CharacterType.RULER,
    elder: CharacterType.RESEARCH_LEADER,
    high_priest: CharacterType.FAITH_LEADER,
    archmage: CharacterType.MAGE_LEADER,
    chief_judge: CharacterType.CIVIL_LEADER,
    general: CharacterType.GENERAL,
    diplomat: CharacterType.DIPLOMAT,
    // 进阶职位归属同一类型
    king: CharacterType.RULER,
    emperor: CharacterType.RULER,
    president: CharacterType.RULER,
    grand_scholar: CharacterType.RESEARCH_LEADER,
    academy_head: CharacterType.RESEARCH_LEADER,
    archbishop: CharacterType.FAITH_LEADER,
    pope: CharacterType.FAITH_LEADER,
    royal_archmage: CharacterType.MAGE_LEADER,
    speaker: CharacterType.CIVIL_LEADER,
    grand_marshal: CharacterType.GENERAL
  };

  const unlockedPositions = (gameState?.characterSystem?.unlockedPositions || []) as string[];
  // 仅渲染“已解锁且已就任”的职位卡片（未就任的职位不显示，满足“永不出现空缺”）
  const positionEntries = unlockedPositions
    .map((pos) => ({ pos, character: byPosition[pos] || null, type: posToType[pos] }))
    .filter((e) => !!e.character);
  
  // 获取可用人物
  const availableCharacters = (getAvailableCharacters?.() || []) as Character[];



  // 处理任命人物（需要职位参数）
  const handleAppointCharacter = (characterId: string, position: CharacterPosition) => {
    if (appointCharacter?.(characterId, position)) {
      setShowAppointment(false);
      setSelectedCharacterType(null);
    }
  };

  // 处理解除职务
  const handleDismissCharacter = (characterId: string) => {
    dismissCharacter?.(characterId);
  };

  // 获取健康状态显示
  const getHealthStatusDisplay = (status: HealthStatus) => {
    const statusMap = {
      [HealthStatus.GOOD]: { text: '好', color: 'text-emerald-400' },
      [HealthStatus.FAIR]: { text: '中', color: 'text-amber-400' },
      [HealthStatus.POOR]: { text: '差', color: 'text-rose-400' }
    };
    return statusMap[status];
  };

  // 获取人物类型显示名称
  const getCharacterTypeDisplay = (type: CharacterType) => {
    const typeMap = {
      [CharacterType.RULER]: '统治者',
      [CharacterType.RESEARCH_LEADER]: '科研领袖',
      [CharacterType.FAITH_LEADER]: '信仰领袖',
      [CharacterType.MAGE_LEADER]: '法师领袖',
      [CharacterType.CIVIL_LEADER]: '文官领袖',
      [CharacterType.GENERAL]: '将领',
      [CharacterType.DIPLOMAT]: '外交官'
    };
    return typeMap[type];
  };

  // 获取职位显示名称（支持从职位字符串直接获取）
  const getPositionDisplay = (character: Character) => {
    const positionMap = {
      'chief': '酋长',
      'elder': '长老',
      'high_priest': '大祭司',
      'archmage': '大法师',
      'chief_judge': '大法官',
      'general': '将军',
      'diplomat': '外交官',
      'king': '国王',
      'emperor': '皇帝',
      'president': '总统',
      'grand_scholar': '大学者',
      'academy_head': '皇家科学院长',
      'archbishop': '大主教',
      'pope': '教皇',
      'royal_archmage': '皇家大法师',
      'speaker': '议长',
      'grand_marshal': '大元帅'
    };
    return positionMap[character.position as keyof typeof positionMap] || character.position;
  };

  // 渲染在职人物（仅展示已就任的职位卡片）
  const renderActiveCharacters = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-100">在职人物</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {positionEntries.map(({ pos, character, type }) => (
            <div key={pos} className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-2xl ring-1 ring-gray-600 p-4 w-64 min-h-[20rem] shadow-lg">
              {/* 肖像占位（后续可替换为真实肖像） */}
              <div className="mb-3">
                <div className="w-full h-28 bg-gray-600/40 rounded-md flex items-center justify-center text-xs text-gray-300">
                  肖像占位
                </div>
              </div>

              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-amber-300">
                    {getCharacterTypeDisplay((type || CharacterType.RULER) as CharacterType)}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {character ? getPositionDisplay(character) : ''}
                  </p>
                </div>
              </div>

              {character && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      {character.name}
                      {(() => {
                        const genderLabel = character.gender === 'female' ? '女' : '男';
                        return ` · ${genderLabel} · ${character.age}`;
                      })()}
                    </span>
                    <span className={`text-sm ${getHealthStatusDisplay(character.healthStatus).color}`}>
                      健康: {getHealthStatusDisplay(character.healthStatus).text}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="text-left">
                      <span className="text-gray-400">武力 </span>
                      <span className="font-medium text-amber-400">{renderStars(character.attributes.force)}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-gray-400">智力 </span>
                      <span className="font-medium text-amber-400">{renderStars(character.attributes.intelligence)}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-gray-400">魅力 </span>
                      <span className="font-medium text-amber-400">{renderStars(character.attributes.charisma)}</span>
                    </div>
                  </div>

                  {character.traits.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-600 mb-1">特性:</div>
                      <div className="flex flex-wrap gap-1">
                        {character.traits.map((trait, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded text-xs ${
                              trait.type === 'positive'
                                ? 'bg-green-100 text-green-800'
                                : trait.type === 'negative'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                            title={trait.description}
                          >
                            {trait.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {character.buffs.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-600 mb-1">Buff:</div>
                      <div className="flex flex-wrap gap-1">
                        {character.buffs.map((buff, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                            title={buff.description}
                          >
                            {buff.name}
                            {buff.remainingTurns && buff.remainingTurns > 0 && (
                              <span className="ml-1">({buff.remainingTurns})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染可用人物
  const renderAvailableCharacters = () => {
    if (!showAppointment || !selectedCharacterType) return null;
    
    const candidates = availableCharacters.filter(char => char.type === selectedCharacterType);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              选择{getCharacterTypeDisplay(selectedCharacterType)}
            </h3>
            <button
              onClick={() => {
                setShowAppointment(false);
                setSelectedCharacterType(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          {candidates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.map(character => (
                <div key={character.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{character.name}</h4>
                      <p className="text-sm text-gray-600">{getPositionDisplay(character)}</p>
                      <p className="text-sm text-gray-500">年龄: {character.age}岁</p>
                    </div>
                    <span className={`text-sm ${getHealthStatusDisplay(character.healthStatus).color}`}>
                      健康: {getHealthStatusDisplay(character.healthStatus).text}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm mb-3">
                    <div className="text-left">
                      <span className="text-gray-500">武力 </span>
                      <span className="font-medium text-amber-500">{renderStars(character.attributes.force)}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-gray-500">智力 </span>
                      <span className="font-medium text-amber-500">{renderStars(character.attributes.intelligence)}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-gray-500">魅力 </span>
                      <span className="font-medium text-amber-500">{renderStars(character.attributes.charisma)}</span>
                    </div>
                  </div>
                  
                  {character.traits.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-600 mb-1">特性:</div>
                      <div className="flex flex-wrap gap-1">
                        {character.traits.map((trait, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded text-xs ${
                              trait.type === 'positive'
                                ? 'bg-green-100 text-green-800'
                                : trait.type === 'negative'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                            title={trait.description}
                          >
                            {trait.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      忠诚度: {character.loyalty}%
                    </span>
                    <button
                      onClick={() => handleAppointCharacter(character.id, character.position)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      任命
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">暂无可用的{getCharacterTypeDisplay(selectedCharacterType)}候选人</p>
              <p className="text-sm text-gray-400 mt-2">请等待新的候选人出现或满足解锁条件</p>
            </div>
          )}
        </div>
      </div>
    );
  };



  return (
    <div className="space-y-6">
      {/* 在职人物 */}
      {renderActiveCharacters()}
      
      {/* 人物系统提示：自动解锁与自动继任 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-sm text-gray-300">
        提示：人物由对应科技自动解锁并自动上岗；当人物死亡后，系统会自动生成同类型的继任者并就任。
      </div>
    </div>
  );
}