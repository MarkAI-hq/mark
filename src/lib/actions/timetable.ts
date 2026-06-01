'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'

export interface TimetableSlot {
  id: string
  class_id: string
  course_id: string | null
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  period: number | null
  start_time: string
  end_time: string
  subject: string
  room: string | null
  term: string
  academic_year: string
  is_active: boolean
  created_by: string
  createdAt: string
  updatedAt: string
}

export async function getTimetableSlots(
  classId: string,
  term?: string,
  academicYear?: string,
) {
  const params = new URLSearchParams({ class_id: classId })
  if (term)          params.set('term', term)
  if (academicYear)  params.set('academic_year', academicYear)
  return fetcher<TimetableSlot[]>(`/timetable/slots?${params.toString()}`)
}

export async function createTimetableSlot(data: {
  class_id: string
  day_of_week: string
  start_time: string
  end_time: string
  subject: string
  term: string
  academic_year: string
  period?: number
  room?: string
  course_id?: string
}) {
  const res = await fetcher<TimetableSlot>('/timetable/slots', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.error) {
    revalidatePath(`/dashboard/teacher/classes/${data.class_id}/timetable`)
  }
  return res
}

export async function updateTimetableSlot(
  id: string,
  classId: string,
  data: Partial<{
    day_of_week: string
    start_time: string
    end_time: string
    subject: string
    room: string
    period: number
    is_active: boolean
  }>,
) {
  const res = await fetcher<TimetableSlot>(`/timetable/slots/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  if (!res.error) {
    revalidatePath(`/dashboard/teacher/classes/${classId}/timetable`)
  }
  return res
}

export async function deleteTimetableSlot(id: string, classId: string) {
  const res = await fetcher<{ deleted: true }>(`/timetable/slots/${id}`, {
    method: 'DELETE',
  })
  if (!res.error) {
    revalidatePath(`/dashboard/teacher/classes/${classId}/timetable`)
  }
  return res
}

export async function getTodaySchedule() {
  return fetcher<TimetableSlot[]>('/timetable/today')
}
