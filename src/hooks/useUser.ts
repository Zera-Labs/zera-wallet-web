import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { usePrivy } from '@privy-io/react-auth'

// Schema for the subset of the Privy user object we care about on the client
export const LinkedWalletSchema = z.object({
  type: z.literal('wallet'),
  id: z.string().nullable(),
  address: z.string(),
  chainType: z.enum(['solana', 'ethereum']),
  walletClientType: z.string(),
  connectorType: z.string(),
  recoveryMethod: z.string().optional(),
  imported: z.boolean().optional(),
  delegated: z.boolean().optional(),
  walletIndex: z.number().nullable().optional(),
})

export const PrivyUserSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  linkedAccounts: z.array(LinkedWalletSchema.or(z.any())),
}).passthrough()

export type PrivyUser = z.infer<typeof PrivyUserSchema>

async function fetchUser(getAccessToken?: () => Promise<string | undefined>): Promise<PrivyUser> {
  const token = (await getAccessToken?.()) || undefined
  const res = await fetch('/api/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!res.ok) throw new Error('Failed to load user')
  return PrivyUserSchema.parse(await res.json())
}

export function useUser(options?: Omit<UseQueryOptions<PrivyUser, Error>, 'queryKey' | 'queryFn'>) {
  const { getAccessToken } = usePrivy()
  return useQuery<PrivyUser, Error>({
    queryKey: ['user'],
    queryFn: () => fetchUser(getAccessToken as any),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    ...options,
  })
}


