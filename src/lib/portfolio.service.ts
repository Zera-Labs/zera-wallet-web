import type { Portfolio, Holding } from '@/lib/portfolio'
import { Address, Commitment, createSolanaRpc } from '@solana/kit'

// Thin abstraction to prepare for swapping in real APIs/websockets later.
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com')

export async function getLivePrices(mints: string[]): Promise<Map<string, number>> {
  if (!mints.length) return new Map()
  const params = new URLSearchParams({ ids: mints.join(',') })
  const res = await fetch(`/api/prices?${params.toString()}`)
  if (!res.ok) return new Map()
  const json = await res.json().catch(() => ({ data: {} })) as { data?: Record<string, { id: string; price: number }> }
  const out = new Map<string, number>()
  const data = json?.data ?? {}
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value.price === 'number') {
      out.set(key, value.price)
    }
  }
  return out
}

async function fetchSolBalance(address: string): Promise<{ amount: number; priceUsd: number }> {
  const { value } = await rpc
    .getBalance(address as Address, { commitment: 'confirmed' as Commitment })
    .send()
  const lamports = Number(value)
  const amount = lamports / 1_000_000_000
  const priceUsd = await getLivePrices(['So11111111111111111111111111111111111111112']).then((m) => m.get('So11111111111111111111111111111111111111112') ?? 0)
  return { amount, priceUsd }
}

export async function getPortfolioByOwner(owner: string): Promise<Portfolio | undefined> {
  const { amount, priceUsd } = await fetchSolBalance(owner)
  const valueUsd = Number((amount * priceUsd).toFixed(2))
  const holdings: Holding[] = [
    {
      chain: 'solana',
      address: owner,
      mint: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      amountRaw: String(Math.round(amount * 1_000_000_000)),
      amount,
      priceUsd,
      valueUsd,
      avgCostUsd: undefined,
      unrealizedPnlUsd: undefined,
      realizedPnlUsd: 0,
    },
  ]
  return {
    owner,
    holdings,
    totalValueUsd: valueUsd,
  }
}

export async function listHoldings(owner: string): Promise<Holding[]> {
  const p = await getPortfolioByOwner(owner)
  return p?.holdings ?? []
}

export async function getHoldingBySymbol(owner: string, symbol: string): Promise<Holding | undefined> {
  const holdings = await listHoldings(owner)
  return holdings.find((h) => h.symbol.toLowerCase() === symbol.toLowerCase())
}


