'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCookies } from 'next-client-cookies'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { logout } from '@/lib/actions/auth'

export function UserNav() {
	const router = useRouter()
	const cookies = useCookies()

	const handleLogout = async () => {
		try {
			const result = await logout()

			if (!result.success) {
				throw new Error(result.error)
			}

			// Redirect to login
			router.push('/')
		} catch (err) {
			toast.error('Error', {
				description: err instanceof Error ? err.message : 'Failed to logout'
			})
		}
	}

	// Get user data from cookie
	const user = JSON.parse(cookies.get('user') || '{}')

	if (!user) return null

	return (
		<div className="flex items-center gap-4">
			<ThemeToggle />
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant='ghost' className='relative h-8 w-8 rounded-full'>
						<Avatar className='h-8 w-8'>
							<AvatarFallback>
								{user?.name?.charAt(0)?.toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className='w-56' align='end' forceMount>
					<DropdownMenuLabel className='font-normal'>
						<div className='flex flex-col space-y-1'>
							<p className='text-sm font-medium leading-none'>{user.name}</p>
							<p className='text-xs leading-none text-muted-foreground'>
								{user.email}
							</p>
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className='cursor-pointer'
						onClick={() => router.push('#')}
					>
						Profile
					</DropdownMenuItem>
					<DropdownMenuItem
						className='cursor-pointer text-red-600'
						onClick={handleLogout}
					>
						<LogOut className='mr-2 h-4 w-4' />
						Log out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
