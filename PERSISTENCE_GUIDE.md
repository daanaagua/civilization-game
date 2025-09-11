# 游戏持久化功能实现指南

## 概述

本项目已成功实现了游戏数据的持久化功能，确保玩家在刷新页面或重新打开游戏时不会丢失进度。

## 实现的功能

### 1. 自动保存
- 游戏每30秒自动保存一次
- 在游戏开始、暂停、重置时立即保存
- 页面失去焦点时自动保存
- 页面卸载前自动保存

### 2. 自动加载
- 应用启动时自动加载之前保存的游戏数据
- 如果没有保存数据，则开始新游戏

### 3. 手动控制
- 提供手动保存和加载的接口
- 可以通过游戏商店的方法调用

## 技术实现

### 核心文件

1. **`src/lib/persistence.ts`** - 持久化工具模块
   - `saveGameState()` - 保存游戏状态到localStorage
   - `loadGameState()` - 从localStorage加载游戏状态
   - `AutoSaveManager` - 自动保存管理器类

2. **`src/lib/store/gameStore.ts`** - 游戏状态管理
   - 集成了持久化功能
   - 添加了 `saveGame()`, `loadGame()`, `initializePersistence()` 方法

3. **`src/app/page.tsx`** - 主页面
   - 在应用启动时初始化持久化功能

### 数据存储

- 使用浏览器的 `localStorage` 存储游戏数据
- 存储键名: `civilization-game-save`
- 数据格式: JSON字符串

## 使用方法

### 基本使用

游戏会自动处理所有持久化操作，玩家无需手动操作：

1. 游戏启动时自动加载之前的进度
2. 游戏过程中定期自动保存
3. 页面关闭时自动保存当前进度

### 手动控制（开发者）

```typescript
import { useGameStore } from '@/lib/store/gameStore';

const { saveGame, loadGame, initializePersistence } = useGameStore();

// 手动保存
saveGame();

// 手动加载
loadGame();

// 初始化持久化功能（通常在应用启动时调用）
initializePersistence();
```

## 测试功能

访问 `/test-persistence` 页面可以测试持久化功能：

1. 添加一些金币
2. 刷新页面
3. 检查金币数量是否保持不变

## 配置选项

在 `src/lib/persistence.ts` 中可以调整以下配置：

- `SAVE_INTERVAL`: 自动保存间隔（默认30秒）
- `STORAGE_KEY`: localStorage存储键名

## 注意事项

1. **浏览器兼容性**: 需要支持localStorage的现代浏览器
2. **存储限制**: localStorage通常有5-10MB的存储限制
3. **隐私模式**: 在浏览器隐私模式下可能无法正常工作
4. **数据安全**: 数据存储在客户端，用户可以修改或删除

## 故障排除

### 数据没有保存
1. 检查浏览器是否支持localStorage
2. 检查是否在隐私模式下运行
3. 检查浏览器控制台是否有错误信息

### 数据加载失败
1. 检查localStorage中是否有保存的数据
2. 检查数据格式是否正确
3. 清除localStorage数据重新开始

## 未来改进

1. **云端同步**: 实现账户系统和云端数据同步
2. **数据压缩**: 对保存数据进行压缩以节省空间
3. **版本控制**: 实现数据版本控制和迁移
4. **备份恢复**: 提供数据导出和导入功能