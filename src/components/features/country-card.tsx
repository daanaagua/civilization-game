'use client';

import React, { useState } from 'react';
import { Country, RelationshipLevel } from '@/types/diplomacy';
import { Resources } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Gift, 
  Sword, 
  Users, 
  Heart,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CountryCardProps {
  country: Country;
  relationship: { level: RelationshipLevel; value: number } | undefined;
  gameState: any;
  onTrade: (countryId: string, offer: Partial<Resources>, request: Partial<Resources>) => void;
  onGift: (countryId: string, gift: Partial<Resources>) => void;
  onDeclareWar: (countryId: string) => void;
  onHireMercenary: (countryId: string, unitId: string) => void;
  canAfford: (cost: Partial<Resources>) => boolean;
}

export function CountryCard({
  country,
  relationship,
  gameState,
  onTrade,
  onGift,
  onDeclareWar,
  onHireMercenary,
  canAfford
}: CountryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeAction, setActiveAction] = useState<'trade' | 'gift' | 'mercenaries' | null>(null);
  const [tradeOffer, setTradeOffer] = useState<Partial<Resources>>({});
  const [tradeRequest, setTradeRequest] = useState<Partial<Resources>>({});
  const [giftAmount, setGiftAmount] = useState<Partial<Resources>>({});

  // 获取关系等级的显示信息
  const getRelationshipDisplay = (level: RelationshipLevel) => {
    switch (level) {
      case 'hostile':
        return { text: '敌对', color: 'text-red-500', icon: AlertTriangle, bgColor: 'bg-red-100' };
      case 'neutral':
        return { text: '中立', color: 'text-yellow-500', icon: Shield, bgColor: 'bg-yellow-100' };
      case 'friendly':
        return { text: '友好', color: 'text-green-500', icon: Heart, bgColor: 'bg-green-100' };
      default:
        return { text: '未知', color: 'text-gray-500', icon: Shield, bgColor: 'bg-gray-100' };
    }
  };

  // 计算贸易价格
  const calculateTradePrice = (resource: keyof Resources, amount: number) => {
    const basePrice = gameState.diplomacy?.marketPrices?.[resource] || 1;
    const discount = relationship?.level === 'friendly' ? 0.8 : relationship?.level === 'hostile' ? 1.2 : 1.0;
    return Math.ceil(basePrice * amount * discount);
  };

  const relationshipDisplay = getRelationshipDisplay(relationship?.level || 'neutral');
  const RelationIcon = relationshipDisplay.icon;
  const resourceTypes: (keyof Resources)[] = ['food', 'wood', 'stone', 'copper', 'iron'];
  const mercenaryUnits = gameState.diplomacy?.mercenaryUnits?.filter((unit: any) => unit.countryId === country.id) || [];

  const handleTrade = () => {
    onTrade(country.id, tradeOffer, tradeRequest);
    setTradeOffer({});
    setTradeRequest({});
    setActiveAction(null);
  };

  const handleGift = () => {
    onGift(country.id, giftAmount);
    setGiftAmount({});
    setActiveAction(null);
  };

  const handleDeclareWar = () => {
    if (confirm(`确定要对 ${country.name} 宣战吗？这将使关系变为敌对状态！`)) {
      onDeclareWar(country.id);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{country.name}</CardTitle>
          <Badge 
            variant="outline" 
            className={`${relationshipDisplay.color} ${relationshipDisplay.bgColor}`}
          >
            <RelationIcon className="w-3 h-3 mr-1" />
            {relationshipDisplay.text}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">{country.description}</p>
        
        {/* 关系值进度条 */}
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-gray-600">
            关系值: {relationship?.value || 0}/100
          </div>
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                (relationship?.value || 0) >= 60 ? 'bg-green-500' :
                (relationship?.value || 0) >= 30 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(0, (relationship?.value || 0))}%` }}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* 主要操作按钮 */}
        <div className="flex gap-2 mb-4">
          <Button 
            size="sm" 
            variant={activeAction === 'trade' ? 'default' : 'outline'}
            onClick={() => {
              setActiveAction(activeAction === 'trade' ? null : 'trade');
              setIsExpanded(true);
            }}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            贸易
          </Button>
          <Button 
            size="sm" 
            variant={activeAction === 'gift' ? 'default' : 'outline'}
            onClick={() => {
              setActiveAction(activeAction === 'gift' ? null : 'gift');
              setIsExpanded(true);
            }}
          >
            <Gift className="w-4 h-4 mr-1" />
            赠礼
          </Button>
          <Button 
            size="sm" 
            variant={activeAction === 'mercenaries' ? 'default' : 'outline'}
            onClick={() => {
              setActiveAction(activeAction === 'mercenaries' ? null : 'mercenaries');
              setIsExpanded(true);
            }}
          >
            <Users className="w-4 h-4 mr-1" />
            佣兵
          </Button>
          {relationship?.level !== 'hostile' && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={handleDeclareWar}
            >
              <Sword className="w-4 h-4 mr-1" />
              宣战
            </Button>
          )}
        </div>

        {/* 展开/收起按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mb-2"
        >
          {isExpanded ? (
            <><ChevronUp className="w-4 h-4 mr-1" />收起</>
          ) : (
            <><ChevronDown className="w-4 h-4 mr-1" />展开详情</>
          )}
        </Button>

        {/* 详细操作界面 */}
        {isExpanded && activeAction && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            {activeAction === 'trade' && (
              <div className="space-y-4">
                <h4 className="font-medium">贸易界面</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* 我方出售 */}
                  <div>
                    <h5 className="text-sm font-medium mb-2">我方出售</h5>
                    <div className="space-y-2">
                      {resourceTypes.map(resource => (
                        <div key={resource} className="flex items-center gap-2">
                          <span className="w-12 text-xs">{resource}</span>
                          <Input
                            type="number"
                            min="0"
                            max={gameState.resources[resource] || 0}
                            value={tradeOffer[resource] || ''}
                            onChange={(e) => setTradeOffer(prev => ({
                              ...prev,
                              [resource]: parseInt(e.target.value) || 0
                            }))}
                            className="w-16 h-8 text-xs"
                          />
                          <span className="text-xs text-gray-500">
                            ¥{calculateTradePrice(resource, tradeOffer[resource] || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 我方购买 */}
                  <div>
                    <h5 className="text-sm font-medium mb-2">我方购买</h5>
                    <div className="space-y-2">
                      {resourceTypes.map(resource => (
                        <div key={resource} className="flex items-center gap-2">
                          <span className="w-12 text-xs">{resource}</span>
                          <Input
                            type="number"
                            min="0"
                            value={tradeRequest[resource] || ''}
                            onChange={(e) => setTradeRequest(prev => ({
                              ...prev,
                              [resource]: parseInt(e.target.value) || 0
                            }))}
                            className="w-16 h-8 text-xs"
                          />
                          <span className="text-xs text-gray-500">
                            ¥{calculateTradePrice(resource, tradeRequest[resource] || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button onClick={handleTrade} className="w-full">
                  确认贸易
                </Button>
              </div>
            )}

            {activeAction === 'gift' && (
              <div className="space-y-4">
                <h4 className="font-medium">赠礼界面</h4>
                <div className="space-y-2">
                  {resourceTypes.map(resource => (
                    <div key={resource} className="flex items-center gap-2">
                      <span className="w-16 text-sm">{resource}</span>
                      <Input
                        type="number"
                        min="0"
                        max={gameState.resources[resource] || 0}
                        value={giftAmount[resource] || ''}
                        onChange={(e) => setGiftAmount(prev => ({
                          ...prev,
                          [resource]: parseInt(e.target.value) || 0
                        }))}
                        className="w-20 h-8"
                      />
                      <span className="text-sm text-gray-500">
                        可用: {gameState.resources[resource] || 0}
                      </span>
                    </div>
                  ))}
                </div>
                <Button onClick={handleGift} className="w-full">
                  确认赠礼
                </Button>
              </div>
            )}

            {activeAction === 'mercenaries' && (
              <div className="space-y-4">
                <h4 className="font-medium">佣兵雇佣</h4>
                {mercenaryUnits.length === 0 ? (
                  <p className="text-gray-500 text-sm">该国家暂无可雇佣的佣兵</p>
                ) : (
                  <div className="space-y-2">
                    {mercenaryUnits.map((unit: any) => (
                      <div key={unit.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                          <div className="font-medium text-sm">{unit.name}</div>
                          <div className="text-xs text-gray-500">
                            攻击: {unit.attack} | 防御: {unit.defense} | 生命: {unit.health}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">¥{unit.cost}</div>
                          <Button
                            size="sm"
                            onClick={() => onHireMercenary(country.id, unit.id)}
                            disabled={!canAfford({ gold: unit.cost })}
                          >
                            雇佣
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}