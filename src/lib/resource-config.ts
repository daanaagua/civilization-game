import { 
  Apple, 
  TreePine, 
  Mountain, 
  Hammer, 
  Users, 
  Home,
  Coins,
  Wheat,
  Sword
} from 'lucide-react';

interface ResourceConfig {
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  clickable: boolean;
  description: string;
  requiresTech?: string;
}

export const resourceConfig: Record<string, ResourceConfig> = {
  food: {
    name: '食物',
    icon: Apple,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    clickable: true,
    description: '维持人口生存的基本资源'
  },
  wood: {
    name: '木材',
    icon: TreePine,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    clickable: true,
    description: '建造和制作的基础材料'
  },
  stone: {
    name: '石料',
    icon: Mountain,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    clickable: true,
    description: '坚固建筑的重要材料'
  },
  tools: {
    name: '工具',
    icon: Hammer,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    clickable: false,
    description: '提高生产效率的器具'
  },
  population: {
    name: '人口',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    clickable: false,
    description: '文明发展的核心力量'
  },
  housing: {
    name: '住房',
    icon: Home,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    clickable: false,
    description: '人口居住的容量限制'
  },
  // 高级资源（需要科技解锁后显示）
  livestock: {
    name: '牲畜',
    icon: Wheat,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    clickable: false,
    description: '畜牧业产出的动物资源',
    requiresTech: 'animal_husbandry'
  },
  weapons: {
    name: '武器',
    icon: Sword,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    clickable: false,
    description: '军事力量的重要装备',
    requiresTech: 'bronze_working'
  },
  copper: {
    name: '铜',
    icon: Mountain,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    clickable: false,
    description: '制作青铜器的重要材料',
    requiresTech: 'bronze_working'
  },
  iron: {
    name: '铁',
    icon: Mountain,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    clickable: false,
    description: '制作铁器的珍贵材料',
    requiresTech: 'iron_working'
  }
};