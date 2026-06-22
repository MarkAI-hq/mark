import { notFound }            from 'next/navigation'
import { getSession }          from '@/lib/session'
import { getClassDetails }     from '@/lib/actions/classes'
import { getAttendanceSession } from '@/lib/actions/attendance'
import { AttendanceMarkingSheet } from './_components/attendance-marking-sheet'

interface Props {
  params: Promise<{ classId: string; sessionId: string }>
}

export default async function SessionPage({ params }: Props) {
  const { classId, sessionId } = await params
  const [session, classRes, attendanceRes] = await Promise.all([
    getSession(),
    getClassDetails(classId),
    getAttendanceSession(sessionId),
  ])

  if (attendanceRes.error?.status === 404 || !attendanceRes.data) notFound()

  const isAdmin   = session?.role === 'Admin'
  const className = classRes.data?.name ?? null

  return (
    <AttendanceMarkingSheet
      classId={classId}
      className={className}
      classUrl={isAdmin ? `/dashboard/classes/${classId}` : `/dashboard/teacher/classes/${classId}`}
      classesUrl={isAdmin ? '/dashboard/classes' : '/dashboard/teacher/classes'}
      detail={attendanceRes.data}
    />
  )
}
