// Population slice - 通用只读选择器（零侵入）
// 通过调用方提供的取值器，统一计算人口概览，便于 Sidebar 与 BuildingTab 对齐显示

export interface PopulationOverview {
  current: number;   // 当前人口
  cap: number;       // 上限（含 housing +1 等规则的最终值）
  assigned: number;  // 已分配工人总数
  surplus: number;   // 盈余（= current - assigned，最小为 0）
}

export interface PopulationProvider<S = any> {
  // 从状态取当前人口（必需）
  selectCurrent: (state: S) => number | undefined;
  // 从状态取人口上限（必需，已包含 housing 规则后的最终上限）
  selectCap: (state: S) => number | undefined;
  // 从状态取已分配工人总数（可选，默认 0）
  selectAssigned?: (state: S) => number | undefined;
}

export interface PopulationSelectors<S = any> {
  getOverview: (state: S) => PopulationOverview;
  getSurplus: (state: S) => number;
}

export function createPopulationSelectors<S = any>(provider: PopulationProvider<S>): PopulationSelectors<S> {
  const getOverview = (state: S): PopulationOverview => {
    const cur = Number(provider.selectCurrent(state) ?? 0);
    const cap = Number(provider.selectCap(state) ?? 0);
    const assigned = Math.max(0, Number(provider.selectAssigned?.(state) ?? 0));
    const surplus = Math.max(0, cur - assigned);
    return { current: cur, cap, assigned, surplus };
  };

  return {
    getOverview,
    getSurplus: (state: S) => getOverview(state).surplus
  };
}