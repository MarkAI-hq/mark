import { Metadata } from 'next'

// FIXED: Use a non-relative path alias for robustness.
// This resolves the "is not exported" error.
import { ExamsClient } from '@/app/(dashboard)/dashboard/exams/exams-client'
import { getAssessments } from '@/lib/actions/assessments'
import { getSubjects } from '@/lib/actions/subjects'

export const metadata: Metadata = {
  title: 'Assessments - Mark',
  description: 'Manage your assessments',
}

export default async function ExamsPage() {
  const [{ data: assessments }, { data: subjects }] = await Promise.all([
    getAssessments(),
    getSubjects(),
  ])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Assessments</h2>
      </div>
      <ExamsClient assessments={assessments ?? []} subjects={subjects ?? []} />
    </div>
  )
}
