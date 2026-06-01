import { notFound } from 'next/navigation'
import { getAttendanceSession } from '@/lib/actions/attendance'
import { AttendanceMarkingSheet } from './_components/attendance-marking-sheet'

interface Props {
  params: Promise<{ classId: string; sessionId: string }>
}

export default async function SessionPage({ params }: Props) {
  const { classId, sessionId } = await params
  const { data, error } = await getAttendanceSession(sessionId)

  if (error?.status === 404 || !data) notFound()

  return <AttendanceMarkingSheet classId={classId} detail={data} />
}
