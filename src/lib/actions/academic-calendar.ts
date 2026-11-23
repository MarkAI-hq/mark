'use server'

import { fetcher } from '@/lib/fetch'

export interface CalendarTerm {
  term: number
  label: string
  start: string
  end: string
  total_weeks?: number
}

export interface SchoolTerms {
  year: string
  terms: CalendarTerm[]
  /** Where the dates come from: the school's own, the national calendar, or an estimate. */
  source: 'school' | 'national' | 'national_estimated' | 'none'
  national_terms: CalendarTerm[]
}

export interface TermStatus {
  phase: 'in_term' | 'holiday' | 'unknown'
  today: string
  academic_year: string | null
  term: (CalendarTerm & { total_weeks: number }) | null
  week: number | null
  weeks_remaining: number | null
  next_term: (CalendarTerm & { starts_in_days: number }) | null
  source: SchoolTerms['source']
  summary: string
}

export async function getCurrentTermStatus() {
  return fetcher<TermStatus>('/academic-calendar/current')
}

export async function getSchoolTerms(year: number) {
  return fetcher<SchoolTerms>(`/academic-calendar?year=${year}`)
}

/** Save the school's own term dates for a year; an empty list returns to the national calendar. */
export async function saveSchoolTerms(year: number, terms: CalendarTerm[]) {
  return fetcher<SchoolTerms & { rollover: unknown }>(`/academic-calendar/${year}`, {
    method: 'PUT',
    body: JSON.stringify({ terms }),
  })
}
