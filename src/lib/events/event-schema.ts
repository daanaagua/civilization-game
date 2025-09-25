import { z } from 'zod';

export const EventPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const EventMetaSchema = z.object({
  doNotRecordInLatest: z.boolean().optional(),
  recordInLatest: z.boolean().optional(),
  pausesGame: z.boolean().optional()
}).optional();

export const BaseEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: EventPrioritySchema.optional(),
  timestamp: z.number().optional(),
  icon: z.string().optional(),
  category: z.string().optional(),
  meta: EventMetaSchema
});

export const ChoiceOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  effects: z.array(z.any()).optional()
});

export const ChoiceEventSchema = BaseEventSchema.extend({
  kind: z.literal('choice'),
  options: z.array(ChoiceOptionSchema).min(1)
});

export const NotificationEventSchema = BaseEventSchema.extend({
  kind: z.literal('notification'),
  duration: z.number().optional()
});

export const GameEventSchema = z.union([ChoiceEventSchema, NotificationEventSchema]);

export type ChoiceEventInput = z.infer<typeof ChoiceEventSchema>;
export type NotificationEventInput = z.infer<typeof NotificationEventSchema>;

export function validateEvent(ev: unknown): { ok: boolean; error?: string } {
  const r = GameEventSchema.safeParse(ev);
  return r.success ? { ok: true } : { ok: false, error: r.error.message };
}