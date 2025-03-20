import { ThemeToggle } from '@/components/layout/theme-toggle'

export default function AuthLayout({
	children
}: {
	children: React.ReactNode
}) {
	return (
		<div className='min-h-screen'>
			<header className='absolute right-4 top-4'>
				<ThemeToggle />
			</header>
			<main className='flex min-h-screen flex-col items-center justify-center'>
				{children}
			</main>
		</div>
	)
} 