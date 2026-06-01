'use client'

// src/components/gap-attribution/gap-attribution-card.tsx
// B3: Renders a student's gap attribution diagnoses

import Link  from 'next/link'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, BookOpen, Clock, CheckCircle2, Zap } from 'lucide-react'
import type { StudentGapAttribution, AttributionType } from '@/lib/actions/gap-attribution'

const ATTRIBUTION_META: Record<AttributionType, {
  label:   string
  color:   string   // Tailwind border + bg
  text:    string
  Icon:    React.ComponentType<{ className?: string }>
}> = {
  taught_not_understood: {
    label: 'Needs Reteaching',
    color: 'border-purple-200 bg-purple-50',
    text:  'text-purple-700',
    Icon:  Brain,
  },
  never_exposed: {
    label: 'Missed Lessons',
    color: 'border-rose-200 bg-rose-50',
    text:  'text-rose-700',
    Icon:  AlertTriangle,
  },
  partially_exposed: {
    label: 'Partial Exposure',
    color: 'border-amber-200 bg-amber-50',
    text:  'text-amber-700',
    Icon:  Clock,
  },
  not_yet_taught: {
    label: 'Not Yet Taught',
    color: 'border-slate-200 bg-slate-50',
    text:  'text-slate-600',
    Icon:  BookOpen,
  },
}

function Brain({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  )
}

interface GapAttributionCardProps {
  gaps:        StudentGapAttribution[]
  studentId:   string
  assessmentId?: string
  className?:  string
}

export function GapAttributionCard({ gaps, studentId, assessmentId, className }: GapAttributionCardProps) {
  if (!gaps.length) return null

  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Gap Attribution</p>
      <div className="space-y-2">
        {gaps.slice(0, 6).map((gap, i) => {
          const meta = ATTRIBUTION_META[gap.attribution] ?? ATTRIBUTION_META.not_yet_taught
          const Icon = meta.Icon
          return (
            <div key={i} className={`rounded-lg border p-3 ${meta.color}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${meta.text}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900">{gap.topic}</span>
                      <Badge variant="outline" className={`text-xs border-current ${meta.text}`}>
                        {meta.label}
                      </Badge>
                    </div>
                    {gap.subtopic && (
                      <p className="text-xs text-slate-500 mt-0.5">{gap.subtopic}</p>
                    )}
                    <p className={`text-xs mt-1 ${meta.text}`}>{gap.explanation}</p>
                    {gap.attendance_pct !== null && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Attendance: {gap.attendance_pct}% of lessons
                      </p>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  {gap.sessions_count > 0 ? (
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Session exists
                    </div>
                  ) : gap.attribution === 'taught_not_understood' ? (
                    assessmentId ? (
                      <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                        <Link href={`/dashboard/assessments/${assessmentId}/reteach`}>
                          <Zap className="h-3 w-3 mr-1" />
                          Generate
                        </Link>
                      </Button>
                    ) : null
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
