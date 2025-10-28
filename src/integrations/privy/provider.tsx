import * as React from 'react'

type Props = { children: React.ReactNode }

export function PrivyProviderIfClient({ children }: Props) {
  const isClient = typeof window !== 'undefined'
  const [PrivyProvider, setPrivyProvider] = React.useState<React.ComponentType<any> | null>(null)
  const [solanaConnectors, setSolanaConnectors] = React.useState<any | null>(null)

  const envAppId = (import.meta as any).env?.VITE_PRIVY_APP_ID as string | undefined
  const envClientId = (import.meta as any).env?.VITE_PRIVY_CLIENT_ID as string | undefined
  // Some setups only provide one value; treat client ID as app ID fallback to avoid no-modal state
  const appId = envAppId || envClientId
  // Using Privy defaults for Solana RPC to avoid misconfiguration issues

  if (!appId) {
    // Render children without Privy if no appId is configured to avoid runtime errors in dev
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[Privy] VITE_PRIVY_APP_ID is not set. Privy auth disabled.')
    }
    return <>{children}</>
  }

  React.useEffect(() => {
    if (!isClient) return
    let mounted = true
    ;(async () => {
      try {
        const mod = await import('@privy-io/react-auth')
        if (mounted) setPrivyProvider(() => mod.PrivyProvider)
        // Try to load Solana wallet connectors (Phantom, Backpack)
        try {
          const sol = await import('@privy-io/react-auth/solana')
          if (sol && (sol as any).toSolanaWalletConnectors) {
            const created = (sol as any).toSolanaWalletConnectors()
            if (mounted) setSolanaConnectors(created)
          }
        } catch {}
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.error('[Privy] Failed to load PrivyProvider', err)
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [isClient])

  // Build Solana RPCs mapping (prefer Helius; fallback to public RPC)
  // Intentionally not overriding Solana RPCs here; rely on Privy defaults to avoid HTTP errors

  if (!isClient || !PrivyProvider) return <>{children}</>

  // Force provider remount once solana connectors load so Privy re-initializes with them
  const providerKey = solanaConnectors ? 'privy-solana-ready' : 'privy-solana-loading'

  return (
    <PrivyProvider
      key={providerKey}
      appId={appId}
      config={{
        loginMethods: ['wallet'],
        appearance: {
          theme: 'dark',
          walletChainType: 'solana-only',
          showWalletLoginFirst: true,
          walletList: ['Phantom', 'Backpack'],
        },
        ...(solanaConnectors ? { externalWallets: { solana: { connectors: solanaConnectors } } } : {}),
      } as any}
    >
      {children}
    </PrivyProvider>
  )
}


