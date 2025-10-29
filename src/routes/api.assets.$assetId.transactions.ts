import { createFileRoute } from '@tanstack/react-router'
import { verifyRequestAndGetUser, getFirstSolanaAddressFromPrivyUser } from '@/lib/privy.server'
import { getTransactionsForAddress } from '@/lib/solana.transactions'

// Removed unused dummy transaction generator

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
        const data: any = await getTransactionsForAddress(owner)
        const sym = params.assetId.toLowerCase()
        const filtered = {
          ...data,
          transactions: (data.transactions ?? []).filter((t: any) => String(t?.details?.asset || '').toLowerCase() === sym),
        }
        return Response.json(filtered)
      },
    },
  },
})


