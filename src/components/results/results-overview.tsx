'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ExamStats } from '@/lib/types'

interface ResultsOverviewProps {
	stats: ExamStats
}

export function ResultsOverview({ stats }: ResultsOverviewProps) {
	return (
		<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
			<Card>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
					<CardTitle className='text-sm font-medium'>Average Score</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='text-2xl font-bold'>{stats.averageScore}%</div>
					<Progress value={stats.averageScore} className='mt-2' />
				</CardContent>
			</Card>

			<Card>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
					<CardTitle className='text-sm font-medium'>Pass Rate</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='text-2xl font-bold'>{stats.passRate}%</div>
					<Progress value={stats.passRate} className='mt-2' />
				</CardContent>
			</Card>

			<Card>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
					<CardTitle className='text-sm font-medium'>
						Score Range (Min - Max)
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='text-2xl font-bold'>
						{stats.lowestScore}% - {stats.highestScore}%
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
					<CardTitle className='text-sm font-medium'>Total Students</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='text-2xl font-bold'>{stats.totalStudents}</div>
				</CardContent>
			</Card>
		</div>
	)
}
