import { createFileRoute } from '@tanstack/react-router'
import { verifyRequestAndGetUser, getFirstSolanaAddressFromPrivyUser } from '@/lib/privy.server'
import { getTransactionsForAddress } from '@/lib/solana.transactions'

export const Route = createFileRoute('/api/wallets/$walletId/transactions')({
  params: {
    parse: (p: Record<string, string>) => ({ walletId: p.walletId }),
    stringify: ({ walletId }: { walletId: string }) => ({ walletId }),
  },
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const user = await verifyRequestAndGetUser(request)
        const owner = getFirstSolanaAddressFromPrivyUser(user)
        if (!owner || owner !== params.walletId) {
          return new Response('Forbidden', { status: 403 })
        }
        const data = await getTransactionsForAddress(params.walletId, 40, { fetchAll: true, maxPages: 100, dropZero: false })
        return Response.json(data)
      },
    },
  },
})

