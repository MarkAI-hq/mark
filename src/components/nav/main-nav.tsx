// src/components/nav/main-nav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Building, ChevronsUpDown, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { dashboardConfig, NavItem } from '@/config/dashboard'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { UserRole } from '@/lib/types'

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
  organizationName?: string | null
}

export function MainNav({ className, organizationName, ...props }: MainNavProps) {
  const pathname    = usePathname()
  const { user }    = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const accessibleNavItems = dashboardConfig.mainNav.filter(
    (item) => user?.role && item.roles.includes(user.role as UserRole)
  )

  return (
    <>
      <Button
        variant="ghost"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* Desktop sidebar */}
      <nav
        className={cn(
          'hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r bg-background overflow-y-auto',
          className
        )}
        {...props}
      >
        <NavContent
          organizationName={organizationName}
          accessibleNavItems={accessibleNavItems}
          pathname={pathname}
          userRole={user?.role as UserRole}
        />
      </nav>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-40 w-64 bg-background border-r shadow-xl lg:hidden">
            <NavContent
              organizationName={organizationName}
              accessibleNavItems={accessibleNavItems}
              pathname={pathname}
              userRole={user?.role as UserRole}
            />
          </div>
        </>
      )}
    </>
  )
}

interface NavContentProps {
  organizationName?: string | null
  accessibleNavItems: NavItem[]
  pathname:   string | null
  userRole:   UserRole
}

function NavContent({ organizationName, accessibleNavItems, pathname, userRole }: NavContentProps) {
  return (
    <div className="flex flex-col h-full py-4">

      {/* Org switcher */}
      <div className="px-3 mb-4">
        <Collapsible defaultOpen>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between px-3 py-6 text-left hover:bg-muted/50 border border-transparent hover:border-border transition-all"
            >
              <div className="flex items-center gap-3 truncate">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Building className="h-5 w-5 shrink-0 text-primary" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-bold truncate leading-none mb-1">
                    {organizationName || 'Personal'}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    Organization
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 py-1 pl-8" />
        </Collapsible>
      </div>

      {/* Nav links */}
      <div className="flex flex-col space-y-1 px-3">
        {accessibleNavItems.map((item) => {
          // Resolve the correct href for this user's role
          const href     = item.roleHref?.[userRole] ?? item.href
          const isActive =
            pathname === href ||
            (pathname?.startsWith(href) && href !== '/dashboard' && href !== '/dashboard/teacher')

          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'text-muted-foreground hover:text-primary hover:bg-primary/5',
                isActive && 'bg-primary/10 text-primary'
              )}
            >
              <Icon className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
              )} />
              {item.title}
              {isActive && (
                <div className="ml-auto flex h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Footer tip */}
      <div className="mt-auto px-3">
        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Pro Tip</p>
          Use the Exam Builder to generate assessments in seconds.
        </div>
      </div>

    </div>
  )
}