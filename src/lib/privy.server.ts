import { PrivyClient } from '@privy-io/server-auth'
import { getWallets } from '@/lib/privy.rest'

let client: PrivyClient | undefined

export function getPrivyClient() {
  if (!client) {
    const appId = process.env.PRIVY_APP_ID as string | undefined
    const appSecret = process.env.PRIVY_APP_SECRET as string | undefined
    if (!appId || !appSecret) {
      throw new Error('Missing PRIVY_APP_ID/PRIVY_APP_SECRET env vars')
    }
    client = new PrivyClient(appId, appSecret)
  }
  return client
}

export async function verifyRequestAndGetUser(request: Request) {
  const auth = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    throw new Response('Unauthorized', { status: 401 })
  }
  const token = auth.slice('Bearer '.length)
  const privy = getPrivyClient()
  const { userId } = await privy.verifyAuthToken(token)
  const user = await privy.getUser(userId)
  return user
}

export function getFirstSolanaAddressFromPrivyUser(user: any): string | undefined {
  // Prefer new shape
  const wallets: any[] | undefined = (user as any).wallets
  if (Array.isArray(wallets)) {
    const sol = wallets.find((w) => w?.chainType === 'solana' || w?.chain === 'solana')
    if (sol?.address) return sol.address as string
  }
  // Fallback older shape
  const linked: any[] | undefined = (user as any).linkedAccounts
  if (Array.isArray(linked)) {
    const sol = linked.find((a) => a?.type === 'wallet' && (a?.chainType === 'solana' || a?.chain === 'solana'))
    if (sol?.address) return sol.address as string
  }
  return undefined
}

export function getSolanaWallets(user: any): Array<{ id?: string; address?: string }> {
  const out: Array<{ id?: string; address?: string }> = []
  const wallets: any[] | undefined = (user as any).wallets
  if (Array.isArray(wallets)) {
    for (const w of wallets) {
      if (w && (w.chainType === 'solana' || w.chain === 'solana')) {
        out.push({ id: w.id as string | undefined, address: w.address as string | undefined })
      }
    }
  }
  const linked: any[] | undefined = (user as any).linkedAccounts
  if (Array.isArray(linked)) {
    for (const a of linked) {
      if (a && a.type === 'wallet' && (a.chainType === 'solana' || a.chain === 'solana')) {
        out.push({ id: a.id as string | undefined, address: a.address as string | undefined })
      }
    }
  }
  return out
}

export function getSolanaWalletPrivyId(user: any, walletIdOrAddress: string): string | undefined {
  const wallets = getSolanaWallets(user)
  // Try by address match first
  const byAddr = wallets.find((w) => w.address === walletIdOrAddress)
  if (byAddr?.id) return byAddr.id
  // Then try direct id match
  const byId = wallets.find((w) => w.id === walletIdOrAddress)
  if (byId?.id) return byId.id
  return undefined
}

export function getFirstSolanaWalletPrivyId(user: any): string | undefined {
  const wallets = getSolanaWallets(user)
  const firstWithId = wallets.find((w) => !!w.id)
  return firstWithId?.id
}

export async function fetchFirstSolanaWalletPrivyIdFromApi(user: any): Promise<string | undefined> {
  try {
    const userId = (user && (user.id || user.userId || user.user_id)) as string | undefined
    if (!userId) return undefined
    // List wallets by user_id (no chain filter)
    const data = await getWallets({ user_id: userId })
    const list: Array<any> = Array.isArray((data as any)?.wallets)
      ? (data as any).wallets
      : Array.isArray(data)
        ? (data as any)
        : []
    const first = list.find((w) => (
      typeof w?.chainType === 'string' && w.chainType.toLowerCase() === 'solana'
    ) || (
      typeof w?.chain === 'string' && w.chain.toLowerCase().includes('sol')
    ))
    return (first?.id as string | undefined) ?? undefined
  } catch {
    return undefined
  }
}


