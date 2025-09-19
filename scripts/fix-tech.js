const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'game-data.ts');
let src = fs.readFileSync(filePath, 'utf8');

// 1) 规范 Technology.category 到合法的五大类
const categoryMap = {
  survival: 'production',
  crafting: 'production',
  agriculture: 'production',
  construction: 'production',
  metalworking: 'production',
  knowledge: 'research',
  culture: 'social',
};

src = src.replace(/category:\s*'([a-z_]+)'/g, (m, p1) => {
  const mapped = categoryMap[p1];
  return `category: '${mapped || p1}'`;
});

// 2) 将 unlocks: ['...'] 规范为对象数组，并移除不存在的 granary
const nameMap = {
  hunting_ground: '狩猎场',
  gathering_hut: '采集小屋',
  logging_camp: '伐木场',
  farm: '农田',
  workshop: '工坊',
  pottery_kiln: '陶窑',
  iron_mine: '铁矿',
  forge: '锻造坊',
};

function normalizeUnlocks(match, inner) {
  // 如果内部包含对象或特殊字符，则跳过（说明已经是对象数组或不是简单字符串数组）
  if (/[{}:]/.test(inner)) return match;
  // 拆分 ID 列表
  const ids = inner
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.replace(/^['"]|['"]$/g, ''));

  // 过滤不存在的项
  const filtered = ids.filter(id => id && id !== 'granary');
  if (filtered.length === 0) {
    // 如果全部被过滤掉，则返回空数组
    return 'unlocks: []';
  }

  const objs = filtered.map(id => ({ id, name: nameMap[id] || id }));
  const body = objs
    .map(o => `{ type: 'building', id: '${o.id}', name: '${o.name}' }`)
    .join(',\n      ');

  // 保留为多行美观输出
  return `unlocks: [\n      ${body}\n    ]`;
}

// 先替换带有尾随逗号的情况
src = src.replace(/unlocks:\s*\[([^\]]+)\]\s*,/g, (m, inner) => normalizeUnlocks(m, inner) + ',');
// 再替换没有尾随逗号的情况
src = src.replace(/unlocks:\s*\[([^\]]+)\]/g, (m, inner) => normalizeUnlocks(m, inner));

fs.writeFileSync(filePath, src, 'utf8');
console.log('fix-tech.js: Completed normalization for categories and unlocks.');