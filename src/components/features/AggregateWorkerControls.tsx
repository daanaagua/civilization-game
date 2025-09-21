'use client';

import React, { useMemo } from 'react';
import { useGameStore } from '@/lib/game-store';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Users } from 'lucide-react';

interface Props {
  buildingId: string;
}

export default function AggregateWorkerControls({ buildingId }: Props) {
  const getBuildingInstances = useGameStore(s => s.getBuildingInstances);
  const assignWorkerToBuildingNew = useGameStore(s => s.assignWorkerToBuildingNew);
  const removeWorkerFromBuildingNew = useGameStore(s => s.removeWorkerFromBuildingNew);
  const gameState = useGameStore(s => s.gameState);

  const instances = getBuildingInstances(buildingId) || [];
  const def = (() => {
    try {
      const { getBuildingDefinition } = require('@/lib/building-data');
      return getBuildingDefinition(buildingId);
    } catch {
      return undefined;
    }
  })();

  const { assignedTotal, maxTotal } = useMemo(() => {
    const maxPer = def?.maxWorkers || 0;
    let assigned = 0;
    for (const inst of instances) {
      assigned += inst.assignedWorkers || 0;
    }
    return {
      assignedTotal: assigned,
      maxTotal: maxPer * instances.length
    };
  }, [instances, def]);

  const availableWorkers = useMemo(() => {
    const totalPopulation = gameState.resources.population;
    const assigned = Object.values(gameState.buildings).reduce((sum, b: any) => sum + (b.assignedWorkers || 0), 0);
    return Math.max(0, totalPopulation - assigned);
  }, [gameState]);

  const handleAssignOne = () => {
    if (availableWorkers <= 0) return;
    // 找到第一个有空位的实例
    const target = instances.find(inst => {
      const current = inst.assignedWorkers || 0;
      const cap = (def?.maxWorkers || 0);
      return current < cap;
    });
    if (target) assignWorkerToBuildingNew(target.id || target.buildingId, 1);
  };

  const handleRemoveOne = () => {
    // 找到第一个有工人的实例
    const target = instances.find(inst => (inst.assignedWorkers || 0) > 0);
    if (target) removeWorkerFromBuildingNew(target.id || target.buildingId, 1);
  };

  return (
    <div className="flex items-center justify-between bg-white/5 p-2 rounded">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-gray-400" />
        <span className="text-sm">
          {assignedTotal}/{maxTotal}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRemoveOne}
          disabled={assignedTotal === 0}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAssignOne}
          disabled={availableWorkers === 0 || assignedTotal >= maxTotal}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}