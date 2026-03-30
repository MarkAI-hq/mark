'use client'

import { MainNav } from '@/components/nav/main-nav'
import { UserNav } from '@/components/nav/user-nav'
import { Footer } from '@/components/nav/footer'

interface DashboardShellProps {
  children: React.ReactNode
  organizationName?: string | null
}

export function DashboardShell({ children, organizationName }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <MainNav organizationName={organizationName} />

      <div className="lg:ml-64 flex min-h-screen flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end border-b border-border/50 bg-background/95 backdrop-blur-sm px-6">
          <UserNav />
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8 space-y-6">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}