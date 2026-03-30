'use client'

import { SubmissionResult } from '@/lib/actions/results'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ContentPerformance } from './content-performance'
import { LearningProcessAnalysis } from './learning-process-analysis'
import { ErrorType, BloomLevel, StudentCognitiveProfile } from '@/lib/types'

interface FeedbackPanelProps {
  results:          SubmissionResult
  errorTaxonomy:    ErrorType[]
  bloomsTaxonomy:   BloomLevel[]
  cognitiveProfile: StudentCognitiveProfile | null
  studentName:      string   // ← added so ReteachPanel can label the session
}

export function FeedbackPanel({
  results,
  errorTaxonomy,
  bloomsTaxonomy,
  cognitiveProfile,
  studentName,       // ← added
}: FeedbackPanelProps) {
  return (
    <Card className="h-full">
      <CardContent className="h-[calc(100%-4rem)] p-0">
        <ScrollArea className="h-full p-6">
          <div className="space-y-8">
            <ContentPerformance
              responses={results.responses}
              errorTaxonomy={errorTaxonomy}
              bloomsTaxonomy={bloomsTaxonomy}
              submissionId={results.submission_id}   // ← added
              studentName={studentName}               // ← added
            />
            <LearningProcessAnalysis
              results={results}
              cognitiveProfile={cognitiveProfile}
            />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}