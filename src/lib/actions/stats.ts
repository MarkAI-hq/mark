'use server'

import { fetcher } from '@/lib/fetch'
import { ServerActionResponse, DashboardStats } from '../types'

export async function getStats() {
	const { data, error } = await fetcher<ServerActionResponse<DashboardStats>>('/stats')

	if (data) return data

	if (error) {
		return {
			totalCourses: 0,
			totalStudents: 0,
			totalExams: 0,
			markedPapers: 0,
			recentActivity: [],
			upcomingDeadlines: []
		}
	}
}
