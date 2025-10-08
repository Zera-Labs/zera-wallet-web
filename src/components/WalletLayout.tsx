import * as React from 'react'
import { Activity, Eye, Scale, Settings, Shield, CircleSlash } from 'lucide-react'
import { Link } from '@tanstack/react-router'
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
  SidebarRail,
} from '@/components/ui/sidebar'

type WalletLayoutProps = {
  children: React.ReactNode
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
                            'bg-[rgba(151,223,177,0.15)] border border-[rgba(151,223,177,0.4)]'
                          ),
                        }}
                        inactiveProps={{
                          className: cn(
                            'flex items-center gap-3 w-full',
                            'h-11 rounded-[12px] px-3',
                            'bg-white/10 hover:bg-white/10'
                          ),
                        }}
                      >
                        <Icon className="size-6 text-[var(--brand-green-200)]" />
                        <span className="text-[var(--brand-green-200)]">{label}</span>
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
                            'bg-[rgba(151,223,177,0.15)] border border-[rgba(151,223,177,0.4)]'
                          ),
                        }}
                        inactiveProps={{
                          className: cn(
                            'flex items-center gap-3 w-full',
                            'h-11 rounded-[12px] px-3',
                            'bg-white/10 hover:bg-white/10'
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


