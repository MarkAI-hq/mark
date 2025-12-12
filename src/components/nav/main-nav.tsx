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
    <nav
      className={cn(
        // FIX: Removed 'fixed', 'h-screen', 'w-64', 'border-r', etc.
        // We now just let it fill the parent container provided by DashboardShell.
        'flex flex-col gap-4', 
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
      <div className="flex flex-col space-y-1">
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
                isActive && 'text-primary font-semibold bg-muted/10' // Added bg highlight for active state
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
      </div>
    </nav>
  )
}
