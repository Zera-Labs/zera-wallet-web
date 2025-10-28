import { createFileRoute } from '@tanstack/react-router'
import { verifyRequestAndGetUser, getFirstSolanaAddressFromPrivyUser, getSolanaWalletPrivyId } from '@/lib/privy.server'
import { getWalletTransactions } from '@/lib/privy.rest'
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
        // Basic authorization: ensure the requested walletId belongs to the authenticated user
        const owner = getFirstSolanaAddressFromPrivyUser(user)
        if (!owner || owner !== params.walletId) {
          return new Response('Forbidden', { status: 403 })
        }
        console.log('user', user)
        console.log('params', params)
        const walletPrivyId = getSolanaWalletPrivyId(user, params.walletId)
        if (walletPrivyId) {
          const data = await getWalletTransactions(walletPrivyId)
          return Response.json(data)
        }
        // Fallback: if Privy wallet id is null, fetch basic txs by address from Solana RPC
        const data = await getTransactionsForAddress(params.walletId)
        return Response.json(data)
      },
    },
  },
})

