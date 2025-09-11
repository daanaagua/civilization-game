'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { Character, CharacterType } from '@/types/game';
import { formatNumber } from '@/utils/format';
import { 
  Crown, 
  Users, 
  Hammer, 
  Shield, 
  Scroll, 
  Heart,
  Star,
  TrendingUp,
  Award,
  Clock,
  Zap
} from 'lucide-react';

const characterTypeConfig: Record<CharacterType, { name: string; icon: any; color: string; description: string }> = {
  chief: { 
    name: '酋长', 
    icon: Crown, 
    color: 'text-yellow-600', 
    description: '部落的最高领导者，拥有决策权和统治力'
  },
  elder: { 
    name: '长老', 
    icon: Users, 
    color: 'text-purple-600', 
    description: '智慧的长者，提供建议和文化传承'
  },
  craftsman: { 
    name: '工匠', 
    icon: Hammer, 
    color: 'text-blue-600', 
    description: '技艺精湛的制作者，提升生产效率'
  },
  warrior: { 
    name: '战士', 
    icon: Shield, 
    color: 'text-red-600', 
    description: '勇敢的战斗者，保卫部落安全'
  },
  shaman: { 
    name: '萨满', 
    icon: Scroll, 
    color: 'text-green-600', 
    description: '神秘的智者，掌握古老的知识'
  },
};

interface CharacterCardProps {
  character: Character;
  onLevelUp?: () => void;
  canLevelUp?: boolean;
}

const CharacterCard = ({ character, onLevelUp, canLevelUp = false }: CharacterCardProps) => {
  const typeConfig = characterTypeConfig[character.type];
  const TypeIcon = typeConfig.icon;
  
  const experienceProgress = character.experience % 100;
  const nextLevelExp = 100;
  
  return (
    <div className="card hover:shadow-md transition-all duration-200 bg-white">
      {/* 角色头部信息 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${typeConfig.color} bg-stone-50`}>
            <TypeIcon size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900">{character.name}</h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${typeConfig.color} bg-stone-100`}>
                {typeConfig.name}
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <Star size={12} />
                <span>等级 {character.level}</span>
              </div>
            </div>
          </div>
        </div>
        
        {character.isActive && (
          <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            在职
          </div>
        )}
      </div>
      
      <p className="text-sm text-stone-600 mb-4 leading-relaxed">
        {typeConfig.description}
      </p>
      
      {/* 属性展示 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-stone-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-blue-600" />
            <span className="text-xs font-medium text-stone-600">领导力</span>
          </div>
          <div className="text-lg font-semibold text-stone-900">
            {character.skills.leadership}
          </div>
        </div>
        
        <div className="bg-stone-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Hammer size={14} className="text-green-600" />
            <span className="text-xs font-medium text-stone-600">技能</span>
          </div>
          <div className="text-lg font-semibold text-stone-900">
            {character.skills.crafting}
          </div>
        </div>
        
        <div className="bg-stone-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Scroll size={14} className="text-purple-600" />
            <span className="text-xs font-medium text-stone-600">智慧</span>
          </div>
          <div className="text-lg font-semibold text-stone-900">
            {character.attributes.wisdom}
          </div>
        </div>
        
        <div className="bg-stone-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Heart size={14} className="text-red-600" />
            <span className="text-xs font-medium text-stone-600">忠诚</span>
          </div>
          <div className="text-lg font-semibold text-stone-900">
            {character.attributes.loyalty}
          </div>
        </div>
      </div>
      
      {/* 经验值进度 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-stone-600">经验值</span>
          <span className="text-xs text-stone-500">
            {character.experience} / {character.level * 100}
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill bg-amber-500" 
            style={{ width: `${(experienceProgress / nextLevelExp) * 100}%` }}
          />
        </div>
      </div>
      
      {/* 特殊技能 */}
      {character.skills && character.skills.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-stone-500 mb-2">特殊技能</h4>
          <div className="space-y-2">
            {character.skills.map((skill, index) => (
              <div key={index} className="bg-blue-50 p-2 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-blue-900">{skill.name}</span>
                  <span className="text-xs text-blue-600">Lv.{skill.level}</span>
                </div>
                <p className="text-xs text-blue-700">{skill.description}</p>
                {skill.effect && (
                  <div className="text-xs text-blue-600 mt-1">
                    效果: {skill.effect.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 升级按钮 */}
      {onLevelUp && (
        <button
          onClick={onLevelUp}
          disabled={!canLevelUp}
          className={`w-full btn flex items-center justify-center gap-2 ${
            canLevelUp
              ? 'btn-primary'
              : 'bg-stone-200 text-stone-500 cursor-not-allowed'
          }`}
        >
          <Award size={16} />
          {canLevelUp ? '升级角色' : '经验不足'}
        </button>
      )}
    </div>
  );
};

export const CharactersPanel = () => {
  const { gameState, levelUpCharacter } = useGameStore();
  const [selectedType, setSelectedType] = useState<CharacterType | 'all'>('all');
  
  const types: (CharacterType | 'all')[] = ['all', 'chief', 'elder', 'craftsman', 'warrior', 'shaman'];
  
  const filteredCharacters = Object.values(gameState.characters).filter(character => {
    if (selectedType === 'all') return true;
    return character.type === selectedType;
  });
  
  const activeCharacters = filteredCharacters.filter(char => char.isActive);
  const inactiveCharacters = filteredCharacters.filter(char => !char.isActive);
  
  const handleLevelUp = (characterId: string) => {
    const success = levelUpCharacter(characterId);
    if (!success) {
      console.log('升级失败');
    }
  };
  
  const canLevelUp = (character: Character) => {
    return character.experience >= character.level * 100;
  };
  
  return (
    <div className="space-y-6">
      {/* 角色类型筛选 */}
      <div className="flex flex-wrap gap-2">
        {types.map((type) => {
          const isActive = selectedType === type;
          const config = type === 'all' 
            ? { name: '全部', icon: Users, color: 'text-stone-600' }
            : characterTypeConfig[type];
          const Icon = config.icon;
          
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                isActive
                  ? 'bg-primary-100 border-primary-300 text-primary-800'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Icon size={16} />
              {config.name}
            </button>
          );
        })}
      </div>
      
      {/* 在职角色 */}
      {activeCharacters.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <Zap size={20} className="text-green-600" />
            在职角色 ({activeCharacters.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onLevelUp={() => handleLevelUp(character.id)}
                canLevelUp={canLevelUp(character)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* 待命角色 */}
      {inactiveCharacters.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-stone-500" />
            待命角色 ({inactiveCharacters.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inactiveCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onLevelUp={() => handleLevelUp(character.id)}
                canLevelUp={canLevelUp(character)}
              />
            ))}
          </div>
        </div>
      )}
      
      {filteredCharacters.length === 0 && (
        <div className="text-center py-12">
          <div className="text-stone-400 mb-2">
            <Users size={48} className="mx-auto" />
          </div>
          <p className="text-stone-500">暂无角色</p>
        </div>
      )}
    </div>
  );
};

// 角色招募组件
export const CharacterRecruitment = () => {
  const { gameState, recruitCharacter, canAfford } = useGameStore();
  const [isClient, setIsClient] = useState(false);
  
  // 确保客户端渲染一致性
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 可招募的角色类型和成本
  const recruitmentOptions = [
    {
      type: 'craftsman' as CharacterType,
      cost: { food: 50, wood: 30 },
      description: '招募一名工匠，提升生产效率'
    },
    {
      type: 'warrior' as CharacterType,
      cost: { food: 40, stone: 20 },
      description: '招募一名战士，增强部落防御'
    },
    {
      type: 'elder' as CharacterType,
      cost: { food: 60, tools: 10 },
      description: '招募一名长老，提供智慧指导'
    }
  ];
  
  const handleRecruit = (type: CharacterType, cost: Record<string, number>) => {
    if (canAfford(cost)) {
      const success = recruitCharacter(type, cost);
      if (!success) {
        console.log('招募失败');
      }
    }
  };
  
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
        <Users size={20} className="text-blue-600" />
        角色招募
      </h3>
      
      <div className="space-y-4">
        {recruitmentOptions.map((option) => {
          const config = characterTypeConfig[option.type];
          const Icon = config.icon;
          const affordable = canAfford(option.cost);
          
          return (
            <div key={option.type} className="border border-stone-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color} bg-stone-50`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-stone-900">{config.name}</h4>
                    <p className="text-sm text-stone-600">{option.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {Object.entries(option.cost).map(([resource, amount]) => (
                    <span key={resource} className="text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded">
                      {resource}: {amount}
                    </span>
                  ))}
                </div>
                
                <button
                  onClick={() => handleRecruit(option.type, option.cost)}
                  disabled={!affordable}
                  className={`btn ${
                    affordable
                      ? 'btn-primary'
                      : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {!isClient ? '招募' : (affordable ? '招募' : '资源不足')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};