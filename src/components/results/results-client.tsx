'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useReactToPrint } from 'react-to-print'
import { AlertTriangle, Loader2, Printer, Brain, Lightbulb } from 'lucide-react'
import { SubmissionResult } from '@/lib/actions/results'
import { Assessment } from '@/lib/actions/assessments'
import { Student, ErrorType, BloomLevel } from '@/lib/types'
import { StudentCognitiveProfile } from '@/lib/actions/cognitive' // Import the new type
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScriptViewer } from './script-viewer'
import { FeedbackPanel } from './feedback-panel'

interface ResultsClientProps {
  submissionResults: SubmissionResult
  assessment: Assessment
  student: Student
  errorTaxonomy: ErrorType[]
  bloomsTaxonomy: BloomLevel[]
  cognitiveProfile: StudentCognitiveProfile | null // Added missing prop type
}

export function ResultsClient({
  submissionResults,
  assessment,
  student,
  errorTaxonomy,
  bloomsTaxonomy,
  cognitiveProfile, // Receive the profile
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
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Assessment Results
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              Detailed feedback for {studentName}
            </p>
            {cognitiveProfile && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                <Brain className="w-3 h-3" />
                {cognitiveProfile.profile_name}
              </Badge>
            )}
          </div>
        </div>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </div>

      {/* Cognitive Profile Alert/Ribbon for Teachers */}
      {cognitiveProfile && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-full shadow-sm">
                <Lightbulb className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Learning Scientist Identity: {cognitiveProfile.profile_name}</p>
                <p className="text-xs text-blue-700 line-clamp-1">{cognitiveProfile.profile_description}</p>
              </div>
            </div>
            {/* <Link href={`/dashboard/classes/current/students/${student.id}`}>
              <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-800 hover:bg-blue-100">
                View Toolkit
              </Button>
            </Link> */}
          </CardContent>
        </Card>
      )}

      <div ref={printRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full print:grid-cols-2">
        <div className="col-span-1 print:col-span-1">
          <ScriptViewer scriptUrl={submissionResults.original_submission_url} />
        </div>
        <div className="col-span-1 print:col-span-1">
          <FeedbackPanel
            results={submissionResults}
            errorTaxonomy={errorTaxonomy}
            bloomsTaxonomy={bloomsTaxonomy}
            cognitiveProfile={cognitiveProfile}
          />
        </div>
      </div>
    </div>
  )
}