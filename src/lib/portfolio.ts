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

export function valueUsd(amount: number, priceUsd: number): number {
  return Number((amount * priceUsd).toFixed(2))
}
