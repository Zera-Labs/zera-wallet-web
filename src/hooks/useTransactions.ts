import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'

const TransactionDetailsSchema = z.object({
  type: z.enum(['transfer_sent', 'transfer_received']),
  chain: z.string(),
  asset: z.string(),
  sender: z.string(),
  sender_privy_user_id: z.string().optional(),
  recipient: z.string(),
  recipient_privy_user_id: z.string().optional(),
  raw_value: z.string(),
  raw_value_decimals: z.number(),
  display_values: z.record(z.string(), z.string()),
})

const TransactionSchema = z.object({
  caip2: z.string(),
  transaction_hash: z.string(),
  status: z.enum([
    'broadcasted',
    'confirmed',
    'execution_reverted',
    'failed',
    'replaced',
    'finalized',
    'provider_error',
    'pending',
  ]),
  created_at: z.number(),
  privy_transaction_id: z.string(),
  wallet_id: z.string(),
  details: TransactionDetailsSchema,
})

const TransactionsResponseSchema = z.object({
  transactions: z.array(TransactionSchema),
  next_cursor: z.string().nullable(),
})

export type Transaction = z.infer<typeof TransactionSchema>
export type TransactionsResponse = z.infer<typeof TransactionsResponseSchema>

async function fetchTransactions(walletId: string): Promise<TransactionsResponse> {
  const res = await fetch(`/api/wallets/${encodeURIComponent(walletId)}/transactions`)
  if (!res.ok) throw new Error('Failed to load transactions')
  const json = await res.json()
  return TransactionsResponseSchema.parse(json)
}

export function useTransactions(
  walletId: string,
  options?: Omit<UseQueryOptions<TransactionsResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<TransactionsResponse, Error>({
    queryKey: ['transactions', walletId],
    queryFn: () => fetchTransactions(walletId),
    enabled: !!walletId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    ...options,
  })
}


