import { PauseEvent, NonPauseEvent } from '../types/game';

// 暂停事件数据
export const pauseEvents: PauseEvent[] = [
  {
    id: 'leader_ambush',
    name: '将领遭遇伏击',
    description: '我们的将领在巡逻时遭遇了敌人的伏击，情况危急！',
    category: 'character',
    characterId: 'general',
    probability: 0.15,
    requirements: {
      characters: { has: ['general'] },
      population: { min: 50 }
    },
    options: [
      {
        id: 'fight_back',
        text: '奋力反击',
        description: '命令将领带领部下奋力反击',
        requirements: {
          attribute: 'military',
          dice: '1D6',
          difficulty: 4
        },
        outcomes: {
          success: {
            description: '将领成功击退了敌人，还缴获了一些战利品',
            effects: {
              resources: { tools: 10, food: 5 },
              stability: 5,
              characterEffects: [{
                characterId: 'general',
                attributeChanges: { military: 1 }
              }]
            }
          },
          failure: {
            description: '反击失败，将领受伤，部分物资丢失',
            effects: {
              resources: { food: -10, tools: -5 },
              stability: -3,
              characterEffects: [{
                characterId: 'general',
                healthChange: -10
              }]
            }
          }
        }
      },
      {
        id: 'retreat',
        text: '战略撤退',
        description: '命令将领立即撤退，保存实力',
        outcomes: {
          guaranteed: {
            description: '将领安全撤退，但损失了一些物资和威望',
            effects: {
              resources: { food: -5 },
              stability: -2
            }
          }
        }
      }
    ]
  },
  {
    id: 'diplomat_crisis',
    name: '外交官谈判危机',
    description: '我们的外交官在与邻国谈判时遇到了严重分歧，谈判陷入僵局。',
    category: 'diplomatic',
    characterId: 'diplomat',
    probability: 0.12,
    requirements: {
      characters: { has: ['diplomat'] },
      population: { min: 30 }
    },
    options: [
      {
        id: 'compromise',
        text: '寻求妥协',
        description: '指示外交官做出一定让步，寻求双方都能接受的方案',
        requirements: {
          attribute: 'leadership',
          dice: '1D8',
          difficulty: 5
        },
        outcomes: {
          success: {
            description: '成功达成妥协协议，获得了贸易优势',
            effects: {
              resources: { food: 15, tools: 8 },
              stability: 3,
              buffs: [{
                type: 'trade_bonus',
                value: 10,
                duration: 6
              }]
            }
          },
          failure: {
            description: '妥协被拒绝，关系进一步恶化',
            effects: {
              stability: -5,
              corruption: 2
            }
          }
        }
      },
      {
        id: 'stand_firm',
        text: '坚持立场',
        description: '坚持我们的立场，不做任何让步',
        outcomes: {
          guaranteed: {
            description: '虽然谈判破裂，但维护了我们的尊严和原则',
            effects: {
              stability: 2,
              corruption: -1
            }
          }
        }
      }
    ]
  },
  {
    id: 'ruler_illness',
    name: '统治者突发疾病',
    description: '我们的统治者突然患上了严重的疾病，整个部落陷入恐慌。',
    category: 'crisis',
    characterId: 'chief',
    probability: 0.08,
    requirements: {
      characters: { has: ['chief'] },
      population: { min: 20 }
    },
    options: [
      {
        id: 'seek_healer',
        text: '寻找治疗师',
        description: '派人寻找最好的治疗师来医治统治者',
        requirements: {
          cost: { food: 20, tools: 10 }
        },
        outcomes: {
          success: {
            description: '治疗师成功治愈了统治者，民心大振',
            effects: {
              stability: 10,
              characterEffects: [{
                characterId: 'chief',
                healthChange: 20
              }]
            }
          },
          failure: {
            description: '治疗失败，统治者病情加重，民心动摇',
            effects: {
              stability: -8,
              characterEffects: [{
                characterId: 'chief',
                healthChange: -5
              }]
            }
          }
        }
      },
      {
        id: 'pray_gods',
        text: '向神灵祈祷',
        description: '组织全族向神灵祈祷，祈求统治者康复',
        outcomes: {
          guaranteed: {
            description: '虽然效果有限，但祈祷安抚了民心',
            effects: {
              stability: 3,
              corruption: -2
            }
          }
        }
      }
    ]
  }
];

// 不暂停事件数据
export const nonPauseEvents: NonPauseEvent[] = [
  {
    id: 'discovery_cave',
    name: '发现神秘洞穴',
    description: '探险队在山区发现了一个神秘的洞穴，里面似乎有古老的痕迹。',
    category: 'discovery',
    type: 'positive',
    probability: 0.2,
    requirements: {
      population: { min: 15 },
      technologies: { has: ['exploration'] }
    },
    effects: {
      resources: { stone: 20, tools: 5 },
      discoveries: ['ancient_cave']
    }
  },
  {
    id: 'wild_animal_attack',
    name: '野兽袭击',
    description: '一群饥饿的野兽袭击了我们的定居点，造成了一些损失。',
    category: 'disaster',
    type: 'negative',
    probability: 0.15,
    requirements: {
      population: { min: 10 }
    },
    effects: {
      resources: { food: -15, population: -2 },
      stability: -3,
      casualties: [{
        type: 'civilian',
        count: 2
      }]
    }
  },
  {
    id: 'good_harvest',
    name: '丰收季节',
    description: '今年的收成特别好，仓库里堆满了粮食。',
    category: 'resource',
    type: 'positive',
    probability: 0.25,
    requirements: {
      buildings: { has: ['farm'], count: 1 },
      population: { min: 5 }
    },
    effects: {
      resources: { food: 30 },
      stability: 5
    }
  },
  {
    id: 'tool_discovery',
    name: '发现古代工具',
    description: '在挖掘过程中，我们发现了一些保存完好的古代工具。',
    category: 'discovery',
    type: 'positive',
    probability: 0.18,
    requirements: {
      buildings: { has: ['quarry'], count: 1 }
    },
    effects: {
      resources: { tools: 15 },
      stability: 2
    }
  },
  {
    id: 'storm_damage',
    name: '暴风雨损害',
    description: '一场猛烈的暴风雨损坏了部分建筑和储存的物资。',
    category: 'disaster',
    type: 'negative',
    probability: 0.12,
    requirements: {
      population: { min: 8 }
    },
    effects: {
      resources: { wood: -10, food: -8 },
      stability: -4
    }
  },
  {
    id: 'trader_visit',
    name: '商人来访',
    description: '一群友善的商人来到我们的定居点，带来了一些有用的物品。',
    category: 'exploration',
    type: 'positive',
    probability: 0.2,
    requirements: {
      population: { min: 20 },
      stability: { min: 30 }
    },
    effects: {
      resources: { tools: 8, food: 12 },
      stability: 3
    }
  },
  {
    id: 'resource_depletion',
    name: '资源枯竭',
    description: '附近的一个资源点已经枯竭，我们需要寻找新的资源来源。',
    category: 'resource',
    type: 'negative',
    probability: 0.1,
    requirements: {
      population: { min: 25 }
    },
    effects: {
      stability: -2,
      corruption: 1
    }
  },
  {
    id: 'new_settlement',
    name: '发现新定居点',
    description: '我们的探险队发现了一个适合建立前哨站的地点。',
    category: 'exploration',
    type: 'positive',
    probability: 0.15,
    requirements: {
      population: { min: 40 },
      technologies: { has: ['exploration', 'construction'] }
    },
    effects: {
      discoveries: ['new_outpost'],
      stability: 4
    }
  }
];

// 事件触发检查函数
export function checkEventRequirements(
  event: PauseEvent | NonPauseEvent,
  gameState: any
): boolean {
  const { requirements } = event;
  if (!requirements) return true;

  // 检查人口要求
  if (requirements.population) {
    const { min, max } = requirements.population;
    if (min && gameState.resources.population < min) return false;
    if (max && gameState.resources.population > max) return false;
  }

  // 检查稳定度要求
  if (requirements.stability) {
    const { min, max } = requirements.stability;
    if (min && gameState.stability < min) return false;
    if (max && gameState.stability > max) return false;
  }

  // 检查腐败度要求
  if (requirements.corruption) {
    const { min, max } = requirements.corruption;
    if (min && gameState.corruption < min) return false;
    if (max && gameState.corruption > max) return false;
  }

  // 检查资源要求
  if (requirements.resources) {
    for (const [resource, requirement] of Object.entries(requirements.resources)) {
      const currentValue = gameState.resources[resource] || 0;
      if (requirement?.min && currentValue < requirement.min) return false;
      if (requirement?.max && currentValue > requirement.max) return false;
    }
  }

  // 检查科技要求
  if (requirements.technologies) {
    const { has, not } = requirements.technologies;
    if (has) {
      for (const techId of has) {
        if (!gameState.technologies[techId]?.researched) return false;
      }
    }
    if (not) {
      for (const techId of not) {
        if (gameState.technologies[techId]?.researched) return false;
      }
    }
  }

  // 检查建筑要求
  if (requirements.buildings) {
    const { has, count } = requirements.buildings;
    if (has) {
      for (const buildingId of has) {
        if (!gameState.buildings[buildingId] || gameState.buildings[buildingId].count === 0) {
          return false;
        }
      }
    }
    if (count) {
      const totalBuildings = Object.values(gameState.buildings)
        .reduce((sum: number, building: any) => sum + building.count, 0);
      if (totalBuildings < count) return false;
    }
  }

  // 检查角色要求
  if (requirements.characters) {
    const { has, not } = requirements.characters;
    if (has) {
      for (const characterId of has) {
        if (!gameState.characters[characterId]?.isActive) return false;
      }
    }
    if (not) {
      for (const characterId of not) {
        if (gameState.characters[characterId]?.isActive) return false;
      }
    }
  }

  return true;
}

// 获取可触发的事件
export function getAvailableEvents(
  events: (PauseEvent | NonPauseEvent)[],
  gameState: any
): (PauseEvent | NonPauseEvent)[] {
  return events.filter(event => checkEventRequirements(event, gameState));
}

// 获取所有可触发的事件
export function getTriggeredEvents(gameState: any): (PauseEvent | NonPauseEvent)[] {
  const allEvents = [...pauseEvents, ...nonPauseEvents];
  return getAvailableEvents(allEvents, gameState);
}

// 随机选择事件
export function selectRandomEvent(gameState: any): (PauseEvent | NonPauseEvent) | null {
  const availableEvents = getTriggeredEvents(gameState);
  if (availableEvents.length === 0) return null;
  
  // 根据概率权重选择事件
  const totalWeight = availableEvents.reduce((sum, event) => sum + event.probability, 0);
  const random = Math.random() * totalWeight;
  
  let currentWeight = 0;
  for (const event of availableEvents) {
    currentWeight += event.probability;
    if (random <= currentWeight) {
      return event;
    }
  }
  
  return availableEvents[availableEvents.length - 1];
}