// src/app/(dashboard)/dashboard/assessments/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getAssessment } from '@/lib/actions/assessments'
import { AssessmentClient } from '@/components/assessments/assessment-client' 

interface AssessmentDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AssessmentDetailPage({
  params,
}: AssessmentDetailPageProps) {
  // ✅ Await params before using
  const resolvedParams = await params

  const { data: assessment, error } = await getAssessment(resolvedParams.id)

  if (error || !assessment) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      <AssessmentClient assessment={assessment} />
    </div>
  )
}
