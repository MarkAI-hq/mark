// src/components/nav/main-nav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Building, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { dashboardConfig, NavItem } from '@/config/dashboard'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { UserRole } from '@/lib/types'

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
  organizationName?: string | null
  isPublic?: boolean
  collapsed: boolean
  onToggleCollapse: () => void
}

export function MainNav({ className, organizationName, isPublic, collapsed, onToggleCollapse, ...props }: MainNavProps) {
  const pathname                    = usePathname()
  const { user }                    = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const accessibleNavItems = dashboardConfig.mainNav.filter((item) => {
    if (!user?.role || !item.roles.includes(user.role as UserRole)) return false
    if (item.requiresPublicListing && !isPublic) return false
    return true
  })

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile hamburger button — only visible when sidebar is closed */}
      {!mobileOpen && (
        <Button
          variant="ghost"
          className="fixed top-4 left-4 z-50 lg:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </Button>
      )}

      {/* Desktop sidebar */}
      <nav
        className={cn(
          'hidden lg:flex fixed left-0 top-0 z-40 h-screen flex-col border-r border-border/50 bg-surface-raised overflow-hidden transition-all duration-300 ease-in-out',
          collapsed ? 'w-[60px] bg-background/80 backdrop-blur-md' : 'w-64',
          className
        )}
        {...props}
      >
        <NavContent
          organizationName={organizationName}
          accessibleNavItems={accessibleNavItems}
          pathname={pathname}
          userRole={user?.role as UserRole}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </nav>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-md lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-40 w-64 bg-background border-r shadow-xl lg:hidden overflow-hidden">
            <NavContent
              organizationName={organizationName}
              accessibleNavItems={accessibleNavItems}
              pathname={pathname}
              userRole={user?.role as UserRole}
              collapsed={false}
              onToggleCollapse={() => setMobileOpen(false)}
            />
          </div>
        </>
      )}
    </TooltipProvider>
  )
}

interface NavContentProps {
  organizationName?: string | null
  accessibleNavItems: NavItem[]
  pathname:           string | null
  userRole:           UserRole
  collapsed:          boolean
  onToggleCollapse:   () => void
}

function NavContent({
  organizationName,
  accessibleNavItems,
  pathname,
  userRole,
  collapsed,
  onToggleCollapse,
}: NavContentProps) {
  return (
    <div className="flex flex-col h-full py-4">

      {/* Header: org name + toggle on the same row */}
      <div className="px-3 mb-4">
        {collapsed ? (
          <div className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {organizationName || 'Personal'} · Expand sidebar
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-2 truncate">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gold/10 shrink-0">
                <Building className="h-4 w-4 text-gold" />
              </div>
              <span className="text-sm font-semibold truncate">
                {organizationName || 'Personal'}
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Collapse sidebar</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Nav links */}
      <div className="flex flex-col space-y-1 px-3 flex-1 overflow-y-auto">
        {accessibleNavItems.map((item) => {
          const href     = item.roleHref?.[userRole] ?? item.href
          const isActive =
            pathname === href ||
            (pathname?.startsWith(href) && href !== '/dashboard' && href !== '/dashboard/teacher')

          const Icon = item.icon

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center justify-center rounded-lg p-2.5 transition-all duration-200',
                      'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
                      isActive && 'ring-1 ring-gold/30 bg-gold/8 text-foreground'
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5 shrink-0',
                      isActive ? 'text-gold' : 'text-muted-foreground'
                    )} />
                    <span className="sr-only">{item.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            )
          }

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
                isActive && 'bg-primary/8 text-foreground font-semibold'
              )}
            >
              <Icon className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-gold' : 'text-muted-foreground group-hover:text-foreground'
              )} />
              <span className="truncate">{item.title}</span>
              {isActive && (
                <div className="ml-auto flex h-1.5 w-1.5 rounded-full bg-gold" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Footer: pro tip — only when expanded */}
      {!collapsed && (
        <div className="px-3 mt-4">
          <div className="rounded-lg bg-gold/5 border border-gold/20 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-gold mb-1">Pro Tip</p>
            Use the Exam Builder to generate assessments in seconds.
          </div>
        </div>
      )}

    </div>
  )
}