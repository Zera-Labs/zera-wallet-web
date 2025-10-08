import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { mockPrivyUser } from '@/data/privy.mock'

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
})

export type PrivyUser = z.infer<typeof PrivyUserSchema>

async function fetchUser(): Promise<PrivyUser> {
  // For now, return the mock. Later, hit your real API.
  return PrivyUserSchema.parse(mockPrivyUser)
}

export function useUser(options?: Omit<UseQueryOptions<PrivyUser, Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<PrivyUser, Error>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    ...options,
  })
}


