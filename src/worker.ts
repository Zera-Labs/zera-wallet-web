import start from '@tanstack/react-start/server-entry'

function buildContentSecurityPolicy(isLocal: boolean, nonce?: string): string {
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
    'https://api.mainnet-beta.solana.com',
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
  } else if (nonce) {
    scriptSrcParts.push(`'nonce-${nonce}'`, "'strict-dynamic'")
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

function withSecurityHeaders(resp: Response, isLocal: boolean, nonce?: string): Response {
  const headers = new Headers(resp.headers)
  const csp = buildContentSecurityPolicy(isLocal, nonce)

  // In local dev, use report-only to avoid breaking flows; enforce in production
  if (isLocal) {
    headers.set('Content-Security-Policy-Report-Only', csp)
    headers.delete('Content-Security-Policy')
  } else {
    headers.set('Content-Security-Policy', csp)
    headers.delete('Content-Security-Policy-Report-Only')
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
    // Expose Worker env to server modules that read from process.env
    ;(globalThis as any).__ENV__ = env
    const inner: Response =
      typeof entry === 'function' ? await entry(request, env, ctx) : await entry.fetch(request, env, ctx)

    // Skip header injection for websocket upgrades
    const upgrade = inner.headers.get('Upgrade') || ''
    if (upgrade.toLowerCase() === 'websocket') return inner

    const url = new URL(request.url)
    const { hostname, pathname } = url
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'

    // Start with original headers and add caching/compression-related headers
    const headers = new Headers(inner.headers)

    // Help intermediate caches negotiate compressed variants
    headers.append('Vary', 'Accept-Encoding')

    // Long-term caching for versioned static assets
    const isStaticAsset =
      pathname.startsWith('/assets/') ||
      /\.(?:js|css|woff2|ttf|otf|svg|png|jpg|jpeg|webp|ico|json|map)$/i.test(pathname)

    if (isStaticAsset) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      const withCache = new Response(inner.body, {
        status: inner.status,
        statusText: inner.statusText,
        headers,
      })
      return withSecurityHeaders(withCache, isLocal)
    }

    // If this is an HTML response, try to extract a CSP nonce from a meta tag
    const contentType = inner.headers.get('Content-Type') || ''
    if (contentType.includes('text/html')) {
      const html = await inner.text()
      let nonce = (html.match(/<meta[^>]+name=["']csp-nonce["'][^>]*content=["']([^"']+)["']/i) || [])[1]
      if (!nonce) {
        const bytes = new Uint8Array(16)
        crypto.getRandomValues(bytes)
        let raw = ''
        for (const b of bytes) raw += String.fromCharCode(b)
        nonce = btoa(raw)
      }

      // Ensure meta tag exists and add nonce to all <script> tags lacking a nonce
      let updatedHtml = html
      if (!/<meta[^>]+name=["']csp-nonce["']/i.test(updatedHtml)) {
        updatedHtml = updatedHtml.replace(
          /<head(\b[^>]*)>/i,
          `<head$1><meta name="csp-nonce" content="${nonce}">`
        )
      }
      // Add nonce to any <script> without existing nonce
      updatedHtml = updatedHtml.replace(/<script(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`)

      const withCache = new Response(updatedHtml, {
        status: inner.status,
        statusText: inner.statusText,
        headers,
      })
      return withSecurityHeaders(withCache, isLocal, nonce)
    }

    const withCache = new Response(inner.body, {
      status: inner.status,
      statusText: inner.statusText,
      headers,
    })

    return withSecurityHeaders(withCache, isLocal)
  },
}


