export type Chain = 'solana'

export type Holding = {
  chain: Chain
  address: string
  mint: string
  symbol: string
  name: string
  decimals: number
  amountRaw: string
  amount: number
  priceUsd: number
  valueUsd: number
  avgCostUsd?: number
  unrealizedPnlUsd?: number
  realizedPnlUsd?: number
}

export type Portfolio = {
  owner: string
  holdings: Holding[]
  totalValueUsd: number
}

export function toUiAmount(amountRaw: string, decimals: number): number {
  return Number(amountRaw) / 10 ** decimals
}

export function valueUsd(amount: number, priceUsd: number): number {
  return Number((amount * priceUsd).toFixed(2))
}

export function portfolioTotalUsd(holdings: Holding[]): number {
  return Number(holdings.reduce((s, h) => s + h.valueUsd, 0).toFixed(2))
}

export function unrealizedPnlUsd(amount: number, priceUsd: number, avgCostUsd?: number): number | undefined {
  if (avgCostUsd == null) return undefined
  return Number(((priceUsd - avgCostUsd) * amount).toFixed(2))
}


