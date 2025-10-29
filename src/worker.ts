import start from '@tanstack/react-start/server-entry'

function buildContentSecurityPolicy(isLocal: boolean): string {
  const privyAuth = 'https://auth.privy.io'
  const walletConnectVerify = 'https://verify.walletconnect.com'
  const walletConnectVerifyOrg = 'https://verify.walletconnect.org'
  const cloudflareTurnstile = 'https://challenges.cloudflare.com'

  const connectSrcParts = [
    "'self'",
    privyAuth,
    'wss://relay.walletconnect.com',
    'wss://relay.walletconnect.org',
    'wss://www.walletlink.org',
    'https://*.rpc.privy.systems',
    'https://explorer-api.walletconnect.com',
    'wss://price.zeralabs.org',
    // App-specific backends that may be contacted from the client
    'https://api.helius.xyz',
    'https://mainnet.helius-rpc.com',
  ]
  if (isLocal) {
    connectSrcParts.push('http://localhost:*', 'ws://localhost:*', 'http://127.0.0.1:*', 'ws://127.0.0.1:*')
  }
  const connectSrc = connectSrcParts.join(' ')

  const childSrc = [privyAuth, walletConnectVerify, walletConnectVerifyOrg].join(' ')
  const frameSrc = [privyAuth, walletConnectVerify, walletConnectVerifyOrg, cloudflareTurnstile].join(' ')

  // Allow remote https images due to dynamic token/NFT images
  const imgSrc = "'self' data: blob: https:"

  const scriptSrcParts = ["'self'", cloudflareTurnstile]
  if (isLocal) {
    // Loosen for local dev to allow inline scripts (e.g., framework injections) and eval
    scriptSrcParts.push("'unsafe-inline'", "'unsafe-eval'")
  }

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrcParts.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc}`,
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    `child-src ${childSrc}`,
    `frame-src ${frameSrc}`,
    `connect-src ${connectSrc}`,
    "worker-src 'self'",
    "manifest-src 'self'",
  ].join('; ')

  return csp
}

function withSecurityHeaders(resp: Response, isLocal: boolean): Response {
  const headers = new Headers(resp.headers)
  const csp = buildContentSecurityPolicy(isLocal)

  // In local dev, use report-only to avoid breaking flows; enforce in production
  if (isLocal) {
    headers.set('Content-Security-Policy-Report-Only', csp)
    headers.delete('Content-Security-Policy')
  } else {
    headers.set('Content-Security-Policy', csp)
    headers.set('Content-Security-Policy-Report-Only', csp)
  }

  // Additional hardening headers
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()')
  headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  if (!isLocal) {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers,
  })
}

const entry: any = start as any

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const inner: Response =
      typeof entry === 'function' ? await entry(request, env, ctx) : await entry.fetch(request, env, ctx)

    // Skip header injection for websocket upgrades
    const upgrade = inner.headers.get('Upgrade') || ''
    if (upgrade.toLowerCase() === 'websocket') return inner

    const { hostname } = new URL(request.url)
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
    return withSecurityHeaders(inner, isLocal)
  },
}


