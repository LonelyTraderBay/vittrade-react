import { z } from 'zod';

const httpsUrlSchema = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === 'https:', 'URL must use HTTPS.');

export const marketNewsResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      summary: z.string().min(1),
      category: z.enum(['market', 'macro', 'regulation', 'project']),
      sentiment: z.enum(['bullish', 'neutral', 'bearish']),
      source: z.string().min(1),
      articleUrl: httpsUrlSchema,
      publishedAt: z.string().datetime({ offset: true }),
      relatedPairs: z.array(z.object({ pairId: z.string().min(1), symbol: z.string().min(1) })),
      isBreaking: z.boolean(),
    }),
  ),
  updatedAt: z.string().datetime({ offset: true }),
});

export const marketCalendarResponseSchema = z
  .object({
    items: z.array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        type: z.enum([
          'unlock',
          'upgrade',
          'halving',
          'airdrop',
          'listing',
          'fork',
          'burn',
          'conference',
          'report',
        ]),
        eventAt: z.string().datetime({ offset: true }),
        symbol: z.string().min(1).optional(),
        impact: z.enum(['high', 'medium', 'low']),
        description: z.string().min(1),
        sourceUrl: httpsUrlSchema.optional(),
        confirmed: z.boolean(),
      }),
    ),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .superRefine(({ items }, context) => {
    for (let index = 1; index < items.length; index += 1) {
      if (Date.parse(items[index - 1].eventAt) > Date.parse(items[index].eventAt)) {
        context.addIssue({
          code: 'custom',
          path: ['items', index, 'eventAt'],
          message: 'Calendar events must be ordered by eventAt ascending.',
        });
      }
    }
  });

export const marketCorrelationsResponseSchema = z
  .object({
    window: z.enum(['7d', '30d', '90d']),
    method: z.enum(['pearson', 'spearman']),
    provider: z.string().min(1),
    items: z.array(
      z
        .object({
          assetA: z.string().min(1),
          assetB: z.string().min(1),
          coefficient: z.number().min(-1).max(1),
          observations: z.number().int().min(2),
        })
        .refine(
          (pair) => pair.assetA !== pair.assetB,
          'Correlation pairs must use distinct assets.',
        ),
    ),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .superRefine(({ items }, context) => {
    const seen = new Set<string>();
    for (const [index, pair] of items.entries()) {
      const key = JSON.stringify([pair.assetA, pair.assetB].sort());
      if (seen.has(key)) {
        context.addIssue({
          code: 'custom',
          path: ['items', index],
          message: 'Each unordered asset pair may appear only once.',
        });
      }
      seen.add(key);
    }
  });

export const marketTokenUnlocksResponseSchema = z
  .object({
    window: z.enum(['7d', '30d', '90d']),
    provider: z.string().min(1),
    items: z.array(
      z.object({
        id: z.string().min(1),
        symbol: z.string().min(1),
        name: z.string().min(1),
        eventAt: z.string().datetime({ offset: true }),
        amount: z.number().nonnegative(),
        circulatingSupplyPercent: z.number().min(0).max(100),
        category: z.enum(['team', 'investor', 'ecosystem', 'community', 'foundation']),
        scheduleType: z.enum(['cliff', 'linear', 'milestone']),
        status: z.enum(['confirmed', 'estimated']),
        sourceUrl: httpsUrlSchema,
      }),
    ),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .superRefine(({ items }, context) => {
    const ids = new Set<string>();
    for (let index = 0; index < items.length; index += 1) {
      if (ids.has(items[index].id)) {
        context.addIssue({
          code: 'custom',
          path: ['items', index, 'id'],
          message: 'Token unlock IDs must be unique within a response.',
        });
      }
      ids.add(items[index].id);
      if (index > 0 && Date.parse(items[index - 1].eventAt) > Date.parse(items[index].eventAt)) {
        context.addIssue({
          code: 'custom',
          path: ['items', index, 'eventAt'],
          message: 'Token unlock events must be ordered by eventAt ascending.',
        });
      }
    }
  });

export const marketDerivativesResponseSchema = z
  .object({
    provider: z.string().min(1),
    updatedAt: z.string().datetime({ offset: true }),
    stats: z.object({
      totalOpenInterest: z.number().nonnegative(),
      openInterestChange24h: z.number(),
      totalVolume24h: z.number().nonnegative(),
      volumeChange24h: z.number(),
      totalLiquidations24h: z.number().nonnegative(),
      longLiquidations24h: z.number().nonnegative(),
      shortLiquidations24h: z.number().nonnegative(),
      averageFundingRate8h: z.number(),
      btcLongShortRatio: z.number().positive(),
    }),
    pairs: z.array(
      z.object({
        id: z.string().min(1),
        symbol: z.string().min(1),
        name: z.string().min(1),
        price: z.number().nonnegative(),
        change24h: z.number(),
        fundingRate: z.number(),
        openInterest: z.number().nonnegative(),
        openInterestChange24h: z.number(),
        volume24h: z.number().nonnegative(),
        longSharePercent: z.number().min(0).max(100),
        liquidations24h: z.object({
          long: z.number().nonnegative(),
          short: z.number().nonnegative(),
        }),
      }),
    ),
    liquidationHistory: z.array(
      z.object({
        bucketAt: z.string().datetime({ offset: true }),
        long: z.number().nonnegative(),
        short: z.number().nonnegative(),
      }),
    ),
  })
  .superRefine(({ pairs, liquidationHistory }, context) => {
    const pairIds = new Set<string>();
    for (const [index, pair] of pairs.entries()) {
      if (pairIds.has(pair.id)) {
        context.addIssue({
          code: 'custom',
          path: ['pairs', index, 'id'],
          message: 'Derivative pair IDs must be unique within a response.',
        });
      }
      pairIds.add(pair.id);
    }
    for (let index = 1; index < liquidationHistory.length; index += 1) {
      if (
        Date.parse(liquidationHistory[index - 1].bucketAt) >=
        Date.parse(liquidationHistory[index].bucketAt)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['liquidationHistory', index, 'bucketAt'],
          message: 'Liquidation buckets must have unique timestamps ordered oldest first.',
        });
      }
    }
  });

const sentimentShareSchema = z
  .object({
    bullish: z.number().min(0).max(100),
    neutral: z.number().min(0).max(100),
    bearish: z.number().min(0).max(100),
  })
  .refine(
    ({ bullish, neutral, bearish }) => Math.abs(bullish + neutral + bearish - 100) <= 0.5,
    'Sentiment shares must total 100% within rounding tolerance.',
  );

const socialDominanceSchema = z
  .object({
    btcPercent: z.number().min(0).max(100),
    ethPercent: z.number().min(0).max(100),
    otherPercent: z.number().min(0).max(100),
  })
  .refine(
    ({ btcPercent, ethPercent, otherPercent }) =>
      Math.abs(btcPercent + ethPercent + otherPercent - 100) <= 0.5,
    'Social dominance shares must total 100% within rounding tolerance.',
  );

export const marketSentimentResponseSchema = z
  .object({
    window: z.enum(['24h', '7d', '30d']),
    provider: z.string().min(1),
    updatedAt: z.string().datetime({ offset: true }),
    overall: z.object({
      score: z.number().min(-100).max(100),
      sentiment: z.enum(['bullish', 'neutral', 'bearish']),
      totalMentions24h: z.number().int().nonnegative(),
      mentionsChange24h: z.number(),
      trendingTokenCount: z.number().int().nonnegative(),
      socialDominance: socialDominanceSchema,
    }),
    timeline: z.array(
      z.object({
        at: z.string().datetime({ offset: true }),
        score: z.number().min(-100).max(100),
        mentions: z.number().int().nonnegative(),
      }),
    ),
    tokens: z.array(
      z.object({
        id: z.string().min(1),
        symbol: z.string().min(1),
        name: z.string().min(1),
        score: z.number().min(-100).max(100),
        sentiment: z.enum(['bullish', 'neutral', 'bearish']),
        mentions24h: z.number().int().nonnegative(),
        mentionsChange24h: z.number(),
        sentimentSharePercent: sentimentShareSchema,
        trendingRank: z.number().int().positive().optional(),
        topTopics: z.array(z.string().min(1)),
      }),
    ),
    trendingTopics: z.array(
      z.object({
        topic: z.string().min(1),
        mentions24h: z.number().int().nonnegative(),
        change24h: z.number(),
      }),
    ),
  })
  .superRefine(({ timeline, tokens }, context) => {
    const ids = new Set<string>();
    for (const [index, token] of tokens.entries()) {
      if (ids.has(token.id)) {
        context.addIssue({
          code: 'custom',
          path: ['tokens', index, 'id'],
          message: 'Sentiment token IDs must be unique within a response.',
        });
      }
      ids.add(token.id);
    }
    for (let index = 1; index < timeline.length; index += 1) {
      if (Date.parse(timeline[index - 1].at) >= Date.parse(timeline[index].at)) {
        context.addIssue({
          code: 'custom',
          path: ['timeline', index, 'at'],
          message: 'Sentiment timeline observations must be uniquely ordered oldest first.',
        });
      }
    }
  });

export const marketSignalsResponseSchema = z
  .object({
    provider: z.string().min(1),
    updatedAt: z.string().datetime({ offset: true }),
    items: z
      .array(
        z
          .object({
            id: z.string().min(1),
            providerName: z.string().min(1),
            symbol: z.string().min(1),
            direction: z.enum(['long', 'short']),
            category: z.enum(['scalp', 'swing', 'position']),
            status: z.enum(['active', 'closed', 'expired']),
            publishedAt: z.string().datetime({ offset: true }),
            expiresAt: z.string().datetime({ offset: true }).optional(),
            rationale: z.string().min(1),
            sourceUrl: httpsUrlSchema,
          })
          .refine(
            (signal) =>
              signal.expiresAt === undefined ||
              Date.parse(signal.expiresAt) > Date.parse(signal.publishedAt),
            { path: ['expiresAt'], message: 'Signal expiry must be after its publication time.' },
          ),
      )
      .max(100),
  })
  .superRefine(({ items }, context) => {
    const ids = new Set<string>();
    for (const [index, signal] of items.entries()) {
      if (ids.has(signal.id)) {
        context.addIssue({
          code: 'custom',
          path: ['items', index, 'id'],
          message: 'Signal IDs must be unique within a response.',
        });
      }
      ids.add(signal.id);
      if (index > 0 && Date.parse(items[index - 1].publishedAt) < Date.parse(signal.publishedAt)) {
        context.addIssue({
          code: 'custom',
          path: ['items', index, 'publishedAt'],
          message: 'Signals must be ordered newest first.',
        });
      }
    }
  });
