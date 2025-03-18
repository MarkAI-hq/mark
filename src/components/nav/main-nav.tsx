'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const items = [
	{
		title: 'Dashboard',
		href: '/dashboard'
	},
	// {
	// 	title: 'Students',
	// 	href: '/dashboard/students'
	// },
	{
		title: 'Subjects', // Courses
		href: '/dashboard/subjects'
	},
	{
		title: 'Exams',
		href: '/dashboard/exams'
	}
]

export function MainNav({
	className,
	...props
}: React.HTMLAttributes<HTMLElement>) {
	const pathname = usePathname()

	return (
		<nav
			className={cn('flex items-center space-x-4 lg:space-x-6', className)}
			{...props}
		>
			{items.map((item) => (
				<Link
					key={item.href}
					href={item.href}
					className={cn(
						'text-sm font-medium transition-colors hover:text-primary',
						pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
					)}
				>
					{item.title}
				</Link>
			))}
		</nav>
	)
}
