import type { RegistryAPI, BuildingItem, TechItem, UnitItem, EventItem, NationItem } from '../registry/types';
import { FEATURE_FLAGS } from '../feature-flags';

/**
 * 外部模块可通过该适配器注册内容
 * - 当对应模块 feature flag 为 false 时，此适配器输出空操作，避免编译路径被牵引
 */

export interface Plugin {
  register?: (api: RegistryAPI) => void;
}

export function applyPluginRegistrations(api: RegistryAPI, plugins: Plugin[] = []): void {
  if (!FEATURE_FLAGS.modules.registry) return;
  for (const p of plugins) {
    try {
      p.register?.(api);
    } catch (e) {
      // 保守处理，防止单个插件阻断
      // eslint-disable-next-line no-console
      console.warn('[plugin] register error:', e);
    }
  }
}

// 示例：关闭模块时导出空集合，供上层按需引入
export function getDisabledPlugin(): Plugin {
  return {};
}

// 便捷 re-export
export type { BuildingItem, TechItem, UnitItem, EventItem, NationItem };