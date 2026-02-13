'use client'

import { MainNav } from '@/components/nav/main-nav'
import { UserNav } from '@/components/nav/user-nav'
import { Footer } from '@/components/nav/footer'

interface DashboardShellProps {
  children: React.ReactNode
  organizationName?: string | null
}

export function DashboardShell({
  children,
  organizationName,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen">
      {/* --- SIDEBAR (desktop + mobile handled inside MainNav) --- */}
      <MainNav organizationName={organizationName} />

      {/* --- MAIN CONTENT --- */}
      <div className="ml-0 lg:ml-64 flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <div className="flex-1" />
          <UserNav />
        </header>

        {/* Page content scrolls */}
        <main className="flex-1 overflow-y-auto">
          <div className="space-y-4 p-4 lg:p-8 lg:pt-6">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
