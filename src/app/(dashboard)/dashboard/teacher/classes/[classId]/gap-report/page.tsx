import { getClassExposureMatrix } from '@/lib/actions/gap-attribution'
import { GapReportClient } from './_components/gap-report-client'

interface Props {
  params: Promise<{ classId: string }>
}

export default async function GapReportPage({ params }: Props) {
  const { classId } = await params
  const { data: matrix, error } = await getClassExposureMatrix(classId)

  return <GapReportClient classId={classId} matrix={matrix ?? null} error={error?.message ?? null} />
}
