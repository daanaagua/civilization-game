'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/game-store';
import { BUILDINGS } from '@/lib/game-data';
import { ResourcePanel } from '@/components/ui/resource-display';
import { BuildingTab } from '@/components/features/building-tab';
import TechnologyTab from '@/components/features/technology-tab';
import { CharactersPanel, CharacterRecruitment } from '@/components/features/characters';
import { ResourcesPanel } from '@/components/features/resources';
import { MilitaryPanel } from '@/components/features/military';
import { ExplorationPanel } from '@/components/features/exploration';
import { InheritanceShop } from '@/components/ui/inheritance-shop';
import { formatNumber, formatTime } from '@/utils/format';
import { 
  Home, 
  Building, 
  Zap, 
  Users, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  Save,
  Menu,
  X,
  Clock,
  TrendingUp,
  Award,
  Shield,
  Compass,
  Swords,
  Star
} from 'lucide-react';
import { isTestScoutingEnabled, setTestScoutingEnabled } from '@/lib/feature-flags';

type TabType = 'overview' | 'resources' | 'buildings' | 'technology' | 'characters' | 'exploration' | 'military' | 'settings';

const tabs: { id: TabType; name: string; icon: any }[] = [
  { id: 'overview', name: '概览', icon: Home },
  { id: 'resources', name: '资源', icon: TrendingUp },
  { id: 'buildings', name: '建筑', icon: Building },
  { id: 'technology', name: '科技', icon: Zap },
  { id: 'characters', name: '人物', icon: Users },
  { id: 'exploration', name: '探险', icon: Compass },
  { id: 'military', name: '军队', icon: Swords },
  { id: 'settings', name: '设置', icon: Settings },
];

const OverviewPanel = () => {
  const { gameState } = useGameStore();
  
  const totalBuildings = Object.values(gameState.buildings).reduce((sum, building) => sum + building.count, 0);
  const researchedTech = Object.values(gameState.technologies).filter(tech => tech.researched).length;
  const totalTech = Object.values(gameState.technologies).length;
  const activeCharacters = Object.keys(gameState.characterSystem.activeCharacters).length;
  
  return (
    <div className="space-y-6">
      {/* 游戏状态概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Clock size={20} />
            </div>
            <h3 className="font-semibold text-blue-900">游戏时间</h3>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {formatTime(gameState.gameTime)}
          </div>
          <p className="text-sm text-blue-700 mt-1">已运行时间</p>
        </div>
        
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-600 text-white p-2 rounded-lg">
              <Users size={20} />
            </div>
            <h3 className="font-semibold text-green-900">人口</h3>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {formatNumber(gameState.resources.population, 0)} {/* 人口显示为整数 */}
          </div>
          <p className="text-sm text-green-700 mt-1">部落成员</p>
        </div>
        
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-600 text-white p-2 rounded-lg">
              <Shield size={20} />
            </div>
            <h3 className="font-semibold text-purple-900">稳定度</h3>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {gameState.stability.toFixed(2)}
          </div>
          <p className="text-sm text-purple-700 mt-1">部落稳定度</p>
        </div>
        
        {/* 腐败度 - 只在解锁法律法典后显示 */}
        {gameState.technologies.legal_code?.researched && (
          <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-600 text-white p-2 rounded-lg">
                <Shield size={20} />
              </div>
              <h3 className="font-semibold text-red-900">腐败度</h3>
            </div>
            <div className="text-2xl font-bold text-red-900">
              {gameState.corruption}
            </div>
            <p className="text-sm text-red-700 mt-1">官僚腐败度</p>
          </div>
        )}
        
        <div className="card bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-600 text-white p-2 rounded-lg">
              <Award size={20} />
            </div>
            <h3 className="font-semibold text-amber-900">成就点</h3>
          </div>
          <div className="text-2xl font-bold text-amber-900">
            {formatNumber(gameState.achievements.length)}
          </div>
          <p className="text-sm text-amber-700 mt-1">累计获得</p>
        </div>
      </div>
      
      {/* 进度统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <Building size={20} className="text-blue-600" />
            建筑进度
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-stone-600">总建筑数量</span>
              <span className="font-semibold">{totalBuildings}</span>
            </div>
            {Object.entries(gameState.buildings).filter(([_, building]) => building.count > 0).map(([id, building]) => {
              const buildingData = BUILDINGS[id];
              return (
                <div key={id} className="flex justify-between items-center text-sm">
                  <span className="text-stone-500">{buildingData?.name || id}</span>
                  <span className="text-stone-700">{building.count}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="card">
          <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <Zap size={20} className="text-purple-600" />
            科技进度
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-stone-600">研究进度</span>
              <span className="font-semibold">{researchedTech}/{totalTech}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill bg-purple-600" 
                style={{ width: `${(researchedTech / totalTech) * 100}%` }}
              />
            </div>
            {gameState.researchState?.currentResearch && (
              <div className="text-sm text-purple-600">
                正在研究: {gameState.technologies[gameState.researchState.currentResearch.technologyId]?.name}
              </div>
            )}
          </div>
        </div>
        
        <div className="card">
          <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <Users size={20} className="text-green-600" />
            人物状态
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-stone-600">在职人员</span>
              <span className="font-semibold">{activeCharacters}</span>
            </div>
            {Object.values(gameState.characterSystem.activeCharacters)
              .filter(Boolean)
              .slice(0, 3)
              .map((val) => {
                const character = typeof val === 'string' ? gameState.characterSystem.allCharacters[val] : val;
                if (!character) return null;
                return (
                  <div key={character.id} className="flex justify-between items-center text-sm">
                    <span className="text-stone-500">{character.name}</span>
                    <span className="text-stone-700">忠诚 {character.loyalty}</span>
                  </div>
                );
              })}
            
          </div>
        </div>
      </div>
      
      {/* 角色招募 */}
      <CharacterRecruitment />
      
      {/* 最近事件 */}
      {gameState.events && gameState.events.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-stone-900 mb-4">最近事件</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {gameState.events.slice(-5).reverse().map((event, index) => (
              <div key={index} className="bg-stone-50 p-3 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-stone-900">{event.name}</h4>
                  <span className="text-xs text-stone-500">
                    {formatTime(gameState.gameTime - event.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-stone-600">{event.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsPanel = () => {
  const isRunning = useGameStore(state => state.isRunning);
  const isPaused = useGameStore(state => state.gameState.isPaused);
  const gameState = useGameStore(state => state.gameState);
  const togglePause = useGameStore(state => state.togglePause);
  const startGame = useGameStore(state => state.startGame);
  const resetGame = useGameStore(state => state.resetGame);
  const saveGame = useGameStore(state => state.saveGame);
  const openInheritanceShop = useGameStore(state => state.showInheritanceShop);

  // 运行参数
  const gameSettings = useGameStore(s => s.gameState.settings);
  const setGameSpeed = useGameStore(s => s.setGameSpeed);
  const setEventsPollIntervalMs = useGameStore(s => s.setEventsPollIntervalMs);
  const setEventsDebugEnabled = useGameStore(s => s.setEventsDebugEnabled);

  // 测试开关
  const [testScouting, setTestScouting] = useState<boolean>(isTestScoutingEnabled());
  const handleToggleTestScouting = (v: boolean) => {
    setTestScouting(v);
    setTestScoutingEnabled(v);
  };
  
  return (
    <div className="space-y-6">
      <InheritanceShop />
      <div className="card">
        <h3 className="font-semibold text-stone-900 mb-4">运行参数</h3>
        <div className="space-y-4">
          {/* 游戏速度 */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-stone-600">游戏速度</span>
              <span className="text-stone-900 font-semibold">{gameSettings.gameSpeed}x</span>
            </div>
            <div className="mt-2 flex gap-2">
              {[1,5,10,50].map(sp => (
                <button
                  key={sp}
                  onClick={() => setGameSpeed(sp)}
                  className={`px-3 py-1 rounded text-sm ${gameSettings.gameSpeed===sp ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-100 hover:bg-slate-600'}`}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>
          {/* 事件轮询频率 */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-stone-600">事件轮询频率 (ms)</span>
              <span className="text-stone-900 font-medium">{gameSettings.eventsPollIntervalMs}</span>
            </div>
            <input
              type="number"
              min={200}
              max={10000}
              step={100}
              value={gameSettings.eventsPollIntervalMs}
              onChange={(e) => setEventsPollIntervalMs(Number(e.target.value))}
              className="mt-2 w-full bg-slate-800 text-slate-100 px-3 py-2 rounded border border-slate-700"
            />
          </div>
          {/* 事件调试日志 */}
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={gameSettings.eventsDebugEnabled}
              onChange={(e) => setEventsDebugEnabled(e.target.checked)}
            />
            <span className="text-stone-700">输出事件调试日志</span>
          </label>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-stone-900 mb-4">继承点商店</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 text-white p-2 rounded-lg">
                <Star size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-purple-900">继承点</h4>
                <p className="text-sm text-purple-700">用于购买永久增益</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {formatNumber(gameState.inheritancePoints)}
            </div>
          </div>
          
          <button
            onClick={openInheritanceShop}
            className="w-full btn bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center gap-2"
          >
            <Star size={16} />
            打开继承点商店
          </button>
        </div>
      </div>
      
      <div className="card">
        <h3 className="font-semibold text-stone-900 mb-4">游戏控制</h3>
        <div className="space-y-4">
          <button
            onClick={!isRunning ? startGame : togglePause}
            className={`w-full btn flex items-center justify-center gap-2 ${
              !isRunning || isPaused ? 'btn-primary' : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            {!isRunning ? (
              <>
                <Play size={16} />
                开始游戏
              </>
            ) : isPaused ? (
              <>
                <Play size={16} />
                继续游戏
              </>
            ) : (
              <>
                <Pause size={16} />
                暂停游戏
              </>
            )}
          </button>
          
          <button
            onClick={saveGame}
            className="w-full btn btn-secondary flex items-center justify-center gap-2"
          >
            <Save size={16} />
            保存游戏
          </button>
          
          <button
            onClick={() => {
              if (confirm('确定要重置游戏吗？这将清除所有进度！')) {
                resetGame();
              }
            }}
            className="w-full btn bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            重置游戏
          </button>
        </div>
      </div>
      
      {/* 继承点商店弹窗（已由 InheritanceShop 自行控制显示，故移除本地弹窗实现） */}
      
      <div className="card">
        <h3 className="font-semibold text-stone-900 mb-4">测试开关</h3>
        <div className="space-y-2">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={testScouting}
              onChange={(e) => handleToggleTestScouting(e.target.checked)}
            />
            <span className="text-stone-700">开局自动研究“侦察学”并赠送3名斥候</span>
          </label>
          <p className="text-xs text-stone-500">需新开一局或重置后生效</p>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-stone-900 mb-4">游戏信息</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">版本</span>
            <span className="text-stone-900">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">游戏时间</span>
            <span className="text-stone-900">{formatTime(gameState.gameTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">存档大小</span>
            <span className="text-stone-900">{Math.round(JSON.stringify(gameState).length / 1024)}KB</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GameLayout = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { gameState } = useGameStore();
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPanel />;
      case 'resources':
        return <ResourcesPanel />;
      case 'buildings':
        return <BuildingTab />;
      case 'technology':
        return <TechnologyTab />;
      case 'characters':
        return <CharactersPanel />;
      case 'exploration':
        return <ExplorationPanel />;
      case 'military':
        return <MilitaryPanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <OverviewPanel />;
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900">
      {/* 顶部导航栏 */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 左侧 - 游戏标题和菜单按钮 */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-700 text-slate-100"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-xl font-bold text-slate-100">文明演进</h1>
              {gameState.isPaused && (
                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                  已暂停
                </span>
              )}
            </div>
            
            {/* 右侧 - 资源显示 */}
            <div className="hidden sm:block">
              <ResourcePanel />
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* 侧边栏 */}
          {/* 桌面端侧边栏 */}
          <aside className="w-64 space-y-2 hidden lg:block">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-800 border border-primary-200'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                  }`}
                >
                  <Icon size={20} />
                  {tab.name}
                </button>
              );
            })}
          </aside>
          
          {/* 移动端侧边栏 */}
          {sidebarOpen && (
            <aside className="lg:hidden fixed top-0 left-0 h-full w-64 bg-slate-800 z-30 p-4 border-r border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-slate-100">菜单</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-700 text-slate-100"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-primary-100 text-primary-800 border border-primary-200'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                      }`}
                    >
                      <Icon size={20} />
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            </aside>
          )}
          
          {/* 主内容区域 */}
          <main className="flex-1 min-w-0">
            {/* 移动端资源显示 */}
            <div className="sm:hidden mb-6">
              <ResourcePanel />
            </div>
            
            {renderTabContent()}
          </main>
        </div>
      </div>
      
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};