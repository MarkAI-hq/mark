'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useCookies } from 'next-client-cookies'
import { toast } from 'sonner'
import {
  PanelLeftClose, PanelLeftOpen, LogOut, Shield, Headphones,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { rootConfig } from '@/config/root'
import { logout } from '@/lib/actions/auth'
import type { User } from '@/lib/types'

export function RootShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname                  = usePathname()
  const router                    = useRouter()
  const cookies                   = useCookies()

  let user: User | null = null
  try {
    const c = cookies.get('user')
    if (c) user = JSON.parse(c) as User
  } catch { /* ignore */ }

  const isRoot    = user?.role === 'Root'
  const isSupport = user?.role === 'Support'

  const initials = user?.name
    ?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'

  const visibleNav = rootConfig.mainNav.filter(item => !item.rootOnly || isRoot)

  const handleLogout = async () => {
    try {
      const result = await logout()
      if (!result.success) throw new Error(result.error as string)
      router.push('/login')
      router.refresh()
    } catch (err) {
      toast.error('Logout failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-screen flex overflow-hidden" style={{ background: '#08080f' }}>

        {/* Sidebar */}
        <nav
          className={cn(
            'hidden lg:flex fixed left-0 top-0 z-40 h-screen flex-col border-r overflow-y-auto transition-all duration-300 ease-in-out',
            collapsed ? 'w-[60px]' : 'w-64',
          )}
          style={{ background: '#0c0c14', borderColor: 'rgba(201,168,76,0.12)' }}
        >
          <div className="flex flex-col h-full py-4">

            {/* Brand header */}
            <div className="px-3 mb-6">
              {collapsed ? (
                <div className="flex justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(false)}
                        className="h-9 w-9"
                        style={{ color: '#c9a84c' }}
                      >
                        <PanelLeftOpen className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Mirror Intelligence · Platform</TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                <div className="flex items-center justify-between px-1 py-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-md shrink-0"
                      style={{ background: 'rgba(201,168,76,0.15)' }}
                    >
                      <Shield className="h-4 w-4" style={{ color: '#c9a84c' }} />
                    </div>
                    <div className="leading-none">
                      <span className="text-sm font-bold text-white">Mirror Intelligence</span>
                      <span className="text-xs ml-1" style={{ color: '#c9a84c' }}>· Platform</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(true)}
                    className="h-7 w-7 shrink-0"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Nav links */}
            <div className="flex flex-col space-y-1 px-3 flex-1">
              {visibleNav.map(item => {
                const isActive =
                  pathname === item.href ||
                  (pathname?.startsWith(item.href + '/') && item.href !== '/root')
                const Icon = item.icon

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className="flex items-center justify-center rounded-lg p-2.5 transition-all duration-200"
                          style={{
                            background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
                            color:       isActive ? '#c9a84c' : 'rgba(255,255,255,0.45)',
                          }}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="sr-only">{item.title}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">{item.title}</TooltipContent>
                    </Tooltip>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
                    style={{
                      background: isActive ? 'rgba(201,168,76,0.08)' : 'transparent',
                      color:       isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" style={{ color: isActive ? '#c9a84c' : undefined }} />
                    <span className="truncate">{item.title}</span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: '#c9a84c' }} />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Role badge footer */}
            {!collapsed && (
              <div className="px-3 mt-4">
                <div
                  className="rounded-lg p-3 text-xs"
                  style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}
                >
                  <div className="flex items-center gap-2">
                    {isRoot
                      ? <Shield className="h-3.5 w-3.5 shrink-0" style={{ color: '#c9a84c' }} />
                      : <Headphones className="h-3.5 w-3.5 shrink-0" style={{ color: '#c9a84c' }} />
                    }
                    <span style={{ color: '#c9a84c' }} className="font-semibold">
                      {isRoot ? 'Root Admin' : 'Support'}
                    </span>
                  </div>
                  <p className="mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {isRoot ? 'Full platform access' : 'Read-only cross-org access'}
                  </p>
                </div>
              </div>
            )}

          </div>
        </nav>

        {/* Main content */}
        <div
          className={cn(
            'flex-1 min-w-0 flex flex-col transition-all duration-300',
            collapsed ? 'lg:ml-[60px]' : 'lg:ml-64',
          )}
        >
          {/* Top bar */}
          <header
            className="flex-shrink-0 sticky top-0 z-30 flex h-14 items-center justify-between px-6"
            style={{
              borderBottom: '1px solid rgba(201,168,76,0.1)',
              background:   'rgba(12,12,20,0.85)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Platform Operations Console
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="text-xs"
                style={{ borderColor: 'rgba(201,168,76,0.3)', color: '#c9a84c' }}
              >
                {isRoot ? 'Root' : isSupport ? 'Support' : user?.role}
              </Badge>

              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback
                    className="text-xs font-semibold"
                    style={{ background: 'rgba(201,168,76,0.2)', color: '#c9a84c' }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium text-white/70">
                  {user?.email ?? user?.name}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs gap-1.5"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto" style={{ background: '#08080f' }}>
            <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 space-y-6">
              {children}
            </div>
          </main>
        </div>

      </div>
    </TooltipProvider>
  )
}
