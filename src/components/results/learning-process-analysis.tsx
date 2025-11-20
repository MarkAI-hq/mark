'use client'

import { SubmissionResult } from '@/lib/actions/results'
import { BrainCircuit, BookOpen, Target, CheckSquare } from 'lucide-react'

interface LearningProcessAnalysisProps {
  results: SubmissionResult
  // In the future, we can pass the student's full cognitive profile object
  // for more detailed display.
  // cognitiveProfile: CognitiveProfile;
}

// A small helper component for consistent section styling
function AnalysisSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div className="flex-1">
        <h4 className="font-semibold">{title}</h4>
        <div className="text-sm text-muted-foreground mt-1">{children}</div>
      </div>
    </div>
  )
}

export function LearningProcessAnalysis({
  results,
}: LearningProcessAnalysisProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold tracking-tight">
        Part 2: Learning Process Analysis (How you learn)
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        Insights into your learning patterns and personalized recommendations.
      </p>

      <div className="mt-4 space-y-6 rounded-lg border bg-muted/20 p-4">
        <AnalysisSection
          icon={<BrainCircuit className="h-5 w-5 text-purple-500" />}
          title="Your Learning Scientist Profile"
        >
          {/* TODO: To get the real profile name, the page component will need to
              fetch the student's cognitive profile and pass it down. */}
          <p>The Energetic Explorer (Placeholder)</p>
        </AnalysisSection>

        <AnalysisSection
          icon={<BookOpen className="h-5 w-5 text-blue-500" />}
          title="Observed Pattern"
        >
          {/* This now displays the real overall feedback from the AI. */}
          <p>{results.overall_feedback || 'No overall feedback was generated.'}</p>
        </AnalysisSection>

        <AnalysisSection
          icon={<Target className="h-5 w-5 text-green-500" />}
          title="Personalized Strategy Recommendation"
        >
          {/* This now displays the real cognitive feedback from the AI.
              We take it from the first response record. */}
          <p>
            {results.responses[0]?.cognitive_feedback ||
              'No specific strategy recommendation was generated.'}
          </p>
        </AnalysisSection>

        {results.follow_up_assignments &&
          results.follow_up_assignments.length > 0 && (
            <AnalysisSection
              icon={<CheckSquare className="h-5 w-5 text-red-500" />}
              title="Your Smart Follow-up Tasks"
            >
              <ul className="list-disc pl-5 space-y-1">
                {results.follow_up_assignments.map((task, index) => (
                  <li key={index}>{task.question}</li>
                ))}
              </ul>
            </AnalysisSection>
          )}
      </div>
    </div>
  )
}
