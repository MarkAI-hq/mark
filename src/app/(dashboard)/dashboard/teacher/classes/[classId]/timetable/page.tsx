import { getTimetableSlots } from '@/lib/actions/timetable'
import { TimetableClient } from './_components/timetable-client'

interface Props {
  params: Promise<{ classId: string }>
  searchParams: Promise<{ term?: string; academic_year?: string }>
}

export default async function TimetablePage({ params, searchParams }: Props) {
  const { classId } = await params
  const { term, academic_year } = await searchParams
  const { data: slots, error } = await getTimetableSlots(classId, term, academic_year)

  return (
    <TimetableClient
      classId={classId}
      initialSlots={slots ?? []}
      error={error?.message ?? null}
      defaultTerm={term}
      defaultAcademicYear={academic_year}
    />
  )
}
