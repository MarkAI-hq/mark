// src/components/layout/user-nav.tsx
'use client'

import { LogOut, Settings } from 'lucide-react' // Import the Settings icon
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCookies } from 'next-client-cookies'
import Link from 'next/link' // Import Link for navigation

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { logout } from '@/lib/actions/auth'
import { User } from '@/lib/types' // Import the User type

export function UserNav() {
  const router = useRouter()
  const cookies = useCookies()

  const handleLogout = async () => {
    try {
      const result = await logout()
      if (!result.success) {
        throw new Error(result.error as string)
      }
      // Redirect to home/login page after logout
      router.push('/')
      router.refresh() // Ensure server components re-evaluate
    } catch (err) {
      toast.error('Error', {
        description: err instanceof Error ? err.message : 'Failed to logout',
      })
    }
  }

  // Safely parse user data from cookie
  let user: User | null = null;
  try {
    const userCookie = cookies.get('user');
    if (userCookie) {
      user = JSON.parse(userCookie) as User;
    }
  } catch (error) {
    console.error("Failed to parse user cookie:", error);
  }

  if (!user) return null

  return (
    <div className="flex items-center gap-4">
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user?.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* --- NEW SETTINGS LINK --- */}
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href="/dashboard/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          {/* --- END NEW SETTINGS LINK --- */}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-red-600"
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
