'use client'

// src/components/reteach/reteach-session-content.tsx
// Shared content renderer — used by panel, modal, and full page

import { Badge }     from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  BookOpen, MessageSquare, Lightbulb,
  AlertCircle, CheckCircle2, Brain, Clock,
} from 'lucide-react'
import type { ReteachSession } from '@/lib/actions/reteach'

interface ReteachSessionContentProps {
  session: ReteachSession
}

const SCOPE_LABEL: Record<ReteachSession['scope'], string> = {
  individual:   'Individual Session',
  class:        'Whole-Class Session',
  longitudinal: 'Coaching Session',
}

const SCOPE_COLOR: Record<ReteachSession['scope'], string> = {
  individual:   'bg-amber-50 text-amber-700 border-amber-200',
  class:        'bg-blue-50 text-blue-700 border-blue-200',
  longitudinal: 'bg-purple-50 text-purple-700 border-purple-200',
}

export function ReteachSessionContent({ session }: ReteachSessionContentProps) {
  return (
    <div className="space-y-6">

      {/* ── Header meta ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={SCOPE_COLOR[session.scope]}>
          {SCOPE_LABEL[session.scope]}
        </Badge>
        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
          <Clock className="mr-1 h-3 w-3" />
          {session.duration_minutes} min
        </Badge>
        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
          {session.target_error}
        </Badge>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          {session.target_bloom_level}
        </Badge>
      </div>

      {/* ── Scripted explanation ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-slate-500" />
          <h4 className="text-sm font-medium text-slate-900">Scripted explanation</h4>
        </div>

        <div className="rounded-lg border bg-slate-50 p-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Opening</p>
            <p className="text-sm text-slate-700 leading-relaxed">{session.scripted_explanation.opening}</p>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Core concept</p>
            <p className="text-sm text-slate-700 leading-relaxed">{session.scripted_explanation.core_concept}</p>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Worked example</p>
            <p className="text-sm text-slate-700 leading-relaxed">{session.scripted_explanation.worked_example}</p>
          </div>
        </div>
      </div>

      {/* ── Example questions ────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-slate-500" />
          <h4 className="text-sm font-medium text-slate-900">Example questions</h4>
          <span className="text-xs text-slate-400">(teacher-led)</span>
        </div>
        <div className="space-y-2">
          {session.example_questions.map((q, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-800">{i + 1}. {q.question}</p>
                <Badge variant="outline" className="text-[10px] shrink-0 bg-slate-50 text-slate-500 border-slate-200">
                  {q.bloom_level}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="font-medium text-slate-600">Expected: </span>
                {q.expected_answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Practice questions ───────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-slate-500" />
          <h4 className="text-sm font-medium text-slate-900">Practice questions</h4>
          <span className="text-xs text-slate-400">(students work independently)</span>
        </div>
        <div className="space-y-2">
          {session.practice_questions.map((q, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-800">{i + 1}. {q.question}</p>
                <Badge variant="outline" className="text-[10px] shrink-0 bg-slate-50 text-slate-500 border-slate-200">
                  {q.bloom_level}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="font-medium text-slate-600">Expected: </span>
                {q.expected_answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Expected misconceptions ──────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-slate-500" />
          <h4 className="text-sm font-medium text-slate-900">Expected misconceptions</h4>
        </div>
        <div className="space-y-2">
          {session.expected_misconceptions.map((m, i) => (
            <div key={i} className="rounded-lg border border-amber-100 bg-amber-50 p-3 space-y-1">
              <p className="text-xs font-medium text-amber-800">
                Student might say: "{m.misconception}"
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                <span className="font-medium">Respond: </span>{m.correction}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cognitive tip (optional) ─────────────────────────────────── */}
      {session.cognitive_tip && (
        <div className="rounded-lg border border-purple-100 bg-purple-50 p-3 space-y-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Brain className="h-3.5 w-3.5 text-purple-600" />
            <p className="text-xs font-medium text-purple-800">Cognitive profile tip</p>
          </div>
          <p className="text-xs text-purple-700 leading-relaxed">{session.cognitive_tip}</p>
        </div>
      )}

      {/* ── Success criteria ─────────────────────────────────────────── */}
      <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 space-y-1">
        <div className="flex items-center gap-1.5 mb-1">
          <Lightbulb className="h-3.5 w-3.5 text-emerald-600" />
          <p className="text-xs font-medium text-emerald-800">How you know it worked</p>
        </div>
        <p className="text-xs text-emerald-700 leading-relaxed">{session.success_criteria}</p>
      </div>

    </div>
  )
}