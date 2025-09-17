'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building, 
  Home, 
  Factory, 
  Warehouse, 
  Shield, 
  Palette, 
  Settings,
  Plus,
  Minus,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { GameState } from '@/types/game';
import { 
  BuildingDefinition, 
  BuildingInstance, 
  BuildingCategory,
  BuildingManagementState 
} from '@/types/building';
import { 
  BUILDING_DEFINITIONS, 
  BUILDING_CATEGORIES, 
  getBuildingDefinition,
  getBuildingsByCategory 
} from '@/lib/building-data';
import { BuildingSystem, BuildingUtils } from '@/lib/building-system';
import { useGameStore } from '@/lib/game-store';

const categoryIcons = {
  housing: Home,
  production: Factory,
  storage: Warehouse,
  functional: Settings,
  military: Shield,
  cultural: Palette
};

const categoryColors = {
  housing: 'bg-blue-500',
  production: 'bg-green-500',
  storage: 'bg-yellow-500',
  functional: 'bg-purple-500',
  military: 'bg-red-500',
  cultural: 'bg-indigo-500'
};

export function BuildingTab() {
  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory>('housing');
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [buildQuantity, setBuildQuantity] = useState(1);
  
  const gameState = useGameStore(state => state.gameState);
  const constructBuilding = useGameStore(state => state.constructBuilding);
  const demolishBuildingNew = useGameStore(state => state.demolishBuildingNew);
  const assignWorkerToBuildingNew = useGameStore(state => state.assignWorkerToBuildingNew);
  const removeWorkerFromBuildingNew = useGameStore(state => state.removeWorkerFromBuildingNew);
  const addNotification = useGameStore(state => state.addNotification);
  // 新增：使用 GameStore 的统一校验与成本计算，以匹配 20% 递增规则
  const canConstructBuilding = useGameStore(state => state.canConstructBuilding);
  const getBuildingConstructionCost = useGameStore(state => state.getBuildingConstructionCost);
  
  const buildingSystem = useMemo(() => new BuildingSystem(gameState), [gameState]);
  const managementState = useMemo(() => buildingSystem.getBuildingManagementState(), [buildingSystem]);
  
  // 获取分类下的建筑
  const categoryBuildings = useMemo(() => {
    return getBuildingsByCategory(selectedCategory).filter(building => 
      buildingSystem.isBuildingUnlocked(building.id)
    );
  }, [selectedCategory, buildingSystem]);

  // 处理建造建筑
  const handleBuildBuilding = (buildingId: string, quantity: number) => {
    const success = constructBuilding(buildingId);
    
    if (success) {
      addNotification({
        type: 'success',
        title: '建造成功',
        message: `成功建造了 ${getBuildingDefinition(buildingId)?.name || buildingId}`
      });
    } else {
      addNotification({
        type: 'error',
        title: '建造失败',
        message: '资源不足或不满足建造条件'
      });
    }
  };

  // 处理工人分配
  const handleWorkerAssignment = (instanceId: string, workerCount: number) => {
    const success = assignWorkerToBuildingNew(instanceId, workerCount);
    
    if (success) {
      addNotification({
        type: 'success',
        title: '工人分配成功',
        message: `成功分配了 ${workerCount} 个工人`
      });
    } else {
      addNotification({
        type: 'error',
        title: '工人分配失败',
        message: '可用工人不足'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 建筑统计概览 - 精简为单行三项 */}
      <Card className="bg-transparent shadow-none border-0 p-0">
        <CardContent className="p-0">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{managementState.statistics.totalBuildings}</span>
              <span className="text-gray-500">总建筑数</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{managementState.workerAssignment.assignedWorkers}</span>
              <span className="text-gray-500">已分配工人</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{managementState.workerAssignment.availableWorkers}</span>
              <span className="text-gray-500">盈余人口</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 建筑管理主界面 */}
      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as BuildingCategory)}>
        <TabsList className="grid w-full grid-cols-6 gap-1 p-0 bg-transparent border-0">
          {Object.entries(BUILDING_CATEGORIES).map(([category, config]) => {
            const Icon = categoryIcons[category as BuildingCategory];
            const count = managementState.statistics.buildingsByCategory[category as BuildingCategory];
            
            return (
              <TabsTrigger key={category} value={category} className="flex items-center justify-center gap-2 px-2 py-2 rounded-md text-sm border-b-2 border-transparent text-gray-400 hover:text-gray-200 data-[state=active]:text-white data-[state=active]:border-white">
                <Icon className="w-4 h-4" />
                <span className="text-xs">{config.name}</span>
                {count > 0 && (
                  <span className="text-[10px] text-gray-500">{count}</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {/* Tabs 与下方建筑卡片之间的分割线 */}
        <div className="h-px bg-white/10 my-3" />

        {Object.keys(BUILDING_CATEGORIES).map(category => (
          <TabsContent key={category} value={category} className="space-y-3">
            <div className="grid gap-3">
              {/* 分类描述移除 */}

              {/* 可建造建筑列表 */}
              <div className="grid md:grid-cols-2 gap-3">
                {categoryBuildings.map(building => {
                  // 统一使用 GameStore 的成本与可建造校验
                  const adjustedCost = getBuildingConstructionCost(building.id) || {} as any;
                  const canConstruct = canConstructBuilding(building.id);
                  const currentCount = buildingSystem.getBuildingCount(building.id);
                  const buildLimit = managementState.buildLimits[building.id];
                  
                  return (
                    <Card key={building.id} className="relative bg-transparent shadow-none border border-white/10">
                      <CardHeader className="py-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{building.name}</CardTitle>
                            {/* 建筑描述移除 */}
                          </div>
                          <span className="text-xs text-gray-500">
                            {BUILDING_CATEGORIES[building.category].name}
                          </span>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        {/* 建筑信息 */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">建造时间:</span>
                            <span className="ml-2 font-medium">
                              {BuildingUtils.formatBuildTime(building.buildTime)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">最大工人:</span>
                            <span className="ml-2 font-medium">{building.maxWorkers}</span>
                          </div>
                          {currentCount > 0 && (
                            <div>
                              <span className="text-gray-500">已建造:</span>
                              <span className="ml-2 font-medium">{currentCount}</span>
                            </div>
                          )}
                          {buildLimit && (
                            <div>
                              <span className="text-gray-500">建造限制:</span>
                              <span className="ml-2 font-medium">
                                {buildLimit.current}/{buildLimit.maximum}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 建造成本（使用 20% 递增后的动态成本） */}
                        <div>
                          <h4 className="font-medium mb-2">建造成本</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(adjustedCost).map(([resource, cost]) => {
                              const currentAmount = (gameState.resources as any)[resource];
                              const hasEnough = currentAmount >= (cost as number);
                              
                              return (
                                <div key={resource} className={`text-sm ${hasEnough ? 'text-white' : 'text-gray-500'}`}>
                                  {cost as number} {resource}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 生产效果 */}
                        {building.production && building.production.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">生产效果</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {building.production.map(prod => (
                                <div key={prod.resource} className="text-sm text-gray-300">
                                  +{prod.baseRate} {prod.resource}/工人
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 储存效果 */}
                        {building.storage && building.storage.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">储存效果</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {building.storage.map((storage, index) => (
                                <div key={index} className="text-sm text-gray-300">
                                  +{storage.capacity}{storage.isPercentage ? '%' : ''} {storage.resource === 'all' ? '全部资源' : storage.resource}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <Separator />

                        {/* 建造控制 */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setBuildQuantity(Math.max(1, buildQuantity - 1))}
                              disabled={buildQuantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="px-3 py-1 border border-white/10 rounded text-center min-w-[3rem]">
                              {buildQuantity}
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setBuildQuantity(buildQuantity + 1)}
                              disabled={buildLimit ? buildQuantity >= (buildLimit.maximum - buildLimit.current) : false}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <Button
                            className="w-full"
                            onClick={() => handleBuildBuilding(building.id, buildQuantity)}
                            disabled={!canConstruct.canBuild}
                          >
                            <Building className="w-4 h-4 mr-2" />
                            建造 {buildQuantity > 1 ? `x${buildQuantity}` : ''}
                          </Button>
                          
                          {!canConstruct.canBuild && (
                            <div className="text-xs text-gray-500">
                              {canConstruct.reason || '无法建造此建筑'}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {categoryBuildings.length === 0 && (
                <Card className="bg-transparent shadow-none border border-white/10">
                  <CardContent className="pt-6 text-center text-gray-500">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>该分类下暂无可建造的建筑</p>
                    <p className="text-sm mt-1">研究相关科技以解锁更多建筑</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* 已建造建筑管理 */}
      {Object.keys(managementState.buildings).length > 0 && (
        <Card className="bg-transparent shadow-none border border-white/10">
          <CardHeader>
            <CardTitle>建筑管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.values(managementState.buildings).map(instance => {
                const building = getBuildingDefinition(instance.buildingId);
                if (!building) return null;
                
                const productionResult = buildingSystem.calculateBuildingProduction(instance.id);
                
                return (
                  <Card key={instance.id} className="bg-transparent shadow-none border border-white/10">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{building.name}</h4>
                          <p className="text-sm text-gray-500">
                            数量: {instance.count || 1} | 等级: {instance.level}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {instance.status === 'building' && (
                            <Badge variant="outline" className="text-gray-400">
                              <Clock className="w-3 h-3 mr-1" />
                              建造中
                            </Badge>
                          )}
                          {instance.status === 'completed' && (
                            <Badge variant="outline" className="text-gray-400">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              已完成
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* 建造进度 */}
                      {instance.status === 'building' && instance.constructionProgress !== undefined && (
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>建造进度</span>
                            <span>{instance.constructionProgress.toFixed(1)}%</span>
                          </div>
                          <Progress value={instance.constructionProgress} className="h-2" />
                        </div>
                      )}

                      {/* 工人分配 */}
                      {instance.status === 'completed' && building.maxWorkers > 0 && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">工人分配</label>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleWorkerAssignment(instance.id, Math.max(0, instance.assignedWorkers - 1))}
                                disabled={instance.assignedWorkers <= 0}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="px-3 py-1 border border-white/10 rounded text-center min-w-[3rem]">
                                {instance.assignedWorkers}
                              </span>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleWorkerAssignment(instance.id, Math.min(building.maxWorkers, instance.assignedWorkers + 1))}
                                disabled={instance.assignedWorkers >= building.maxWorkers || managementState.workerAssignment.availableWorkers <= 0}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              <span className="text-sm text-gray-500">/ {building.maxWorkers}</span>
                            </div>
                          </div>

                          {/* 生产显示 */}
                          {productionResult.production.length > 0 && (
                            <div>
                              <label className="text-sm font-medium mb-2 block">当前生产</label>
                              <div className="space-y-1">
                                {productionResult.production.map(prod => (
                                  <div key={prod.resource} className="text-sm">
                                    <span className="text-gray-300">+{prod.actualRate.toFixed(1)}</span>
                                    <span className="text-gray-500 ml-1">{prod.resource}</span>
                                    <span className="text-gray-500 ml-1">({(prod.efficiency * 100).toFixed(0)}% 效率)</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}