// src/components/students/exam-history-detail.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText, ExternalLink, CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import type { ExamHistoryItem, StudentResponse } from '@/lib/actions/student-dashboard'

// ── Helpers ────────────────────────────────────────────────────────────────

const perfColor = (p: number) =>
  p >= 80 ? 'text-emerald-600' : p >= 65 ? 'text-amber-600' : p >= 50 ? 'text-orange-600' : 'text-rose-600'

const perfBg = (p: number) =>
  p >= 80 ? 'bg-emerald-50 border-emerald-200'
  : p >= 65 ? 'bg-amber-50 border-amber-200'
  : p >= 50 ? 'bg-orange-50 border-orange-200'
  : 'bg-rose-50 border-rose-200'

function QuestionFeedbackRow({ response, index }: { response: StudentResponse; index: number }) {
  const [open, setOpen] = useState(false)

  const earned  = response.points_earned  ?? null
  const max     = response.max_points     ?? null
  const hasPts  = earned !== null && max !== null
  const pct     = hasPts ? Math.round((earned / max) * 100) : null
  const feedback = response.teacher_feedback ?? response.ai_feedback ?? null

  const ScoreIcon = pct === null ? MinusCircle
    : pct >= 70 ? CheckCircle2
    : XCircle

  const iconClass = pct === null ? 'text-slate-400'
    : pct >= 70   ? 'text-emerald-500'
    : 'text-rose-500'

  return (
    <div className="border rounded-lg overflow-hidden transition-all">
      {/* Row header — always visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <ScoreIcon className={`h-4 w-4 shrink-0 ${iconClass}`} />

        <span className="text-sm font-medium flex-1 min-w-0 truncate">
          Question {index + 1}
        </span>

        {hasPts && (
          <span className={`text-sm font-bold shrink-0 ${perfColor(pct!)}`}>
            {earned}/{max}
          </span>
        )}

        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded feedback */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t bg-slate-50/60">

          {/* Score bar */}
          {hasPts && (
            <div className="pt-3 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Score</span>
                <span className={`font-semibold ${perfColor(pct!)}`}>{pct}%</span>
              </div>
              <Progress value={pct!} className="h-1.5" />
            </div>
          )}

          {/* Student answer */}
          {response.student_answer && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Your Answer
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {response.student_answer}
              </p>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Feedback
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {feedback}
              </p>
            </div>
          )}

          {/* Bloom's level */}
          {response.blooms_level_achieved && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Cognitive level:</p>
              <Badge variant="outline" className="text-xs text-amber-700 border-amber-300 bg-amber-50">
                {response.blooms_level_achieved}
              </Badge>
            </div>
          )}

          {/* No data fallback */}
          {!response.student_answer && !feedback && (
            <p className="text-xs text-muted-foreground pt-3 italic">
              No feedback available for this question yet.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Single exam card ───────────────────────────────────────────────────────

function ExamCard({ item }: { item: ExamHistoryItem }) {
  const [open, setOpen] = useState(false)

  const pct   = item.percentage_score ?? 0
  const date  = item.graded_at

  return (
    <div className={`border rounded-xl overflow-hidden ${open ? 'shadow-sm' : ''}`}>
      {/* Card header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-4 px-4 py-4 text-left transition-colors
          ${open ? 'bg-amber-50/60' : 'hover:bg-slate-50'}`}
        aria-expanded={open}
      >
        {/* Score circle */}
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 font-bold text-sm
          ${perfBg(pct)} ${perfColor(pct)}`}>
          {pct}%
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{item.assessment_title}</p>
          {date && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(date), 'MMM d, yyyy')}
            </p>
          )}
          {item.total_score !== null && item.max_score !== null && (
            <p className="text-xs text-muted-foreground">
              {item.total_score} / {item.max_score} marks
            </p>
          )}
        </div>

        {item.responses.length > 0 && (
          <Badge variant="outline" className="text-xs shrink-0">
            {item.responses.length} {item.responses.length === 1 ? 'question' : 'questions'}
          </Badge>
        )}

        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded: script links + per-question feedback */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t">

          {/* Script download links */}
          {(item.original_submission_url || item.annotated_script_url) && (
            <div className="flex flex-wrap gap-2 pt-3">
              {item.original_submission_url && (
                <a
                  href={item.original_submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
                    border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Your script
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              )}
              {item.annotated_script_url && (
                <a
                  href={item.annotated_script_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
                    border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Marked script
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {/* Per-question rows */}
          {item.responses.length > 0 ? (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Per-Question Breakdown
              </p>
              {item.responses.map((r, i) => (
                <QuestionFeedbackRow key={r.response_id} response={r} index={i} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground pt-2 italic">
              Detailed question feedback is not available for this assessment.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Public component ───────────────────────────────────────────────────────

interface Props {
  examHistory: ExamHistoryItem[]
}

export function ExamHistoryDetail({ examHistory }: Props) {
  if (!examHistory.length) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Exam History
        </CardTitle>
        <CardDescription>
          Click any exam to see your score breakdown and per-question feedback
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {examHistory.map((item) => (
          <ExamCard key={item.submission_id} item={item} />
        ))}
      </CardContent>
    </Card>
  )
}