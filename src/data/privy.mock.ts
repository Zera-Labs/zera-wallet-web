import type { Portfolio, Holding } from '@/lib/portfolio'
import { toUiAmount, valueUsd as calcValueUsd, portfolioTotalUsd, unrealizedPnlUsd as calcUnrealized } from '@/lib/portfolio'

export const mockPrivyUser = {
  id: 'did:privy:abc123',
  createdAt: '2025-10-08T12:34:56.000Z',
  linkedAccounts: [
    {
      type: 'wallet',
      id: null,
      address: '7pZ...RiCoSOL',
      chainType: 'solana',
      walletClientType: 'privy',
      connectorType: 'privy_embedded',
      recoveryMethod: 'privy',
      imported: false,
      delegated: false,
      walletIndex: 0,
    },
  ],
} as const

export const mockConnectedWallets = [
  {
    address: '7pZ...RiCoSOL',
    chainType: 'solana',
    walletClientType: 'privy',
  },
] as const

// Base holdings with raw amounts and pricing; computed fields derive below
const baseHoldings: Array<Pick<Holding, 'chain' | 'address' | 'mint' | 'symbol' | 'name' | 'decimals' | 'amountRaw' | 'priceUsd' | 'avgCostUsd'> & { realizedPnlUsd?: number }> = [
  {
    chain: 'solana',
    address: '7pZ...RiCoSOL',
    mint: '',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    amountRaw: '313670000000',
    priceUsd: 1.00812767,
    avgCostUsd: 0.78,
    realizedPnlUsd: 0,
  },
  {
    chain: 'solana',
    address: '7pZ...RiCoSOL',
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'ZERA',
    name: 'Zera Token',
    decimals: 6,
    amountRaw: '783760000000',
    priceUsd: 0.02538,
    avgCostUsd: 0.02538,
    realizedPnlUsd: 0,
  },
  {
    chain: 'solana',
    address: '7pZ...RiCoSOL',
    mint: 'Es9vMFrzaCERz...USDCmint',
    symbol: 'ETH',
    name: 'Ethereum (wrapped/price proxy)',
    decimals: 6,
    amountRaw: '129010000',
    priceUsd: 0.99374238,
    avgCostUsd: 0.959,
    realizedPnlUsd: 0,
  },
]

const computedHoldings: Holding[] = baseHoldings.map((h) => {
  const amount = toUiAmount(h.amountRaw, h.decimals)
  const value = calcValueUsd(amount, h.priceUsd)
  const unrealized = calcUnrealized(amount, h.priceUsd, h.avgCostUsd)
  return {
    chain: h.chain,
    address: h.address,
    mint: h.mint,
    symbol: h.symbol,
    name: h.name,
    decimals: h.decimals,
    amountRaw: h.amountRaw,
    amount,
    priceUsd: h.priceUsd,
    valueUsd: value,
    avgCostUsd: h.avgCostUsd,
    unrealizedPnlUsd: unrealized,
    realizedPnlUsd: h.realizedPnlUsd ?? 0,
  }
})

export const mockPortfolio: Portfolio = {
  owner: '7pZ...RiCoSOL',
  holdings: computedHoldings,
  totalValueUsd: portfolioTotalUsd(computedHoldings),
}


