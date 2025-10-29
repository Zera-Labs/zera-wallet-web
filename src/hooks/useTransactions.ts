import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { usePrivy } from '@privy-io/react-auth'

const TransactionDetailsSchema = z.object({
  type: z.enum(['transfer_sent', 'transfer_received']),
  chain: z.string(),
  asset: z.string(),
  mint: z.string().optional(),
  sender: z.string(),
  sender_privy_user_id: z.string().optional(),
  recipient: z.string(),
  recipient_privy_user_id: z.string().optional(),
  raw_value: z.string(),
  raw_value_decimals: z.number(),
  display_values: z.record(z.string(), z.string()),
})

const TransactionSchema = z.object({
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
  transaction_id: z.string(),
  details: TransactionDetailsSchema,
})

const TransactionsResponseSchema = z.object({
  transactions: z.array(TransactionSchema),
  next_cursor: z.string().nullable(),
})

export type Transaction = z.infer<typeof TransactionSchema>
export type TransactionsResponse = z.infer<typeof TransactionsResponseSchema>

async function fetchTransactions(walletId: string, getAccessToken?: () => Promise<string | undefined>): Promise<TransactionsResponse> {
  const token = (await getAccessToken?.()) || undefined
  const res = await fetch(`/api/wallets/${encodeURIComponent(walletId)}/transactions`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!res.ok) throw new Error('Failed to load transactions')
  const json = await res.json()
  return TransactionsResponseSchema.parse(json)
}

async function fetchAssetTransactions(assetId: string, getAccessToken?: () => Promise<string | undefined>): Promise<TransactionsResponse> {
  const token = (await getAccessToken?.()) || undefined
  const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}/transactions`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!res.ok) throw new Error('Failed to load asset transactions')
  const json = await res.json()
  return TransactionsResponseSchema.parse(json)
}

export function useTransactions(
  walletId: string,
  options?: Omit<UseQueryOptions<TransactionsResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const { getAccessToken } = usePrivy()
  return useQuery<TransactionsResponse, Error>({
    queryKey: ['transactions', walletId],
    queryFn: () => fetchTransactions(walletId, getAccessToken as any),
    enabled: !!walletId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function useAssetTransactions(
  assetId: string,
  options?: Omit<UseQueryOptions<TransactionsResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const { getAccessToken } = usePrivy()
  return useQuery<TransactionsResponse, Error>({
    queryKey: ['assetTransactions', assetId],
    queryFn: () => fetchAssetTransactions(assetId, getAccessToken as any),
    enabled: !!assetId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    ...options,
  })
}


