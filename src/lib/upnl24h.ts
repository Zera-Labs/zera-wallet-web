import type { PriceMessageData } from '@/lib/priceSocket.schema'

export type AssetForUpnl = {
  mint: string
  amount: number
}

export type TransactionLike = {
  created_at: number
  details: {
    asset: string
    type: 'transfer_sent' | 'transfer_received'
    raw_value: string
    raw_value_decimals: number
  }
  status: 'broadcasted' | 'confirmed' | 'execution_reverted' | 'failed' | 'replaced' | 'finalized' | 'provider_error' | 'pending'
}

export type Upnl24hResult = {
  changeUsd: number
  prevMarketValueUsdIncluded: number
  excluded: Array<{ mint: string; reason: 'price_missing_24h' }>
  debugTop?: Array<{
    mint: string
    amount: number
    p1: number
    dp24: number
    p0: number
    deltaQty24h: number
    balance0: number
    unchangedUnits: number
    tokenChange: number
  }>
}

/**
 * Computes 24h unrealised PnL change using only tokens whose qty/cost basis likely didn't change in the window.
 * For those tokens, UPNL_24h = amount * (price_t1 - price_t0). price_t0 is derived from the feed's 24h delta when available.
 */
export function computeUnrealisedUpnl24h(
  assets: AssetForUpnl[],
  pricesByMint: Record<string, PriceMessageData | undefined>,
  nowEpochMs: number,
  txs?: TransactionLike[],
  scale: number = 1,
): Upnl24hResult {
  const DAY_MS = 24 * 60 * 60 * 1000
  const t0 = nowEpochMs - DAY_MS

  const excluded: Array<{ mint: string; reason: 'price_missing_24h' }> = []

  const SOL_MINT = 'So11111111111111111111111111111111111111112'
  const mapTxAssetToMint = (asset: string | undefined): string | undefined => {
    if (!asset) return undefined
    const a = asset.toLowerCase()
    if (a === 'sol' || a.includes('solana')) return SOL_MINT
    // Heuristic: SPL mint addresses are long base58 strings
    if (a.length >= 30) return asset
    return undefined
  }

  // Net deltas within (t0, t1] per mint (received positive, sent negative)
  const deltaByMint = new Map<string, number>()
  if (Array.isArray(txs) && txs.length > 0) {
    for (const tx of txs) {
      if (!tx || tx.status !== 'confirmed') continue
      if (typeof tx.created_at !== 'number') continue
      if (tx.created_at * 1000 <= t0) continue
      const mint = mapTxAssetToMint(tx.details?.asset)
      if (!mint) continue
      const amountRaw = Number(tx.details?.raw_value ?? '0')
      const decimals = Number(tx.details?.raw_value_decimals ?? 0)
      const qty = decimals > 0 ? amountRaw / Math.pow(10, decimals) : amountRaw
      if (!isFinite(qty) || qty === 0) continue
      const sign = tx.details?.type === 'transfer_received' ? 1 : -1
      deltaByMint.set(mint, (deltaByMint.get(mint) ?? 0) + sign * qty)
    }
  }

  let changeUsd = 0
  let prevMarketValueUsdIncluded = 0
  const debug: Upnl24hResult['debugTop'] = []

  const approx24hDelta = (price?: PriceMessageData): number | null => {
    const s = price?.summary
    if (!s) return null
    const d24 = s['24h']?.last_price_usd_change
    if (typeof d24 === 'number') return d24
    // Fallbacks: scale shorter intervals linearly
    const d6 = s['6h']?.last_price_usd_change
    if (typeof d6 === 'number') return d6 * 4
    const d1 = s['1h']?.last_price_usd_change
    if (typeof d1 === 'number') return d1 * 24
    const d30m = s['30m']?.last_price_usd_change
    if (typeof d30m === 'number') return d30m * 48
    const d15m = s['15m']?.last_price_usd_change
    if (typeof d15m === 'number') return d15m * 96
    const d5m = s['5m']?.last_price_usd_change
    if (typeof d5m === 'number') return d5m * 288
    const d1m = s['1m']?.last_price_usd_change
    if (typeof d1m === 'number') return d1m * 1440
    return null
  }

  for (const a of assets) {
    const price = pricesByMint[a.mint]
    const p1 = price?.summary?.price_usd
    const dp24 = approx24hDelta(price)
    if (typeof p1 !== 'number' || typeof dp24 !== 'number') {
      excluded.push({ mint: a.mint, reason: 'price_missing_24h' })
      continue
    }

    // Sanity-check: skip obviously broken deltas (e.g., delta larger than current price by a wide margin)
    if (!isFinite(dp24) || Math.abs(dp24) > Math.max(Math.abs(p1) * 0.9, 2)) {
      excluded.push({ mint: a.mint, reason: 'price_missing_24h' })
      continue
    }

    const p0 = p1 - dp24
    const balance1 = a.amount
    const delta = deltaByMint.get(a.mint) ?? 0
    const balance0 = balance1 - delta
    const unchangedUnits = Math.max(0, Math.min(balance0, balance1))

    if (unchangedUnits <= 0) continue

    const tokenChange = unchangedUnits * (p1 - p0)
    changeUsd += tokenChange
    prevMarketValueUsdIncluded += unchangedUnits * p0

    if (Math.abs(tokenChange) >= 50) {
      debug?.push({
        mint: a.mint,
        amount: a.amount,
        p1,
        dp24,
        p0,
        deltaQty24h: delta,
        balance0,
        unchangedUnits,
        tokenChange,
      })
    }
  }

  // Round for stability in UI, keep computation simple
  return {
    changeUsd: Number((changeUsd * scale).toFixed(2)),
    prevMarketValueUsdIncluded: Number(prevMarketValueUsdIncluded.toFixed(2)),
    excluded,
    debugTop: debug?.sort((a, b) => Math.abs(b.tokenChange) - Math.abs(a.tokenChange)).slice(0, 10),
  }
}


