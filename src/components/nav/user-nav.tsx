// src/components/nav/user-nav.tsx
'use client'

import { LogOut, Settings, ChevronsUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCookies } from 'next-client-cookies'
import Link from 'next/link'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { logout } from '@/lib/actions/auth'
import { User } from '@/lib/types'

function getSettingsHref(role?: string): string {
  switch (role) {
    case 'Teacher': return '/dashboard/teacher/settings'
    case 'Admin':   return '/dashboard/settings/organization'
    default:        return '/dashboard/settings'
  }
}

export function UserNav() {
  const router  = useRouter()
  const cookies = useCookies()

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

  let user: User | null = null
  try {
    const userCookie = cookies.get('user')
    if (userCookie) user = JSON.parse(userCookie) as User
  } catch {
    console.error('Failed to parse user cookie')
  }

  if (!user) return null

  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  const settingsHref = getSettingsHref(user.role)

  return (
    <div className="flex items-center gap-1">
      <ThemeToggle />

      <div className="mx-2 h-5 w-px bg-border" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start leading-none sm:flex">
              <span className="font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.role}</span>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              <p className="text-xs leading-none text-muted-foreground capitalize">{user.role}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href={settingsHref}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}