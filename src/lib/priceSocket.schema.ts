import { z } from 'zod';

// Coerces numbers and numeric strings to number; otherwise null
const zNullableNumber = z.preprocess((val) => {
  if (val == null) return null;
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const parsed = Number(val);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}, z.number().nullable());

const timeframeStatsSchema = z.object({
  volume: z.number(),
  volume_usd: z.number(),
  sells: z.number(),
  buys: z.number(),
  txns: z.number(),
  buy_usd: z.number(),
  sell_usd: z.number(),
  last_price_usd_change: zNullableNumber,
});

const summarySchema = z.object({
  chain: z.string(),
  id: z.string(),
  price_usd: zNullableNumber,
  fdv: zNullableNumber,
  liquidity_usd: zNullableNumber,
  pools: z.number(),
  '24h': timeframeStatsSchema,
  '6h': timeframeStatsSchema,
  '1h': timeframeStatsSchema,
  '30m': timeframeStatsSchema,
  '15m': timeframeStatsSchema,
  '5m': timeframeStatsSchema,
  '1m': timeframeStatsSchema,
});

const priceDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  chain: z.string(),
  decimals: z.number(),
  total_supply: z.number(),
  description: z.string(),
  website: z.string(),
  added_at: z.string(),
  summary: summarySchema,
  last_updated: z.string(),
});

export const zPriceMessage = z.object({
  type: z.literal('price'),
  tokenAddress: z.string(),
  data: priceDataSchema,
});

export const zSubscribedManyMessage = z.object({
  type: z.literal('subscribedMany'),
  count: z.number(),
});

export const zPriceWsMessage = z.discriminatedUnion('type', [
  zPriceMessage,
  zSubscribedManyMessage,
]);

export type PriceWsMessage = z.infer<typeof zPriceWsMessage>;
export type PriceMessageData = z.infer<typeof zPriceMessage>['data'];


