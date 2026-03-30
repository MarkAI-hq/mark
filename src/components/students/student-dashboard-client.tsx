'use client'

// src/components/students/student-dashboard-client.tsx

import {
  TrendingUp, BookOpen, Target, Award,
  AlertCircle, CheckCircle2, Clock, Download,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge }          from '@/components/ui/badge'
import { Progress }       from '@/components/ui/progress'
import { Button }         from '@/components/ui/button'
import { ErrorTypeLabel } from '@/components/ui/error-type-label'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { format } from 'date-fns'
import { ExamHistoryDetail }  from '@/components/students/exam-history-detail'
import { LearningToolkits }   from '@/components/students/learning-toolkits'
import type { ExamHistoryItem, LearningTool, StudentCognitiveProfile } from '@/lib/actions/student-dashboard'

interface Props {
  user:           any
  analytics:      any
  currentProfile: StudentCognitiveProfile | null
  submissions:    any[]
  examHistory:    ExamHistoryItem[]
  tools:          LearningTool[]
}

const perfColor = (p: number) =>
  p >= 80 ? 'text-emerald-600' : p >= 65 ? 'text-amber-600' : p >= 50 ? 'text-orange-600' : 'text-rose-600'

const perfBg = (p: number) =>
  p >= 80 ? 'bg-emerald-50 border-emerald-200'
  : p >= 65 ? 'bg-amber-50 border-amber-200'
  : p >= 50 ? 'bg-orange-50 border-orange-200'
  : 'bg-rose-50 border-rose-200'

const perfLabel = (p: number) =>
  p >= 80 ? 'Excellent' : p >= 65 ? 'Good' : p >= 50 ? 'Developing' : 'Needs Support'

const statusColor: Record<string, string> = {
  COMPLETED:  'bg-emerald-100 text-emerald-700',
  GRADED:     'bg-emerald-100 text-emerald-700',
  PENDING:    'bg-slate-100 text-slate-600',
  PROCESSING: 'bg-blue-100 text-blue-700',
  FAILED:     'bg-rose-100 text-rose-700',
}

export function StudentDashboardClient({
  user, analytics, currentProfile, submissions, examHistory, tools,
}: Props) {

  // Normalise: API returns camelCase, fall back to snake_case
  const avg       = analytics?.averagePercentage  ?? analytics?.average_percentage  ?? 0
  const totalSubs = analytics?.totalSubmissions   ?? analytics?.total_submissions   ?? 0
  const bloom     = analytics?.bloomDistribution  ?? analytics?.bloom_distribution  ?? []
  const errors    = analytics?.errorDistribution  ?? analytics?.error_distribution  ?? []
  const scoreHist = analytics?.scoreHistory       ?? analytics?.score_history       ?? []

  const chartData = [...scoreHist]
    .reverse()
    .slice(0, 8)
    .map((s: any) => {
      const title = s.assessmentTitle ?? s.assessment_title ?? 'Assessment'
      return {
        name:  title.length > 14 ? title.slice(0, 13) + '…' : title,
        score: s.percentage ?? 0,
      }
    })

  const radarData = bloom.map((b: any) => ({
    subject:    b.level_name,
    percentage: b.percentage,
  }))

  const recentSubs = [...submissions]
    .sort((a, b) =>
      new Date(b.graded_at ?? b.submitted_at ?? 0).getTime() -
      new Date(a.graded_at ?? a.submitted_at ?? 0).getTime(),
    )
    .slice(0, 5)

  const firstName = user?.name?.split(' ')[0] ?? user?.first_name ?? 'Student'

  const handleCompassDownload = async () => {
    try {
      const res = await fetch('/api/student/compass/pdf', { credentials: 'include' })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = 'learning-compass.pdf'; a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open('/api/student/compass/pdf', '_blank')
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Welcome header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here&apos;s how you&apos;re performing across all your assessments.
          </p>
        </div>
        {currentProfile && (
          <Button
            variant="outline" size="sm" onClick={handleCompassDownload}
            className="shrink-0 gap-2 border-amber-200 text-amber-800 hover:bg-amber-50"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Learning Compass</span>
          </Button>
        )}
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className={`col-span-2 sm:col-span-1 border ${perfBg(avg)}`}>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Average Score</p>
            <p className={`text-4xl font-bold ${perfColor(avg)}`}>{avg}%</p>
            <Badge variant="outline" className={`mt-2 text-xs ${perfColor(avg)} border-current`}>
              {perfLabel(avg)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Assessments</p>
            <p className="text-4xl font-bold">{totalSubs}</p>
            <p className="text-xs text-muted-foreground mt-2">Graded so far</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Top Level</p>
            <p className="text-xl font-bold leading-tight">{bloom[0]?.level_name ?? '—'}</p>
            <p className="text-xs text-muted-foreground mt-2">Bloom&apos;s taxonomy</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Score history chart ───────────────────────────────────────── */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Score History
            </CardTitle>
            <CardDescription>Your recent assessment scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Score']} contentStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone" dataKey="score" stroke="#C9A84C" strokeWidth={2.5}
                    dot={{ fill: '#C9A84C', r: 4 }} activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Bloom's + Errors ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {radarData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Cognitive Depth
              </CardTitle>
              <CardDescription>Bloom&apos;s taxonomy breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      dataKey="percentage" stroke="#C9A84C" fill="#C9A84C"
                      fillOpacity={0.25} strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {errors.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500" />
                Areas to improve
              </CardTitle>
              <CardDescription>
                What your answers are losing marks on — tap a label to learn more
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {errors.slice(0, 4).map((e: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    {/* ErrorTypeLabel — shows plain-language description on hover */}
                    <ErrorTypeLabel
                      name={e.error_name}
                      description={e.description ?? null}
                      className="text-sm text-muted-foreground"
                    />
                    <span className="font-semibold tabular-nums shrink-0">{e.percentage}%</span>
                  </div>
                  <Progress value={e.percentage} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Cognitive profile ─────────────────────────────────────────── */}
      {currentProfile && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600" />
              Your Cognitive Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-lg">
                LC
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-semibold">{currentProfile.profile_name ?? 'Learning Profile'}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentProfile.profile_description ?? 'Your personalised learning profile.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Mental Energy</p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={((currentProfile.mental_energy_score ?? 0) / 24) * 100}
                        className="h-2 flex-1"
                      />
                      <span className="text-xs font-semibold w-8 tabular-nums">
                        {currentProfile.mental_energy_score ?? 0}/24
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Learning Strategy</p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={((currentProfile.learning_strategy_score ?? 0) / 24) * 100}
                        className="h-2 flex-1"
                      />
                      <span className="text-xs font-semibold w-8 tabular-nums">
                        {currentProfile.learning_strategy_score ?? 0}/24
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Learning Toolkits ─────────────────────────────────────────── */}
      {currentProfile && tools.length > 0 && (
        <LearningToolkits profile={currentProfile} tools={tools} />
      )}

      {/* ── Exam History ──────────────────────────────────────────────── */}
      {examHistory.length > 0 && (
        <ExamHistoryDetail examHistory={examHistory} />
      )}

      {/* ── Recent submissions ────────────────────────────────────────── */}
      {recentSubs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Recent Assessments
            </CardTitle>
            <CardDescription>Your latest graded work</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {recentSubs.map((sub: any, i: number) => {
              const status = sub.grading_status ?? sub.status ?? 'PENDING'
              const score  = sub.percentage_score ?? sub.score ?? null
              const date   = sub.graded_at ?? sub.submitted_at
              const title  = sub.assessment_title ?? sub.title ?? 'Assessment'
              return (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{title}</p>
                    {date && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {score !== null && (
                      <span className={`text-sm font-bold ${perfColor(score)}`}>{score}%</span>
                    )}
                    <Badge
                      className={`text-xs ${statusColor[status] ?? statusColor.PENDING}`}
                      variant="secondary"
                    >
                      {status === 'COMPLETED' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                      {status === 'COMPLETED' ? 'Graded' : status}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {totalSubs === 0 && recentSubs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No assessments yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your results will appear here once your teacher grades your work.
            </p>
          </CardContent>
        </Card>
      )}

    </div>
  )
}