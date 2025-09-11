'use client';

import { useGameStore } from '@/lib/store/gameStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, RotateCcw, Star } from 'lucide-react';

export function RebirthConfirmation() {
  const {
    uiState,
    hideRebirthConfirmation,
    performRebirth,
    calculateRebirthRewards,
    gameState
  } = useGameStore();

  if (!uiState.showRebirthConfirmation) {
    return null;
  }

  const rebirthRewards = calculateRebirthRewards();
  const currentInheritancePoints = gameState.inheritancePoints;

  const handleConfirm = () => {
    performRebirth();
    hideRebirthConfirmation();
  };

  const handleCancel = () => {
    hideRebirthConfirmation();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <RotateCcw className="h-8 w-8 text-orange-500" />
          </div>
          <CardTitle className="text-xl font-bold text-orange-600">
            确认转生
          </CardTitle>
          <CardDescription>
            转生将重置所有进度，但你将获得继承点用于购买永久加成
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 警告信息 */}
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-medium mb-1">注意：转生将会</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>重置所有资源和建筑</li>
                <li>重置所有科技研究进度</li>
                <li>重置所有成就进度</li>
                <li>重置游戏时间</li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* 奖励信息 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">转生奖励</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">当前继承点：</span>
                <Badge variant="secondary">{currentInheritancePoints}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">获得继承点：</span>
                <Badge variant="default" className="bg-yellow-500">
                  +{rebirthRewards}
                </Badge>
              </div>
            </div>
            
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex justify-between items-center">
                <span className="font-medium text-yellow-800">转生后总计：</span>
                <Badge className="bg-yellow-600">
                  {currentInheritancePoints + rebirthRewards} 继承点
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* 按钮 */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleCancel}
            >
              取消
            </Button>
            <Button 
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              onClick={handleConfirm}
            >
              确认转生
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}