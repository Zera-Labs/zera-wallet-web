import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import WalletLayout from '../components/WalletLayout'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

import * as React from 'react'
const LazyPrivyProvider = React.lazy(() => import('@/components/PrivyProvider.client'))

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  // Auth gating handled by Client PrivyProvider SessionGuard and route-level logic
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Zera Wallet',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { location } = useRouterState()
  const isLogin = location.pathname === '/login'
  // Generate a per-request nonce during SSR so worker can include it in CSP
  const nonce = typeof window === 'undefined'
    ? (() => {
        const bytes = new Uint8Array(16)
        crypto.getRandomValues(bytes)
        let str = ''
        for (const b of bytes) str += String.fromCharCode(b)
        return typeof btoa === 'function' ? btoa(str) : Array.from(bytes).map((x) => x.toString(16).padStart(2, '0')).join('')
      })()
    : undefined
  const content = isLogin ? children : (
    <WalletLayout>
      {children}
    </WalletLayout>
  )

  const app = (
    <html lang="en">
    <head>
      <HeadContent />
      {nonce ? <meta name="csp-nonce" content={nonce} /> : null}
    </head>
    <body>
      <React.Suspense fallback={content}>
        <LazyPrivyProvider>{content}</LazyPrivyProvider>
      </React.Suspense>
      {import.meta.env.DEV ? (
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
      ) : null}
      <Scripts {...({ nonce } as any)} />
    </body>
  </html>
  )

  return app
}

function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="text-center">
        <h1 className="font-pp-machina text-3xl">Not Found</h1>
        <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist.</p>
      </div>
    </div>
  )
}
