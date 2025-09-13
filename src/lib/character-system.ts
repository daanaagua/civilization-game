import { 
  Character, 
  CharacterType, 
  CharacterPosition, 
  CharacterAttributes, 
  CharacterSystemState, 
  CharacterEvent, 
  CharacterBuff,
  CharacterEffect,
  HealthStatus,
  CharacterUnlockCondition
} from '../types/character';
import { 
  CHARACTER_TRAITS, 
  CHARACTER_UNLOCK_CONDITIONS, 
  POSITION_UPGRADE_CONDITIONS,
  CHARACTER_ATTRIBUTE_EFFECTS,
  CHARACTER_NAMES,
  CHARACTER_GENERATION_CONFIG
} from './character-data';
import { GameState } from '../types/game';

// 人物系统类
export class CharacterSystem {
  private state: CharacterSystemState;
  private gameState: GameState;

  constructor(gameState: GameState) {
    this.gameState = gameState;
    this.state = {
      characters: {},
      activeCharacters: {
        [CharacterType.RULER]: null,
        [CharacterType.RESEARCH_LEADER]: null,
        [CharacterType.FAITH_LEADER]: null,
        [CharacterType.MAGE_LEADER]: null,
        [CharacterType.CIVIL_LEADER]: null,
        [CharacterType.GENERAL]: null,
        [CharacterType.DIPLOMAT]: null
      },
      availableCharacters: [],
      characterPool: [],
      lastHealthCheck: 0
    };
  }

  // 获取人物系统状态
  getState(): CharacterSystemState {
    return this.state;
  }

  // 初始化人物系统
  initialize(): void {
    // 生成初始统治者
    const ruler = this.generateCharacter(CharacterType.RULER, CharacterPosition.CHIEF);
    this.state.characters[ruler.id] = ruler;
    this.state.activeCharacters[CharacterType.RULER] = ruler.id;
    
    // 生成人物池
    this.generateCharacterPool();
  }

  // 生成人物
  generateCharacter(
    type: CharacterType, 
    position: CharacterPosition,
    customAttributes?: Partial<CharacterAttributes>
  ): Character {
    const id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const name = this.generateRandomName();
    const age = this.randomBetween(
      CHARACTER_GENERATION_CONFIG.baseAge.min,
      CHARACTER_GENERATION_CONFIG.baseAge.max
    );
    
    // 生成属性
    const attributes: CharacterAttributes = {
      force: customAttributes?.force ?? this.randomBetween(
        CHARACTER_GENERATION_CONFIG.baseAttributeRange.min,
        CHARACTER_GENERATION_CONFIG.baseAttributeRange.max
      ),
      intelligence: customAttributes?.intelligence ?? this.randomBetween(
        CHARACTER_GENERATION_CONFIG.baseAttributeRange.min,
        CHARACTER_GENERATION_CONFIG.baseAttributeRange.max
      ),
      charisma: customAttributes?.charisma ?? this.randomBetween(
        CHARACTER_GENERATION_CONFIG.baseAttributeRange.min,
        CHARACTER_GENERATION_CONFIG.baseAttributeRange.max
      )
    };

    // 生成特性
    const traits = this.generateTraits();

    const character: Character = {
      id,
      name,
      type,
      position,
      age,
      health: CHARACTER_GENERATION_CONFIG.baseHealth,
      healthStatus: HealthStatus.GOOD,
      attributes,
      traits,
      buffs: [],
      isUnlocked: type === CharacterType.RULER, // 统治者默认解锁
      unlockConditions: CHARACTER_UNLOCK_CONDITIONS[type],
      appointmentDate: type === CharacterType.RULER ? new Date() : undefined,
      experience: 0,
      loyalty: this.randomBetween(
        CHARACTER_GENERATION_CONFIG.baseLoyalty.min,
        CHARACTER_GENERATION_CONFIG.baseLoyalty.max
      )
    };

    return character;
  }

  // 生成随机名称
  private generateRandomName(): string {
    const isMale = Math.random() > 0.5;
    const names = isMale ? CHARACTER_NAMES.male : CHARACTER_NAMES.female;
    return names[Math.floor(Math.random() * names.length)];
  }

  // 生成特性
  private generateTraits() {
    const traits = [];
    const traitKeys = Object.keys(CHARACTER_TRAITS);
    const maxTraits = CHARACTER_GENERATION_CONFIG.maxTraitsPerCharacter;
    
    for (let i = 0; i < maxTraits; i++) {
      if (Math.random() < CHARACTER_GENERATION_CONFIG.traitProbability) {
        const randomTrait = traitKeys[Math.floor(Math.random() * traitKeys.length)];
        if (!traits.find(t => t.id === randomTrait)) {
          traits.push(CHARACTER_TRAITS[randomTrait]);
        }
      }
    }
    
    return traits;
  }

  // 生成人物池
  private generateCharacterPool(): void {
    const types = Object.values(CharacterType).filter(t => t !== CharacterType.RULER);
    
    types.forEach(type => {
      // 为每种类型生成2-3个候选人物
      const count = this.randomBetween(2, 3);
      for (let i = 0; i < count; i++) {
        const position = this.getInitialPosition(type);
        const character = this.generateCharacter(type, position);
        this.state.characters[character.id] = character;
        this.state.characterPool.push(character.id);
      }
    });
  }

  // 获取初始职位
  private getInitialPosition(type: CharacterType): CharacterPosition {
    const positionMap = {
      [CharacterType.RULER]: CharacterPosition.CHIEF,
      [CharacterType.RESEARCH_LEADER]: CharacterPosition.ELDER,
      [CharacterType.FAITH_LEADER]: CharacterPosition.HIGH_PRIEST,
      [CharacterType.MAGE_LEADER]: CharacterPosition.ARCHMAGE,
      [CharacterType.CIVIL_LEADER]: CharacterPosition.CHIEF_JUDGE,
      [CharacterType.GENERAL]: CharacterPosition.GENERAL,
      [CharacterType.DIPLOMAT]: CharacterPosition.DIPLOMAT
    };
    return positionMap[type];
  }

  // 检查人物解锁条件
  checkUnlockConditions(): void {
    this.state.characterPool.forEach(characterId => {
      const character = this.state.characters[characterId];
      if (!character.isUnlocked && this.isUnlockConditionMet(character.unlockConditions)) {
        character.isUnlocked = true;
        this.state.availableCharacters.push(characterId);
        
        // 触发解锁事件
        this.triggerCharacterEvent({
          id: `unlock_${characterId}`,
          type: 'appointment',
          characterId,
          timestamp: Date.now(),
          data: { unlocked: true },
          description: `${character.name}(${this.getPositionName(character.position)})已解锁，可以任命`
        });
      }
    });
  }

  // 检查解锁条件是否满足
  private isUnlockConditionMet(conditions: CharacterUnlockCondition): boolean {
    // 检查科技条件
    if (conditions.requiredTechnology) {
      for (const tech of conditions.requiredTechnology) {
        if (!this.gameState.technologies.researched.includes(tech)) {
          return false;
        }
      }
    }

    // 检查建筑条件
    if (conditions.requiredBuilding) {
      for (const building of conditions.requiredBuilding) {
        if (!this.gameState.buildings.some(b => b.type === building && b.isCompleted)) {
          return false;
        }
      }
    }

    // 检查人口条件
    if (conditions.requiredPopulation && this.gameState.population < conditions.requiredPopulation) {
      return false;
    }

    // 检查稳定度条件
    if (conditions.requiredStability && this.gameState.stability < conditions.requiredStability) {
      return false;
    }

    return true;
  }

  // 任命人物
  appointCharacter(characterId: string): boolean {
    const character = this.state.characters[characterId];
    if (!character || !character.isUnlocked) {
      return false;
    }

    // 检查是否已有该类型的在职人物
    const currentActiveId = this.state.activeCharacters[character.type];
    if (currentActiveId) {
      // 解除当前人物职务
      this.dismissCharacter(currentActiveId);
    }

    // 任命新人物
    this.state.activeCharacters[character.type] = characterId;
    character.appointmentDate = new Date();
    
    // 从可用列表中移除
    this.state.availableCharacters = this.state.availableCharacters.filter(id => id !== characterId);

    // 触发任命事件
    this.triggerCharacterEvent({
      id: `appoint_${characterId}`,
      type: 'appointment',
      characterId,
      timestamp: Date.now(),
      data: { appointed: true },
      description: `${character.name}被任命为${this.getPositionName(character.position)}`
    });

    return true;
  }

  // 解除人物职务
  dismissCharacter(characterId: string): boolean {
    const character = this.state.characters[characterId];
    if (!character) {
      return false;
    }

    // 从在职列表中移除
    this.state.activeCharacters[character.type] = null;
    character.appointmentDate = undefined;
    
    // 添加到可用列表
    if (!this.state.availableCharacters.includes(characterId)) {
      this.state.availableCharacters.push(characterId);
    }

    return true;
  }

  // 计算人物效果
  calculateCharacterEffects(): CharacterEffect[] {
    const effects: CharacterEffect[] = [];

    // 遍历所有在职人物
    Object.entries(this.state.activeCharacters).forEach(([type, characterId]) => {
      if (characterId) {
        const character = this.state.characters[characterId];
        if (character) {
          // 计算属性效果
          effects.push(...this.calculateAttributeEffects(character));
          
          // 计算特性效果
          character.traits.forEach(trait => {
            effects.push(...trait.effects);
          });
          
          // 计算Buff效果
          character.buffs.forEach(buff => {
            effects.push(...buff.effects);
          });
        }
      }
    });

    return effects;
  }

  // 计算属性效果
  private calculateAttributeEffects(character: Character): CharacterEffect[] {
    const effects: CharacterEffect[] = [];
    const attributeEffects = CHARACTER_ATTRIBUTE_EFFECTS[character.type];
    
    if (attributeEffects) {
      // 武力效果
      if (attributeEffects.force && character.attributes.force > 0) {
        const effect = attributeEffects.force;
        effects.push({
          type: effect.type as any,
          target: effect.target,
          value: effect.value * character.attributes.force,
          isPercentage: effect.value < 1,
          description: `${character.name}: ${effect.description.replace('/点', ` x${character.attributes.force}`)}`
        });
      }
      
      // 智力效果
      if (attributeEffects.intelligence && character.attributes.intelligence > 0) {
        const effect = attributeEffects.intelligence;
        effects.push({
          type: effect.type as any,
          target: effect.target,
          value: effect.value * character.attributes.intelligence,
          isPercentage: effect.value < 1,
          description: `${character.name}: ${effect.description.replace('/点', ` x${character.attributes.intelligence}`)}`
        });
      }
      
      // 魅力效果
      if (attributeEffects.charisma && character.attributes.charisma > 0) {
        const effect = attributeEffects.charisma;
        effects.push({
          type: effect.type as any,
          target: effect.target,
          value: effect.value * character.attributes.charisma,
          isPercentage: effect.value < 1,
          description: `${character.name}: ${effect.description.replace('/点', ` x${character.attributes.charisma}`)}`
        });
      }
    }

    return effects;
  }

  // 更新人物健康状态
  updateHealth(): void {
    const currentTime = Date.now();
    
    // 每季度检查一次健康状态
    if (currentTime - this.state.lastHealthCheck < 90 * 24 * 60 * 60 * 1000) {
      return;
    }

    Object.values(this.state.characters).forEach(character => {
      if (character.age >= 40) {
        // 健康度衰减
        const healthDecay = (character.age - 40) / 10;
        character.health = Math.max(0, character.health - healthDecay);
        
        // 更新健康状态显示
        character.healthStatus = this.getHealthStatus(character.health);
        
        // 计算死亡概率
        const deathProbability = this.calculateDeathProbability(character);
        
        // 检查是否死亡
        if (Math.random() < deathProbability) {
          this.handleCharacterDeath(character);
        }
      }
    });

    this.state.lastHealthCheck = currentTime;
  }

  // 获取健康状态
  private getHealthStatus(health: number): HealthStatus {
    if (health > 70) return HealthStatus.GOOD;
    if (health > 40) return HealthStatus.FAIR;
    return HealthStatus.POOR;
  }

  // 计算死亡概率
  private calculateDeathProbability(character: Character): number {
    const baseProbability = (100 - character.health) / 150;
    const ageFactor = Math.max(0, (character.age - 60) * 0.008);
    return Math.min(1, baseProbability + ageFactor);
  }

  // 处理人物死亡
  private handleCharacterDeath(character: Character): void {
    // 如果是在职人物，需要解除职务
    if (this.state.activeCharacters[character.type] === character.id) {
      this.state.activeCharacters[character.type] = null;
    }

    // 从各种列表中移除
    this.state.availableCharacters = this.state.availableCharacters.filter(id => id !== character.id);
    this.state.characterPool = this.state.characterPool.filter(id => id !== character.id);
    
    // 触发死亡事件
    this.triggerCharacterEvent({
      id: `death_${character.id}`,
      type: 'death',
      characterId: character.id,
      timestamp: Date.now(),
      data: { age: character.age, health: character.health },
      description: `${character.name}(${this.getPositionName(character.position)})去世了，享年${character.age}岁`
    });

    // 删除人物数据
    delete this.state.characters[character.id];
    
    // 生成继承者或新候选人
    this.generateReplacement(character.type);
  }

  // 生成替代人物
  private generateReplacement(type: CharacterType): void {
    const position = this.getInitialPosition(type);
    const replacement = this.generateCharacter(type, position);
    
    this.state.characters[replacement.id] = replacement;
    this.state.characterPool.push(replacement.id);
    
    // 如果条件满足，直接解锁
    if (this.isUnlockConditionMet(replacement.unlockConditions)) {
      replacement.isUnlocked = true;
      this.state.availableCharacters.push(replacement.id);
    }
  }

  // 添加Buff
  addBuff(characterId: string, buff: CharacterBuff): boolean {
    const character = this.state.characters[characterId];
    if (!character) {
      return false;
    }

    // 检查是否已有相同Buff
    const existingBuffIndex = character.buffs.findIndex(b => b.id === buff.id);
    if (existingBuffIndex >= 0) {
      // 更新现有Buff
      character.buffs[existingBuffIndex] = { ...buff, remainingTurns: buff.duration };
    } else {
      // 添加新Buff
      character.buffs.push({ ...buff, remainingTurns: buff.duration });
    }

    return true;
  }

  // 移除Buff
  removeBuff(characterId: string, buffId: string): boolean {
    const character = this.state.characters[characterId];
    if (!character) {
      return false;
    }

    character.buffs = character.buffs.filter(buff => buff.id !== buffId);
    return true;
  }

  // 更新Buff持续时间
  updateBuffs(): void {
    Object.values(this.state.characters).forEach(character => {
      character.buffs = character.buffs.filter(buff => {
        if (buff.duration === -1) {
          return true; // 永久Buff
        }
        
        if (buff.remainingTurns !== undefined) {
          buff.remainingTurns--;
          return buff.remainingTurns > 0;
        }
        
        return false;
      });
    });
  }

  // 获取职位名称
  private getPositionName(position: CharacterPosition): string {
    const positionNames = {
      [CharacterPosition.CHIEF]: '酋长',
      [CharacterPosition.ELDER]: '长老',
      [CharacterPosition.HIGH_PRIEST]: '大祭司',
      [CharacterPosition.ARCHMAGE]: '大法师',
      [CharacterPosition.CHIEF_JUDGE]: '大法官',
      [CharacterPosition.GENERAL]: '将军',
      [CharacterPosition.DIPLOMAT]: '外交官',
      [CharacterPosition.KING]: '国王',
      [CharacterPosition.EMPEROR]: '皇帝',
      [CharacterPosition.PRESIDENT]: '总统',
      [CharacterPosition.GRAND_SCHOLAR]: '大学者',
      [CharacterPosition.ACADEMY_HEAD]: '皇家科学院长',
      [CharacterPosition.ARCHBISHOP]: '大主教',
      [CharacterPosition.POPE]: '教皇',
      [CharacterPosition.ROYAL_ARCHMAGE]: '皇家大法师',
      [CharacterPosition.SPEAKER]: '议长',
      [CharacterPosition.GRAND_MARSHAL]: '大元帅'
    };
    return positionNames[position] || position;
  }

  // 触发人物事件
  private triggerCharacterEvent(event: CharacterEvent): void {
    // 这里可以添加事件处理逻辑，比如通知系统、记录日志等
    console.log(`人物事件: ${event.description}`);
  }

  // 工具方法：生成随机数
  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // 获取在职人物
  getActiveCharacters(): Record<CharacterType, Character | null> {
    const result: Record<CharacterType, Character | null> = {} as any;
    
    Object.entries(this.state.activeCharacters).forEach(([type, characterId]) => {
      result[type as CharacterType] = characterId ? this.state.characters[characterId] : null;
    });
    
    return result;
  }

  // 获取可用人物
  getAvailableCharacters(): Character[] {
    return this.state.availableCharacters.map(id => this.state.characters[id]).filter(Boolean);
  }

  // 获取人物详情
  getCharacter(characterId: string): Character | null {
    return this.state.characters[characterId] || null;
  }
}