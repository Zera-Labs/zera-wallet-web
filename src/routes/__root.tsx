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
  const app = (
    <html lang="en">
    <head>
      <HeadContent />
    </head>
    <body>
      {isLogin ? children : (
        <WalletLayout>
          {children}
        </WalletLayout>
      )}
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
      <Scripts />
    </body>
  </html>
  )

  if (typeof window === 'undefined') {
    return app
  }

  return (
    <React.Suspense fallback={app}>
      <LazyPrivyProvider>{app}</LazyPrivyProvider>
    </React.Suspense>
  )
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
