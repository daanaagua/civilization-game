const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'game-data.ts');
let src = fs.readFileSync(filePath, 'utf8');

// 允许的 effect.type 集合
const allowedTypes = new Set([
  'resource_production_bonus',
  'resource_storage_bonus',
  'building_efficiency_bonus',
  'stability_bonus',
  'research_speed_bonus',
  'military_bonus',
  'population_growth_bonus',
  'global_bonus',
  'resource_multiplier',
]);

// 可以参与倍率运算的资源键（参照 resourceRates / newRates）
const resourceKeys = new Set(['food','wood','stone','tools','population','researchPoints','copper','iron','horses']);

// 1) 统一部分效果类型到合法集合
// storage_bonus -> resource_storage_bonus
src = src.replace(/type:\s*'storage_bonus'/g, "type: 'resource_storage_bonus'");
// improve_tool_quality -> resource_multiplier (以资源倍率表达提升)
src = src.replace(/type:\s*'improve_tool_quality'/g, "type: 'resource_multiplier'");
// 所有 unlock_* -> global_bonus（值保持不变，后续统一补充描述说明“已迁移至 unlocks”）
src = src.replace(/type:\s*'unlock_[^']+'/g, "type: 'global_bonus'");

// 2) 特判：hunting_efficiency -> resource_multiplier，且 target 统一映射为 food
src = src.replace(/\{\s*type:\s*'hunting_efficiency'\s*,\s*target:\s*'hunting'\s*,/g,
  "{ type: 'resource_multiplier', target: 'food',");
src = src.replace(/\{\s*type:\s*'hunting_efficiency'\s*,\s*target:\s*'food'\s*,/g,
  "{ type: 'resource_multiplier', target: 'food',");

// 3) 为缺少 description 的效果补充描述（仅最常见的四字段形式）
src = src.replace(/\{\s*type:\s*'([^']+)'\s*,\s*target:\s*'([^']+)'\s*,\s*value:\s*([^,}\]]+)\s*\}/g,
  (m, type, target, value) => {
    if (/description\s*:/.test(m)) return m; // 已有描述则跳过
    const v = String(value).trim();
    let desc = '';
    switch (type) {
      case 'resource_multiplier':
        desc = `将 ${target} 的倍率调整为 ${v}`; break;
      case 'resource_production_bonus':
        desc = `提升 ${target} 的生产：${v}`; break;
      case 'resource_storage_bonus':
        desc = `提升 ${target} 的储存：${v}`; break;
      case 'building_efficiency_bonus':
        desc = `提升建筑效率（${target}）：${v}`; break;
      case 'research_speed_bonus':
        desc = `研究速度加成：${v}`; break;
      case 'military_bonus':
        desc = `军事加成（${target}）：${v}`; break;
      case 'population_growth_bonus':
        desc = `人口增长加成：${v}`; break;
      case 'global_bonus':
        desc = `全局加成（原解锁已迁移：${target}）：${v}`; break;
      case 'stability_bonus':
        desc = `稳定度加成：${v}`; break;
      default:
        desc = `效果：${type} -> ${target} = ${v}`;
    }
    return `{ type: '${type}', target: '${target}', value: ${v}, description: '${desc}' }`;
  }
);

// 4) 将 technologies 内部的未知 effect.type 统一映射到允许集合
// 仅处理我们前面注入了“效果：”描述的效果对象，避免误伤建筑/事件等其它 type 字段
src = src.replace(/\{\s*type:\s*'([^']+)'\s*,\s*target:\s*'([^']+)'\s*,\s*value:\s*([^,}\]]+)\s*,\s*description:\s*'效果：[^']+'\s*\}/g,
  (m, type, target, value) => {
    const v = String(value).trim();
    if (allowedTypes.has(type)) return m; // 合法，原样返回

    // 决策映射：若 target 是资源键 -> resource_multiplier，否则 -> global_bonus
    let newType = resourceKeys.has(target) ? 'resource_multiplier' : 'global_bonus';
    let newTarget = target;

    // 生成新的描述以反映映射后的含义
    let desc = '';
    if (newType === 'resource_multiplier') {
      desc = `将 ${newTarget} 的倍率调整为 ${v}`;
    } else {
      desc = `全局加成（原类型 ${type}，目标 ${newTarget}）：${v}`;
    }

    return `{ type: '${newType}', target: '${newTarget}', value: ${v}, description: '${desc}' }`;
  }
);

fs.writeFileSync(filePath, src, 'utf8');
console.log('fix-effects.js: Completed effect type normalization and description injection (enhanced).');