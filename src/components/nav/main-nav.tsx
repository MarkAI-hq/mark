// src/components/nav/main-nav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building, ChevronsUpDown } from 'lucide-react'
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

  // Filter nav items based on user role
  const accessibleNavItems = dashboardConfig.mainNav.filter(
    (item) => user?.role && item.roles.includes(user.role)
  )

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-screen w-64 flex flex-col bg-background border-r border-muted-200 p-4 overflow-y-auto scroll-smooth',
        className
      )}
      {...props}
    >
      {/* --- Organization Switcher/Display --- */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-3 py-2 text-left text-base font-semibold hover:bg-transparent transition"
          >
            <div className="flex items-center gap-3 truncate">
              <Building className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span className="truncate">{organizationName || 'Personal Workspace'}</span>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 py-1 pl-8 scroll-smooth">
          {/* Future items like "Switch Workspace" or "Create New" */}
        </CollapsibleContent>
      </Collapsible>

      {/* --- Navigation Links --- */}
      <nav className="mt-4 flex-1 space-y-1">
        {accessibleNavItems.map((item) => {
          // Determine active item based on pathname
          const isActive =
            pathname === item.href ||
            (pathname.startsWith(item.href) && item.href !== '/dashboard')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted/10',
                isActive && 'text-primary font-semibold'
              )}
            >
              {/* Active link side indicator */}
              {isActive && (
                <span className="absolute left-0 top-0 h-full w-1 rounded-r bg-primary" />
              )}
              {item.title}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

