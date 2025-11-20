'use client'

import { MainNav } from '@/components/nav/main-nav'
import { UserNav } from '@/components/nav/user-nav'
import { Footer } from '@/components/nav/footer'
import { MobileNav } from '@/components/nav/mobile-nav'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DashboardShellProps {
  children: React.ReactNode
  organizationName?: string | null
}

export function DashboardShell({
  children,
  organizationName,
}: DashboardShellProps) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* --- Desktop Sidebar (Stateful) --- */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            {/* Logo can go here */}
          </div>
          <ScrollArea className="flex-1">
            <div className="grid items-start gap-2 p-2 text-sm font-medium">
              <MainNav organizationName={organizationName} />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* MobileNav (Stateful) */}
          <MobileNav organizationName={organizationName} />
          <div className="w-full flex-1">
            {/* Search bar can go here */}
          </div>
          <UserNav />
        </header>

        <ScrollArea className="flex-1">
          <main className="space-y-4 p-4 lg:gap-6 lg:p-8 lg:pt-6">
            {children}
          </main>
          <Footer />
        </ScrollArea>
      </div>
    </div>
  )
}
