// src/app/(dashboard)/dashboard/assessments/[id]/results/page.tsx

import { notFound }                        from 'next/navigation'
import { getSubmissionsForAssessment }     from '@/lib/actions/submissions'
import { getAssessment }                   from '@/lib/actions/assessments'
import { SubmissionsListClient }           from '@/components/results/submissions-list-client'
import { AssessmentImpactTab }             from '@/components/results/assessment-impact-tab'
import { InterventionSuggestionBanner }   from '@/components/reteach/intervention-suggestion-banner'
import { BulkGenerateButton }             from '@/components/reteach/bulk-generate-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import Link from 'next/link'

// Always fetch fresh — never serve a cached version after grading completes
export const dynamic = 'force-dynamic'

interface SubmissionsPageProps {
  params: Promise<{ id: string }>
}

export default async function SubmissionsPage({ params }: SubmissionsPageProps) {
  const { id: assessmentId } = await params

  const [submissionsRes, assessmentRes] = await Promise.all([
    getSubmissionsForAssessment(assessmentId),
    getAssessment(assessmentId),
  ])

  const { data: submissions, error: submissionsError } = submissionsRes
  const { data: assessment,  error: assessmentError  } = assessmentRes

  if (submissionsError || assessmentError || !assessment) {
    return notFound()
  }

  return (
    <div className="space-y-4">

      {/* ── Breadcrumb ───────────────────────────────────────────────── */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/exam-builder">Examination Centre</Link>
            </BreadcrumbLink>
          <BreadcrumbSeparator />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/exams">Assessments</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/dashboard/assessments/${assessment.assessment_id}`}>
                {assessment.title}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Student Results</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Results</h1>
          <p className="text-muted-foreground">
            Results for &quot;{assessment.title}&quot;
          </p>
        </div>
        {(submissions?.length ?? 0) > 0 && (
          <BulkGenerateButton assessmentId={assessmentId} />
        )}
      </div>

      {/* ── C2/C1: Intervention suggestion banner ───────────────────── */}
      <InterventionSuggestionBanner assessmentId={assessmentId} />

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <Tabs defaultValue="results" className="w-full">
        <TabsList>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="impact">Intervention Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-4">
          <SubmissionsListClient
            initialSubmissions={submissions ?? []}
            assessmentId={assessmentId}
          />
        </TabsContent>

        <TabsContent value="impact" className="mt-4">
          <AssessmentImpactTab assessmentId={assessmentId} />
        </TabsContent>
      </Tabs>

    </div>
  )
}