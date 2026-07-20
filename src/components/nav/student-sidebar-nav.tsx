'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { GraduationCap, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { studentNavItems, StudentNavItem } from '@/config/student-nav'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { studentLogout } from '@/lib/actions/student-auth'

export interface StudentUser {
  id:                 string
  name:               string
  student_school_id?: string
  enrollment_source?: string
  roles?:             string[]
  organization_id?:   string
  organization_name?: string
}

interface StudentSidebarNavProps {
  user:              StudentUser
  organizationName?: string | null
  collapsed:         boolean
  onToggleCollapse:  () => void
}

export function StudentSidebarNav({
  user, organizationName, collapsed, onToggleCollapse,
}: StudentSidebarNavProps) {
  const pathname                    = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isMarketplace = user.enrollment_source === 'marketplace'

  const accessibleItems = studentNavItems.filter(
    (item) => !(isMarketplace && item.hideForMarketplace),
  )

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile hamburger */}
      {!mobileOpen && (
        <Button
          variant="ghost"
          className="fixed top-4 left-4 z-50 md:!hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </Button>
      )}

      {/* Desktop sidebar */}
      <nav
        className={cn(
          'hidden md:flex fixed left-0 top-0 z-40 h-screen flex-col border-r border-border/50 bg-surface-raised overflow-hidden transition-all duration-300 ease-in-out',
          collapsed ? 'w-[60px] bg-background/80 backdrop-blur-md' : 'w-64',
        )}
      >
        <NavContent
          user={user}
          organizationName={organizationName}
          accessibleItems={accessibleItems}
          pathname={pathname}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </nav>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-md md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-40 w-64 bg-background border-r shadow-xl md:hidden overflow-hidden">
            <NavContent
              user={user}
              organizationName={organizationName}
              accessibleItems={accessibleItems}
              pathname={pathname}
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
  user:             StudentUser
  organizationName?: string | null
  accessibleItems:  StudentNavItem[]
  pathname:         string | null
  collapsed:        boolean
  onToggleCollapse: () => void
}

function NavContent({
  user, organizationName, accessibleItems, pathname, collapsed, onToggleCollapse,
}: NavContentProps) {
  const router          = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const orgLabel = organizationName ?? user.organization_name ?? 'My School'

  const initials = (user.name ?? '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'S'

  async function handleLogout() {
    setLoggingOut(true)
    await studentLogout()
    router.push('/student/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full py-4">

      {/* Header: school name + collapse toggle */}
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
                {orgLabel} · Expand sidebar
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-2 truncate">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gold/10 shrink-0">
                <GraduationCap className="h-4 w-4 text-gold" />
              </div>
              <span className="text-sm font-semibold truncate">{orgLabel}</span>
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
        {accessibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (pathname?.startsWith(item.href + '/') && item.href !== '/student/dashboard')

          const Icon = item.icon

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center justify-center rounded-lg p-2.5 transition-all duration-200',
                      'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
                      isActive && 'ring-1 ring-gold/30 bg-gold/8 text-foreground',
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5 shrink-0',
                      isActive ? 'text-gold' : 'text-muted-foreground',
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
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
                isActive && 'bg-primary/8 text-foreground font-semibold',
              )}
            >
              <Icon className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-gold' : 'text-muted-foreground group-hover:text-foreground',
              )} />
              <span className="truncate">{item.title}</span>
              {isActive && (
                <div className="ml-auto flex h-1.5 w-1.5 rounded-full bg-gold" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Footer: user info + logout */}
      <div className="px-3 mt-4">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center justify-center w-full rounded-lg p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        ) : (
          <div className="rounded-lg border border-border/50 bg-background/50 p-2.5 flex items-center gap-2.5">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-xs bg-gold text-gold-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate leading-tight">{user.name}</p>
              {user.student_school_id && (
                <p className="text-[10px] text-muted-foreground truncate">
                  ID: {user.student_school_id}
                </p>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

    </div>
  )
}
