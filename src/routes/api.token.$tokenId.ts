import { createFileRoute } from '@tanstack/react-router'
import { getHoldingByMint } from '@/lib/portfolio.service'
import { verifyRequestAndGetUser, getFirstSolanaAddressFromPrivyUser } from '@/lib/privy.server'
import { TokenMeta } from '@/hooks/useToken'

const tokenDirectory: Record<string, TokenMeta> = {}

export const Route = createFileRoute('/api/token/$tokenId')({
  params: {
    parse: (p: Record<string, string>) => ({ tokenId: p.tokenId }),
    stringify: ({ tokenId }: { tokenId: string }) => ({ tokenId }),
  },
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const user = await verifyRequestAndGetUser(request)
        const owner = getFirstSolanaAddressFromPrivyUser(user)
        const mint = params.tokenId
        if (owner) {
          const holding = await getHoldingByMint(owner, mint)
          if (holding) {
            const meta: TokenMeta = {
              id: mint,
              name: holding.name,
              mint: holding.mint,
              symbol: holding.symbol,
              chain: 'SOL',
              price: holding.priceUsd,
              pnl: holding.unrealizedPnlUsd ?? 0,
              // include avgCostUsd for client-side percent pnl computation
              avgCostUsd: holding.avgCostUsd,
            }
            return Response.json(meta)
          }
        }
        const fallback = tokenDirectory[mint] ?? {
          id: mint,
          name: mint.toUpperCase(),
          mint: mint,
          symbol: mint.slice(0, 4).toUpperCase(),
          chain: 'SOL',
          price: 1,
          pnl: 0,
        }
        return Response.json(fallback)
      },
    },
  },
})


