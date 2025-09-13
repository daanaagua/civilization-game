import { ExplorationResult, ExplorationEvent, DiscoveredLocation, MilitaryUnit } from '../types/military';
import { getRandomEvent, getDungeonById, getCountryById } from './dungeon-data';
import { getUnitType } from './military-data';

// 探索系统类
export class ExplorationSystem {
  private discoveredLocations: DiscoveredLocation[] = [];
  private explorationHistory: ExplorationResult[] = [];
  
  // 获取已发现的位置
  getDiscoveredLocations(): DiscoveredLocation[] {
    return this.discoveredLocations;
  }
  
  // 获取探索历史
  getExplorationHistory(): ExplorationResult[] {
    return this.explorationHistory;
  }
  
  // 检查是否有可用的探索单位
  hasExplorationUnits(units: MilitaryUnit[]): boolean {
    return units.some(unit => {
      const unitType = getUnitType(unit.typeId);
      return unitType?.isExplorationUnit && unit.count > 0 && unit.status === 'defending';
    });
  }
  
  // 获取可用的探索单位
  getAvailableExplorationUnits(units: MilitaryUnit[]): MilitaryUnit[] {
    return units.filter(unit => {
      const unitType = getUnitType(unit.typeId);
      return unitType?.isExplorationUnit && unit.count > 0 && unit.status === 'defending';
    });
  }
  
  // 执行探索
  explore(explorationUnits: MilitaryUnit[]): ExplorationResult {
    if (!this.hasExplorationUnits(explorationUnits)) {
      throw new Error('没有可用的探索单位');
    }
    
    // 计算探索成功率
    const successRate = this.calculateExplorationSuccessRate(explorationUnits);
    const isSuccessful = Math.random() < successRate;
    
    let result: ExplorationResult;
    
    if (isSuccessful) {
      result = this.generateSuccessfulExploration(explorationUnits);
    } else {
      result = this.generateFailedExploration(explorationUnits);
    }
    
    // 记录探索历史
    this.explorationHistory.push(result);
    
    // 如果发现了新位置，添加到已发现位置列表
    if (result.discovery) {
      this.addDiscoveredLocation(result.discovery);
    }
    
    return result;
  }
  
  // 计算探索成功率
  private calculateExplorationSuccessRate(units: MilitaryUnit[]): number {
    let totalExplorationPower = 0;
    
    units.forEach(unit => {
      const unitType = getUnitType(unit.typeId);
      if (unitType?.isExplorationUnit && unit.count > 0) {
        // 冒险家比侦察兵有更高的探索能力
        const basePower = unitType.name === '冒险家' ? 0.8 : 0.6;
        const moraleBonus = (unit.currentMorale || unitType.baseStats.morale) / unitType.baseStats.morale;
        totalExplorationPower += basePower * unit.count * moraleBonus;
      }
    });
    
    // 基础成功率 + 探索力量加成
    const baseSuccessRate = 0.3;
    const powerBonus = Math.min(0.5, totalExplorationPower * 0.1);
    
    return Math.min(0.9, baseSuccessRate + powerBonus);
  }
  
  // 生成成功的探索结果
  private generateSuccessfulExploration(units: MilitaryUnit[]): ExplorationResult {
    const discoveryType = this.determineDiscoveryType();
    let discovery: DiscoveredLocation | undefined;
    let event: ExplorationEvent | undefined;
    
    switch (discoveryType) {
      case 'dungeon':
        discovery = this.generateDungeonDiscovery();
        break;
      case 'country':
        discovery = this.generateCountryDiscovery();
        break;
      case 'event':
        event = this.generateRandomEvent();
        break;
      case 'resource':
        event = this.generateResourceEvent();
        break;
    }
    
    return {
      success: true,
      explorationUnits: units.map(u => ({ ...u })),
      discovery,
      event,
      timestamp: Date.now(),
      description: this.generateExplorationDescription(true, discovery, event)
    };
  }
  
  // 生成失败的探索结果
  private generateFailedExploration(units: MilitaryUnit[]): ExplorationResult {
    // 失败可能导致单位损失
    const casualties = this.calculateExplorationCasualties(units);
    
    return {
      success: false,
      explorationUnits: units.map(u => ({ ...u })),
      casualties,
      timestamp: Date.now(),
      description: this.generateExplorationDescription(false, undefined, undefined, casualties)
    };
  }
  
  // 确定发现类型
  private determineDiscoveryType(): 'dungeon' | 'country' | 'event' | 'resource' {
    const random = Math.random();
    
    if (random < 0.4) {
      return 'dungeon';
    } else if (random < 0.6) {
      return 'country';
    } else if (random < 0.8) {
      return 'event';
    } else {
      return 'resource';
    }
  }
  
  // 生成地下城发现
  private generateDungeonDiscovery(): DiscoveredLocation {
    const dungeonIds = ['ancient_ruins', 'goblin_cave', 'dragon_lair', 'cursed_forest', 'ice_cavern', 'fire_temple', 'shadow_realm', 'crystal_mine'];
    const randomId = dungeonIds[Math.floor(Math.random() * dungeonIds.length)];
    const dungeon = getDungeonById(randomId);
    
    if (!dungeon) {
      throw new Error(`未找到地下城: ${randomId}`);
    }
    
    return {
      id: `discovered_${randomId}_${Date.now()}`,
      type: 'dungeon',
      name: dungeon.name,
      description: dungeon.description,
      difficulty: dungeon.difficulty,
      discoveredAt: Date.now(),
      data: dungeon
    };
  }
  
  // 生成国家发现
  private generateCountryDiscovery(): DiscoveredLocation {
    const countryIds = ['elven_kingdom', 'dwarven_stronghold', 'orc_tribes', 'human_empire', 'undead_realm'];
    const randomId = countryIds[Math.floor(Math.random() * countryIds.length)];
    const country = getCountryById(randomId);
    
    if (!country) {
      throw new Error(`未找到国家: ${randomId}`);
    }
    
    return {
      id: `discovered_${randomId}_${Date.now()}`,
      type: 'country',
      name: country.name,
      description: country.description,
      difficulty: country.strength,
      discoveredAt: Date.now(),
      data: country
    };
  }
  
  // 生成随机事件
  private generateRandomEvent(): ExplorationEvent {
    const randomEvent = getRandomEvent();
    
    return {
      id: `event_${Date.now()}`,
      type: 'random',
      title: randomEvent.name,
      description: randomEvent.description,
      effects: randomEvent.effects,
      timestamp: Date.now()
    };
  }
  
  // 生成资源事件
  private generateResourceEvent(): ExplorationEvent {
    const resources = ['wood', 'stone', 'tools', 'food'];
    const randomResource = resources[Math.floor(Math.random() * resources.length)];
    const amount = Math.floor(Math.random() * 50) + 10;
    
    return {
      id: `resource_${Date.now()}`,
      type: 'resource',
      title: '发现资源',
      description: `你的探索队发现了一些${randomResource}资源！`,
      effects: {
        resources: {
          [randomResource]: amount
        }
      },
      timestamp: Date.now()
    };
  }
  
  // 计算探索伤亡
  private calculateExplorationCasualties(units: MilitaryUnit[]): Record<string, number> {
    const casualties: Record<string, number> = {};
    
    units.forEach(unit => {
      if (unit.count > 0) {
        // 失败时有小概率损失单位
        const lossRate = 0.1; // 10%的损失率
        const losses = Math.floor(unit.count * lossRate * Math.random());
        
        if (losses > 0) {
          casualties[unit.typeId] = losses;
        }
      }
    });
    
    return casualties;
  }
  
  // 生成探索描述
  private generateExplorationDescription(
    success: boolean,
    discovery?: DiscoveredLocation,
    event?: ExplorationEvent,
    casualties?: Record<string, number>
  ): string {
    if (success) {
      if (discovery) {
        switch (discovery.type) {
          case 'dungeon':
            return `你的探索队发现了一个神秘的地下城：${discovery.name}！这里似乎隐藏着宝藏和危险。`;
          case 'country':
            return `你的探索队遇到了另一个文明：${discovery.name}！他们的实力看起来${discovery.difficulty > 50 ? '相当强大' : '较为温和'}。`;
        }
      }
      
      if (event) {
        return event.description;
      }
      
      return '你的探索队成功完成了探索任务，但没有发现什么特别的东西。';
    } else {
      let description = '探索失败了！你的队伍在未知的土地上迷失了方向。';
      
      if (casualties && Object.keys(casualties).length > 0) {
        description += ' 在这次探索中，一些队员没能回来...';
      }
      
      return description;
    }
  }
  
  // 添加已发现的位置
  private addDiscoveredLocation(location: DiscoveredLocation): void {
    // 检查是否已经发现过相同类型和名称的位置
    const existing = this.discoveredLocations.find(
      loc => loc.type === location.type && loc.name === location.name
    );
    
    if (!existing) {
      this.discoveredLocations.push(location);
    }
  }
  
  // 应用探索结果
  applyExplorationResult(result: ExplorationResult, units: MilitaryUnit[]): void {
    // 应用伤亡
    if (result.casualties) {
      Object.entries(result.casualties).forEach(([typeId, losses]) => {
        const unit = units.find(u => u.typeId === typeId);
        if (unit) {
          unit.count = Math.max(0, unit.count - losses);
          unit.assignedPopulation = Math.max(0, unit.assignedPopulation - losses);
        }
      });
    }
    
    // 应用事件效果
    if (result.event?.effects) {
      // 这里需要与游戏状态管理系统集成
      // 暂时只记录效果，具体应用由上层系统处理
    }
  }
  
  // 获取位置详情
  getLocationDetails(locationId: string): DiscoveredLocation | undefined {
    return this.discoveredLocations.find(loc => loc.id === locationId);
  }
  
  // 检查是否可以攻击某个位置
  canAttackLocation(locationId: string, availableUnits: MilitaryUnit[]): boolean {
    const location = this.getLocationDetails(locationId);
    if (!location || location.type !== 'dungeon') {
      return false;
    }
    
    // 检查是否有非探索单位可以参战
    const combatUnits = availableUnits.filter(unit => {
      const unitType = getUnitType(unit.typeId);
      return !unitType?.isExplorationUnit && unit.count > 0 && unit.status === 'defending';
    });
    
    return combatUnits.length > 0;
  }
  
  // 获取推荐的探索队伍配置
  getRecommendedExplorationForce(availableUnits: MilitaryUnit[]): {
    recommended: MilitaryUnit[];
    reason: string;
  } {
    const explorationUnits = this.getAvailableExplorationUnits(availableUnits);
    
    if (explorationUnits.length === 0) {
      return {
        recommended: [],
        reason: '没有可用的探索单位。需要训练侦察兵或冒险家。'
      };
    }
    
    // 优先推荐冒险家，其次是侦察兵
    const adventurers = explorationUnits.filter(unit => {
      const unitType = getUnitType(unit.typeId);
      return unitType?.name === '冒险家';
    });
    
    const scouts = explorationUnits.filter(unit => {
      const unitType = getUnitType(unit.typeId);
      return unitType?.name === '侦察兵';
    });
    
    let recommended: MilitaryUnit[];
    let reason: string;
    
    if (adventurers.length > 0) {
      recommended = adventurers.slice(0, 1); // 推荐1个冒险家单位
      reason = '冒险家具有更高的探索成功率和发现珍贵物品的能力。';
    } else {
      recommended = scouts.slice(0, 2); // 推荐最多2个侦察兵单位
      reason = '侦察兵是基础的探索单位，适合初期探索。建议升级为冒险家以获得更好的探索效果。';
    }
    
    return { recommended, reason };
  }
  
  // 清除探索历史（可选功能）
  clearExplorationHistory(): void {
    this.explorationHistory = [];
  }
  
  // 导出探索数据
  exportExplorationData(): {
    discoveredLocations: DiscoveredLocation[];
    explorationHistory: ExplorationResult[];
  } {
    return {
      discoveredLocations: [...this.discoveredLocations],
      explorationHistory: [...this.explorationHistory]
    };
  }
  
  // 导入探索数据
  importExplorationData(data: {
    discoveredLocations: DiscoveredLocation[];
    explorationHistory: ExplorationResult[];
  }): void {
    this.discoveredLocations = data.discoveredLocations || [];
    this.explorationHistory = data.explorationHistory || [];
  }
}