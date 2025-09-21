# 部落发展策略游戏 - 实现架构说明（当前版本）

本文件描述当前仓库内实际生效的游戏架构与数据流，聚焦“科技与建筑如何定义/解锁/生效”，“效果如何应用”，以及“状态如何组织”。与早期规划文档不同，本说明以源码为准。

## 1. 技术栈与项目结构概览

- 前端框架: Next.js (App Router)
- 语言: TypeScript
- UI: React + Tailwind + 自定义组件
- 全局状态: Zustand（核心 Store 位于 src/lib/game-store.ts）
- 辅助模块与目录：
  - 科技数据: src/lib/technology-data.ts
  - 建筑数据: src/lib/building-data.ts
  - 建筑系统: src/lib/building-system.ts
  - 选择器与切片: src/lib/slices/*（population、events、exploration、diplomacy 等）
  - 效果系统与运行器: 
    - src/lib/effect-runner.ts
    - src/lib/events/effect-runner.ts
    - src/lib/events/event-schema.ts
  - 注册中心（可选的内容注册/可见性门面）:
    - src/lib/registry/*（registry.ts, bootstrap.ts, types.ts, schemas.ts, safe-register.ts）
    - src/lib/facade/visibility-facade.ts（getVisibleFromRegistry）
  - 统一选择器与工具:
    - src/lib/selectors/*（cap-helpers.ts, visibility.ts, index.ts）
    - src/lib/adapters/population-adapter.ts（对旧存储结构做零侵入适配）
  - 组件侧关键页面：
    - src/components/features/building-tab.tsx（建筑页：按科技前置与注册中心过滤）
    - 其他特性页：technology-tab.tsx, exploration-tab.tsx, diplomacy-tab.tsx 等

## 2. 科技系统

### 2.1 科技定义存放
- 文件: src/lib/technology-data.ts
- 结构（示意）：
  - 每个科技包含：
    - id（唯一标识）
    - name/description
    - prerequisites（前置科技 id 列表）
    - researchCost / researchTime
    - effects（一个或多个效果条目，详见“效果系统”）
  - 示例（简化示意）：
    ```ts
    export const TECHNOLOGIES = {
      fire: { id: 'fire', effects: [{ type: 'unlock_building', value: 'housing' }] },
      basic_agriculture: { id: 'basic_agriculture', effects: [{ type: 'unlock_building', value: 'farm' }] },
      logging: { id: 'logging', effects: [{ type: 'unlock_building', value: 'logging_camp' }] },
      quarrying: { id: 'quarrying', effects: [{ type: 'unlock_building', value: 'quarry' }] },
      // ...
    }
    ```

### 2.2 科技解锁与可见性
- 研究状态存储在 Zustand Store（src/lib/game-store.ts）的 gameState 内（如 researched 列表或 researchedTechIds 集）。
- UI 侧按照“科技前置 → 建筑可见”的规则：
  - 建筑页 BuildingTab 使用 getBuildingsByCategory + isBuildingUnlocked 过滤（来自 src/lib/building-data.ts），并与注册中心的可见性结果做交集过滤。
  - 关键逻辑（building-tab.tsx）：
    - useEffect 中 bootstrapRegistry({ includeDemoSeed: false })，避免 demo 数据提前曝光未解锁项目。
    - 计算 ownedTechIds：从 gameState 中合并已研究科技集合。
    - categoryBuildings = 分类列表 ∩ registry 可见集 ∩ isBuildingUnlocked(b.id, ownedTechIds)。
- isBuildingUnlocked 定义位置：src/lib/building-data.ts
  - 按建筑项的 requiredTechnology 与玩家已研究科技集合进行判断。

### 2.3 科技效果生效流程
- 触发点：当科技研究完成（spendResearchPoints/completeResearch）后，Store 会调用 applyTechnologyEffects(technologyId)。
- 入口：src/lib/game-store.ts（方法名 applyTechnologyEffects），将该科技的 effects 逐条应用到游戏状态与效果系统。
- 效果载入：效果系统统一通过 effectsSystem.addEffect 注册（见“效果系统”），并更新 effectsVersion 触发重算。
- 典型效果类型：
  - unlock_building: 设置某建筑可解锁（通常与 requiredTechnology 搭配）
  - research_points / research_speed: 研究产出与速度调整
  - resource_limit/storage: 扩容类效果
  - production_bonus: 产量加成
  - stability/corruption: 稳定度/腐败度影响
  - 其他：按业务扩展

## 3. 建筑系统

### 3.1 建筑定义存放
- 文件: src/lib/building-data.ts
- 关键字段：
  - id, name, description, category
  - cost（基础成本），buildTime
  - requiredTechnology（科技前置，控制可解锁/可见）
  - maxWorkers
  - production / storage / specialEffects（用于 UI 展示；数值计算由系统层统一处理）
  - buildLimit（固定或随人口增长的上限规则）

### 3.2 建筑可见性与过滤
- getBuildingDefinition/getBuildingsByCategory/isBuildingUnlocked/getAvailableBuildings 皆在 src/lib/building-data.ts。
- BuildingTab（src/components/features/building-tab.tsx）对分类建筑做双重过滤：
  1) 分类预选（getBuildingsByCategory）
  2) 若 registry 启用，则与 registry 可见 ID 取交集
  3) 再按 isBuildingUnlocked(b.id, ownedTechIds) 进行最终 gating（确保未研究前置科技不显示）
- 注意：我们已关闭 demo 种子（includeDemoSeed: false），以免未解锁的内容被提前注册显示。

### 3.3 建造、成本与生产/储存计算
- 系统类：src/lib/building-system.ts
  - 负责建造判定、成本（含递增规则）与工人分配等。
- Store 方法（src/lib/game-store.ts）：
  - canConstructBuilding(buildingId)
  - getBuildingConstructionCost(buildingId)
  - constructBuilding / demolishBuildingNew
  - assignWorkerToBuildingNew / removeWorkerFromBuildingNew
- 生产与储存的“实时结算”：
  - 通过 BuildingSystem.calculateBuildingProduction 与 Store 中统一的资源生成重算（calculateResourceRates）实现；
  - 在最近一次类型修正中，已将“按效果数组遍历”替代对 effects.production/storage 的直接属性访问，确保与多来源加成兼容。

## 4. 效果系统

### 4.1 定义与类型
- 位置：
  - src/lib/events/event-schema.ts 定义事件/效果的模式（Zod/类型）
  - src/lib/effect-runner.ts 与 src/lib/events/effect-runner.ts 负责“将效果应用到状态或速率”的统一入口
- 源头（sourceType）：
  - technology（科技）、building（建筑）、event（事件）、character（人物）等
  - 所有效果都带 sourceType 与 sourceId，便于撤销/替换

### 4.2 应用与撤销
- 添加：effectsSystem.addEffect({ ...effect, sourceType, sourceId })
- 移除：effectsSystem.removeEffectsBySource(sourceType)
- 版本号：每次效果变更会 set({ effectsVersion: state.effectsVersion + 1 })，触发依赖重算（如资源速率、存储上限等）

### 4.3 资源与上限的修改
- 任何资源/上限/速率更新，采用“合并写法”而非直接赋值 Record：
  ```ts
  set((state) => ({
    gameState: {
      ...state.gameState,
      resources: { ...state.gameState.resources, ...deltaResources },
      resourceLimits: { ...state.gameState.resourceLimits, ...deltaLimits },
      resourceRates: { ...state.gameState.resourceRates, ...deltaRates },
    }
  }))
  ```
- 这样可避免类型错配，并与其他效果叠加兼容。

## 5. 事件与探索

### 5.1 事件系统
- 位置：src/lib/slices/events.ts、src/lib/event-bus/*、src/lib/events/*
- 触发流程（简述）：
  - checkGameEvents()（Store 中，采用 getTriggeredEvents/selectRandomEvent）
  - 事件若含 pausesGame（暂停型）则进入 activeEvent 等待玩家选择
  - 其他事件直接应用效果（通过效果系统）
  - 通知：addNotification 统一 UI 提示
- 类型守卫：对 union 字段（requirements、conditions）使用 in-check/Array.isArray 守卫，保证编译安全。

### 5.2 探索系统
- 位置：src/lib/slices/exploration.ts、src/components/features/exploration-tab.tsx
- 关键逻辑：
  - explore(units) 单参调用，受 isPaused 约束（暂停时不推进）
  - 结果通过 in-app notification 呈现
  - “探索点”explorationPoints 为内部指标，不在 UI 展示

## 6. 人口系统与分配

- 适配器：src/lib/adapters/population-adapter.ts
- 统一选择器：src/lib/slices/population.ts + src/lib/slices/index.ts 的 createPopulationSelectors
- BuildingTab 统计头部展示：
  - 通过 popSelectors.getOverview(state) 获取已分配与盈余，确保与侧边栏一致
- 规则：
  - 总人口 = 当前人口
  - 盈余人口 = 当前人口 - Σ(各建筑 assignedWorkers)
  - 住房上限随 housing 类建筑叠加（详见 building-data.ts 的 population_capacity 效果或上限规则）

## 7. 外交与贸易

- 外交切片：src/lib/slices/diplomacy.ts；Store 内含 trade/gift/war 等方法
- 关系对象：Record<string, Relationship>，严禁 undefined 值（写入前判断）
- 市场与佣兵：DiplomacySystem 生成报价/佣兵池，交易成功后合并资源与关系历史

## 8. 可见性与注册中心（高级）

- 注册中心：src/lib/registry/*
  - bootstrapRegistry({ includeDemoSeed: false })：默认不加载 demo 内容
  - registry.listBuildings() 提供已注册条目
- 可见性门面：src/lib/facade/visibility-facade.ts
  - getVisibleFromRegistry({ ownedTechIds })：在已有科技的前提下返回可见内容
- UI 最终策略（建筑页）：
  - 分类基础集 ∩ registry 可见集 ∩ isBuildingUnlocked(b.id, ownedTechIds)

## 9. 扩展指引

### 9.1 新增一个科技
1) 在 src/lib/technology-data.ts 添加条目，指定 id、前置与 effects
2) 若该科技解锁建筑，在建筑数据中将相应 building.requiredTechnology 设为此科技 id
3) 确认 UI：technology-tab.tsx 能显示并研究；建筑页解锁后出现

### 9.2 新增一个建筑
1) 在 src/lib/building-data.ts 添加定义（包含 category/cost/buildTime/maxWorkers/requiredTechnology 等）
2) 若有生产/储存/特殊效果，填入 production/storage/specialEffects（用于 UI 展示）
3) 核心数值由 BuildingSystem 与效果系统统一计算（如需加成，设计对应效果）

### 9.3 新增一个效果类型
1) 在 effect-runner 中添加处理分支（或扩展效果枚举/守卫）
2) 在相应系统（资源/速率/上限/稳定度/腐败度）中实现具体应用逻辑
3) 确保 addEffect/removeEffectsBySource 正确维护

### 9.4 新增一个事件
1) 在事件库（events-map 或切片）中定义
2) 指定 requirements/conditions 与 effects
3) 若为暂停型，设置 pausesGame 与 options；UI 将进入 activeEvent 等待选择

## 10. 运行与质量

- 类型检查：npx tsc --noEmit（已修复当前所有 TS 编译错误）
- 代码合并策略：小步提交、合并写法更新嵌套状态，避免覆盖
- 调试开关：设置面板集中 Dev 功能（速度控制与实验开关）；顶部速度按钮已移除

---

附：关键入口索引
- Store（游戏核心状态/方法）: src/lib/game-store.ts
- 科技数据/解锁: src/lib/technology-data.ts + applyTechnologyEffects
- 建筑数据/解锁: src/lib/building-data.ts + isBuildingUnlocked/getAvailableBuildings
- 建筑页 UI（按科技 gating）: src/components/features/building-tab.tsx
- 效果系统: src/lib/effect-runner.ts 与 src/lib/events/effect-runner.ts
- 注册中心与可见性门面: src/lib/registry/* 与 src/lib/facade/visibility-facade.ts