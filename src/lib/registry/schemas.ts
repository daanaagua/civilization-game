import { z } from 'zod';

export const RequirementTokenSchema = z.string(); // 'cap:xxx' | 'tag:yyy'

const BaseItem = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  requires: z.array(RequirementTokenSchema).optional()
});

export const BuildingItemSchema = BaseItem.extend({
  kind: z.literal('building'),
  data: z.record(z.string(), z.any()).optional()
});

export const TechItemSchema = BaseItem.extend({
  kind: z.literal('tech'),
  grantsCapabilities: z.array(z.string()).optional(),
  data: z.record(z.string(), z.any()).optional()
});

export const UnitItemSchema = BaseItem.extend({
  kind: z.literal('unit'),
  data: z.record(z.string(), z.any()).optional()
});

export const EventItemSchema = BaseItem.extend({
  kind: z.literal('event'),
  probability: z.number().min(0).max(1).optional(),
  payload: z.record(z.string(), z.any()).optional()
});

export const NationItemSchema = BaseItem.extend({
  kind: z.literal('nation'),
  data: z.record(z.string(), z.any()).optional()
});

export type BuildingItemInput = z.infer<typeof BuildingItemSchema>;
export type TechItemInput = z.infer<typeof TechItemSchema>;
export type UnitItemInput = z.infer<typeof UnitItemSchema>;
export type EventItemInput = z.infer<typeof EventItemSchema>;
export type NationItemInput = z.infer<typeof NationItemSchema>;