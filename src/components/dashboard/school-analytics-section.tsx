'use client'

// src/components/dashboard/school-analytics-section.tsx

import { Brain, AlertTriangle, TrendingUp, Users, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ErrorTypeLabel } from '@/components/ui/error-type-label'
import type { SchoolAnalytics } from '@/lib/actions/analytics'

interface SchoolAnalyticsSectionProps {
  analytics: SchoolAnalytics
}

// Bloom's level colours — ordered by cognitive complexity
const BLOOM_COLORS: Record<string, string> = {
  REMEMBER:   '#94a3b8',
  UNDERSTAND: '#60a5fa',
  APPLY:      '#34d399',
  ANALYZE:    '#fbbf24',
  EVALUATE:   '#f97316',
  CREATE:     '#a78bfa',
}

const SCORE_COLORS = [
  '#ef4444', // 0–20 red
  '#f97316', // 21–40 orange
  '#fbbf24', // 41–60 amber
  '#60a5fa', // 61–80 blue
  '#34d399', // 81–100 green
]

function performanceBadge(pct: number) {
  if (pct >= 80) return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Strong</Badge>
  if (pct >= 60) return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Good</Badge>
  if (pct >= 50) return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Developing</Badge>
  return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">At Risk</Badge>
}

export function SchoolAnalyticsSection({ analytics }: SchoolAnalyticsSectionProps) {
  const bloomRadarData = analytics.bloomDistribution.map((b) => ({
    level:       b.level_name,
    mastery:     b.percentage,
    fill:        BLOOM_COLORS[b.level_code] ?? '#94a3b8',
  }))

  const hasData = analytics.totalSubmissions > 0

  if (!hasData) return null

  return (
    <div className="space-y-4">

      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">School Intelligence</h2>
          <p className="text-sm text-muted-foreground">
            Based on {analytics.totalSubmissions} graded submission{analytics.totalSubmissions !== 1 ? 's' : ''} · School average: <strong>{analytics.avgSchoolScore}%</strong>
          </p>
        </div>
      </div>

      {/* ── Row 1: Bloom's radar + Score distribution + Top errors ──────── */}
      <div className="grid gap-4 md:grid-cols-3">

        {/* Bloom's radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-muted-foreground" />
              Cognitive Depth
            </CardTitle>
            <CardDescription className="text-xs">
              Bloom's taxonomy across all students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bloomRadarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={bloomRadarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="level"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                  />
                  <Radar
                    dataKey="mastery"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(val) => [`${val}%`, 'Mastery']}
                    contentStyle={{ fontSize: 11 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No Bloom's data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score distribution bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              Score Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              How scores are spread across the school
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.scoreDistribution} barSize={28}>
                <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip
                  formatter={(val, _, props) => [
                    `${val} student${Number(val) !== 1 ? 's' : ''} (${props.payload.percentage}%)`,
                    'Count',
                  ]}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {analytics.scoreDistribution.map((_, i) => (
                    <Cell key={i} fill={SCORE_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top error types */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Common Error Patterns
            </CardTitle>
            <CardDescription className="text-xs">
              Most frequent mistakes — hover for plain-language explanation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.errorDistribution.length > 0 ? (
              <div className="space-y-3 pt-1">
                {analytics.errorDistribution.slice(0, 5).map((err, i) => (
                  <div key={err.error_code} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <ErrorTypeLabel
                        name={err.error_name}
                        description={err.description}
                        className="text-xs font-medium truncate max-w-[70%]"
                      />
                      <span className="text-xs text-muted-foreground">{err.percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${err.percentage}%`,
                          backgroundColor: ['#ef4444','#f97316','#fbbf24','#60a5fa','#94a3b8'][i],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">
                No error data yet
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ── Row 2: At-risk students ──────────────────────────────────────── */}
      {analytics.atRiskStudents.length > 0 && (
        <Card className="border-red-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-red-500" />
                  Students Needing Intervention
                  <Badge variant="destructive" className="text-xs ml-1">
                    {analytics.atRiskStudents.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Averaging below 50% across 2+ assessments
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {analytics.atRiskStudents.map((student) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50/50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{student.studentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.submissions} assessment{student.submissions !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <p className="text-lg font-bold text-red-600">{student.avgPct}%</p>
                    {performanceBadge(student.avgPct)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}