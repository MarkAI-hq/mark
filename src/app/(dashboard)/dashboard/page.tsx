import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { BookOpen, GraduationCap, FileCheck, Users, Clock } from 'lucide-react'

import { StatCard } from '@/components/dashboard/stat-card'
import { getStats } from '@/lib/actions/stats'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OverviewChart } from '@/components/charts/overview-chart'
import { DistributionChart } from '@/components/charts/distribution-chart'
import { DashboardStats } from '@/lib/types'

const overviewData = [
	{ name: '1', total: 12 },
	{ name: '2', total: 18 },
	{ name: '3', total: 24 },
	{ name: '4', total: 32 },
	{ name: '5', total: 28 },
	{ name: '6', total: 36 },
	{ name: '7', total: 42 }
]

const distributionData = [
	{ name: 'A', value: 35, color: '#22c55e' },
	{ name: 'B', value: 30, color: '#3b82f6' },
	{ name: 'C', value: 20, color: '#f59e0b' },
	{ name: 'D', value: 10, color: '#ef4444' },
	{ name: 'F', value: 5, color: '#6b7280' }
]

export const metadata: Metadata = {
	title: 'Dashboard',
	description: 'Overview of your exam marking system.'
}

export default async function DashboardPage() {
	const cookieStore = await cookies()
	const user = JSON.parse(cookieStore.get('user')?.value || '{}')
	const stats= (await getStats()) as DashboardStats

	return (
		<div className='flex-1 space-y-4'>
			<div className='flex items-center justify-between space-y-2'>
				<h2 className='text-3xl font-bold tracking-tight'>
					Welcome back, {user.name}
				</h2>
			</div>
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<StatCard
					title='Total Courses'
					value={stats.totalCourses}
					icon={<BookOpen className='h-4 w-4' />}
					description='Active courses in the system'
				/>
				<StatCard
					title='Total Students'
					value={stats.totalStudents}
					icon={<Users className='h-4 w-4' />}
					description='Enrolled students'
				/>
				<StatCard
					title='Exams Created'
					value={stats.totalExams}
					icon={<GraduationCap className='h-4 w-4' />}
					description='Total exams in the system'
				/>
				<StatCard
					title='Papers Marked'
					value={stats.markedPapers}
					icon={<FileCheck className='h-4 w-4' />}
					description='Papers marked this month'
				/>
			</div>
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
				<div className='col-span-4'>
					<OverviewChart data={overviewData} />
				</div>
				<div className='col-span-3'>
					<DistributionChart data={distributionData} />
				</div>
			</div>
			<div className='grid gap-4 md:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
					</CardHeader>
					<CardContent>
						{stats.recentActivity.map((activity) => (
							<div
								key={activity.id}
								className='mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0'
							>
								<span className='flex h-2 w-2 translate-y-1.5 rounded-full bg-sky-500' />
								<div className='space-y-1'>
									<p className='text-sm font-medium'>{activity.description}</p>
									<time className='text-xs text-muted-foreground'>
										{new Date(activity.timestamp).toLocaleString()}
									</time>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Upcoming Deadlines</CardTitle>
					</CardHeader>
					<CardContent>
						{stats.upcomingDeadlines.map((deadline) => (
							<div
								key={deadline.id}
								className='mb-4 flex items-center space-x-4 rounded-md border p-4'
							>
								<Clock className='h-4 w-4 text-muted-foreground' />
								<div className='flex-1 space-y-1'>
									<p className='text-sm font-medium'>{deadline.title}</p>
									<p className='text-xs text-muted-foreground'>
										Due {new Date(deadline.dueDate).toLocaleDateString()}
									</p>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
