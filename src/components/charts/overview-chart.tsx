'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'

interface OverviewChartProps {
	data: Array<{
		name: string
		total: number
	}>
}

export function OverviewChart({ data }: OverviewChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Papers Marked Overview</CardTitle>
				<CardDescription>Number of papers marked per day this month</CardDescription>
			</CardHeader>
			<CardContent className='pb-4'>
				<div className='h-[200px]'>
					<ResponsiveContainer width='100%' height='100%'>
						<LineChart
							data={data}
							margin={{
								top: 5,
								right: 10,
								left: 10,
								bottom: 0
							}}
						>
							<Tooltip
								content={({ active, payload }) => {
									if (active && payload && payload.length) {
										return (
											<div className='rounded-lg border bg-background p-2 shadow-sm'>
												<div className='grid grid-cols-2 gap-2'>
													<div className='flex flex-col'>
														<span className='text-[0.70rem] uppercase text-muted-foreground'>
															Papers
														</span>
														<span className='font-bold text-muted-foreground'>
															{payload[0].value}
														</span>
													</div>
												</div>
											</div>
										)
									}
									return null
								}}
							/>
							<Line
								type='monotone'
								dataKey='total'
								strokeWidth={2}
								activeDot={{
									r: 6,
									style: { fill: 'var(--theme-primary)' }
								}}
								style={{
									stroke: 'var(--theme-primary)'
								}}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	)
} 