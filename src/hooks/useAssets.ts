import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'

export const AssetRowDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  chain: z.string(),
  price: z.number(),
  amount: z.number(),
  value: z.number(),
  pnl: z.number(),
  avgCostUsd: z.number().optional(),
})

export type AssetRowData = z.infer<typeof AssetRowDataSchema>

const AssetsResponseSchema = z.array(AssetRowDataSchema)

async function fetchAssets(): Promise<AssetRowData[]> {
  const res = await fetch('/api/assets')
  if (!res.ok) throw new Error('Failed to load assets')
  const json = await res.json()
  const parsed = AssetsResponseSchema.parse(json)
  return parsed
}

export function useAssets(options?: Omit<UseQueryOptions<AssetRowData[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<AssetRowData[], Error>({
    queryKey: ['assets'],
    queryFn: fetchAssets,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    ...options,
  })
}


