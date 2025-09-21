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
  getBuildingsByCategory,
  isBuildingUnlocked
} from '@/lib/building-data';
import AggregateWorkerControls from './AggregateWorkerControls';
import { BuildingSystem, BuildingUtils } from '@/lib/building-system';
import { useGameStore } from '@/lib/game-store';
import { useEffect } from 'react';
import { bootstrapRegistry } from '@/lib/registry/bootstrap';
import { getResearchedSet } from '@/lib/selectors';
import { getVisibleFromRegistry } from '@/lib/facade/visibility-facade';
import { registry } from '@/lib/registry/index';
import { createPopulationSelectors } from '@/lib/slices';
import { makeGameStorePopulationProvider } from '@/lib/adapters/population-adapter';

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
  // 取消建造数量选择：点击一次仅建一座
  
  const gameState = useGameStore(state => state.gameState);
  const constructBuilding = useGameStore(state => state.constructBuilding);
  const demolishBuildingNew = useGameStore(state => state.demolishBuildingNew);
  const assignWorkerToBuildingNew = useGameStore(state => state.assignWorkerToBuildingNew);
  const removeWorkerFromBuildingNew = useGameStore(state => state.removeWorkerFromBuildingNew);
  const addNotification = useGameStore(state => state.addNotification);
  // 新增：使用 GameStore 的统一校验与成本计算，以匹配 20% 递增规则
  const canConstructBuilding = useGameStore(state => state.canConstructBuilding);
  const getBuildingConstructionCost = useGameStore(state => state.getBuildingConstructionCost);
  
  // 统一人口选择器（零侵入适配现有 store）
  const popProvider = useMemo(() => makeGameStorePopulationProvider(), []);
  const popSelectors = useMemo(() => createPopulationSelectors(popProvider), [popProvider]);
  const popOverview = useGameStore(state => popSelectors.getOverview(state));

  const buildingSystem = useMemo(() => new BuildingSystem(gameState), [gameState]);
  const managementState = useMemo(() => buildingSystem.getBuildingManagementState(), [buildingSystem]);
  
  // 启动时确保注册中心引导完成（不强制注入 demo 种子）
  useEffect(() => {
    // 仅第一次挂载时尝试引导；避免引入 demo 数据造成未解锁建筑提前显示
    bootstrapRegistry({ includeDemoSeed: false }).catch(() => {});
  }, []);
  
  // 从 store 正确构造“已研究科技”集合
  const ownedTechIds = useMemo(() => getResearchedSet(gameState), [gameState]);
  
  // 通过统一 gating 选择器获取可见建筑（若 registry 为空则回退到旧逻辑）
  const registryVisibleBuildings = useMemo(() => {
    try {
      const { buildings } = getVisibleFromRegistry({ ownedTechIds });
      return buildings;
    } catch {
      return [];
    }
  }, [ownedTechIds]);

  // 注册中心是否已启用（有任何建筑被注册）
  const registryHasAnyBuildings = useMemo(() => {
    try {
      return registry.listBuildings().length > 0;
    } catch {
      return false;
    }
  }, []);

  // 获取分类下的建筑：
  // - 若注册中心启用，则仅使用 registry 的可见结果进行过滤映射（不回退旧逻辑，避免提前曝光）
  // - 若注册中心未启用，则回退旧系统解锁判断
  const categoryBuildings = useMemo(() => {
    const baseList = getBuildingsByCategory(selectedCategory);
    if (registryHasAnyBuildings) {
      const idsInCategory = new Set(baseList.map(b => b.id));
      const visibleIds = new Set(registryVisibleBuildings.map(b => b.id));
      // 同时要求：分类命中 + registry 可见 + 科技前置解锁
      return baseList.filter(b => idsInCategory.has(b.id) && visibleIds.has(b.id) && isBuildingUnlocked(b.id, ownedTechIds));
    }
    // 回退：始终以科技前置为准
    return baseList.filter(b => isBuildingUnlocked(b.id, ownedTechIds));
  }, [selectedCategory, buildingSystem, registryHasAnyBuildings, registryVisibleBuildings]);

  // 处理建造建筑
  const handleBuildBuilding = (buildingId: string) => {
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
              <span className="text-white font-semibold">{popOverview.assigned}</span>
              <span className="text-gray-500">已分配工人</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{popOverview.surplus}</span>
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

                        {/* 工人分配（聚合控制：对该建筑类型所有实例的已分配/上限） */}
                        {building.maxWorkers > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium">人口分配</h4>
                            <AggregateWorkerControls buildingId={building.id} />
                          </div>
                        )}

                        {/* 建造：点击一次仅建一座 */}
                        <div className="space-y-2">
                          <Button
                            className="w-full"
                            onClick={() => handleBuildBuilding(building.id)}
                            disabled={!canConstruct.canBuild}
                          >
                            <Building className="w-4 h-4 mr-2" />
                            建造
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

      {/* 建筑管理模块已移除 */}
    </div>
  );
}