import { CombatUnit, CombatResult, MilitaryUnit, EnemyUnit } from '../types/military';
import { getUnitType } from './military-data';
import { DungeonData } from './dungeon-data';

// 战斗系统类
export class CombatSystem {
  
  // 将军事单位转换为战斗单位
  private convertToCombatUnits(militaryUnits: MilitaryUnit[]): CombatUnit[] {
    const combatUnits: CombatUnit[] = [];
    
    militaryUnits.forEach(unit => {
      const unitType = getUnitType(unit.typeId);
      if (!unitType || unit.count <= 0) return;
      
      // 为每个士兵创建一个战斗单位
      for (let i = 0; i < unit.count; i++) {
        combatUnits.push({
          id: `${unit.id}_${i}`,
          typeId: unit.typeId,
          health: unit.currentHealth || unitType.baseStats.health,
          maxHealth: unitType.baseStats.health,
          morale: unit.currentMorale || unitType.baseStats.morale,
          maxMorale: unitType.baseStats.morale,
          attack: unitType.baseStats.attack,
          defense: unitType.baseStats.defense,
          status: 'active'
        });
      }
    });
    
    return combatUnits;
  }
  
  // 将敌人单位转换为战斗单位
  private convertEnemyToCombatUnits(enemies: EnemyUnit[]): CombatUnit[] {
    const combatUnits: CombatUnit[] = [];
    
    enemies.forEach((enemy, enemyIndex) => {
      for (let i = 0; i < enemy.count; i++) {
        combatUnits.push({
          id: `enemy_${enemyIndex}_${i}`,
          typeId: `enemy_${enemy.name}`,
          health: enemy.health,
          maxHealth: enemy.health,
          morale: enemy.morale,
          maxMorale: enemy.morale,
          attack: enemy.attack,
          defense: 0, // 敌人默认无防御
          status: 'active'
        });
      }
    });
    
    return combatUnits;
  }
  
  // 执行战斗
  simulateCombat(playerUnits: MilitaryUnit[], dungeon: DungeonData): CombatResult {
    const playerCombatUnits = this.convertToCombatUnits(playerUnits);
    const enemyCombatUnits = this.convertEnemyToCombatUnits(dungeon.enemies);
    
    let round = 0;
    const maxRounds = 50; // 防止无限循环
    
    // 战斗循环
    while (round < maxRounds) {
      round++;
      
      // 检查战斗是否结束
      const activePlayerUnits = playerCombatUnits.filter(u => u.status === 'active');
      const activeEnemyUnits = enemyCombatUnits.filter(u => u.status === 'active');
      
      if (activePlayerUnits.length === 0) {
        // 玩家失败
        return this.createCombatResult(false, playerCombatUnits, dungeon);
      }
      
      if (activeEnemyUnits.length === 0) {
        // 玩家胜利
        return this.createCombatResult(true, playerCombatUnits, dungeon);
      }
      
      // 执行一轮战斗
      this.executeCombatRound(activePlayerUnits, activeEnemyUnits);
    }
    
    // 超时，判定为失败
    return this.createCombatResult(false, playerCombatUnits, dungeon);
  }
  
  // 执行一轮战斗
  private executeCombatRound(playerUnits: CombatUnit[], enemyUnits: CombatUnit[]): void {
    // 玩家单位攻击
    playerUnits.forEach(unit => {
      if (unit.status !== 'active') return;
      
      const target = this.selectRandomTarget(enemyUnits);
      if (target) {
        this.executeAttack(unit, target);
      }
    });
    
    // 敌人单位攻击
    enemyUnits.forEach(unit => {
      if (unit.status !== 'active') return;
      
      const target = this.selectRandomTarget(playerUnits);
      if (target) {
        this.executeAttack(unit, target);
      }
    });
    
    // 检查士气崩溃
    this.checkMoraleBreak(playerUnits);
    this.checkMoraleBreak(enemyUnits);
  }
  
  // 选择随机目标
  private selectRandomTarget(units: CombatUnit[]): CombatUnit | null {
    const activeUnits = units.filter(u => u.status === 'active');
    if (activeUnits.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * activeUnits.length);
    return activeUnits[randomIndex];
  }
  
  // 执行攻击
  private executeAttack(attacker: CombatUnit, target: CombatUnit): void {
    if (attacker.status !== 'active' || target.status !== 'active') return;
    
    // 计算伤害
    const baseDamage = attacker.attack;
    const defense = target.defense;
    const randomFactor = 0.8 + Math.random() * 0.4; // 80%-120%的随机伤害
    
    const actualDamage = Math.max(1, Math.floor((baseDamage - defense) * randomFactor));
    
    // 应用伤害
    target.health -= actualDamage;
    
    // 士气损失（受到伤害时）
    const moraleDamage = Math.floor(actualDamage * 0.3);
    target.morale -= moraleDamage;
    
    // 检查死亡
    if (target.health <= 0) {
      target.status = 'dead';
      target.health = 0;
      
      // 死亡影响周围单位士气
      this.applyDeathMoraleEffect(target, this.getAllUnitsInSameFaction(target));
    }
    
    // 检查士气崩溃
    if (target.morale <= 0 && target.status === 'active') {
      target.status = 'retreated';
      target.morale = 0;
      
      // 溃退影响周围单位士气
      this.applyRetreatMoraleEffect(target, this.getAllUnitsInSameFaction(target));
    }
  }
  
  // 获取同阵营的所有单位（简化实现）
  private getAllUnitsInSameFaction(unit: CombatUnit): CombatUnit[] {
    // 这里需要根据实际情况获取同阵营单位
    // 简化实现，返回空数组
    return [];
  }
  
  // 应用死亡对士气的影响
  private applyDeathMoraleEffect(deadUnit: CombatUnit, allies: CombatUnit[]): void {
    allies.forEach(ally => {
      if (ally.status === 'active') {
        ally.morale -= 3; // 友军死亡降低3点士气
      }
    });
  }
  
  // 应用溃退对士气的影响
  private applyRetreatMoraleEffect(retreatedUnit: CombatUnit, allies: CombatUnit[]): void {
    allies.forEach(ally => {
      if (ally.status === 'active') {
        ally.morale -= 2; // 友军溃退降低2点士气
      }
    });
  }
  
  // 检查士气崩溃
  private checkMoraleBreak(units: CombatUnit[]): void {
    units.forEach(unit => {
      if (unit.status === 'active' && unit.morale <= 0) {
        unit.status = 'retreated';
        unit.morale = 0;
      }
    });
  }
  
  // 创建战斗结果
  private createCombatResult(victory: boolean, playerUnits: CombatUnit[], dungeon: DungeonData): CombatResult {
    const survivingUnits = playerUnits.filter(u => u.status === 'active');
    const casualties = playerUnits.filter(u => u.status === 'dead').length;
    const retreated = playerUnits.filter(u => u.status === 'retreated').length;
    
    const result: CombatResult = {
      victory,
      survivingUnits,
      casualties,
      retreated
    };
    
    // 如果胜利，给予奖励
    if (victory) {
      result.rewards = dungeon.rewards;
      result.experience = this.calculateExperience(dungeon.difficulty, casualties);
    }
    
    return result;
  }
  
  // 计算经验值
  private calculateExperience(difficulty: number, casualties: number): number {
    const baseExp = difficulty * 10;
    const casualtyPenalty = casualties * 2;
    return Math.max(5, baseExp - casualtyPenalty);
  }
  
  // 计算战斗力评估
  calculateCombatPower(units: MilitaryUnit[]): number {
    return units.reduce((total, unit) => {
      const unitType = getUnitType(unit.typeId);
      if (!unitType || unit.count <= 0) return total;
      
      const unitPower = (unitType.baseStats.attack + unitType.baseStats.defense + unitType.baseStats.health / 10) * unit.count;
      const moraleModifier = (unit.currentMorale || unitType.baseStats.morale) / unitType.baseStats.morale;
      
      return total + (unitPower * moraleModifier);
    }, 0);
  }
  
  // 计算敌人战斗力
  calculateEnemyPower(enemies: EnemyUnit[]): number {
    return enemies.reduce((total, enemy) => {
      const enemyPower = (enemy.attack + enemy.health / 10) * enemy.count;
      const moraleModifier = enemy.morale / 50; // 假设标准士气为50
      
      return total + (enemyPower * moraleModifier);
    }, 0);
  }
  
  // 预测战斗结果
  predictBattleOutcome(playerUnits: MilitaryUnit[], enemies: EnemyUnit[]): {
    playerPower: number;
    enemyPower: number;
    winChance: number;
    recommendation: 'attack' | 'retreat' | 'prepare';
  } {
    const playerPower = this.calculateCombatPower(playerUnits);
    const enemyPower = this.calculateEnemyPower(enemies);
    
    const powerRatio = playerPower / (enemyPower || 1);
    let winChance: number;
    let recommendation: 'attack' | 'retreat' | 'prepare';
    
    if (powerRatio >= 1.5) {
      winChance = 90;
      recommendation = 'attack';
    } else if (powerRatio >= 1.2) {
      winChance = 75;
      recommendation = 'attack';
    } else if (powerRatio >= 1.0) {
      winChance = 60;
      recommendation = 'attack';
    } else if (powerRatio >= 0.8) {
      winChance = 40;
      recommendation = 'prepare';
    } else if (powerRatio >= 0.6) {
      winChance = 25;
      recommendation = 'prepare';
    } else {
      winChance = 10;
      recommendation = 'retreat';
    }
    
    return {
      playerPower,
      enemyPower,
      winChance,
      recommendation
    };
  }
  
  // 应用战斗结果到军事单位
  applyCombatResult(result: CombatResult, originalUnits: MilitaryUnit[]): void {
    // 按类型统计幸存者
    const survivorsByType: Record<string, number> = {};
    result.survivingUnits.forEach(unit => {
      survivorsByType[unit.typeId] = (survivorsByType[unit.typeId] || 0) + 1;
    });
    
    // 更新原始单位
    originalUnits.forEach(unit => {
      const survivors = survivorsByType[unit.typeId] || 0;
      const originalCount = unit.count;
      
      unit.count = survivors;
      
      // 更新占用人口
      const populationLoss = originalCount - survivors;
      unit.assignedPopulation -= populationLoss;
      
      // 更新状态
      if (unit.count > 0) {
        unit.status = 'defending';
        
        // 更新血量和士气（取平均值）
        const unitSurvivors = result.survivingUnits.filter(s => s.typeId === unit.typeId);
        if (unitSurvivors.length > 0) {
          const avgHealth = unitSurvivors.reduce((sum, u) => sum + u.health, 0) / unitSurvivors.length;
          const avgMorale = unitSurvivors.reduce((sum, u) => sum + u.morale, 0) / unitSurvivors.length;
          
          unit.currentHealth = Math.floor(avgHealth);
          unit.currentMorale = Math.floor(avgMorale);
        }
      }
    });
    
    // 移除没有幸存者的单位
    const unitsToRemove = originalUnits.filter(unit => unit.count <= 0);
    unitsToRemove.forEach(unit => {
      const index = originalUnits.indexOf(unit);
      if (index > -1) {
        originalUnits.splice(index, 1);
      }
    });
  }
  
  // 获取战斗报告
  generateBattleReport(result: CombatResult, dungeon: DungeonData): string {
    let report = `战斗报告 - ${dungeon.name}\n\n`;
    
    if (result.victory) {
      report += "🎉 胜利！\n\n";
      report += `获得奖励：\n`;
      if (result.rewards) {
        Object.entries(result.rewards).forEach(([resource, amount]) => {
          if (amount && amount > 0) {
            report += `- ${resource}: +${amount}\n`;
          }
        });
      }
      if (result.experience) {
        report += `- 经验值: +${result.experience}\n`;
      }
    } else {
      report += "💀 失败...\n\n";
    }
    
    report += `\n战斗统计：\n`;
    report += `- 幸存者: ${result.survivingUnits.length}\n`;
    report += `- 阵亡: ${result.casualties}\n`;
    report += `- 溃退: ${result.retreated}\n`;
    
    return report;
  }
}