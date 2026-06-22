'use client'

// src/app/(dashboard)/dashboard/teacher/classes/[classId]/_components/teacher-class-detail-tabs.tsx


import Link from 'next/link'
import {
  Brain, AlertTriangle, BarChart2, Users, BookOpen,
  TrendingUp, TrendingDown, Minus, CalendarCheck, CalendarDays, GitBranch, Layers, LayoutDashboard,
} from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClassStudentsTab } from '@/app/(dashboard)/dashboard/classes/[id]/_components/class-students-tab'
import type { AssignedCourse } from '@/lib/types'
import type { ClassAnalytics } from '@/lib/actions/classes'
import type { SowSummary }     from '@/lib/actions/scheme-of-work'
import { ClassSowTab }         from '@/app/(dashboard)/dashboard/classes/[id]/_components/class-sow-tab'

interface Privileges {
  can_add_students:       boolean
  can_create_assessments: boolean
  can_grade:              boolean
  can_view_analytics:     boolean
}

interface ClassInfo {
  class_id:        string
  name:            string
  description:     string | null
  organization_id: string
  created_by:      string
  createdAt:       string
}

interface Props {
  classId:        string
  classDetails:   ClassInfo
  courses:        AssignedCourse[]
  analytics:      ClassAnalytics | null
  privileges:     Privileges
  initialSchemes: SowSummary[]
}

const SCORE_COLORS = ['#ef4444', '#f97316', '#fbbf24', '#60a5fa', '#34d399']

function PctBadge({ pct }: { pct: number }) {
  if (pct >= 80) return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 text-xs">Excellent</Badge>
  if (pct >= 65) return <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900 text-xs">Good</Badge>
  if (pct >= 50) return <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900 text-xs">Developing</Badge>
  return <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900 text-xs">At Risk</Badge>
}

function TrendIcon({ pct }: { pct: number }) {
  if (pct >= 65) return <TrendingUp className="h-4 w-4 text-green-500" />
  if (pct >= 50) return <Minus className="h-4 w-4 text-amber-500" />
  return <TrendingDown className="h-4 w-4 text-red-500" />
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center animate-fade-up">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/8">
        <Icon className="h-8 w-8 text-gold/60" />
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
    </div>
  )
}

export function TeacherClassDetailTabs({
  classId, classDetails, courses, analytics, privileges, initialSchemes,
}: Props) {
  const bloomData = analytics?.bloomDistribution.map((b) => ({
    level:   b.level_name,
    mastery: b.percentage,
  })) ?? []

  const scoreData = analytics?.scoreDistribution ?? []
  const hasData   = analytics && analytics.averagePercentage > 0

  return (
    <Tabs defaultValue="overview" className="w-full">
      <div className="overflow-x-auto">
      <TabsList>

        <TabsTrigger value="overview" className="flex items-center gap-1.5">
          <LayoutDashboard className="h-3.5 w-3.5" />
          Overview
          {analytics && analytics.averagePercentage < 50 && analytics.averagePercentage > 0 && (
            <span className="ml-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </TabsTrigger>

        <TabsTrigger value="students" className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Students
          {analytics?.totalStudents ? (
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
              {analytics.totalStudents}
            </Badge>
          ) : null}
        </TabsTrigger>

        <TabsTrigger value="attendance" className="flex items-center gap-1.5">
          <CalendarCheck className="h-3.5 w-3.5" />
          Attendance
        </TabsTrigger>

        <TabsTrigger value="timetable" className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          Timetable
        </TabsTrigger>

        <TabsTrigger value="gaps" className="flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5" />
          Gap Report
        </TabsTrigger>

        <TabsTrigger value="sow" className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          SoW
        </TabsTrigger>

      </TabsList>
      </div>

      {/* ── Overview (Analytics + Courses) ──────────────────────────────────── */}
      <TabsContent value="overview" className="mt-6">
        <div className="space-y-8">

          {/* Analytics section */}
          <div>
            <h3 className="text-xs font-semibold mb-4 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <BarChart2 className="h-3.5 w-3.5" />
              Analytics
            </h3>
            {!hasData ? (
              <EmptyState
                icon={BarChart2}
                message="No graded submissions yet. Analytics will appear once assessments have been marked for this class."
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Class Average',    value: `${analytics.averagePercentage}%` },
                    { label: 'Students',          value: analytics.totalStudents },
                    { label: 'Top Error',         value: analytics.errorDistribution[0]?.error_name ?? '—' },
                    { label: "Top Bloom's Level", value: analytics.bloomDistribution[0]?.level_name ?? '—' },
                  ].map((s) => (
                    <Card key={s.label}>
                      <CardContent className="pt-5">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                        <p className="text-xl font-bold mt-1 leading-tight truncate">{s.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="h-4 w-4 text-muted-foreground" />
                        Cognitive Depth
                      </CardTitle>
                      <CardDescription className="text-xs">Bloom&apos;s taxonomy for this class</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {bloomData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <RadarChart data={bloomData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="level" tick={{ fontSize: 9, fill: '#64748b' }} />
                            <Radar dataKey="mastery" fill="hsl(var(--gold))" fillOpacity={0.3} stroke="hsl(var(--gold))" strokeWidth={2} />
                            <Tooltip formatter={(v) => [`${v}%`, 'Mastery']} contentStyle={{ fontSize: 11 }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-xs">No data</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-muted-foreground" />
                        Score Distribution
                      </CardTitle>
                      <CardDescription className="text-xs">How this class&apos;s scores spread</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={scoreData} barSize={26}>
                          <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                          <Tooltip formatter={(v) => [`${v} student${Number(v) !== 1 ? 's' : ''}`, 'Count']} contentStyle={{ fontSize: 11 }} />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {scoreData.map((_, i) => <Cell key={i} fill={SCORE_COLORS[i]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Error Patterns
                      </CardTitle>
                      <CardDescription className="text-xs">Teaching gap indicators</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analytics.errorDistribution.length > 0 ? (
                        <div className="space-y-3 pt-1">
                          {analytics.errorDistribution.slice(0, 5).map((err, i) => (
                            <div key={err.error_code} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium truncate max-w-[70%]">{err.error_name}</span>
                                <span className="text-xs text-muted-foreground">{err.percentage}%</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${err.percentage}%`, backgroundColor: SCORE_COLORS[i] ?? '#94a3b8' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-[160px] flex items-center justify-center text-muted-foreground text-xs">No errors recorded</div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {analytics.studentSummaries.filter(s => s.submissions > 0).length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Student Performance
                      </CardTitle>
                      <CardDescription className="text-xs">Sorted by score — lowest first</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y">
                        {[...analytics.studentSummaries]
                          .filter(s => s.submissions > 0)
                          .sort((a, b) => a.avgPct - b.avgPct)
                          .map((s) => (
                            <div key={s.studentId} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                  {s.studentName.charAt(0)}
                                </div>
                                <div>
                                  <Link
                                    href={`/dashboard/teacher/classes/${classId}/students/${s.studentId}`}
                                    className="text-sm font-medium hover:underline"
                                  >
                                    {s.studentName}
                                  </Link>
                                  <p className="text-xs text-muted-foreground">
                                    {s.submissions} submission{s.submissions !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <TrendIcon pct={s.avgPct} />
                                <div className="text-right min-w-[60px]">
                                  <p className="text-sm font-bold">{s.avgPct}%</p>
                                  <PctBadge pct={s.avgPct} />
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/dashboard/teacher/classes/${classId}/students/${s.studentId}`}>
                                    View
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          <div className="border-t" />

          {/* Subjects section */}
          <div>
            <h3 className="text-xs font-semibold mb-4 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <BookOpen className="h-3.5 w-3.5" />
              Subjects
            </h3>
            {courses.length === 0 ? (
              <EmptyState icon={BookOpen} message="No courses assigned yet. Your administrator will assign courses to this class." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <Card key={course.id}>
                    <CardContent className="pt-5">
                      <p className="text-sm font-semibold truncate">{course.course_title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{course.course_code}</p>
                      {course.course_description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{course.course_description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-3">
                        {course.teacher_name} {course.teacher_lastname}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>
      </TabsContent>

      {/* ── Students ────────────────────────────────────────────────────────── */}
      <TabsContent value="students" className="mt-6">
        <ClassStudentsTab
          classId={classId}
          analytics={analytics}
          readOnly={true}
          studentBasePath="/dashboard/teacher/classes"
        />
      </TabsContent>

      {/* ── Gap Report — navigation panel ─────────────────────────────── */}
      <TabsContent value="gaps" className="mt-6">
        <div className="rounded-2xl border border-border/60 bg-surface-raised p-10 flex flex-col items-center gap-5 text-center animate-fade-up">
          <div className="h-16 w-16 rounded-2xl bg-gold/10 flex items-center justify-center">
            <GitBranch className="h-8 w-8 text-gold" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <p className="text-base font-semibold">Exposure matrix &amp; gap attribution</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              See which students were present for each SoW topic — and whether gaps are from missed lessons or poor understanding.
            </p>
          </div>
          <Link href={`/dashboard/teacher/classes/${classId}/gap-report`}>
            <Button variant="gold" className="gap-2 rounded-xl">
              <GitBranch className="h-4 w-4" aria-hidden="true" />
              View Gap Report
            </Button>
          </Link>
        </div>
      </TabsContent>

      {/* ── Timetable — navigation panel ─────────────────────────────── */}
      <TabsContent value="timetable" className="mt-6">
        <div className="rounded-2xl border border-border/60 bg-surface-raised p-10 flex flex-col items-center gap-5 text-center animate-fade-up">
          <div className="h-16 w-16 rounded-2xl bg-gold/10 flex items-center justify-center">
            <CalendarDays className="h-8 w-8 text-gold" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <p className="text-base font-semibold">Weekly schedule</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Define when each subject is taught — day, time, and room.
            </p>
          </div>
          <Link href={`/dashboard/teacher/classes/${classId}/timetable`}>
            <Button variant="gold" className="gap-2 rounded-xl">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Go to Timetable
            </Button>
          </Link>
        </div>
      </TabsContent>

      {/* ── Attendance — navigation panel ────────────────────────────── */}
      <TabsContent value="attendance" className="mt-6">
        <div className="rounded-2xl border border-border/60 bg-surface-raised p-10 flex flex-col items-center gap-5 text-center animate-fade-up">
          <div className="h-16 w-16 rounded-2xl bg-gold/10 flex items-center justify-center">
            <CalendarCheck className="h-8 w-8 text-gold" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <p className="text-base font-semibold">Class attendance</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Open sessions, mark students present or absent, and review history.
            </p>
          </div>
          <Link href={`/dashboard/teacher/classes/${classId}/attendance`}>
            <Button variant="gold" className="gap-2 rounded-xl">
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
              Go to Attendance
            </Button>
          </Link>
        </div>
      </TabsContent>

      {/* ── Scheme of Work ──────────────────────────────────────────── */}
      <TabsContent value="sow" className="mt-6">
        <ClassSowTab classId={classId} initialSchemes={initialSchemes} />
      </TabsContent>

    </Tabs>
  )
}
