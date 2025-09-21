import { z } from 'zod';

// 资源键统一宽松，避免侵入现有 Resources 类型
const ResourcesSchema = z.record(z.string(), z.number());

const DiscoveredLocationSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  data: z.any().optional()
}).passthrough();

export const ExplorationSchema = z.object({
  discoveredLocations: z.object({
    dungeons: z.array(DiscoveredLocationSchema).default([]),
    countries: z.array(DiscoveredLocationSchema).default([]),
    events: z.array(DiscoveredLocationSchema).default([])
  }).default({ dungeons: [], countries: [], events: [] }),
  explorationHistory: z.array(z.any()).default([]),
  explorationPoints: z.number().int().nonnegative().default(0)
}).default({ discoveredLocations: { dungeons: [], countries: [], events: [] }, explorationHistory: [], explorationPoints: 0 });

const RelationshipSchema = z.object({
  attitude: z.string().optional(),
  value: z.number().optional()
}).passthrough();

export const DiplomacySchema = z.object({
  relationships: z.record(z.string(), RelationshipSchema).default({}),
  tradeHistory: z.array(z.any()).default([]),
  giftHistory: z.array(z.any()).default([]),
  discoveredCountries: z.array(z.any()).default([]),
  raidEvents: z.array(z.any()).optional().default([])
}).default({ relationships: {}, tradeHistory: [], giftHistory: [], discoveredCountries: [], raidEvents: [] });

const ExplorationDefault = { discoveredLocations: { dungeons: [], countries: [], events: [] }, explorationHistory: [], explorationPoints: 0 };
const DiplomacyDefault = { relationships: {}, tradeHistory: [], giftHistory: [], discoveredCountries: [], raidEvents: [] };

export const GameStateZod = z.object({
  version: z.number().int().nonnegative().default(1),
  resources: ResourcesSchema.default({}),
  stability: z.number().default(0),
  corruption: z.number().default(0),
  exploration: ExplorationSchema.default(ExplorationDefault),
  diplomacy: DiplomacySchema.default(DiplomacyDefault)
}).passthrough();

export type GameStateZ = z.infer<typeof GameStateZod>;

export type ZodMigration = (state: GameStateZ) => GameStateZ;

export function parseAndMigrate(input: unknown, currentVersion: number, migrations: ZodMigration[] = []): GameStateZ {
  // 先 parse 与默认值填充
  let parsed = GameStateZod.parse({ ...(typeof input === 'object' && input ? (input as object) : {}), version: (input as any)?.version ?? currentVersion });

  // 逐版本迁移
  const from = Number(parsed.version ?? 0);
  if (Number.isFinite(from) && from < currentVersion) {
    for (let v = from; v < currentVersion; v++) {
      const m = migrations[v];
      if (typeof m === 'function') {
        parsed = m(parsed);
        parsed.version = v + 1;
      }
    }
  }

  // 对齐最终版本
  parsed.version = currentVersion;
  return parsed;
}