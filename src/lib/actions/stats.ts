// src/lib/actions/stats.ts
'use server'

import { fetcher } from '@/lib/fetch'

export interface DailyCount {
  name:  string
  total: number
}

export interface StatsResponse {
  totalSubjects:     number
  totalCourses:      number
  totalClasses:      number
  totalStudents:     number
  totalExams:        number
  markedPapers:      number
  recentActivity:    Array<{ id: string; description: string; timestamp: string }>
  upcomingDeadlines: Array<{ id: string; title: string; dueDate: string }>
  dailyMarked:       DailyCount[]
}

export async function getStats(): Promise<StatsResponse> {
  const { data, error } = await fetcher<StatsResponse>('/stats')

  if (data) return data

  return {
    totalSubjects:     0,
    totalCourses:      0,
    totalClasses:      0,
    totalStudents:     0,
    totalExams:        0,
    markedPapers:      0,
    recentActivity:    [],
    upcomingDeadlines: [],
    dailyMarked:       [],
  }
}