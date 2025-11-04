import { createFileRoute } from '@tanstack/react-router'
import { listHoldings, listHoldingsFromPrivy } from '@/lib/portfolio.service'
import axios from 'axios'
import { verifyRequestAndGetUser, getFirstSolanaAddressFromPrivyUser, getSolanaWalletPrivyId, getFirstSolanaWalletPrivyId, fetchFirstSolanaWalletPrivyIdFromApi } from '@/lib/privy.server'

const MINT_META_TTL_MS = 2 * 60 * 60 * 1000
type MintMetaCacheEntry = { name?: string; symbol?: string; expiresAt: number }
const mintMetaCache = new Map<string, MintMetaCacheEntry>()

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
        const reqUrl = new URL(request.url)
        try {
          const user = await verifyRequestAndGetUser(request)
          const owner = getFirstSolanaAddressFromPrivyUser(user)
          if (!owner) return Response.json([])
          let walletPrivyId = getSolanaWalletPrivyId(user, owner) || getFirstSolanaWalletPrivyId(user)
          if (!walletPrivyId) {
            walletPrivyId = await fetchFirstSolanaWalletPrivyIdFromApi(user)
          }
          const holdings = walletPrivyId
            ? await listHoldingsFromPrivy(walletPrivyId, owner)
            : await listHoldings(owner)
          let rows: Asset[] = holdings.map((h) => ({
            id: h.mint,
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

          // Enrich names/symbols via Helius with in-memory cache (2h TTL)
          const key = process.env.HELIUS_API_KEY as string | undefined
          if (key) {
            const targets = rows.filter(r => r.chain === 'SOL' && r.mint)
            if (targets.length > 0) {
              const now = Date.now()
              const url = `https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(key)}`

              const toFetch: Asset[] = []
              for (const r of targets) {
                const cached = mintMetaCache.get(r.mint)
                if (cached && cached.expiresAt > now) {
                  if (cached.name || cached.symbol) {
                    r.name = cached.name || cached.symbol || r.name
                    r.symbol = cached.symbol || cached.name || r.symbol
                  }
                  continue
                }
                toFetch.push(r)
              }

              await Promise.all(toFetch.map(async (r) => {
                try {
                  const res = await axios.post(url, { jsonrpc: '2.0', id: '1', method: 'getAsset', params: { id: r.mint } }, { validateStatus: () => true, timeout: 15000 })
                  if (res.status >= 200 && res.status < 300) {
                    const content = res.data?.result?.content
                    const metaName: string | undefined = content?.metadata?.name
                    const metaSymbol: string | undefined = content?.metadata?.symbol
                    if (metaName || metaSymbol) {
                      r.name = metaName || metaSymbol || r.name
                      r.symbol = metaSymbol || metaName || r.symbol
                      mintMetaCache.set(r.mint, { name: metaName, symbol: metaSymbol, expiresAt: now + MINT_META_TTL_MS })
                    }
                  }
                } catch {}
              }))
            }
          }
          return Response.json(rows)
        } catch (err: any) {
          // Preserve explicit Response to keep status codes like 401
          if (err instanceof Response) throw err
          console.error('GET /api/assets error', {
            path: reqUrl.pathname,
            message: err?.message || String(err),
            stack: err?.stack,
            axiosStatus: err?.response?.status,
            axiosData: err?.response?.data,
          })
          return new Response('Internal Server Error', { status: 500 })
        }
      },
    },
  },
})

