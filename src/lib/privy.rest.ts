const PRIVY_API_BASE = 'https://api.privy.io/v1'

function getBasicAuthHeader(): string {
  const appId = process.env.PRIVY_APP_ID as string | undefined
  const appSecret = process.env.PRIVY_APP_SECRET as string | undefined
  if (!appId || !appSecret) throw new Error('Missing PRIVY_APP_ID/PRIVY_APP_SECRET env vars')
  const creds = Buffer.from(`${appId}:${appSecret}`).toString('base64')
  return `Basic ${creds}`
}

export async function getWalletTransactions(walletId: string) {
  const res = await fetch(`${PRIVY_API_BASE}/wallets/${encodeURIComponent(walletId)}/transactions`, {
    headers: {
      Authorization: getBasicAuthHeader(),
      'privy-app-id': process.env.PRIVY_APP_ID as string,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Privy transactions error: ${res.status} ${text}`)
  }
  return await res.json()
}


