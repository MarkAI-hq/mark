'use client'

import { SubmissionResult } from '@/lib/actions/results'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ContentPerformance } from './content-performance'
import { LearningProcessAnalysis } from './learning-process-analysis'
import { ErrorType, BloomLevel, StudentCognitiveProfile } from '@/lib/types' // Added StudentCognitiveProfile

interface FeedbackPanelProps {
  results: SubmissionResult
  errorTaxonomy: ErrorType[]
  bloomsTaxonomy: BloomLevel[]
  cognitiveProfile: StudentCognitiveProfile | null // Added this to the interface
}

export function FeedbackPanel({
  results,
  errorTaxonomy,
  bloomsTaxonomy,
  cognitiveProfile, // Destructure the new prop
}: FeedbackPanelProps) {
  return (
    <Card className="h-full">
      {/* <CardHeader>
        <CardTitle>Feedback Report</CardTitle>
      </CardHeader> */}
      <CardContent className="h-[calc(100%-4rem)] p-0">
        <ScrollArea className="h-full p-6">
          <div className="space-y-8">
            <ContentPerformance
              responses={results.responses}
              errorTaxonomy={errorTaxonomy}
              bloomsTaxonomy={bloomsTaxonomy}
            />
            {/* FIX: Pass the cognitiveProfile down to the analysis component */}
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