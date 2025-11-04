import * as React from 'react'
import { PrivyProvider, usePrivy } from '@privy-io/react-auth'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit'

type Props = { children: React.ReactNode }

export default function ClientPrivyProvider({ children }: Props) {
  const { VITE_PRIVY_APP_ID, VITE_PRIVY_CLIENT_ID } = import.meta.env as Record<string, string | undefined>
  const appId = VITE_PRIVY_APP_ID ?? ''
  const clientId = VITE_PRIVY_CLIENT_ID ?? ''

  // Restrict to Phantom (use built-in connectors config; runtime filter removed to satisfy types)
  const connectors = toSolanaWalletConnectors()

  const solanaRpcs = {
    'solana:mainnet': {
      rpc: createSolanaRpc('https://api.mainnet-beta.solana.com'),
      rpcSubscriptions: createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com'),
    },
    'solana:devnet': {
      rpc: createSolanaRpc('https://api.devnet.solana.com'),
      rpcSubscriptions: createSolanaRpcSubscriptions('wss://api.devnet.solana.com'),
    },
  }

  return (
    <PrivyProvider
      appId={appId}
      {...(clientId ? { clientId } as const : {})}
      config={{
        appearance: {
          walletChainType: 'solana-only',
          showWalletLoginFirst: true,
          walletList: [
            'phantom',
            'solflare',
            'backpack',
            'metamask',
          ],
        },
        loginMethods: ['wallet'],
        solana: { rpcs: solanaRpcs },
        externalWallets: { solana: { connectors } },
      }}
    >
      <SessionGuard>
        {children}
      </SessionGuard>
    </PrivyProvider>
  )
}
function SessionGuard({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, logout, getAccessToken } = usePrivy() as any
  const navigate = useNavigate()
  const { location } = useRouterState()
  const isLogin = location.pathname === '/login'
  const hasCheckedRef = React.useRef(false)
  const handlingRef = React.useRef(false)

  React.useEffect(() => {
    if (!ready || isLogin) return
    if (hasCheckedRef.current) return
    hasCheckedRef.current = true
    let cancelled = false
    const check = async () => {
      try {
        const headerToken = (await getAccessToken?.()) || undefined
        const res = await fetch('/api/me', {
          credentials: 'include',
          cache: 'no-store',
          headers: headerToken ? { Authorization: `Bearer ${headerToken}` } : undefined,
        })
        if (!cancelled && !handlingRef.current && (res.status === 401 || res.status === 403)) {
          handlingRef.current = true
          try {
            if (authenticated) {
              await logout()
            }
          } finally {
            navigate({ to: '/login' })
          }
        }
      } catch {
        // Ignore network errors; gate will catch on navigation
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [ready, isLogin, authenticated, logout, navigate])

  return <>{children}</>
}



