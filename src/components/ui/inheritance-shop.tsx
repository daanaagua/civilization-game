'use client';

import { useGameStore } from '@/lib/store/gameStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, ShoppingCart, Zap, TrendingUp, Shield, Hammer, Wheat, Users } from 'lucide-react';

// 继承点商店物品定义
const INHERITANCE_ITEMS = [
  {
    id: 'resource_boost',
    name: '资源采集加成',
    description: '所有资源采集速度永久提升20%',
    icon: TrendingUp,
    cost: 5,
    maxLevel: 5,
    effects: [{ type: 'resource_production', target: 'all', value: 0.2, isPercentage: true }]
  },
  {
    id: 'population_growth',
    name: '人口增长加速',
    description: '人口增长速度永久提升25%',
    icon: Users,
    cost: 8,
    maxLevel: 3,
    effects: [{ type: 'population_growth', target: 'population', value: 0.25, isPercentage: true }]
  },
  {
    id: 'building_efficiency',
    name: '建筑效率提升',
    description: '所有建筑效率永久提升15%',
    icon: Hammer,
    cost: 6,
    maxLevel: 4,
    effects: [{ type: 'building_efficiency', target: 'all', value: 0.15, isPercentage: true }]
  },
  {
    id: 'research_speed',
    name: '研究速度加成',
    description: '科技研究速度永久提升30%',
    icon: Zap,
    cost: 10,
    maxLevel: 3,
    effects: [{ type: 'research_speed', target: 'research', value: 0.3, isPercentage: true }]
  },
  {
    id: 'stability_bonus',
    name: '稳定度加成',
    description: '基础稳定度永久提升10点',
    icon: Shield,
    cost: 7,
    maxLevel: 5,
    effects: [{ type: 'stability', target: 'stability', value: 10, isPercentage: false }]
  },
  {
    id: 'food_storage',
    name: '食物储存扩容',
    description: '食物储存上限永久提升50%',
    icon: Wheat,
    cost: 4,
    maxLevel: 6,
    effects: [{ type: 'resource_limit', target: 'food', value: 0.5, isPercentage: true }]
  }
];

export function InheritanceShop() {
  const {
    uiState,
    hideInheritanceShop,
    gameState,
    spendInheritancePoints,
    addBuff
  } = useGameStore();

  if (!uiState.showInheritanceShop) {
    return null;
  }

  const currentPoints = gameState.inheritancePoints;

  const handlePurchase = (item: typeof INHERITANCE_ITEMS[0]) => {
    if (currentPoints >= item.cost) {
      // 检查是否已达到最大等级
      const existingBuffs = Object.values(gameState.buffs).filter(
        buff => buff.source.type === 'inheritance' && buff.source.id === item.id
      );
      
      if (existingBuffs.length >= item.maxLevel) {
        return; // 已达到最大等级
      }

      if (spendInheritancePoints(item.cost)) {
        // 添加永久buff
        addBuff({
          name: item.name,
          description: item.description,
          source: {
            type: 'inheritance',
            id: item.id,
            name: item.name
          },
          effects: item.effects,
          // 不设置duration，表示永久
        });
      }
    }
  };

  const getItemLevel = (itemId: string) => {
    return Object.values(gameState.buffs).filter(
      buff => buff.source.type === 'inheritance' && buff.source.id === itemId
    ).length;
  };

  const canPurchase = (item: typeof INHERITANCE_ITEMS[0]) => {
    const currentLevel = getItemLevel(item.id);
    return currentPoints >= item.cost && currentLevel < item.maxLevel;
  };

  const handleClose = () => {
    hideInheritanceShop();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh]">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <ShoppingCart className="h-8 w-8 text-yellow-500" />
          </div>
          <CardTitle className="text-xl font-bold text-yellow-600">
            继承点商店
          </CardTitle>
          <CardDescription>
            使用继承点购买永久加成，提升下次游戏体验
          </CardDescription>
          
          <div className="flex items-center justify-center gap-2 mt-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="font-medium">当前继承点：</span>
            <Badge className="bg-yellow-600">{currentPoints}</Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-96">
            <div className="grid gap-3">
              {INHERITANCE_ITEMS.map((item) => {
                const IconComponent = item.icon;
                const currentLevel = getItemLevel(item.id);
                const isMaxLevel = currentLevel >= item.maxLevel;
                const canBuy = canPurchase(item);
                
                return (
                  <Card key={item.id} className={`p-4 ${isMaxLevel ? 'bg-green-50 border-green-200' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <div className="flex items-center gap-2">
                            {currentLevel > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Lv.{currentLevel}/{item.maxLevel}
                              </Badge>
                            )}
                            {isMaxLevel ? (
                              <Badge className="bg-green-600 text-xs">已满级</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                {item.cost} 继承点
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {item.description}
                        </p>
                        
                        {currentLevel > 0 && (
                          <div className="text-xs text-green-600 mb-2">
                            当前效果：{item.effects[0].value * currentLevel * (item.effects[0].isPercentage ? 100 : 1)}
                            {item.effects[0].isPercentage ? '%' : '点'} 加成
                          </div>
                        )}
                        
                        <div className="flex justify-end">
                          {isMaxLevel ? (
                            <Button size="sm" disabled>
                              已满级
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              disabled={!canBuy}
                              onClick={() => handlePurchase(item)}
                              className={canBuy ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                            >
                              {canBuy ? '购买' : '继承点不足'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
          
          <Separator className="my-4" />
          
          <div className="flex justify-center">
            <Button onClick={handleClose} className="w-32">
              关闭商店
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}