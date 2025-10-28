import * as React from 'react'
import { Activity, Eye, Scale, Settings, Shield, CircleSlash } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar'

type WalletLayoutProps = {
  children: React.ReactNode
}

function AuthControlsLoaded({ usePrivy }: { usePrivy: any }) {
  const { authenticated, ready, login, logout } = usePrivy()
  return (
    <div className={cn('h-11 rounded-[12px] px-3 gap-3 mb-2', 'flex items-center justify-between')}>
      <div className="text-sm text-[var(--text-tertiary)] truncate max-w-[140px]">
        {ready ? (authenticated ? 'Connected' : 'Not signed in') : '...'}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (authenticated) logout()
            else login()
          }}
        >
          {authenticated ? 'Logout' : 'Sign in'}
        </Button>
      </div>
    </div>
  )
}

function AuthControls() {
  const [usePrivyHook, setUsePrivyHook] = React.useState<any | null>(null)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    let mounted = true
    ;(async () => {
      try {
        const mod = await import('@privy-io/react-auth')
        if (mounted) setUsePrivyHook(() => (mod as any).usePrivy)
      } catch {}
    })()
    return () => {
      mounted = false
    }
  }, [])
  if (!usePrivyHook) return null
  return <AuthControlsLoaded usePrivy={usePrivyHook} />
}

export default function WalletLayout({ children }: WalletLayoutProps) {
  const topItems = [
    { key: 'overview', label: 'Overview', icon: Eye, to: '/' },
    { key: 'zkcash', label: 'ZK Cash', icon: CircleSlash, to: '/demo/start/ssr/full-ssr' },
    { key: 'payments', label: 'Payments', icon: Scale, to: '/demo/api/names' },
    { key: 'activity', label: 'Activity', icon: Activity, to: '/demo/start/ssr/spa-mode' },
    { key: 'vault', label: 'Vault', icon: Shield, to: '/demo/tanstack-query' },
  ] as const

  return (
      <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <AuthControls />
                </SidebarMenuItem>
                {topItems.map(({ key, label, icon: Icon, to }) => (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton
                      tooltip={label}
                      asChild
                      className={cn('h-11 rounded-[12px] px-3 gap-3', 'text-[18px] leading-[14px] font-normal')}
                    >
                      <Link
                        to={to}
                        activeOptions={{ exact: to === '/' }}
                        activeProps={{
                          className: cn(
                            'flex items-center gap-3 w-full',
                            'h-11 rounded-[12px] px-3',
                            'bg-sidebar-accent border border-sidebar-border text-sidebar-accent-foreground'
                          ),
                        }}
                        inactiveProps={{
                          className: cn(
                            'flex items-center gap-3 w-full',
                            'h-11 rounded-[12px] px-3',
                            'bg-white/10 hover:bg-sidebar-accent'
                          ),
                        }}
                      >
                        <Icon className="size-6" />
                        <span className="text-sidebar-primary">{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="mt-auto">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Settings"
                      asChild
                      className={cn('h-11 rounded-[12px] px-3 gap-3', 'text-[18px] leading-[14px] font-normal')}
                    >
                      <Link
                        to="/demo/start/api-request"
                        activeProps={{
                          className: cn(
                            'flex items-center gap-3 w-full',
                            'h-11 rounded-[12px] px-3',
                            'bg-sidebar-accent border border-sidebar-border text-sidebar-accent-foreground'
                          ),
                        }}
                        inactiveProps={{
                          className: cn(
                            'flex items-center gap-3 w-full',
                            'h-11 rounded-[12px] px-3',
                            'bg-white/10 hover:bg-sidebar-accent'
                          ),
                        }}
                      >
                        <Settings className="size-6 text-[var(--brand-green-200)]" />
                        <span className="text-[var(--brand-green-200)]">Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}


