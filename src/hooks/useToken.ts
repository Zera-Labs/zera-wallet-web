import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { usePrivy } from '@privy-io/react-auth'

export const TokenMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  chain: z.string(),
  price: z.number(),
  pnl: z.number(),
  avgCostUsd: z.number().optional(),
})

export type TokenMeta = z.infer<typeof TokenMetaSchema>

export const TxSchema = z.object({
  id: z.string(),
  fromSymbol: z.string(),
  toSymbol: z.string(),
  fromValue: z.number(),
  toValue: z.number(),
  at: z.string(),
})

export type Tx = z.infer<typeof TxSchema>

const TxsResponseSchema = z.array(TxSchema)

async function fetchTokenMeta(tokenId: string, getAccessToken?: () => Promise<string | undefined>): Promise<TokenMeta> {
  const token = (await getAccessToken?.()) || undefined
  const res = await fetch(`/api/token/${tokenId}` , { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  if (!res.ok) throw new Error('Failed to load token meta')
  const json = await res.json()
  return TokenMetaSchema.parse(json)
}

async function fetchTokenTxs(tokenId: string): Promise<Tx[]> {
  const res = await fetch(`/api/assets/${tokenId}/transactions`)
  if (!res.ok) throw new Error('Failed to load txs')
  const json = await res.json()
  return TxsResponseSchema.parse(json)
}

export function useTokenMeta(tokenId: string, options?: Omit<UseQueryOptions<TokenMeta, Error>, 'queryKey' | 'queryFn'>) {
  const { getAccessToken } = usePrivy()
  return useQuery<TokenMeta, Error>({
    queryKey: ['token', tokenId],
    queryFn: () => fetchTokenMeta(tokenId, getAccessToken as any),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function useTokenTxs(tokenId: string, options?: Omit<UseQueryOptions<Tx[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<Tx[], Error>({
    queryKey: ['tokenTxs', tokenId],
    queryFn: () => fetchTokenTxs(tokenId),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    ...options,
  })
}


