import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
	title: string
	value: string | number
	description?: string
	icon?: React.ReactNode
	loading?: boolean
}

export function StatCard({
	title,
	value,
	description,
	icon,
	loading = false,
	className,
	...props
}: StatCardProps) {
	return (
		<Card className={cn('', className)} {...props}>
			<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
				<CardTitle className='text-sm font-medium'>{title}</CardTitle>
				{icon && <div className='text-muted-foreground'>{icon}</div>}
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className='h-9 w-24 animate-pulse rounded-md bg-muted' />
				) : (
					<>
						<div className='text-2xl font-bold'>{value}</div>
						{description && (
							<p className='text-xs text-muted-foreground'>{description}</p>
						)}
					</>
				)}
			</CardContent>
		</Card>
	)
} 