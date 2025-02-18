'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'

interface DistributionChartProps {
	data: Array<{
		name: string
		value: number
		color: string
	}>
}

export function DistributionChart({ data }: DistributionChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Grade Distribution</CardTitle>
				<CardDescription>Distribution of grades this semester</CardDescription>
			</CardHeader>
			<CardContent className='pb-4'>
				<div className='h-[200px]'>
					<ResponsiveContainer width='100%' height='100%'>
						<PieChart>
							<Pie
								data={data}
								dataKey='value'
								nameKey='name'
								cx='50%'
								cy='50%'
								outerRadius={80}
								innerRadius={60}
								paddingAngle={2}
							>
								{data.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={entry.color} />
								))}
							</Pie>
							<Tooltip
								content={({ active, payload }) => {
									if (active && payload && payload.length) {
										return (
											<div className='rounded-lg border bg-background p-2 shadow-sm'>
												<div className='grid grid-cols-2 gap-2'>
													<div className='flex flex-col'>
														<span className='text-[0.70rem] uppercase text-muted-foreground'>
															{payload[0].name}
														</span>
														<span className='font-bold text-muted-foreground'>
															{payload[0].value}%
														</span>
													</div>
												</div>
											</div>
										)
									}
									return null
								}}
							/>
						</PieChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	)
} 