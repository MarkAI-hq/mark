import { getSession }        from '@/lib/session'
import { getClassDetails }   from '@/lib/actions/classes'
import { getTimetableSlots } from '@/lib/actions/timetable'
import { TimetableClient }   from './_components/timetable-client'

interface Props {
  params: Promise<{ classId: string }>
  searchParams: Promise<{ term?: string; academic_year?: string }>
}

export default async function TimetablePage({ params, searchParams }: Props) {
  const { classId } = await params
  const { term, academic_year } = await searchParams
  const [session, classRes, slotsRes] = await Promise.all([
    getSession(),
    getClassDetails(classId),
    getTimetableSlots(classId, term, academic_year),
  ])

  const isAdmin   = session?.role === 'Admin'
  const className = classRes.data?.name ?? null

  return (
    <TimetableClient
      classId={classId}
      className={className}
      classesUrl={isAdmin ? '/dashboard/classes' : '/dashboard/teacher/classes'}
      classUrl={isAdmin ? `/dashboard/classes/${classId}` : `/dashboard/teacher/classes/${classId}`}
      initialSlots={slotsRes.data ?? []}
      error={slotsRes.error?.message ?? null}
      defaultTerm={term}
      defaultAcademicYear={academic_year}
    />
  )
}
