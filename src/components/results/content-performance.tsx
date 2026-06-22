'use client'

import { SubmissionResponse } from '@/lib/actions/results'
import { Badge }              from '@/components/ui/badge'
import { Separator }          from '@/components/ui/separator'
import { Lightbulb, AlertCircle, Brain } from 'lucide-react'
import { ErrorType, BloomLevel }         from '@/lib/types'
import { ReteachPanel }       from '@/components/reteach/reteach-panel'  // ← added
import { SourcesConsulted }   from '@/components/common/sources-consulted'

interface ContentPerformanceProps {
  responses:       SubmissionResponse[]
  errorTaxonomy:   ErrorType[]
  bloomsTaxonomy:  BloomLevel[]
  submissionId:    string   // ← added
  studentName:     string   // ← added
}

export function ContentPerformance({
  responses,
  errorTaxonomy,
  bloomsTaxonomy,
  submissionId,   // ← added
  studentName,    // ← added
}: ContentPerformanceProps) {
  const errorMap  = new Map(errorTaxonomy.map((e) => [e.error_id, e.error_name]))
  const bloomsMap = new Map(bloomsTaxonomy.map((b) => [b.level_id, b.level_name]))

  return (
    <div>
      <h3 className="text-lg font-semibold tracking-tight">
        Part 1: Content Performance (What you know)
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        A question-by-question breakdown of the AI&apos;s analysis of the content.
      </p>

      <div className="mt-4 space-y-6">
        {responses.map((response, index) => {
          // Resolve the top error label for the panel subtitle
          const topErrorId    = response.identified_errors?.[0]
          const topErrorLabel = topErrorId ? (errorMap.get(topErrorId) ?? 'Error') : 'Error'
          const hasErrors     = response.identified_errors && response.identified_errors.length > 0

          return (
            <div key={response.response_id}>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Overall Submission Analysis</h4>
                <Badge variant={response.points_earned === null ? 'outline' : 'secondary'}>
                  Score: {response.points_earned ?? 'N/A'}
                </Badge>
              </div>

              {response.content_feedback && (
                <div className="mt-3 flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
                  <Lightbulb className="h-5 w-5 flex-shrink-0 text-blue-500 mt-1" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Feedback</p>
                    <p className="text-sm text-muted-foreground">
                      {response.content_feedback}
                    </p>
                  </div>
                </div>
              )}

              <SourcesConsulted
                citations={response.sources_consulted}
                className="mt-3"
              />

              {response.blooms_level_achieved && (
                <div className="mt-3 flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
                  <Brain className="h-5 w-5 flex-shrink-0 text-purple-500 mt-1" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Cognitive Level</p>
                    <p className="text-sm text-muted-foreground">
                      Level Achieved: {bloomsMap.get(response.blooms_level_achieved) || 'Unknown Level'}
                    </p>
                  </div>
                </div>
              )}

              {hasErrors && (
                <div className="mt-3 flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-1" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Identified Issues</p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {response.identified_errors!.map((errorId) => (
                        <li key={errorId}>
                          {errorMap.get(errorId) || 'Unknown Error'}
                        </li>
                      ))}
                    </ul>

                    {/* ── Button 1: Generate reteach session ── */}
                    <ReteachPanel
                      submissionId={submissionId}
                      studentName={studentName}
                      errorType={topErrorLabel}
                    />
                  </div>
                </div>
              )}

              {index < responses.length - 1 && <Separator className="mt-6" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}