import { registry } from './index';
import { applyPluginRegistrations, type Plugin } from '../plugins/registry-adapter';

// 可选引入示例种子；仅在 includeDemoSeed=true 时才注册
type SeedFactory = () => { register: (api: any) => void };

/**
 * 显式注册插件到统一注册中心
 * - 默认不做任何注册，避免引入新报错
 * - 仅当 includeDemoSeed=true 时，才动态引入 core-seed-plugin
 */
export async function bootstrapRegistry(opts?: {
  plugins?: Plugin[];
  includeDemoSeed?: boolean;
}): Promise<void> {
  const { plugins = [], includeDemoSeed = false } = opts || {};
  const actualPlugins: Plugin[] = [...plugins];

  if (includeDemoSeed) {
    try {
      const mod = await import('../plugins/core-seed-plugin');
      const createCoreSeedPlugin = (mod as unknown as { createCoreSeedPlugin: SeedFactory }).createCoreSeedPlugin;
      if (typeof createCoreSeedPlugin === 'function') {
        actualPlugins.push(createCoreSeedPlugin());
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[bootstrap] demo seed load failed:', e);
    }
  }

  applyPluginRegistrations(registry, actualPlugins);
}