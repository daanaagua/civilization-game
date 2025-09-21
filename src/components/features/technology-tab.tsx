'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '@/lib/game-store';
import { TECHNOLOGIES, TECHNOLOGY_CATEGORIES } from '@/lib/technology-data';
import { Technology } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { bootstrapRegistry } from '@/lib/registry/bootstrap';
import { getVisibleFromRegistry } from '@/lib/facade/visibility-facade';
import { 
  FlaskConical, 
  Sword, 
  Users, 
  BookOpen,
  Lock,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

interface TechnologyCardProps {
  technology: Technology;
  canResearch: boolean;
  isResearching: boolean;
  onStartResearch: (techId: string) => void;
}

function TechnologyCard({ technology, canResearch, isResearching, onStartResearch }: TechnologyCardProps) {
  const gameState = useGameStore((state) => state.gameState);
  const currentResearch = gameState.researchState?.currentResearch;
  const isResearched = gameState.technologies[technology.id]?.researched || false;
  const researchProgressPercent =
    isResearching && currentResearch
      ? Math.min(
          100,
          Math.max(
            0,
            (currentResearch.progress /
              (gameState.technologies[technology.id]?.researchTime || 1)) *
              100
          )
        )
      : 0;
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'production': return <FlaskConical className="w-4 h-4" />;
      case 'military': return <Sword className="w-4 h-4" />;
      case 'social': return <Users className="w-4 h-4" />;
      case 'research': return <BookOpen className="w-4 h-4" />;
      default: return <FlaskConical className="w-4 h-4" />;
    }
  };
  
  const getStatusIcon = () => {
    if (isResearched) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (isResearching) return <Clock className="w-4 h-4 text-blue-500" />;
    if (canResearch) return <Zap className="w-4 h-4 text-yellow-500" />;
    return <Lock className="w-4 h-4 text-gray-400" />;
  };
  
  const getCardClassName = () => {
    if (isResearched) return "border-green-300 bg-green-100/50 shadow-sm";
    if (isResearching) return "border-blue-300 bg-blue-100/50 shadow-sm";
    if (canResearch) return "border-amber-300 bg-amber-100/50 hover:bg-amber-200/50 shadow-sm hover:shadow-md";
    return "border-gray-300 bg-gray-100/50 shadow-sm";
  };
  
  return (
    <Card className={`transition-all duration-200 ${getCardClassName()} h-fit`}>
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {getCategoryIcon(technology.category)}
            <CardTitle className="text-xs font-medium leading-tight">{technology.name}</CardTitle>
          </div>
          {getStatusIcon()}
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3">
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{technology.description}</p>
        
        {/* 前置条件 */}
        {technology.requires && technology.requires.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-medium text-gray-700 mb-1">前置:</p>
            <div className="flex flex-wrap gap-1">
              {technology.requires.slice(0, 2).map((prereq) => {
                const prereqTech = Object.values(TECHNOLOGIES).find(t => t.id === prereq);
                const isPrereqMet = gameState.technologies[prereq]?.researched;
                return (
                  <Badge 
                    key={prereq} 
                    variant={isPrereqMet ? "default" : "secondary"}
                    className="text-xs px-1.5 py-0.5"
                  >
                    {prereqTech?.name || prereq}
                  </Badge>
                );
              })}
              {technology.requires.length > 2 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">+{technology.requires.length - 2}</Badge>
              )}
            </div>
          </div>
        )}
        
        {/* 研究成本 */}
        <div className="mb-2">
          <p className="text-xs font-medium text-gray-700 mb-1">成本:</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(technology.cost).slice(0, 3).map(([resource, amount]) => (
              <Badge key={resource} variant="outline" className="text-xs px-1.5 py-0.5">
                {resource}: {amount}
              </Badge>
            ))}
            {Object.entries(technology.cost).length > 3 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">+{Object.entries(technology.cost).length - 3}</Badge>
            )}
          </div>
        </div>
        
        {/* 解锁内容 */}
        {technology.unlocks && technology.unlocks.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-medium text-gray-700 mb-1">解锁:</p>
            <div className="flex flex-wrap gap-1">
              {technology.unlocks.slice(0, 2).map((unlock, index) => (
                <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                  {typeof unlock === 'string' ? unlock : unlock.name}
                </Badge>
              ))}
              {technology.unlocks.length > 2 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">+{technology.unlocks.length - 2}</Badge>
              )}
            </div>
          </div>
        )}
        
        {/* 研究进度 */}
        {isResearching && (
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-700">进度</span>
              <span className="text-xs text-gray-600">
                {Math.round(researchProgressPercent)}%
              </span>
            </div>
            <Progress value={researchProgressPercent} className="h-1.5" />
          </div>
        )}
        
        {/* 操作按钮 */}
        {!isResearched && (
          <Button 
            size="sm" 
            className="w-full h-7 text-xs"
            disabled={!canResearch || isResearching}
            onClick={() => onStartResearch(technology.id)}
          >
            {isResearching ? '研究中' : '研究'}
          </Button>
        )}
        
        {isResearched && (
          <div className="text-center">
            <Badge variant="default" className="text-xs px-2 py-0.5">
              已完成
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TechnologyTab() {
  const gameState = useGameStore((state) => state.gameState);
  const startResearch = useGameStore((state) => state.startResearch);
  const canResearch = useGameStore((state) => state.canResearch);
  const pauseResearch = useGameStore((state) => state.pauseResearch);
  const getAvailableTechnologies = useGameStore((state) => state.getAvailableTechnologies);
  const getResearchedTechnologies = useGameStore((state) => state.getResearchedTechnologies);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // 启动时引导注册中心（幂等），启用 demo 种子以便展示示例数据
  useEffect(() => {
    bootstrapRegistry({ includeDemoSeed: true }).catch(() => {});
  }, []);
  
  // 推断已拥有科技集合（回退友好）
  const ownedTechIds = useMemo(() => {
    const t1 = (gameState as any)?.technologies ? Object.values((gameState as any).technologies)
      .filter((t: any) => t?.researched)
      .map((t: any) => t.id) : [];
    const t2 = (gameState as any)?.researchedTechIds || [];
    return new Set<string>([...t1, ...t2]);
  }, [gameState]);
  
  // 通过统一 gating 获取 registry 可见科技 id 列表
  const registryVisibleTechIds = useMemo(() => {
    try {
      const { techs } = getVisibleFromRegistry({ ownedTechIds });
      return techs.map(t => t.id);
    } catch {
      return [];
    }
  }, [ownedTechIds]);
  
  const currentResearch = gameState.researchState?.currentResearch || null;
  const currentTech = currentResearch ? gameState.technologies[currentResearch.technologyId] : null;
  const currentProgressPercent = currentTech && currentResearch
    ? Math.min(100, Math.max(0, (currentResearch.progress / (currentTech.researchTime || 1)) * 100))
    : 0;
  const researchPoints = gameState.resources.researchPoints;
  const researchPointsPerSecond = gameState.resourceRates?.researchPoints || 0;
  
  const handleStartResearch = (techId: string) => {
    if (currentResearch) {
      // 如果已有研究在进行，暂停当前研究
      pauseResearch();
    }
    startResearch(techId);
  };
  
  const getFilteredTechnologies = () => {
    const hasNeighbor = ((gameState.diplomacy?.discoveredCountries) || []).length > 0;
    // 基本集合：unlocked 或满足前置
    let base = Object.values(TECHNOLOGIES).filter((tech) => {
      const requires = tech.requires || [];
      const prereqMet = requires.length === 0 || requires.every((req) => gameState.technologies[req]?.researched);
      // 外交官训练需发现邻国后才可见
      const neighborGate = (tech.id !== 'diplomat_training') || hasNeighbor;
      return (tech.unlocked || prereqMet) && neighborGate;
    });

    // 注册中心集合（用于扩展/排序），但不再“覆盖”基本集合，避免隐藏初始科技如“生火”
    if (registryVisibleTechIds.length > 0) {
      const fromRegistry = Object.values(TECHNOLOGIES).filter(t => registryVisibleTechIds.includes(t.id));
      const map = new Map(base.map(t => [t.id, t]));
      fromRegistry.forEach(t => map.set(t.id, t));
      // 合并后再次用统一的 gating 规则过滤：仅显示默认解锁或已满足前置的科技
      let merged = Array.from(map.values()).filter((tech) => {
        const requires = tech.requires || [];
        const prereqMet = requires.length === 0 || requires.every((req) => gameState.technologies[req]?.researched);
        // 外交官训练需发现邻国后才可见
        const neighborGate = (tech.id !== 'diplomat_training') || hasNeighbor;
        return (tech.unlocked || prereqMet) && neighborGate;
      });
      if (selectedCategory !== 'all') {
        merged = merged.filter(t => t.category === selectedCategory);
      }
      return merged;
    }

    if (selectedCategory !== 'all') {
      base = base.filter(tech => tech.category === selectedCategory);
    }
    return base;
  };
  
  const availableTechnologies = getAvailableTechnologies();
  const researchedTechnologies = getResearchedTechnologies();
  const filteredTechnologies = getFilteredTechnologies();
  
  return (
    <div className="space-y-6">
      {/* 研究状态概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            科技研究
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.floor(researchPoints)}</div>
              <div className="text-sm text-gray-600">研究点</div>
              <div className="text-xs text-gray-500">
                +{researchPointsPerSecond.toFixed(1)}/秒
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{researchedTechnologies.length}</div>
              <div className="text-sm text-gray-600">已研究科技</div>
              <div className="text-xs text-gray-500">
                共 {Object.values(TECHNOLOGIES).length} 项
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{availableTechnologies.length}</div>
              <div className="text-sm text-gray-600">可研究科技</div>
              <div className="text-xs text-gray-500">
                满足前置条件
              </div>
            </div>
          </div>
          
          {/* 当前研究 */}
          {currentResearch && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-900">当前研究</h4>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={pauseResearch}
                >
                  暂停
                </Button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{currentTech?.name || ''}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">进度</span>
                <span className="text-sm text-gray-600">
                  {Math.round(currentProgressPercent)}%
                </span>
              </div>
              <Progress 
                value={currentProgressPercent} 
                className="h-2" 
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 科技分类标签 */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="production">
            <FlaskConical className="w-4 h-4 mr-1" />
            生产
          </TabsTrigger>
          <TabsTrigger value="military">
            <Sword className="w-4 h-4 mr-1" />
            军事
          </TabsTrigger>
          <TabsTrigger value="social">
            <Users className="w-4 h-4 mr-1" />
            社会
          </TabsTrigger>
          <TabsTrigger value="research">
            <BookOpen className="w-4 h-4 mr-1" />
            研究
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={selectedCategory} className="mt-6">
          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredTechnologies.map((technology) => {
                const canResearchTech = canResearch(technology.id);
                const isResearching = currentResearch?.technologyId === technology.id;
                
                return (
                  <TechnologyCard
                    key={technology.id}
                    technology={technology}
                    canResearch={canResearchTech}
                    isResearching={isResearching}
                    onStartResearch={handleStartResearch}
                  />
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}