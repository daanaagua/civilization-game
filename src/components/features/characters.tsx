'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/game-store';
import { Character, CharacterType } from '@/types/character';
import { 
  Crown, 
  Users, 
  Shield, 
  Scroll, 
  Heart,
  Clock,
  Zap
} from 'lucide-react';

const characterTypeConfig: Record<CharacterType, { name: string; icon: any; color: string; description: string }> = {
  [CharacterType.RULER]: { 
    name: '统治者', 
    icon: Crown, 
    color: 'text-yellow-600', 
    description: '文明的最高领导者，负责全局决策与统治'
  },
  [CharacterType.RESEARCH_LEADER]: { 
    name: '科研领袖', 
    icon: Scroll, 
    color: 'text-purple-600', 
    description: '领导科研与知识发展，提升研究效率'
  },
  [CharacterType.FAITH_LEADER]: { 
    name: '信仰领袖', 
    icon: Users, 
    color: 'text-amber-700', 
    description: '凝聚民心与信仰，带来稳定与士气'
  },
  [CharacterType.MAGE_LEADER]: { 
    name: '法师领袖', 
    icon: Zap, 
    color: 'text-blue-600', 
    description: '掌控秘法与奥术，影响特殊体系的发展'
  },
  [CharacterType.CIVIL_LEADER]: { 
    name: '文官领袖', 
    icon: Users, 
    color: 'text-green-700', 
    description: '负责行政与治理，优化城市与制度效率'
  },
  [CharacterType.GENERAL]: { 
    name: '将领', 
    icon: Shield, 
    color: 'text-red-600', 
    description: '军事统帅，提升军队战斗与防御能力'
  },
  [CharacterType.DIPLOMAT]: { 
    name: '外交官', 
    icon: Users, 
    color: 'text-sky-700', 
    description: '负责对外交流与谈判，改善外交关系'
  }
};

interface CharacterCardProps {
  character: Character;
}

const CharacterCard = ({ character }: CharacterCardProps) => {
  const typeConfig = characterTypeConfig[character.type];
  const TypeIcon = typeConfig.icon;

  return (
    <div className="card hover:shadow-lg transition-all duration-200 bg-gray-800 border border-gray-700">
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
            </div>
          </div>
        </div>
        <div className="bg-gray-700 text-gray-200 px-2 py-1 rounded-full text-xs font-medium">
          {character.healthStatus === 'good' ? '健康' : character.healthStatus === 'fair' ? '一般' : '欠佳'}
        </div>
      </div>

      <p className="text-sm text-gray-300 mb-4 leading-relaxed">
        {typeConfig.description}
      </p>

      {/* 属性展示 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-900 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} className="text-red-600" />
            <span className="text-xs font-medium text-stone-600">武力</span>
          </div>
          <div className="text-lg font-semibold text-stone-900">{character.attributes.force}</div>
        </div>
        <div className="bg-gray-900 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Scroll size={14} className="text-purple-600" />
            <span className="text-xs font-medium text-stone-600">智力</span>
          </div>
          <div className="text-lg font-semibold text-stone-900">{character.attributes.intelligence}</div>
        </div>
        <div className="bg-gray-900 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-blue-600" />
            <span className="text-xs font-medium text-stone-600">魅力</span>
          </div>
          <div className="text-lg font-semibold text-stone-900">{character.attributes.charisma}</div>
        </div>
      </div>

      {/* 忠诚与经验 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-stone-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Heart size={14} className="text-rose-600" />
            <span className="text-xs font-medium text-stone-600">忠诚</span>
          </div>
          <div className="text-lg font-semibold text-stone-900">{character.loyalty}</div>
        </div>
        <div className="bg-stone-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Scroll size={14} className="text-amber-600" />
            <span className="text-xs font-medium text-stone-600">经验</span>
          </div>
          <div className="text-lg font-semibold text-stone-900">{character.experience}</div>
        </div>
      </div>
    </div>
  );
};

export const CharactersPanel = () => {
  const { getActiveCharacters, getAvailableCharacters } = useGameStore();
  const [selectedType, setSelectedType] = useState<CharacterType | 'all'>('all');

  const allTypes = (Object.values(CharacterType) as CharacterType[]);
  const types: (CharacterType | 'all')[] = ['all', ...allTypes];

  const activeCharacters = getActiveCharacters();
  const availableCharacters = getAvailableCharacters();

  const filteredActive = selectedType === 'all' 
    ? activeCharacters 
    : activeCharacters.filter(c => c.type === selectedType);

  const filteredAvailable = selectedType === 'all' 
    ? availableCharacters 
    : availableCharacters.filter(c => c.type === selectedType);

  return (
    <div className="space-y-6">
      {/* 角色类型筛选 */}
      <div className="flex flex-wrap gap-2">
        {types.map((type) => {
          const isActive = selectedType === type;
          const config = type === 'all' 
            ? { name: '全部', icon: Users, color: 'text-stone-600' }
            : characterTypeConfig[type as CharacterType];
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
      {filteredActive.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <Zap size={20} className="text-green-600" />
            在职角色 ({filteredActive.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActive.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
              />
            ))}
          </div>
        </div>
      )}

      {/* 可任命/候选角色 */}
      {false && (
        <div>
          <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-stone-500" />
            候选角色 ({filteredAvailable.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAvailable.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
              />
            ))}
          </div>
        </div>
      )}

      {filteredActive.length === 0 && filteredAvailable.length === 0 && (
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

// 角色招募组件（暂未接入完整人物生成逻辑，占位以避免调用不存在的方法）
export const CharacterRecruitment = () => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
        <Users size={20} className="text-blue-600" />
        角色招募
      </h3>
      <div className="text-sm text-stone-600">
        角色招募系统正在适配新的人物模型，敬请期待。
      </div>
    </div>
  );
};