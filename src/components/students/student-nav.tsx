// src/components/student/student-nav.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { GraduationCap, LogOut, BookOpen, LayoutDashboard, Award, Users, ArrowRightLeft, FileCheck, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/notifications/notification-bell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { studentLogout } from '@/lib/actions/student-auth'

interface StudentNavProps {
  user: {
    name:               string
    student_school_id?: string
    enrollment_source?: string
  }
}

export function StudentNav({ user }: StudentNavProps) {
  const router    = useRouter()
  const pathname  = usePathname()
  const [loading, setLoading] = useState(false)

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleLogout() {
    setLoading(true)
    await studentLogout()
    router.push('/student/login')
    router.refresh()
  }

  const isMarketplace = user.enrollment_source === 'marketplace'

  const navLinks = [
    { href: '/student/dashboard',    label: 'Dashboard',    icon: LayoutDashboard, marketplaceOnly: false },
    { href: '/student/study-plans',  label: 'Study Plans',  icon: BookOpen,        marketplaceOnly: false },
    { href: '/student/certificates', label: 'Certificates', icon: Award,           marketplaceOnly: false },
    { href: '/student/community',    label: 'Community',    icon: Users,           hideForMarketplace: true },
    { href: '/student/exams',        label: 'Exams',        icon: FileCheck,       marketplaceOnly: false },
    { href: '/student/transfer',     label: 'Transfer',     icon: ArrowRightLeft,  hideForMarketplace: true },
    { href: '/student/welcome-pack', label: 'Welcome Pack', icon: Gift,            marketplaceOnly: false },
  ].filter(link => !(isMarketplace && link.hideForMarketplace))

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="container mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">

        {/* Logo + nav */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold">
              <GraduationCap className="h-4 w-4 text-gold-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-tight hidden sm:block">Student Portal</span>
          </div>
          <nav className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  pathname === href
                    ? 'bg-gold/15 text-gold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-1">
          <NotificationBell />
          <div className="mx-1.5 h-5 w-px bg-border/50" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-gold text-gold-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  {user.student_school_id && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ID: {user.student_school_id}
                    </p>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 sm:hidden">
                <p className="text-sm font-medium">{user.name}</p>
                {user.student_school_id && (
                  <p className="text-xs text-muted-foreground">ID: {user.student_school_id}</p>
                )}
              </div>
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={loading}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {loading ? 'Signing out...' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </header>
  )
}