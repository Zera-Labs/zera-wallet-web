import { createFileRoute } from '@tanstack/react-router'
import { buildMockTransactions } from '@/data/transactions.mock'

export const Route = createFileRoute('/api/wallets/$walletId/transactions')({
  params: {
    parse: (p: Record<string, string>) => ({ walletId: p.walletId }),
    stringify: ({ walletId }: { walletId: string }) => ({ walletId }),
  },
  server: {
    handlers: {
      GET: ({ params }) => {
        const data = buildMockTransactions(params.walletId)
        return Response.json(data)
      },
    },
  },
})

