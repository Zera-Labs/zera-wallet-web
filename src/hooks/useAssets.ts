import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { usePrivy } from '@privy-io/react-auth'

export const AssetRowDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  chain: z.string(),
  mint: z.string(),
  price: z.number(),
  amount: z.number(),
  value: z.number(),
  pnl: z.number(),
  avgCostUsd: z.number().optional(),
})

export type AssetRowData = z.infer<typeof AssetRowDataSchema>

const AssetsResponseSchema = z.array(AssetRowDataSchema)

async function fetchAssetsWithAuth(
  getAccessToken?: () => Promise<string | undefined>,
): Promise<AssetRowData[]> {
  const token = (await getAccessToken?.()) || undefined
  const url = '/api/assets'
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!res.ok) throw new Error('Failed to load assets')
  const json = await res.json()
  const parsed = AssetsResponseSchema.parse(json)
  return parsed
}

export function useAssets(options?: Omit<UseQueryOptions<AssetRowData[], Error>, 'queryKey' | 'queryFn'>) {
  const { getAccessToken, ready, authenticated } = usePrivy()
  return useQuery<AssetRowData[], Error>({
    queryKey: ['assets'],
    queryFn: () => fetchAssetsWithAuth(async () => (await getAccessToken()) ?? undefined),
    enabled: !!ready && !!authenticated,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    ...options,
  })
}


