'use client'

import React, { useEffect } from 'react'
import { SubmissionResult } from '@/lib/actions/results'
import { StudentCognitiveProfile } from '@/lib/types' 
import { BrainCircuit, BookOpen, Target, CheckSquare } from 'lucide-react'

interface LearningProcessAnalysisProps {
  results: SubmissionResult
  cognitiveProfile: StudentCognitiveProfile | null
}

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
      <div className="flex-shrink-0 mt-1 p-2 bg-white rounded-md shadow-sm border border-muted">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm sm:text-base">{title}</h4>
        <div className="text-sm text-muted-foreground mt-1">{children}</div>
      </div>
    </div>
  )
}

export function LearningProcessAnalysis({
  results,
  cognitiveProfile,
}: LearningProcessAnalysisProps) {
  
  // DEBUG STEP: Check your browser console to see exactly what is being passed
  useEffect(() => {
    console.log('🔍 Cognitive Profile Data:', cognitiveProfile);
    console.log('🔍 Submission Results:', results);
  }, [cognitiveProfile, results]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold tracking-tight text-foreground">
          Part 2: Learning Process Analysis (How you learn)
        </h3>
        <p className="text-sm text-muted-foreground">
          Insights into your learning patterns and personalized recommendations.
        </p>
      </div>

      <div className="space-y-6 rounded-xl border border-blue-100 bg-blue-50/30 p-5 shadow-sm">
        {/* Profile Section */}
        <AnalysisSection
          icon={<BrainCircuit className="h-5 w-5 text-purple-600" />}
          title="Your Learning Scientist Profile"
        >
          {cognitiveProfile ? (
            <>
              <p className="font-medium text-purple-900">
                {cognitiveProfile.profile_name}
              </p>
              {cognitiveProfile.profile_description && (
                <p className="text-xs leading-relaxed mt-1">
                  {cognitiveProfile.profile_description}
                </p>
              )}
            </>
          ) : (
            <div className="animate-pulse">
              <p className="text-muted-foreground italic">Profile data not found for this student.</p>
              <p className="text-[10px] mt-1 text-red-400">Verify: getStudentCognitiveProfile({results.student_id})</p>
            </div>
          )}
        </AnalysisSection>

        {/* Observed Patterns */}
        <AnalysisSection
          icon={<BookOpen className="h-5 w-5 text-blue-600" />}
          title="Observed Pattern"
        >
          <p className="leading-relaxed">
            {results.overall_feedback || 'Pattern analysis pending for this submission.'}
          </p>
        </AnalysisSection>

        {/* Strategy Recommendations */}
        <AnalysisSection
          icon={<Target className="h-5 w-5 text-green-600" />}
          title="Personalized Strategy Recommendation"
        >
          <p className="leading-relaxed italic">
            {results.responses?.[0]?.cognitive_feedback ||
              'Follow the specific guidance in your student toolkit for active recall.'}
          </p>
        </AnalysisSection>

        {/* Follow-up Tasks */}
        {results.follow_up_assignments && results.follow_up_assignments.length > 0 && (
          <AnalysisSection
            icon={<CheckSquare className="h-5 w-5 text-orange-600" />}
            title="Your Smart Follow-up Tasks"
          >
            <ul className="list-none space-y-2 mt-2">
              {results.follow_up_assignments.map((task, index) => (
                <li key={index} className="flex items-center gap-2 text-sm bg-white/60 p-2 rounded border border-orange-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                  {task.question}
                </li>
              ))}
            </ul>
          </AnalysisSection>
        )}
      </div>
    </div>
  )
}