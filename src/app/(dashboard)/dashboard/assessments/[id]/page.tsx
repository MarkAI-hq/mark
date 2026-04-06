import { notFound, redirect }   from 'next/navigation'
import { getAssessment }        from '@/lib/actions/assessments'
import { getEnrolledStudents }  from '@/lib/actions/enrollments'
import { getLatestAudit, getRedesignItems } from '@/lib/actions/audit'
import { AssessmentClient }     from '@/components/assessments/assessment-client'

interface AssessmentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AssessmentDetailPage({ params }: AssessmentDetailPageProps) {
  const { id } = await params

  // 1. Fetch Assessment
  const { data: assessment, error } = await getAssessment(id)

  // Auth error — cookie not ready on first client-side navigation
  if (error?.status === 401 || error?.status === 403) {
    redirect('/login')
  }

  // Any error or missing data — show not found
  if (error || !assessment) return notFound()

  // 2. Fetch Latest Audit (contains findings and prediction)
  const { data: audit } = await getLatestAudit(id)

  // 3. Fetch saved redesign items (blueprint items teacher has added)
  const { data: redesignItems } = await getRedesignItems(id)

  // 4. Fetch Enrolled Students
  let enrolledStudentCount = 0
  if (assessment.classId) {
    const { data: enrolled } = await getEnrolledStudents(assessment.classId)
    enrolledStudentCount = (enrolled ?? []).filter(s => s.status === 'active').length
  }

  return (
    <div className="space-y-6">
      <AssessmentClient
        assessment={assessment}
        enrolledStudentCount={enrolledStudentCount}
        latestAudit={audit}
        savedRedesignItems={redesignItems ?? []}
      />
    </div>
  )
}