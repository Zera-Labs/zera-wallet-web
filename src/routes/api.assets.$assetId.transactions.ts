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
        const WRAPPED_SOL_MINT = 'so11111111111111111111111111111111111111112'
        const SYNTH_SOL_MINT = 'sol11111111111111111111111111111111111111112'
        const solMints = new Set<string>([
          WRAPPED_SOL_MINT,
          SYNTH_SOL_MINT,
        ])
        const isSolLike = assetId === 'sol' || solMints.has(assetId)
        const filtered: SolanaTransactionsResponse = {
          ...data,
          transactions: (data.transactions ?? []).filter((t: SolanaTransactionsResponse['transactions'][number]) => {
            const asset = String(t?.details?.asset || '').toLowerCase()
            const mint = String(t?.details?.mint || '').toLowerCase()
            if (isSolLike) {
              // Combine native SOL and wrapped SOL transfers
              return asset === 'sol' || asset === WRAPPED_SOL_MINT || mint === WRAPPED_SOL_MINT
            }
            return asset === assetId
          }),
        }
        return Response.json(filtered)
      },
    },
  },
})


