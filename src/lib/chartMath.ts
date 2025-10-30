import type { UTCTimestamp } from 'lightweight-charts'
import type { PriceMessageData } from '@/lib/priceSocket.schema'

export type ShortTimeframe = '24h' | '6h' | '1h' | '30m' | '15m' | '5m' | '1m'

export const TIMEFRAME_TO_SECONDS: Record<ShortTimeframe, number> = {
  '24h': 24 * 60 * 60,
  '6h': 6 * 60 * 60,
  '1h': 60 * 60,
  '30m': 30 * 60,
  '15m': 15 * 60,
  '5m': 5 * 60,
  '1m': 60,
}

export function computePriceFromChange(currentPriceUsd: number, changePercent: number | null | undefined): number | null {
  if (!Number.isFinite(currentPriceUsd) || currentPriceUsd <= 0) return null
  if (changePercent == null || !Number.isFinite(changePercent)) return null
  const ratio = 1 + changePercent / 100
  if (ratio === 0) return null
  return currentPriceUsd / ratio
}

export function buildAnchoredSeries(
  nowUnixSeconds: number,
  currentPriceUsd: number,
  changes: Partial<Record<ShortTimeframe, number | null>>,
): Array<{ time: UTCTimestamp; value: number }> {
  const anchors: Array<{ t: number; v: number | null }> = []
  ;(['24h', '6h', '1h', '30m', '15m', '5m', '1m'] as const).forEach((tf) => {
    const pct = changes[tf]
    const past = computePriceFromChange(currentPriceUsd, pct)
    if (past != null) {
      anchors.push({ t: nowUnixSeconds - TIMEFRAME_TO_SECONDS[tf], v: past })
    }
  })
  anchors.push({ t: nowUnixSeconds, v: currentPriceUsd })

  anchors.sort((a, b) => a.t - b.t)

  return anchors
    .filter((a): a is { t: number; v: number } => a.v != null && Number.isFinite(a.v))
    .map((a) => ({ time: a.t as UTCTimestamp, value: a.v }))
}

export type RangeOption = '1H' | '1D' | '1W' | '1M' | 'YTD' | 'ALL' | '24H'

export function buildDataByRangeFromLive(live: PriceMessageData | undefined): Partial<Record<RangeOption, Array<{ time: UTCTimestamp; value: number }>>> {
  if (!live || live.summary.price_usd == null) return {}
  const now = Math.floor(Date.now() / 1000)
  const price = Number(live.summary.price_usd)

  const s = live.summary
  const baseChanges: Partial<Record<ShortTimeframe, number | null>> = {
    '24h': s['24h'].last_price_usd_change,
    '6h': s['6h'].last_price_usd_change,
    '1h': s['1h'].last_price_usd_change,
    '30m': s['30m'].last_price_usd_change,
    '15m': s['15m'].last_price_usd_change,
    '5m': s['5m'].last_price_usd_change,
    '1m': s['1m'].last_price_usd_change,
  }

  const series24h = buildAnchoredSeries(now, price, baseChanges)
  const series1h = buildAnchoredSeries(now, price, {
    '1h': baseChanges['1h'] ?? null,
    '30m': baseChanges['30m'] ?? null,
    '15m': baseChanges['15m'] ?? null,
    '5m': baseChanges['5m'] ?? null,
    '1m': baseChanges['1m'] ?? null,
  })

  return {
    '24H': series24h,
    '1H': series1h,
  }
}

type MinimalAsset = {
  mint: string
  amount: number
  price?: number | null
}

export function buildPortfolioAnchoredSeriesFromLive(
  nowUnixSeconds: number,
  assets: ReadonlyArray<MinimalAsset>,
  pricesByMint: Record<string, PriceMessageData | undefined>,
): Array<{ time: UTCTimestamp; value: number }> {
  const anchors: ShortTimeframe[] = ['24h', '6h', '1h', '30m', '15m', '5m', '1m']

  const resolveCurrentAssetPrice = (asset: MinimalAsset): number | null => {
    const live = pricesByMint[asset.mint]
    const livePrice = live?.summary?.price_usd
    const p = (typeof livePrice === 'number' ? livePrice : asset.price) ?? null
    return p != null && Number.isFinite(p) ? p : null
  }

  const sumAtTimeframe = (tf: ShortTimeframe): number => {
    let total = 0
    for (const a of assets) {
      const current = resolveCurrentAssetPrice(a)
      if (current == null || !Number.isFinite(a.amount)) continue
      const change = pricesByMint[a.mint]?.summary?.[tf]?.last_price_usd_change
      const past = computePriceFromChange(current, change ?? 0) ?? current
      total += past * a.amount
    }
    return total
  }

  const points: Array<{ time: UTCTimestamp; value: number }> = []
  for (const tf of anchors) {
    const t = nowUnixSeconds - TIMEFRAME_TO_SECONDS[tf]
    const v = sumAtTimeframe(tf)
    points.push({ time: t as UTCTimestamp, value: v })
  }

  // Append current total value
  const currentTotal = assets.reduce((s, a) => {
    const current = resolveCurrentAssetPrice(a)
    if (current == null) return s
    return s + current * a.amount
  }, 0)
  points.push({ time: nowUnixSeconds as UTCTimestamp, value: currentTotal })

  points.sort((a, b) => (a.time as number) - (b.time as number))
  return points
}

export function buildPortfolioAnchoredSeriesWithDiagnostics(
  nowUnixSeconds: number,
  assets: ReadonlyArray<MinimalAsset>,
  pricesByMint: Record<string, PriceMessageData | undefined>,
): { points: Array<{ time: UTCTimestamp; value: number }>; missingMints: string[] } {
  const anchors: ShortTimeframe[] = ['24h', '6h', '1h', '30m', '15m', '5m', '1m']

  const resolveCurrentAssetPrice = (asset: MinimalAsset): number | null => {
    const live = pricesByMint[asset.mint]
    const livePrice = live?.summary?.price_usd
    const p = (typeof livePrice === 'number' ? livePrice : asset.price) ?? null
    return p != null && Number.isFinite(p) ? p : null
  }

  const missing = new Set<string>()

  const sumAtTimeframe = (tf: ShortTimeframe): number => {
    let total = 0
    for (const a of assets) {
      const current = resolveCurrentAssetPrice(a)
      if (current == null || !Number.isFinite(a.amount)) continue
      const change = pricesByMint[a.mint]?.summary?.[tf]?.last_price_usd_change
      if (
        anchors.every((k) => pricesByMint[a.mint]?.summary?.[k]?.last_price_usd_change == null)
      ) {
        missing.add(a.mint)
      }
      const past = computePriceFromChange(current, change ?? 0) ?? current
      total += past * a.amount
    }
    return total
  }

  const points: Array<{ time: UTCTimestamp; value: number }> = []
  for (const tf of anchors) {
    const t = nowUnixSeconds - TIMEFRAME_TO_SECONDS[tf]
    const v = sumAtTimeframe(tf)
    points.push({ time: t as UTCTimestamp, value: v })
  }

  const currentTotal = assets.reduce((s, a) => {
    const current = resolveCurrentAssetPrice(a)
    if (current == null) return s
    return s + current * a.amount
  }, 0)
  points.push({ time: nowUnixSeconds as UTCTimestamp, value: currentTotal })

  points.sort((a, b) => (a.time as number) - (b.time as number))
  return { points, missingMints: Array.from(missing) }
}


