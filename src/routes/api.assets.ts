import { createFileRoute } from '@tanstack/react-router'
import { portfolioService } from '@/lib/portfolio.service'
import { mockPrivyUser } from '@/data/privy.mock'

type Asset = {
  id: string
  name: string
  symbol: string
  chain: string
  price: number
  amount: number
  value: number
  pnl: number
  avgCostUsd?: number
}

export const Route = createFileRoute('/api/assets')({
  server: {
    handlers: {
      GET: async () => {
        const owner = mockPrivyUser.linkedAccounts.find((a: any) => a.type === 'wallet' && a.chainType === 'solana')?.address
        if (!owner) return Response.json([])
        const holdings = await portfolioService.listHoldings(owner)
        const rows: Asset[] = holdings.map((h) => ({
          id: h.symbol.toLowerCase(),
          name: h.name,
          symbol: h.symbol,
          chain: 'SOL',
          price: h.priceUsd,
          amount: h.amount,
          value: h.valueUsd,
          pnl: h.unrealizedPnlUsd ?? 0,
          avgCostUsd: h.avgCostUsd,
        }))
        return Response.json(rows)
      },
    },
  },
})

