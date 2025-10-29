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

function getCookie(name: string, cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined
  const parts = cookieHeader.split(';')
  for (const raw of parts) {
    const part = raw.trim()
    const idx = part.indexOf('=')
    if (idx <= 0) continue
    const k = part.slice(0, idx).trim()
    const v = part.slice(idx + 1)
    if (k === name) return decodeURIComponent(v)
  }
  return undefined
}

export async function verifyRequestAndGetUser(request: Request) {
  const privy = getPrivyClient()
  const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie')
  const idToken = getCookie('privy-id-token', cookieHeader) || getCookie('privy_id_token', cookieHeader)
  if (idToken) {
    try {
      return await privy.getUser({ idToken })
    } catch {
      // fall through to header token check
    }
  }

  // Fallback: support Authorization Bearer access token from client
  const auth = request.headers.get('authorization') || request.headers.get('Authorization')
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length)
    try {
      // Prefer idToken path if a client supplies an id token via header
      return await privy.getUser({ idToken: token })
    } catch {}
    try {
      const { userId } = await privy.verifyAuthToken(token)
      return await privy.getUserById(userId)
    } catch {}
  }

  throw new Response('Unauthorized in privy.server.ts', { status: 401 })
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


