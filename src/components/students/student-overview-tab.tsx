'use client'

// src/components/students/student-overview-tab.tsx
// No functional changes — ErrorTypeLabel already wired correctly with description.
// description type corrected to string | null for consistency with DB shape.

import { ReactNode, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, Minus, Brain, AlertTriangle, BarChart2 } from 'lucide-react'
import { Student } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge }          from '@/components/ui/badge'
import { Skeleton }       from '@/components/ui/skeleton'
import { ErrorTypeLabel } from '@/components/ui/error-type-label'
import { ReteachModal }   from '@/components/reteach/reteach-modal'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'

interface StudentOverviewTabProps {
  student:   Student
  studentId: string
}

interface StudentAnalytics {
  totalSubmissions:   number
  averageScore:       number
  averagePercentage:  number
  bloomDistribution:  Array<{ level_code: string; level_name: string; count: number; percentage: number }>
  errorDistribution:  Array<{ error_code: string; error_name: string; description: string | null; count: number; percentage: number }>
  scoreHistory:       Array<{ assessmentTitle: string; score: number; maxScore: number; percentage: number; gradedAt: string }>
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm">{value || '—'}</span>
    </div>
  )
}

function TrendIcon({ pct }: { pct: number }) {
  if (pct >= 70) return <TrendingUp   className="h-4 w-4 text-green-500" />
  if (pct >= 50) return <Minus        className="h-4 w-4 text-amber-500" />
  return              <TrendingDown className="h-4 w-4 text-red-500"   />
}

function PerformanceBadge({ pct }: { pct: number }) {
  if (pct >= 80) return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>
  if (pct >= 70) return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good</Badge>
  if (pct >= 50) return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Developing</Badge>
  return              <Badge className="bg-red-100 text-red-800 border-red-200">Needs Support</Badge>
}

export function StudentOverviewTab({ student, studentId }: StudentOverviewTabProps) {
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null)
  const [loading,   setLoading]   = useState(true)

  const studentName  = `${student.first_name} ${student.last_name}`.trim()
  const formattedDob = student.date_of_birth
    ? format(new Date(student.date_of_birth), 'MMMM d, yyyy')
    : null

  useEffect(() => {
    fetch(`/api/analytics/student/${studentId}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false))
  }, [studentId])

  const bloomRadarData = analytics?.bloomDistribution.map((b) => ({
    level:       b.level_name,
    achievement: b.percentage,
  })) ?? []

  const scoreChartData = [...(analytics?.scoreHistory ?? [])]
    .reverse()
    .slice(0, 8)
    .map((h, i) => ({ name: `A${i + 1}`, pct: h.percentage, full: h.assessmentTitle }))

  return (
    <div className="space-y-6">

      {/* ── Student Info ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>Core profile and enrollment details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Email Address"   value={student.email} />
            <DetailItem label="School ID"       value={student.student_school_id} />
            <DetailItem label="Date of Birth"   value={formattedDob} />
            <DetailItem label="Gender"          value={student.gender} />
            <DetailItem
              label="Enrollment Status"
              value={<Badge variant="secondary">{student.enrollment_status}</Badge>}
            />
            <DetailItem
              label="Account Status"
              value={
                <Badge variant={student.is_active ? 'default' : 'destructive'}>
                  {student.is_active ? 'Active' : 'Inactive'}
                </Badge>
              }
            />
            <DetailItem label="Guardian Name"  value={student.guardian_name} />
            <DetailItem label="Guardian Phone" value={student.guardian_phone} />
            <DetailItem label="Guardian Email" value={student.guardian_email} />
          </div>
        </CardContent>
      </Card>

      {/* ── Analytics ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : analytics && analytics.totalSubmissions > 0 ? (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Score</p>
                  <p className="text-3xl font-bold mt-1">{analytics.averagePercentage}%</p>
                  <div className="mt-2"><PerformanceBadge pct={analytics.averagePercentage} /></div>
                </div>
                <TrendIcon pct={analytics.averagePercentage} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Submissions</p>
                <p className="text-3xl font-bold mt-1">{analytics.totalSubmissions}</p>
                <p className="text-xs text-muted-foreground mt-2">Assessments completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Top Error Type</p>
                {analytics.errorDistribution[0] ? (
                  <>
                    <div className="mt-1">
                      <ErrorTypeLabel
                        name={analytics.errorDistribution[0].error_name}
                        description={analytics.errorDistribution[0].description}
                        className="text-lg font-semibold leading-tight"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics.errorDistribution[0].percentage}% of errors
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">No errors recorded</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scoreChartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    Score History
                  </CardTitle>
                  <CardDescription>
                    Performance across last {scoreChartData.length} assessment{scoreChartData.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={scoreChartData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                        <Tooltip
                          formatter={(val, _, props) => [`${val}%`, props.payload.full]}
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="pct"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {bloomRadarData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    Cognitive Achievement
                  </CardTitle>
                  <CardDescription>Bloom's taxonomy mastery levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={bloomRadarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="level" tick={{ fontSize: 10 }} />
                        <Radar
                          dataKey="achievement"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.35}
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                        />
                        <Tooltip formatter={(v) => [`${v}%`, 'Mastery']} contentStyle={{ fontSize: 12 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Error Pattern Breakdown */}
          {analytics.errorDistribution.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  Error Pattern Breakdown
                </CardTitle>
                <CardDescription>
                  Most frequent error types — hover a label for a plain-language explanation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.errorDistribution.slice(0, 5).map((err) => (
                    <div key={err.error_code} className="flex items-center gap-3">
                      <div className="w-32 shrink-0">
                        <ErrorTypeLabel
                          name={err.error_name}
                          description={err.description}
                          className="text-xs font-medium block"
                        />
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${err.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right shrink-0 tabular-nums">
                        {err.percentage}%
                      </span>
                      <ReteachModal
                        studentId={studentId}
                        studentName={studentName}
                        topError={`${err.error_name} ${err.percentage}%`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <BarChart2 className="h-10 w-10 mb-3 opacity-30" />
            <p className="font-medium">No performance data yet</p>
            <p className="text-sm mt-1">
              Analytics will appear once this student has graded submissions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}