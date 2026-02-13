'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Building, ChevronsUpDown, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { dashboardConfig } from '@/config/dashboard'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
  organizationName?: string | null
}

export function MainNav({ className, organizationName, ...props }: MainNavProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const accessibleNavItems = dashboardConfig.mainNav.filter(
    (item) => user?.role && item.roles.includes(user.role)
  )

  return (
    <>
      {/* --- Mobile Hamburger Button --- */}
      <Button
        variant="ghost"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* --- Desktop Sidebar --- */}
      <nav
        className={cn(
          'hidden lg:flex fixed left-0 top-4 z-40 h-screen w-64 flex-col gap-4 border-r bg-background overflow-y-auto',
          className
        )}
        {...props}
      >
        <NavContent organizationName={organizationName} accessibleNavItems={accessibleNavItems} pathname={pathname} />
      </nav>

      {/* --- Mobile Sidebar --- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 w-64 bg-background p-4 overflow-y-auto lg:hidden">
          <NavContent organizationName={organizationName} accessibleNavItems={accessibleNavItems} pathname={pathname} />
        </div>
      )}
    </>
  )
}

interface NavContentProps {
  organizationName?: string | null
  accessibleNavItems: typeof dashboardConfig.mainNav
  pathname: string | null
}

function NavContent({ organizationName, accessibleNavItems, pathname }: NavContentProps) {
  return (
    <>
      {/* --- Organization Switcher --- */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-3 py-2 text-left text-base font-semibold hover:bg-transparent"
          >
            <div className="flex items-center gap-3 truncate">
              <Building className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {organizationName || 'Personal Workspace'}
              </span>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 py-1 pl-8">
          {/* future workspace items */}
        </CollapsibleContent>
      </Collapsible>

      {/* --- Navigation Links --- */}
      <div className="flex flex-col space-y-1 px-1 mt-4">
        {accessibleNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (pathname?.startsWith(item.href) && item.href !== '/dashboard')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2',
                'text-muted-foreground transition-all',
                'hover:text-primary hover:bg-muted/10',
                isActive && 'bg-muted/10 text-primary font-semibold'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-0 h-full w-1 rounded-r bg-primary" />
              )}
              {item.title}
            </Link>
          )
        })}
      </div>
    </>
  )
}
