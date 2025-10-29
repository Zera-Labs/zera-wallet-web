import { createFileRoute } from '@tanstack/react-router'
import { verifyRequestAndGetUser, getFirstSolanaAddressFromPrivyUser } from '@/lib/privy.server'
import { getTransactionsForAddress } from '@/lib/solana.transactions'
import { SolanaTransactionsResponse } from '@/lib/solana.transactions'

export const Route = createFileRoute('/api/assets/$assetId/transactions')({
  params: {
    parse: (p: Record<string, string>) => ({ assetId: p.assetId }),
    stringify: ({ assetId }: { assetId: string }) => ({ assetId }),
  },
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const user = await verifyRequestAndGetUser(request)
        const owner = getFirstSolanaAddressFromPrivyUser(user)
        if (!owner) return Response.json([])
        // Fetch wallet transactions directly from Solana RPC and filter by asset symbol
        const data: SolanaTransactionsResponse = await getTransactionsForAddress(owner)
        const assetId = params.assetId.toLowerCase()
        const solMints = new Set<string>([
          'so11111111111111111111111111111111111111112'.toLowerCase(),
          'sol11111111111111111111111111111111111111112'.toLowerCase(),
        ])
        const isSolLike = assetId === 'sol' || solMints.has(assetId)
        const filtered: SolanaTransactionsResponse = {
          ...data,
          transactions: (data.transactions ?? []).filter((t: SolanaTransactionsResponse['transactions'][number]) => {
            const asset = String(t?.details?.asset || '').toLowerCase()
            return isSolLike ? asset === 'sol' : asset === assetId
          }),
        }
        return Response.json(filtered)
      },
    },
  },
})


