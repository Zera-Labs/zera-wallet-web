import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'

const NamesResponseSchema = z.array(z.string())
export type DemoName = z.infer<typeof NamesResponseSchema>[number]

async function fetchNames(): Promise<string[]> {
  const res = await fetch('/demo/api/names')
  if (!res.ok) throw new Error('Failed to load names')
  const json = await res.json()
  return NamesResponseSchema.parse(json)
}

export function useDemoNames(options?: Omit<UseQueryOptions<string[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<string[], Error>({
    queryKey: ['names'],
    queryFn: fetchNames,
    ...options,
  })
}


