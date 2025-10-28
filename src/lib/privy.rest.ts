const PRIVY_API_BASE = 'https://api.privy.io/v1'

function getBasicAuthHeader(): string {
  const appId = process.env.PRIVY_APP_ID as string | undefined
  const appSecret = process.env.PRIVY_APP_SECRET as string | undefined
  if (!appId || !appSecret) throw new Error('Missing PRIVY_APP_ID/PRIVY_APP_SECRET env vars')
  const creds = Buffer.from(`${appId}:${appSecret}`).toString('base64')
  return `Basic ${creds}`
}

async function privyRequest(path: string, init?: { params?: Record<string, string | string[] | undefined> }) {
  const url = new URL(`${PRIVY_API_BASE}${path}`)
  const params = init?.params ?? {}
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const v of value) if (v != null) url.searchParams.append(key, v)
    } else if (value != null) {
      url.searchParams.set(key, String(value))
    }
  }

  const headers = {
    Authorization: getBasicAuthHeader(),
    'privy-app-id': process.env.PRIVY_APP_ID as string,
    'Content-Type': 'application/json',
  }

  try {
    const res = await fetch(url.toString(), { headers })
    if (!res.ok) {
      const contentType = res.headers.get('content-type') || ''
      let body: unknown
      try {
        body = contentType.includes('application/json') ? await res.json() : await res.text()
      } catch {
        body = '<unreadable>'
      }
      console.error('Privy request failed', {
        url: url.toString(),
        status: res.status,
        statusText: res.statusText,
        body,
      })
      throw new Error(`Privy error ${res.status} ${res.statusText}: ${typeof body === 'string' ? body : JSON.stringify(body)}`)
    }
    const json = await res.json()
    return json
  } catch (err: any) {
    console.error('Privy fetch threw', { url: url.toString(), message: err?.message })
    throw err
  }
}

export async function getWalletTransactions(walletId: string) {
  return await privyRequest(`/wallets/${encodeURIComponent(walletId)}/transactions`)
}

export async function getWalletBalance(
  walletId: string,
  params?: {
    chain?: Array<'ethereum' | 'arbitrum' | 'base' | 'linea' | 'optimism' | 'polygon' | 'solana' | 'zksync_era' | 'sepolia' | 'arbitrum_sepolia' | 'base_sepolia' | 'linea_testnet' | 'optimism_sepolia' | 'polygon_amoy'>
    asset?: Array<'usdc' | 'eth' | 'pol' | 'usdt' | 'sol'>
    include_currency?: 'usd'
  },
) {
  return await privyRequest(`/wallets/${encodeURIComponent(walletId)}/balance`, {
    params: {
      ...(params?.chain ? { chain: params.chain } : {}),
      ...(params?.asset ? { asset: params.asset } : {}),
      ...(params?.include_currency ? { include_currency: params.include_currency } : {}),
    },
  })
}

export async function getWallets(params?: { user_id?: string; chain?: string[] }) {
  const paramsOut: Record<string, string> = {}
  if (params?.user_id) paramsOut['user_id'] = params.user_id
  try {
    const json = await privyRequest('/wallets', { params: paramsOut })
    return json
  } catch (err: any) {
    console.error('getWallets error', err?.message)
    throw err
  }
}


