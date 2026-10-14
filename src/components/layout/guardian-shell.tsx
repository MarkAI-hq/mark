'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, Settings, LogOut, GraduationCap, Menu } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { Footer } from '@/components/nav/footer'
import { logout } from '@/lib/actions/auth'
import type { User } from '@/lib/types'

const navItems = [
  { href: '/guardian/dashboard', label: 'My children', icon: LayoutDashboard },
  { href: '/guardian/settings', label: 'Settings', icon: Settings },
]

interface GuardianShellProps {
  children: React.ReactNode
  user: User
}

export function GuardianShell({ children, user }: GuardianShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials =
    user.name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?'

  const handleLogout = async () => {
    try {
      const result = await logout()
      if (!result.success) throw new Error(result.error as string)
      router.push('/')
      router.refresh()
    } catch (err) {
      toast.error('Error', {
        description: err instanceof Error ? err.message : 'Failed to logout',
      })
    }
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Mobile hamburger — only visible when the drawer is closed */}
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
      <nav className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r border-border/50 bg-surface-raised">
        <GuardianNavContent
          user={user}
          initials={initials}
          pathname={pathname}
          onLogout={handleLogout}
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
            <GuardianNavContent
              user={user}
              initials={initials}
              pathname={pathname}
              onLogout={handleLogout}
            />
          </div>
        </>
      )}

      <div className="flex-1 min-w-0 flex flex-col md:ml-64">
        <header className="flex-shrink-0 sticky top-0 z-30 flex h-14 items-center justify-end gap-2 border-b border-border/30 glass px-6">
          <ThemeToggle />
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-5 lg:px-8 lg:py-7 space-y-6">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}

interface GuardianNavContentProps {
  user: User
  initials: string
  pathname: string | null
  onLogout: () => void
}

function GuardianNavContent({ user, initials, pathname, onLogout }: GuardianNavContentProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex h-14 items-center gap-2 border-b border-border/30 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gold/10 shrink-0">
          <GraduationCap className="h-4 w-4 text-gold" />
        </div>
        <span className="text-sm font-semibold truncate">Mark AI</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-gold/10 text-gold font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </div>

      <div className="border-t border-border/30 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gold text-gold-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 flex flex-col leading-none">
            <span className="text-sm font-medium truncate">{user.name}</span>
            <span className="text-xs text-muted-foreground">Guardian</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
