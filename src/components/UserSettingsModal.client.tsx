import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { usePrivy } from '@privy-io/react-auth'

function shorten(value: string, head = 6, tail = 4) {
  if (!value) return ''
  return value.length > head + tail ? `${value.slice(0, head)}…${value.slice(-tail)}` : value
}

function getFirstAddress(user: any, chain: 'solana' | 'ethereum'): string | undefined {
  if (!user) return undefined
  const wallets = (user as any).wallets as any[] | undefined
  if (Array.isArray(wallets)) {
    const w = wallets.find((x) => x?.chainType === chain || x?.chain === chain)
    if (w?.address) return w.address as string
  }
  const linked = (user as any).linkedAccounts as any[] | undefined
  if (Array.isArray(linked)) {
    const w = linked.find((x) => x?.type === 'wallet' && (x?.chainType === chain || x?.chain === chain))
    if (w?.address) return w.address as string
  }
  return undefined
}

export default function UserSettingsModal() {
  const { ready, authenticated, user } = usePrivy()
  const [open, setOpen] = React.useState(false)

  if (!(ready && authenticated) || !user) return null

  const solAddress = getFirstAddress(user, 'solana')
  const ethAddress = getFirstAddress(user, 'ethereum')

  function handleBuy() {
    const address = solAddress || ethAddress
    const maybeWin = typeof window !== 'undefined' ? (window as unknown as Record<string, any>) : undefined
    const maybePrivy: any = undefined
    // Try a few likely SDK entry points if available; otherwise, guide the developer.
    if (address && maybeWin?.PrivyOnramp?.open) {
      try {
        maybeWin.PrivyOnramp.open({ address, chain: solAddress ? 'solana' : 'ethereum' })
        return
      } catch {}
    }
    if (address && maybeWin?.Privy?.onramp?.open) {
      try {
        maybeWin.Privy.onramp.open({ address, chain: solAddress ? 'solana' : 'ethereum' })
        return
      } catch {}
    }
    if (address && (maybePrivy as any)?.onramp?.open) {
      try {
        ;(maybePrivy as any).onramp.open({ address, chain: solAddress ? 'solana' : 'ethereum' })
        return
      } catch {}
    }
    console.warn('Privy Onramp not detected. Ensure Privy Onramp is enabled and SDK is up to date.')
    alert('Onramp not configured. Please enable Privy Onramp or update the SDK.')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={'w-full h-11 rounded-[12px]'}>
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl rounded-2xl border border-sidebar-border bg-background p-6 shadow-xl">
        <DialogHeader className="flex flex-col items-start gap-2 px-0 py-0">
          <DialogTitle className="text-lg">User settings</DialogTitle>
          <DialogDescription className="text-sm">Inspect your Privy user and linked accounts.</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <section className="space-y-2">
            <div className="text-sm text-muted-foreground">User</div>
            <div className="rounded-md border border-sidebar-border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">DID</span>
                <span className="font-mono">{user.id}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div>{user.createdAt ? new Date(user.createdAt as any).toLocaleString() : '—'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Guest</div>
                  <div>{String((user as any).isGuest ?? false)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Accepted Terms</div>
                  <div>{String((user as any).hasAcceptedTerms ?? false)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">MFA Methods</div>
                  <div>{Array.isArray((user as any).mfaMethods) ? (user as any).mfaMethods.length : 0}</div>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-muted-foreground">Solana</div>
                  <div className="font-mono">{solAddress ? shorten(solAddress) : '—'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Ethereum</div>
                  <div className="font-mono">{ethAddress ? shorten(ethAddress) : '—'}</div>
                </div>
              </div>
              <div className="mt-3">
                <Button className="w-full h-10 rounded-[10px]" onClick={handleBuy}>
                  Buy with onramp
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="text-sm text-muted-foreground">Linked accounts</div>
            <div className="rounded-md border border-sidebar-border p-3 text-sm space-y-2">
              {Array.isArray((user as any).linkedAccounts) && (user as any).linkedAccounts.length > 0 ? (
                (user as any).linkedAccounts.map((acc: any, idx: number) => (
                  <div key={idx} className="rounded border border-sidebar-border p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{String(acc?.type ?? 'unknown')}</span>
                      {acc?.address ? <span className="font-mono">{shorten(acc.address)}</span> : null}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {acc?.chainType ? (
                        <div>
                          <div className="text-muted-foreground">Chain</div>
                          <div>{String(acc.chainType)}</div>
                        </div>
                      ) : null}
                      {acc?.walletClientType ? (
                        <div>
                          <div className="text-muted-foreground">Client</div>
                          <div>{String(acc.walletClientType)}</div>
                        </div>
                      ) : null}
                      {acc?.connectorType ? (
                        <div>
                          <div className="text-muted-foreground">Connector</div>
                          <div>{String(acc.connectorType)}</div>
                        </div>
                      ) : null}
                      {acc?.delegated !== undefined ? (
                        <div>
                          <div className="text-muted-foreground">Delegated</div>
                          <div>{String(acc.delegated)}</div>
                        </div>
                      ) : null}
                      {acc?.imported !== undefined ? (
                        <div>
                          <div className="text-muted-foreground">Imported</div>
                          <div>{String(acc.imported)}</div>
                        </div>
                      ) : null}
                      {acc?.walletIndex !== undefined && acc?.walletIndex !== null ? (
                        <div>
                          <div className="text-muted-foreground">Index</div>
                          <div>{String(acc.walletIndex)}</div>
                        </div>
                      ) : null}
                      {acc?.email ? (
                        <div className="col-span-2">
                          <div className="text-muted-foreground">Email</div>
                          <div className="font-mono">{String(acc.email)}</div>
                        </div>
                      ) : null}
                      {acc?.number ? (
                        <div className="col-span-2">
                          <div className="text-muted-foreground">Phone</div>
                          <div className="font-mono">{String(acc.number)}</div>
                        </div>
                      ) : null}
                      {acc?.username ? (
                        <div>
                          <div className="text-muted-foreground">Username</div>
                          <div>{String(acc.username)}</div>
                        </div>
                      ) : null}
                      {acc?.name ? (
                        <div>
                          <div className="text-muted-foreground">Name</div>
                          <div>{String(acc.name)}</div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground">No linked accounts.</div>
              )}
            </div>
          </section>

          <section className="space-y-2">
            <div className="text-sm text-muted-foreground">Optional fields</div>
            <div className="rounded-md border border-sidebar-border p-3 text-sm grid grid-cols-2 gap-2">
              {(user as any)?.email?.address ? (
                <div>
                  <div className="text-muted-foreground">Email</div>
                  <div className="font-mono">{String((user as any).email.address)}</div>
                </div>
              ) : null}
              {(user as any)?.phone?.number ? (
                <div>
                  <div className="text-muted-foreground">Phone</div>
                  <div className="font-mono">{String((user as any).phone.number)}</div>
                </div>
              ) : null}
              {(user as any)?.wallet?.address ? (
                <div>
                  <div className="text-muted-foreground">Primary wallet</div>
                  <div className="font-mono">{shorten(String((user as any).wallet.address))}</div>
                </div>
              ) : null}
              {(user as any)?.smartWallet?.address ? (
                <div>
                  <div className="text-muted-foreground">Smart wallet</div>
                  <div className="font-mono">{shorten(String((user as any).smartWallet.address))}</div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}


