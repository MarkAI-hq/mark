import { getSession }             from '@/lib/session'
import { getClassDetails }        from '@/lib/actions/classes'
import { getClassExposureMatrix } from '@/lib/actions/gap-attribution'
import { GapReportClient }        from './_components/gap-report-client'

interface Props {
  params: Promise<{ classId: string }>
}

export default async function GapReportPage({ params }: Props) {
  const { classId } = await params
  const [session, classRes, matrixRes] = await Promise.all([
    getSession(),
    getClassDetails(classId),
    getClassExposureMatrix(classId),
  ])

  const isAdmin   = session?.role === 'Admin'
  const className = classRes.data?.name ?? null

  return (
    <GapReportClient
      classId={classId}
      className={className}
      classesUrl={isAdmin ? '/dashboard/classes' : '/dashboard/teacher/classes'}
      classUrl={isAdmin ? `/dashboard/classes/${classId}` : `/dashboard/teacher/classes/${classId}`}
      matrix={matrixRes.data ?? null}
      error={matrixRes.error?.message ?? null}
    />
  )
}
