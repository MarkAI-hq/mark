'use client'

import { SubmissionResult } from '@/lib/actions/results'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ContentPerformance } from './content-performance'
import { LearningProcessAnalysis } from './learning-process-analysis'
import { ErrorType, BloomLevel } from '@/lib/types'

interface FeedbackPanelProps {
  results: SubmissionResult
  errorTaxonomy: ErrorType[]
  bloomsTaxonomy: BloomLevel[]
}

export function FeedbackPanel({
  results,
  errorTaxonomy,
  bloomsTaxonomy,
}: FeedbackPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>AI-Generated Feedback Report</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-4rem)] p-0">
        <ScrollArea className="h-full p-6">
          <div className="space-y-8">
            <ContentPerformance
              responses={results.responses}
              errorTaxonomy={errorTaxonomy}
              bloomsTaxonomy={bloomsTaxonomy}
            />
            <LearningProcessAnalysis results={results} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
