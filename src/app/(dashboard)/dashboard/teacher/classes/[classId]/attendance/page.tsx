import { getAttendanceSessions } from '@/lib/actions/attendance'
import { AttendanceClient } from './_components/attendance-client'

interface Props {
  params: Promise<{ classId: string }>
}

export default async function AttendancePage({ params }: Props) {
  const { classId } = await params
  const { data: sessions, error } = await getAttendanceSessions(classId)

  return (
    <AttendanceClient
      classId={classId}
      initialSessions={sessions ?? []}
      error={error?.message ?? null}
    />
  )
}
