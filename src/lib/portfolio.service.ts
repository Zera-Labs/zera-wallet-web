import type { Portfolio, Holding } from '@/lib/portfolio'
import { Address, Commitment, createSolanaRpc } from '@solana/kit'

// Thin abstraction to prepare for swapping in real APIs/websockets later.
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com')

export async function getLivePrices(_mints: string[]): Promise<Map<string, number>> {
  return new Map()
}

async function fetchSolBalance(address: string): Promise<{ amount: number; priceUsd: number }> {
  const { value } = await rpc
    .getBalance(address as Address, { commitment: 'confirmed' as Commitment })
    .send()
  const lamports = Number(value)
  const amount = lamports / 1_000_000_000
  const priceUsd = 0
  return { amount, priceUsd }
}

type JsonParsedTokenAccount = {
  pubkey: string
  account: {
    data: {
      program: string
      parsed: {
        type: string
        info: {
          isNative?: boolean
          mint: string
          owner: string
          tokenAmount: {
            amount: string
            decimals: number
            uiAmount: number | null
          }
        }
      }
    }
  }
}

async function fetchSplTokenAccounts(owner: string): Promise<Array<{ mint: string; amount: number; decimals: number }>> {
  const { value } = await rpc
    .getTokenAccountsByOwner(owner as Address, { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address }, {
      encoding: 'jsonParsed' as any,
      commitment: 'confirmed' as Commitment,
    } as any)
    .send()
  const accounts: JsonParsedTokenAccount[] = Array.isArray(value) ? (value as any) : []
  const perMint = new Map<string, { amount: number; decimals: number }>()
  for (const acc of accounts) {
    const parsed = (acc as any)?.account?.data?.parsed
    const info = parsed?.info
    const mint: string | undefined = info?.mint
    const tokenAmount = info?.tokenAmount
    const decimals: number | undefined = tokenAmount?.decimals
    const uiAmount = tokenAmount?.uiAmount
    if (!mint || typeof decimals !== 'number') continue
    const amount = typeof uiAmount === 'number' ? uiAmount : Number(tokenAmount?.amount ?? '0') / Math.pow(10, decimals)
    if (amount <= 0) continue
    const prev = perMint.get(mint) || { amount: 0, decimals }
    perMint.set(mint, { amount: prev.amount + amount, decimals })
  }
  return Array.from(perMint, ([mint, { amount, decimals }]) => ({ mint, amount, decimals }))
}

function mapMintToMetadata(mint: string, decimals: number): { symbol: string; name: string; decimals: number; mint: string } {
  const m = mint.toLowerCase()
  if (m === 'so11111111111111111111111111111111111111112') return { symbol: 'SOL', name: 'Solana', decimals: 9, mint }
  if (m === 'epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwydtt1v') return { symbol: 'USDC', name: 'USD Coin', decimals: 6, mint }
  if (m === 'es9vmfrzacerzz1zq6k8cqjqb9cyym2dlixx7ac3y3') return { symbol: 'USDT', name: 'Tether USD', decimals: 6, mint }
  if (m === '8avjtjhahfqp4g2rr9alagbpstqkpzr8nrbzstwzera') return { symbol: 'ZERA', name: 'Zera', decimals, mint }
  return { symbol: mint.slice(0, 4).toUpperCase(), name: mint, decimals, mint }
}

export async function getPortfolioByOwner(owner: string): Promise<Portfolio | undefined> {
  const [{ amount: solAmount, priceUsd: solPrice }, tokens] = await Promise.all([
    fetchSolBalance(owner),
    fetchSplTokenAccounts(owner),
  ])

  const priceMap = new Map<string, number>()

  const holdings: Holding[] = []
  const solValue = Number((solAmount * solPrice).toFixed(2))
  holdings.push({
    chain: 'solana',
    address: owner,
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    amountRaw: String(Math.round(solAmount * 1_000_000_000)),
    amount: solAmount,
    priceUsd: solPrice,
    valueUsd: solValue,
    avgCostUsd: undefined,
    unrealizedPnlUsd: undefined,
    realizedPnlUsd: 0,
  })

  for (const t of tokens) {
    const { symbol, name, decimals, mint } = mapMintToMetadata(t.mint, t.decimals)
    const price = priceMap.get(mint) ?? 0
    const value = Number((t.amount * price).toFixed(2))
    holdings.push({
      chain: 'solana',
      address: owner,
      mint,
      symbol,
      name,
      decimals,
      amountRaw: String(Math.round(t.amount * Math.pow(10, decimals))),
      amount: t.amount,
      priceUsd: price,
      valueUsd: value,
      avgCostUsd: undefined,
      unrealizedPnlUsd: undefined,
      realizedPnlUsd: 0,
    })
  }

  const totalValueUsd = Number(holdings.reduce((s, h) => s + (h.valueUsd || 0), 0).toFixed(2))
  return { owner, holdings, totalValueUsd }
}

export async function listHoldings(owner: string): Promise<Holding[]> {
  const p = await getPortfolioByOwner(owner)
  return p?.holdings ?? []
}

export async function getHoldingBySymbol(owner: string, symbol: string): Promise<Holding | undefined> {
  const holdings = await listHoldings(owner)
  return holdings.find((h) => h.symbol.toLowerCase() === symbol.toLowerCase())
}

// Removed Privy asset mapping in favor of mint-based metadata

export async function listHoldingsFromPrivy(_walletPrivyId: string, ownerAddress?: string): Promise<Holding[]> {
  if (!ownerAddress) return []
  return await listHoldings(ownerAddress)
}

export async function getPortfolioFromPrivy(_walletPrivyId: string, ownerAddress?: string): Promise<Portfolio | undefined> {
  if (!ownerAddress) return { owner: '', holdings: [], totalValueUsd: 0 }
  return await getPortfolioByOwner(ownerAddress)
}

export async function getHoldingByMint(owner: string, mint: string): Promise<Holding | undefined> {
  const holdings = await listHoldings(owner)
  const target = mint.toLowerCase()
  return holdings.find((h) => h.mint.toLowerCase() === target)
}


