'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useReactToPrint } from 'react-to-print'
import { AlertTriangle, Loader2, Printer } from 'lucide-react'
import { SubmissionResult } from '@/lib/actions/results'
import { Assessment } from '@/lib/actions/assessments'
import { Student, ErrorType, BloomLevel } from '@/lib/types' // Import BloomLevel
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ScriptViewer } from './script-viewer'
import { FeedbackPanel } from './feedback-panel'

// FIXED: Add bloomsTaxonomy to the props interface
interface ResultsClientProps {
  submissionResults: SubmissionResult
  assessment: Assessment
  student: Student
  errorTaxonomy: ErrorType[]
  bloomsTaxonomy: BloomLevel[]
}

export function ResultsClient({
  submissionResults,
  assessment,
  student,
  errorTaxonomy,
  bloomsTaxonomy, // Receive the new prop
}: ResultsClientProps) {
  const studentName = `${student.first_name} ${student.last_name}`.trim()
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    // @ts-ignore
    content: () => printRef.current,
    documentTitle: `Feedback Report for ${studentName} - ${assessment.title}`,
  })

  if (
    submissionResults.grading_status === 'PENDING' ||
    submissionResults.grading_status === 'PROCESSING'
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-bold">Grading in Progress</h2>
        <p className="text-muted-foreground mt-2">
          The AI is currently analyzing this submission.
          <br />
          This page will automatically refresh when the results are ready.
        </p>
      </div>
    )
  }

  if (submissionResults.grading_status === 'FAILED') {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Grading Failed</AlertTitle>
        <AlertDescription>
          An unexpected error occurred while the AI was grading this submission.
          Please try re-submitting for grading, or contact support if the
          problem persists.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
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
            <BreadcrumbLink asChild>
              <Link href={`/dashboard/assessments/${assessment.assessment_id}/results`}>
                Class Results
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Results for {studentName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Assessment Results
          </h1>
          <p className="text-muted-foreground">
            Detailed feedback for {studentName} on &quot;{assessment.title}&quot;
          </p>
        </div>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </div>

      <div ref={printRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full print:grid-cols-2">
        <div className="col-span-1 print:col-span-1">
          <ScriptViewer scriptUrl={submissionResults.original_submission_url} />
        </div>
        <div className="col-span-1 print:col-span-1">
          <FeedbackPanel
            results={submissionResults}
            errorTaxonomy={errorTaxonomy}
            bloomsTaxonomy={bloomsTaxonomy}
          />
        </div>
      </div>
    </div>
  )
}
