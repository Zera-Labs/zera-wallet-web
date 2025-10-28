import { createFileRoute } from '@tanstack/react-router'
import { getHoldingBySymbol } from '@/lib/portfolio.service'
import { verifyRequestAndGetUser, getFirstSolanaAddressFromPrivyUser } from '@/lib/privy.server'

type TokenMeta = {
  id: string
  name: string
  symbol: string
  chain: string
  price: number
  pnl: number
}

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
        const symbol = params.tokenId
        if (owner) {
          const holding = await getHoldingBySymbol(owner, symbol)
          if (holding) {
            const meta: TokenMeta = {
              id: symbol,
              name: holding.name,
              symbol: holding.symbol,
              chain: 'SOL',
              price: holding.priceUsd,
              pnl: holding.unrealizedPnlUsd ?? 0,
              // include avgCostUsd for client-side percent pnl computation
              // @ts-expect-error augmenting TokenMeta server-side type to include optional avgCostUsd
              avgCostUsd: holding.avgCostUsd,
            }
            return Response.json(meta)
          }
        }
        const fallback = tokenDirectory[symbol] ?? {
          id: symbol,
          name: symbol.toUpperCase(),
          symbol: symbol.toUpperCase(),
          chain: 'SOL',
          price: 1,
          pnl: 0,
        }
        return Response.json(fallback)
      },
    },
  },
})


