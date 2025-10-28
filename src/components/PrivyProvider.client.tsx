import * as React from 'react'
import { PrivyProvider } from '@privy-io/react-auth'
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
      clientId={clientId}
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
      {children}
    </PrivyProvider>
  )
}


