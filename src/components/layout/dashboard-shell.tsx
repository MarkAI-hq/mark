'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { MainNav } from '@/components/nav/main-nav'
import { UserNav } from '@/components/nav/user-nav'
import { Footer } from '@/components/nav/footer'

interface DashboardShellProps {
  children: React.ReactNode
  organizationName?: string | null
  isPublic?: boolean
}

export function DashboardShell({ children, organizationName, isPublic }: DashboardShellProps) {
  const pathname              = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const isChat                = pathname?.includes('/tracy')

  return (
    <div className="h-screen flex bg-background overflow-hidden">

      {/* Sidebar — receives collapsed state from here */}
      <MainNav
        organizationName={organizationName}
        isPublic={isPublic}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      {/* Main content column — margin matches sidebar width, animates with it */}
      <div
        className={`flex-1 min-w-0 flex flex-col transition-all duration-300 will-change-[margin-left] ${
          collapsed ? 'md:ml-[60px]' : 'md:ml-64'
        }`}
      >
        {/* Top bar */}
        <header className="flex-shrink-0 sticky top-0 z-30 flex h-14 items-center justify-end border-b border-border/30 glass px-6">
          <UserNav />
        </header>

        {/* Page content — Tracy gets full height, all other pages get padded layout */}
        {isChat ? (
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