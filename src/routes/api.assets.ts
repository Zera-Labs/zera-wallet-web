import { createFileRoute } from '@tanstack/react-router'
import { listHoldings, listHoldingsFromPrivy } from '@/lib/portfolio.service'
import axios from 'axios'
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
        let rows: Asset[] = holdings.map((h) => ({
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
        // Enrich names/symbols via Helius DAS for unknown tokens
        const key = process.env.HELIUS_API_KEY as string | undefined
        if (key) {
          const unknowns = rows.filter(r => r.chain === 'SOL' && r.mint && (r.name === r.mint || !r.name || r.name.toUpperCase() === r.symbol.toUpperCase()))
          if (unknowns.length > 0) {
            const url = `https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(key)}`
            await Promise.all(unknowns.map(async (r) => {
              try {
                const res = await axios.post(url, { jsonrpc: '2.0', id: '1', method: 'getAsset', params: { id: r.mint } }, { validateStatus: () => true, timeout: 15000 })
                if (res.status >= 200 && res.status < 300) {
                  const content = res.data?.result?.content
                  const metaName: string | undefined = content?.metadata?.name
                  const metaSymbol: string | undefined = content?.metadata?.symbol
                  if (metaName || metaSymbol) {
                    r.name = metaName || metaSymbol || r.name
                    r.symbol = metaSymbol || metaName || r.symbol
                  }
                }
              } catch {}
            }))
          }
        }
        return Response.json(rows)
      },
    },
  },
})

