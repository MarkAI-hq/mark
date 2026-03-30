// src/lib/actions/analytics.ts
'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface BloomDistribution {
  level_code:  string
  level_name:  string
  count:       number
  percentage:  number
}

export interface ErrorDistribution {
  error_code:  string
  error_name:  string
  count:       number
  percentage:  number
  description?: string
}

export interface AtRiskStudent {
  studentId:   string
  studentName: string
  avgPct:      number
  submissions: number
}

export interface SchoolAnalytics {
  totalSubmissions:  number
  avgSchoolScore:    number
  bloomDistribution: BloomDistribution[]
  errorDistribution: ErrorDistribution[]
  scoreDistribution: Array<{ range: string; count: number; percentage: number }>
  atRiskStudents:    AtRiskStudent[]
}

export interface StudentAnalytics {
  studentId:          string
  totalSubmissions:   number
  averageScore:       number
  averagePercentage:  number
  bloomDistribution:  BloomDistribution[]
  errorDistribution:  ErrorDistribution[]
  scoreHistory:       Array<{
    assessmentTitle: string
    score:           number
    maxScore:        number
    percentage:      number
    gradedAt:        string
  }>
}

export async function getSchoolAnalytics(): Promise<SchoolAnalytics | null> {
  const { data, error } = await fetcher<SchoolAnalytics>('/analytics/school')
  if (error || !data) return null
  return data
}

export async function getStudentAnalytics(
  studentId: string,
): Promise<StudentAnalytics | null> {
  const { data, error } = await fetcher<StudentAnalytics>(`/analytics/student/${studentId}`)
  if (error || !data) return null
  return data
}