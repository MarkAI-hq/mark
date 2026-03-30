import { notFound }          from 'next/navigation'
import { getAssessment }     from '@/lib/actions/assessments'
import { getEnrolledStudents } from '@/lib/actions/enrollments'
import { getLatestAudit }    from '@/lib/actions/audit' 
import { AssessmentClient }  from '@/components/assessments/assessment-client'

interface AssessmentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AssessmentDetailPage({ params }: AssessmentDetailPageProps) {
  const { id } = await params

  // 1. Fetch Assessment
  const { data: assessment, error } = await getAssessment(id)
  if (error || !assessment) return notFound()

  // 2. Fetch Latest Audit (contains findings and prediction)
  const { data: audit } = await getLatestAudit(id)

  // 3. Fetch Enrolled Students
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
      />
    </div>
  )
}