import { z } from 'zod';

// requires: 统一 token（cap:/tag:），这里不限定枚举，留给上层选择器解析
export const RequirementTokenSchema = z.string();

// 条件模型：保留最小集，可按需扩展
// - type: 'tag' | 'cap' | 'building_count' | 'resource_at_least' 等
// - value: 对应的值（字符串/数字）
// - compare?: 可选比较器
export const EventConditionSchema = z.object({
  type: z.string(),
  value: z.any().optional(),
  compare: z.enum(['>=', '<=', '==', '>', '<']).optional()
}).passthrough();

export const EffectSchema = z.object({
  kind: z.string().min(1),
  payload: z.any().optional()
}).passthrough();

export const EventScriptSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  requires: z.array(RequirementTokenSchema).optional(),
  probability: z.number().min(0).max(1).optional(),
  conditions: z.array(EventConditionSchema).optional(),
  effects: z.array(EffectSchema).optional(),
  // 当未完成条目时，允许占位
  placeholder: z.boolean().optional()
}).passthrough();

export type EventCondition = z.infer<typeof EventConditionSchema>;
export type EffectDef = z.infer<typeof EffectSchema>;
export type EventScript = z.infer<typeof EventScriptSchema>;