'use client';

import React, { useState, useEffect } from 'react';
import { Character, CharacterType, HealthStatus, CharacterPosition } from '../../types/character';
import { useGameStore } from '@/lib/game-store';

interface CharacterTabProps {
  // 可以添加props如果需要
}

export function CharacterTab({}: CharacterTabProps) {
  const { getActiveCharacters, getAvailableCharacters, calculateCharacterEffects, appointCharacter, dismissCharacter } = useGameStore();
  const [selectedCharacterType, setSelectedCharacterType] = useState<CharacterType | null>(null);
  const [showAppointment, setShowAppointment] = useState(false);
 
  // 获取在职人物（构建类型到人物的映射，便于现有渲染逻辑）
  const activeList = (getActiveCharacters?.() || []) as Character[];
  const activeCharacters: Record<CharacterType, Character | null> = {
    [CharacterType.RULER]: null,
    [CharacterType.RESEARCH_LEADER]: null,
    [CharacterType.FAITH_LEADER]: null,
    [CharacterType.MAGE_LEADER]: null,
    [CharacterType.CIVIL_LEADER]: null,
    [CharacterType.GENERAL]: null,
    [CharacterType.DIPLOMAT]: null,
  };
  activeList.forEach((c: Character) => {
    activeCharacters[c.type] = c;
  });
  
  // 获取可用人物
  const availableCharacters = (getAvailableCharacters?.() || []) as Character[];

   // 获取人物效果
   const characterEffects = calculateCharacterEffects?.() || [];

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
      [HealthStatus.GOOD]: { text: '好', color: 'text-green-600' },
      [HealthStatus.FAIR]: { text: '中', color: 'text-yellow-600' },
      [HealthStatus.POOR]: { text: '差', color: 'text-red-600' }
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

  // 获取职位显示名称
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

  // 渲染在职人物
  const renderActiveCharacters = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">在职人物</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(activeCharacters).map(([type, character]) => (
            <div key={type} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {getCharacterTypeDisplay(type as CharacterType)}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {character ? getPositionDisplay(character) : '空缺'}
                  </p>
                </div>
                {character && (
                  <button
                    onClick={() => handleDismissCharacter(character.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    解除
                  </button>
                )}
              </div>
              
              {character ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{character.name}</span>
                    <span className={`text-sm ${getHealthStatusDisplay(character.healthStatus).color}`}>
                      健康: {getHealthStatusDisplay(character.healthStatus).text}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <div className="text-gray-600">武力</div>
                      <div className="font-medium">{character.attributes.force}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">智力</div>
                      <div className="font-medium">{character.attributes.intelligence}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">魅力</div>
                      <div className="font-medium">{character.attributes.charisma}</div>
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
                                : 'bg-red-100 text-red-800'
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
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-2">职位空缺</p>
                  <button
                    onClick={() => {
                      setSelectedCharacterType(type as CharacterType);
                      setShowAppointment(true);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    任命人物
                  </button>
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
                  
                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div className="text-center">
                      <div className="text-gray-600">武力</div>
                      <div className="font-medium">{character.attributes.force}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">智力</div>
                      <div className="font-medium">{character.attributes.intelligence}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">魅力</div>
                      <div className="font-medium">{character.attributes.charisma}</div>
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
                                : 'bg-red-100 text-red-800'
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

  // 渲染人物效果
  const renderCharacterEffects = () => {
    if (characterEffects.length === 0) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">人物效果</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {characterEffects.map((effect, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">{effect.description}</span>
                <span className={`text-sm font-medium ${
                  effect.value > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {effect.value > 0 ? '+' : ''}{effect.value}{effect.isPercentage ? '%' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 在职人物 */}
      {renderActiveCharacters()}
      
      {/* 人物效果 */}
      {renderCharacterEffects()}
      
      {/* 任命对话框 */}
      {renderAvailableCharacters()}
    </div>
  );
}