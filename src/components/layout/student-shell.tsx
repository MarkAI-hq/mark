'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { StudentSidebarNav, StudentUser } from '@/components/nav/student-sidebar-nav'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { StreakBadge } from '@/components/students/streak-badge'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Footer } from '@/components/nav/footer'
import { WelcomeCheckIn } from '@/components/check-in/welcome-checkin'
import { CheckInIndicator } from '@/components/check-in/checkin-indicator'

interface StudentShellProps {
  children:          React.ReactNode
  user:              StudentUser
  organizationName?: string | null
}

export function StudentShell({ children, user, organizationName }: StudentShellProps) {
  const pathname                      = usePathname()
  const [collapsed, setCollapsed]     = useState(false)

  // Full-height treatment for Tracy and Studio (no padding, no footer)
  const isFullscreen = pathname?.includes('/tracy') || pathname?.includes('/studio')

  return (
    <div className="h-screen flex bg-background overflow-hidden">

      <WelcomeCheckIn userId={user.id} firstName={user.name?.split(' ')[0]} streak={user.study_streak} />

      <StudentSidebarNav
        user={user}
        organizationName={organizationName}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      <div
        className={`flex-1 min-w-0 flex flex-col transition-all duration-300 will-change-[margin-left] ${
          collapsed ? 'md:ml-[60px]' : 'md:ml-64'
        }`}
      >
        {/* Top bar — hidden on fullscreen pages (Tracy/Studio handle their own chrome) */}
        {!isFullscreen && (
          <header className="flex-shrink-0 sticky top-0 z-30 flex h-14 items-center justify-end gap-2 border-b border-border/30 glass px-6">
            <CheckInIndicator userId={user.id} />
            <StreakBadge streak={user.study_streak} />
            <ThemeToggle />
            <NotificationBell />
          </header>
        )}

        {isFullscreen ? (
          <main className="flex-1 min-h-0 flex flex-col">
            {children}
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto flex flex-col">
            <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-5 lg:px-8 lg:py-7 space-y-6">
              {children}
            </div>
            <Footer />
          </main>
        )}
      </div>

    </div>
  )
}
