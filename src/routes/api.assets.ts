import { createFileRoute } from '@tanstack/react-router'
import { listHoldings, listHoldingsFromPrivy } from '@/lib/portfolio.service'
import { verifyRequestAndGetUser, getFirstSolanaAddressFromPrivyUser, getSolanaWalletPrivyId, getFirstSolanaWalletPrivyId, fetchFirstSolanaWalletPrivyIdFromApi } from '@/lib/privy.server'

type Asset = {
  id: string
  name: string
  symbol: string
  chain: string
  mint: string
  price: number
  amount: number
  value: number
  pnl: number
  avgCostUsd?: number
}

export const Route = createFileRoute('/api/assets')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await verifyRequestAndGetUser(request)
        const owner = getFirstSolanaAddressFromPrivyUser(user)
        if (!owner) return Response.json([])
        let walletPrivyId = await fetchFirstSolanaWalletPrivyIdFromApi(user)
        if (!walletPrivyId) {
          walletPrivyId = getSolanaWalletPrivyId(user, owner) || getFirstSolanaWalletPrivyId(user)
        }
        const holdings = walletPrivyId
          ? await listHoldingsFromPrivy(walletPrivyId, owner)
          : await listHoldings(owner)
        const rows: Asset[] = holdings.map((h) => ({
          id: h.symbol.toLowerCase(),
          name: h.name,
          symbol: h.symbol,
          chain: (h.chain || 'solana').toUpperCase().startsWith('SOL') ? 'SOL' : (h.chain || '').toUpperCase(),
          mint: h.mint,
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

