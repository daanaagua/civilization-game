import { MilitaryUnit, TrainingQueue, MilitaryState, UnitType, ResourceCost } from '../types/military';
import { UNIT_TYPES, getUnitType } from './military-data';
import { GameState } from '../types/game';

// 军队系统管理类
export class MilitarySystem {
  private state: MilitaryState;
  private gameState: GameState;

  constructor(gameState: GameState) {
    this.gameState = gameState;
    this.state = {
      units: [],
      trainingQueue: [],
      availableUnitTypes: ['tribal_militia'], // 默认解锁部落民兵
      isTraining: false
    };
  }

  // 获取军队状态
  getState(): MilitaryState {
    return this.state;
  }

  // 更新可用兵种（基于科技解锁）
  updateAvailableUnits(unlockedTechs: string[]): void {
    const availableTypes = Object.values(UNIT_TYPES)
      .filter(unit => {
        if (unit.unlockCondition === 'none') return true;
        return unlockedTechs.includes(unit.unlockCondition);
      })
      .map(unit => unit.id);
    
    this.state.availableUnitTypes = availableTypes;
  }

  // 检查是否可以训练指定兵种
  canTrainUnit(unitTypeId: string, quantity: number = 1): {
    canTrain: boolean;
    reason?: string;
    cost?: ResourceCost;
  } {
    const unitType = getUnitType(unitTypeId);
    if (!unitType) {
      return { canTrain: false, reason: '未知兵种' };
    }

    // 检查是否已解锁
    if (!this.state.availableUnitTypes.includes(unitTypeId)) {
      return { canTrain: false, reason: '兵种未解锁' };
    }

    // 检查是否正在训练其他兵种
    if (this.state.isTraining && this.state.currentTrainingType !== unitTypeId) {
      return { canTrain: false, reason: '正在训练其他兵种' };
    }

    // 检查人口是否足够
    const requiredPopulation = quantity;
    const availablePopulation = this.gameState.population.current - this.gameState.population.used;
    if (availablePopulation < requiredPopulation) {
      return { canTrain: false, reason: '人口不足' };
    }

    // 计算总成本
    const totalCost: ResourceCost = {};
    Object.entries(unitType.recruitmentCost).forEach(([resource, cost]) => {
      if (cost) {
        totalCost[resource as keyof ResourceCost] = cost * quantity;
      }
    });

    // 检查资源是否足够
    const resourceCheck = this.checkResourceAvailability(totalCost);
    if (!resourceCheck.sufficient) {
      return { canTrain: false, reason: `资源不足: ${resourceCheck.missing.join(', ')}` };
    }

    return { canTrain: true, cost: totalCost };
  }

  // 开始训练兵种
  startTraining(unitTypeId: string, quantity: number = 1): boolean {
    const canTrain = this.canTrainUnit(unitTypeId, quantity);
    if (!canTrain.canTrain || !canTrain.cost) {
      return false;
    }

    const unitType = getUnitType(unitTypeId)!;
    const currentTime = Date.now();
    const trainingDuration = unitType.trainingTime * 24 * 60 * 60 * 1000; // 转换为毫秒

    // 消耗资源
    this.consumeResources(canTrain.cost);

    // 占用人口
    this.gameState.population.used += quantity;

    // 添加到训练队列
    const trainingItem: TrainingQueue = {
      unitTypeId,
      quantity,
      startTime: currentTime,
      endTime: currentTime + trainingDuration,
      assignedPopulation: quantity
    };

    this.state.trainingQueue.push(trainingItem);
    this.state.isTraining = true;
    this.state.currentTrainingType = unitTypeId;

    return true;
  }

  // 更新训练进度
  updateTraining(): void {
    const currentTime = Date.now();
    const completedTraining: TrainingQueue[] = [];

    // 检查完成的训练
    this.state.trainingQueue = this.state.trainingQueue.filter(training => {
      if (currentTime >= training.endTime) {
        completedTraining.push(training);
        return false;
      }
      return true;
    });

    // 处理完成的训练
    completedTraining.forEach(training => {
      this.completeTraining(training);
    });

    // 更新训练状态
    if (this.state.trainingQueue.length === 0) {
      this.state.isTraining = false;
      this.state.currentTrainingType = undefined;
    }
  }

  // 完成训练
  private completeTraining(training: TrainingQueue): void {
    const unitType = getUnitType(training.unitTypeId)!;
    
    // 查找现有单位或创建新单位
    let existingUnit = this.state.units.find(
      unit => unit.typeId === training.unitTypeId && unit.status === 'defending'
    );

    if (existingUnit) {
      existingUnit.count += training.quantity;
      existingUnit.assignedPopulation += training.assignedPopulation;
    } else {
      const newUnit: MilitaryUnit = {
        id: `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        typeId: training.unitTypeId,
        count: training.quantity,
        currentHealth: unitType.baseStats.health,
        currentMorale: unitType.baseStats.morale,
        status: 'defending',
        assignedPopulation: training.assignedPopulation
      };
      this.state.units.push(newUnit);
    }
  }

  // 获取训练进度
  getTrainingProgress(): number {
    if (!this.state.isTraining || this.state.trainingQueue.length === 0) {
      return 0;
    }

    const currentTraining = this.state.trainingQueue[0];
    const currentTime = Date.now();
    const totalTime = currentTraining.endTime - currentTraining.startTime;
    const elapsedTime = currentTime - currentTraining.startTime;
    
    return Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
  }

  // 获取守城部队
  getDefendingUnits(): MilitaryUnit[] {
    return this.state.units.filter(unit => unit.status === 'defending' && unit.count > 0);
  }

  // 获取探索部队
  getExplorerUnits(): MilitaryUnit[] {
    return this.state.units.filter(unit => {
      const unitType = getUnitType(unit.typeId);
      return unitType?.isExplorer && unit.count > 0;
    });
  }

  // 派遣部队探索
  sendExploration(unitId: string): boolean {
    const unit = this.state.units.find(u => u.id === unitId);
    if (!unit || unit.count === 0 || unit.status !== 'defending') {
      return false;
    }

    const unitType = getUnitType(unit.typeId);
    if (!unitType?.isExplorer) {
      return false;
    }

    unit.status = 'exploring';
    return true;
  }

  // 召回探索部队
  recallExplorer(unitId: string): boolean {
    const unit = this.state.units.find(u => u.id === unitId);
    if (!unit || unit.status !== 'exploring') {
      return false;
    }

    unit.status = 'defending';
    return true;
  }

  // 派遣部队攻击副本
  sendAttack(unitIds: string[], targetId: string): boolean {
    const attackingUnits = unitIds.map(id => 
      this.state.units.find(u => u.id === id)
    ).filter(unit => 
      unit && unit.count > 0 && unit.status === 'defending'
    ) as MilitaryUnit[];

    if (attackingUnits.length === 0) {
      return false;
    }

    // 设置部队状态为攻击
    attackingUnits.forEach(unit => {
      unit.status = 'attacking';
    });

    return true;
  }

  // 处理战斗伤亡
  processCasualties(unitId: string, casualties: number, retreated: number): void {
    const unit = this.state.units.find(u => u.id === unitId);
    if (!unit) return;

    // 处理死亡
    const actualCasualties = Math.min(casualties, unit.count);
    unit.count -= actualCasualties;
    unit.assignedPopulation -= actualCasualties;
    
    // 从总人口中减少死亡数量
    this.gameState.population.current -= actualCasualties;
    this.gameState.population.used -= actualCasualties;

    // 处理溃退（溃退的士兵不死亡，但暂时无法战斗）
    const actualRetreated = Math.min(retreated, unit.count);
    unit.currentMorale = Math.max(0, unit.currentMorale - retreated * 5); // 溃退影响士气

    // 如果单位全部死亡或溃退，移除该单位
    if (unit.count <= 0) {
      const index = this.state.units.indexOf(unit);
      if (index > -1) {
        this.state.units.splice(index, 1);
      }
    } else {
      // 战斗结束后返回守城状态
      unit.status = 'defending';
    }
  }

  // 恢复士气
  restoreMorale(): void {
    this.state.units.forEach(unit => {
      const unitType = getUnitType(unit.typeId);
      if (unitType && unit.currentMorale < unitType.baseStats.morale) {
        unit.currentMorale = Math.min(
          unitType.baseStats.morale,
          unit.currentMorale + 5 // 每次恢复5点士气
        );
      }
    });
  }

  // 检查资源可用性
  private checkResourceAvailability(cost: ResourceCost): {
    sufficient: boolean;
    missing: string[];
  } {
    const missing: string[] = [];
    
    Object.entries(cost).forEach(([resource, amount]) => {
      if (amount && amount > 0) {
        const available = this.gameState.resources[resource as keyof typeof this.gameState.resources] || 0;
        if (available < amount) {
          missing.push(resource);
        }
      }
    });

    return {
      sufficient: missing.length === 0,
      missing
    };
  }

  // 消耗资源
  private consumeResources(cost: ResourceCost): void {
    Object.entries(cost).forEach(([resource, amount]) => {
      if (amount && amount > 0) {
        const currentAmount = this.gameState.resources[resource as keyof typeof this.gameState.resources] || 0;
        this.gameState.resources[resource as keyof typeof this.gameState.resources] = Math.max(0, currentAmount - amount);
      }
    });
  }

  // 获取维护成本
  getMaintenanceCost(): ResourceCost {
    const totalCost: ResourceCost = {};
    
    this.state.units.forEach(unit => {
      const unitType = getUnitType(unit.typeId);
      if (unitType && unit.count > 0) {
        Object.entries(unitType.maintenanceCost).forEach(([resource, cost]) => {
          if (cost) {
            const key = resource as keyof ResourceCost;
            totalCost[key] = (totalCost[key] || 0) + (cost * unit.count);
          }
        });
      }
    });

    return totalCost;
  }

  // 支付维护费用
  payMaintenance(): boolean {
    const cost = this.getMaintenanceCost();
    const check = this.checkResourceAvailability(cost);
    
    if (check.sufficient) {
      this.consumeResources(cost);
      return true;
    }
    
    // 如果无法支付维护费用，降低士气
    this.state.units.forEach(unit => {
      unit.currentMorale = Math.max(0, unit.currentMorale - 10);
    });
    
    return false;
  }

  // 获取总军力
  getTotalMilitaryPower(): number {
    return this.state.units.reduce((total, unit) => {
      const unitType = getUnitType(unit.typeId);
      if (unitType) {
        return total + (unit.count * (unitType.baseStats.attack + unitType.baseStats.defense));
      }
      return total;
    }, 0);
  }

  // 序列化状态
  serialize(): any {
    return {
      units: this.state.units,
      trainingQueue: this.state.trainingQueue,
      availableUnitTypes: this.state.availableUnitTypes,
      isTraining: this.state.isTraining,
      currentTrainingType: this.state.currentTrainingType
    };
  }

  // 反序列化状态
  deserialize(data: any): void {
    this.state = {
      units: data.units || [],
      trainingQueue: data.trainingQueue || [],
      availableUnitTypes: data.availableUnitTypes || ['tribal_militia'],
      isTraining: data.isTraining || false,
      currentTrainingType: data.currentTrainingType
    };
  }
}