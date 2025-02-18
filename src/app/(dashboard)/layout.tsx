import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

import { refreshAccessToken } from '@/lib/actions/auth'
import { getSession, isTokenExpired } from '@/lib/session'
import { MainNav } from '@/components/nav/main-nav'
import { UserNav } from '@/components/nav/user-nav'
import { Footer } from '@/components/nav/footer'

export default async function DashboardLayout({
	children
}: {
	children: React.ReactNode
}) {
	const cookieStore = await cookies()
	const token = cookieStore.get('token')
	const refreshToken = cookieStore.get('refreshToken')
	const session = await getSession()

	if (!session) {
		// No session or session expired
		if (token?.value && isTokenExpired(token.value) && refreshToken) {
			// Token expired but we have refresh token
			const result = await refreshAccessToken()
			if (!result.data) {
				redirect('/login')
			}
		} else {
			redirect('/login')
		}
	}

	return (
		<div className='flex min-h-screen flex-col'>
			<header className='sticky top-0 z-50 border-b bg-background'>
				<div className='flex h-16 items-center px-4'>
					<MainNav className='mx-6' />
					<div className='ml-auto flex items-center space-x-4'>
						<UserNav />
					</div>
				</div>
			</header>
			<main className='flex-1 space-y-4 p-8 pt-6'>{children}</main>
			<Footer />
		</div>
	)
}
