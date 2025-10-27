import * as React from 'react'
import { Activity, Scale, House, EyeOff } from 'lucide-react'
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
} from '@/components/ui/sidebar'

type WalletLayoutProps = {
  children: React.ReactNode
}

export default function WalletLayout({ children }: WalletLayoutProps) {
  const topItems = [
    { key: 'Dashboard', label: 'Dashboard', icon: House, to: '/' },
    { key: 'Private Cash', label: 'Private Cash', icon: EyeOff, to: '/demo/start/ssr/full-ssr' },
    { key: 'payments', label: 'Payments', icon: Scale, to: '/demo/api/names' },
    { key: 'activity', label: 'Activity', icon: Activity, to: '/activity' },
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
                      className={cn('h-11 rounded-[12px] px-3 gap-3', 'text-[18px] leading-[14px] font-normal', '[&>svg]:!size-6')}
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
                        <Icon className="size-6 text-[var(--brand-green-300)]" />
                        <span className="text-sidebar-primary">{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}


