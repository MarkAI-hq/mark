'use client'

import { useState, useEffect } from 'react' // Import useEffect
import { BrainCircuit } from 'lucide-react'
import Link from 'next/link'
import { Assessment } from '@/lib/actions/assessments'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { BatchGradingDialog } from '@/components/grading/batch-grading-dialog'

interface AssessmentClientProps {
  assessment: Assessment
}

export function AssessmentClient({ assessment }: AssessmentClientProps) {
  const [isGradingDialogOpen, setIsGradingDialogOpen] = useState(false)

  // --- DEBUGGING CHECKPOINT 3 ---
  useEffect(() => {
    console.log('[DEBUG] AssessmentClient received assessment prop:', assessment);
  }, [assessment]);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/exams">Assessments</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{assessment.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{assessment.title}</h1>
          <p className="text-muted-foreground">
            {assessment.className} - {assessment.subject}
          </p>
        </div>
        {assessment.assessment_type === 'AI_ASSISTED_GRADING' && (
          <Button onClick={() => setIsGradingDialogOpen(true)}>
            <BrainCircuit className="mr-2 h-4 w-4" />
            Grade with AI
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3 pt-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">
                Description
              </span>
              <p className="text-base">{assessment.description || 'No description provided.'}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">
                Grading Type
              </span>
              <Badge variant="outline" className="w-fit mt-1">
                {assessment.assessment_type === 'AI_ASSISTED_GRADING'
                  ? 'AI Assisted Grading'
                                    : 'Manual Grading'}
              </Badge>
            </div>
            {assessment.structure_type && (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">
                  Structure
                </span>
                <Badge variant="secondary" className="w-fit mt-1">
                  {assessment.structure_type === 'DATABASE'
                    ? 'Structured (Database)'
                    : 'Unstructured (PDF)'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {assessment.marking_scheme_url ? (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Marking Scheme</CardTitle>
              <CardDescription>
                This is the rubric or guide used for grading this assessment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <iframe
                src={assessment.marking_scheme_url}
                className="w-full h-[600px] rounded-md border"
                title="Marking Scheme"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="md:col-span-2 flex items-center justify-center text-muted-foreground bg-muted/40 rounded-lg border">
            No marking scheme was uploaded for this assessment.
          </div>
        )}
      </div>

      <BatchGradingDialog
        open={isGradingDialogOpen}
        onOpenChange={setIsGradingDialogOpen}
        assessmentId={assessment.assessment_id}
        classId={assessment.classId}
      />
    </>
  )
}
