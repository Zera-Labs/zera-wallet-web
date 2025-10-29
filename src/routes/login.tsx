import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { ready, authenticated, login } = usePrivy()
  const navigate = useNavigate()
  // no-op: cookie presence no longer required for redirect
  console.log('ready: ', ready)
  console.log('authenticated: ', authenticated)

  React.useEffect(() => {
    if (ready && authenticated) {
      navigate({ to: '/' })
    }
  }, [ready, authenticated, navigate])

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-foreground/60">Continue to your Zera Wallet</p>
        </div>
        <Button disabled={!ready} onClick={() => login()} className="w-full h-11 rounded-[12px]">
          Continue with Wallet
        </Button>
      </div>
    </div>
  )
}

