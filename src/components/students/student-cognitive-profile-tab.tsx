'use client'

// src/components/students/student-cognitive-profile-tab.tsx

import { useState } from 'react'
import { format } from 'date-fns'
import { Printer, Loader2, Brain, Zap, BookOpen, TrendingUp, Clock } from 'lucide-react'
import { toast } from 'sonner'

import { StudentCognitiveProfile } from '@/lib/actions/student-details'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface StudentCognitiveProfileTabProps {
  profiles:    StudentCognitiveProfile[]
  studentId:   string
  classId:     string
  studentName: string
  readOnly?:   boolean  // hides Print Report button
}

function ScoreGauge({ label, score, maxScore, color }: {
  label: string; score: number; maxScore: number; color: string
}) {
  const pct = Math.min((score / maxScore) * 100, 100)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>
          {score} <span className="text-xs font-normal text-muted-foreground">/ {maxScore}</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function HistoryRow({ profile }: { profile: StudentCognitiveProfile }) {
  const date = profile.assessment_date
    ? format(new Date(profile.assessment_date), 'MMM d, yyyy')
    : 'Unknown date'
  return (
    <div className="flex items-center gap-4 py-3 border-b last:border-0">
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      <div className="flex items-center gap-6 shrink-0">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Mental Energy</p>
          <p className="text-sm font-semibold">{profile.mental_energy_score ?? '—'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Learning Strategy</p>
          <p className="text-sm font-semibold">{profile.learning_strategy_score ?? '—'}</p>
        </div>
      </div>
    </div>
  )
}

export function StudentCognitiveProfileTab({
  profiles, studentId, classId, studentName, readOnly = false,
}: StudentCognitiveProfileTabProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  const sorted  = [...profiles].sort(
    (a, b) => new Date(b.assessment_date ?? 0).getTime() - new Date(a.assessment_date ?? 0).getTime(),
  )
  const current = sorted.find((p) => p.is_current) ?? sorted[0] ?? null
  const history = sorted.filter((p) => p.student_profile_id !== current?.student_profile_id)

  async function handlePrintCognitive() {
    if (isPrinting) return
    setIsPrinting(true)
    toast.info('Generating cognitive profile report…')
    try {
      const res = await fetch('/api/reports/cognitive-profile', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentId, classId }),
      })
      if (!res.ok) { toast.error('Failed to generate report. Please try again.'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${studentName.replace(/\s+/g, '_')}_Cognitive_Profile.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      toast.success('Cognitive profile downloaded.')
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setIsPrinting(false)
    }
  }

  if (profiles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Brain className="h-10 w-10 mb-3 opacity-25" />
          <p className="font-medium">No cognitive profile yet</p>
          <p className="text-sm mt-1">Use the Assess Profile button to run an assessment.</p>
        </CardContent>
      </Card>
    )
  }

  const maxMental   = 24
  const maxStrategy = 24
  const mentalPct   = current ? ((current.mental_energy_score    ?? 0) / maxMental)   * 100 : 0
  const stratPct    = current ? ((current.learning_strategy_score ?? 0) / maxStrategy) * 100 : 0
  const overallPct  = (mentalPct + stratPct) / 2

  const profileColor =
    overallPct >= 75 ? '#059669' :
    overallPct >= 55 ? '#f6f6f6' :
    overallPct >= 40 ? '#D97706' : '#E11D48'

  const profileLabel =
    overallPct >= 75 ? 'Strong' :
    overallPct >= 55 ? 'Developing' :
    overallPct >= 40 ? 'Emerging' : 'Needs Support'

  return (
    <div className="space-y-4">

      {current && (
        <Card className="overflow-hidden">
          <div className="h-1.5 w-full" style={{ backgroundColor: profileColor }} />

          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="default" className="text-xs">Current Profile</Badge>
                  <Badge variant="outline" className="text-xs" style={{ color: profileColor, borderColor: profileColor + '44' }}>
                    {profileLabel}
                  </Badge>
                </div>
                <CardTitle className="text-lg">Cognitive Assessment</CardTitle>
                <CardDescription>
                  {current.assessment_date
                    ? `Assessed on ${format(new Date(current.assessment_date), 'MMMM d, yyyy')}`
                    : 'Assessment date unknown'}
                </CardDescription>
              </div>

              {/* Print Report — hidden for teachers */}
              {!readOnly && (
                <Button variant="outline" size="sm" onClick={handlePrintCognitive} disabled={isPrinting} className="shrink-0">
                  {isPrinting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Printer className="mr-2 h-3.5 w-3.5" />}
                  {isPrinting ? 'Generating…' : 'Print Report'}
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-3 rounded-lg bg-muted/40 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                    <Zap className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Mental Energy</p>
                    <p className="text-xs text-muted-foreground">Information processing capacity</p>
                  </div>
                </div>
                <ScoreGauge label="Score" score={current.mental_energy_score ?? 0} maxScore={maxMental} color="#4F46E5" />
              </div>

              <div className="space-y-3 rounded-lg bg-muted/40 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Learning Strategy</p>
                    <p className="text-xs text-muted-foreground">Information application ability</p>
                  </div>
                </div>
                <ScoreGauge label="Score" score={current.learning_strategy_score ?? 0} maxScore={maxStrategy} color="#059669" />
              </div>
            </div>

            {current.notes && (
              <div className="rounded-lg border border-dashed p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Assessor Notes</p>
                <p className="text-sm">{current.notes}</p>
              </div>
            )}

            {history.length > 0 && (() => {
              const prev         = history[0]
              const totalDelta   = (current.mental_energy_score ?? 0) - (prev.mental_energy_score ?? 0)
                                 + (current.learning_strategy_score ?? 0) - (prev.learning_strategy_score ?? 0)
              return (
                <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
                  <TrendingUp className={`h-4 w-4 shrink-0 ${totalDelta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
                  <p className="text-xs text-muted-foreground">
                    {totalDelta > 0
                      ? `Improved by ${totalDelta} points since last assessment`
                      : totalDelta < 0
                      ? `Declined by ${Math.abs(totalDelta)} points since last assessment`
                      : 'No change since last assessment'}
                  </p>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Assessment History</CardTitle>
            </div>
            <CardDescription className="text-xs">2 most recent previous assessments</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {history.slice(0, 2).map((p) => (
              <HistoryRow key={p.student_profile_id} profile={p} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}