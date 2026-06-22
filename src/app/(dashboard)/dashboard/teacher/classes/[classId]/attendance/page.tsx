import { getSession }          from '@/lib/session'
import { getClassDetails }      from '@/lib/actions/classes'
import { getAttendanceSessions } from '@/lib/actions/attendance'
import { AttendanceClient }     from './_components/attendance-client'

interface Props {
  params: Promise<{ classId: string }>
}

export default async function AttendancePage({ params }: Props) {
  const { classId } = await params
  const [session, classRes, sessionsRes] = await Promise.all([
    getSession(),
    getClassDetails(classId),
    getAttendanceSessions(classId),
  ])

  const isAdmin   = session?.role === 'Admin'
  const className = classRes.data?.name ?? null

  return (
    <AttendanceClient
      classId={classId}
      className={className}
      classesUrl={isAdmin ? '/dashboard/classes' : '/dashboard/teacher/classes'}
      classUrl={isAdmin ? `/dashboard/classes/${classId}` : `/dashboard/teacher/classes/${classId}`}
      initialSessions={sessionsRes.data ?? []}
      error={sessionsRes.error?.message ?? null}
    />
  )
}
