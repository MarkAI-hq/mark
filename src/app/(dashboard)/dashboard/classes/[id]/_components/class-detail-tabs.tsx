'use client'

// src/app/(dashboard)/dashboard/classes/[id]/_components/class-detail-tabs.tsx

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import {
  Brain, AlertTriangle, BarChart2, Users, BookOpen,
  TrendingUp, TrendingDown, Minus, GraduationCap, Zap, LayoutGrid,
  CalendarCheck2, Layers, LayoutDashboard,
} from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger }                from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge }          from '@/components/ui/badge'
import { Button }         from '@/components/ui/button'
import { ErrorTypeLabel } from '@/components/ui/error-type-label'
import { ClassStudentsTab }      from './class-students-tab'
import { ClassTeachersTab }      from './class-teachers-tab'
import { ClassAttendanceTab }    from './class-attendance-tab'
import { ClassSowTab }           from './class-sow-tab'
import { ClassStudyPlansTab }    from './class-study-plans-tab'
import { ReteachClassButton }    from '@/components/reteach/reteach-class-button'
import { ClassInterventionsTab } from '@/components/classes/class-interventions-tab'
import { ClassGroupsTab }        from '@/components/classes/class-groups-tab'
import type { Class, AssignedCourse }         from '@/lib/types'
import type { ClassAnalytics, ClassTeacher, ClassGroupsData } from '@/lib/actions/classes'
import type { OrganizationUser }                      from '@/lib/actions/organizations'
import type { ReteachSessionRecord }                  from '@/lib/actions/reteach-history'
import type { SowSummary }                            from '@/lib/actions/scheme-of-work'
import type { AttendanceSummary, AttendanceSession }  from '@/lib/actions/attendance'

interface ClassDetailTabsProps {
  classId:            string
  classDetails:       Class
  courses:            AssignedCourse[]
  analytics:          ClassAnalytics | null
  teachers:           ClassTeacher[]
  orgTeachers:        OrganizationUser[]
  latestAssessmentId: string | null
  interventions:      ReteachSessionRecord[]
  groups:             ClassGroupsData | null
  joinRequests?:      import('@/lib/actions/classes').AdminClassJoinRequest[]
  // Pre-loaded by page.tsx — eliminates client-side fetch on tab open
  initialSchemes:           SowSummary[]
  initialAttendanceSummary: AttendanceSummary | null
  initialAttendanceSessions: AttendanceSession[]
  initialStudyPlanStudents: {
    student_id: string; name: string; pending_count: number
    completed_count: number; total_plans: number; buffer_count: number
    lessons_per_day: number; last_dispatched: string | null
  }[]
}

const SCORE_COLORS = ['#ef4444', '#f97316', '#fbbf24', '#60a5fa', '#34d399']

function PctBadge({ pct }: { pct: number }) {
  if (pct >= 80) return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Excellent</Badge>
  if (pct >= 65) return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Good</Badge>
  if (pct >= 50) return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Developing</Badge>
  return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">At Risk</Badge>
}

function TrendIcon({ pct }: { pct: number }) {
  if (pct >= 65) return <TrendingUp   className="h-4 w-4 text-green-500" />
  if (pct >= 50) return <Minus        className="h-4 w-4 text-amber-500" />
  return              <TrendingDown className="h-4 w-4 text-red-500"   />
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Icon className="h-10 w-10 mb-3 opacity-25" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function ClassDetailTabs({
  classId, classDetails, courses: initialCourses, analytics,
  teachers, orgTeachers, latestAssessmentId, interventions, groups, joinRequests,
  initialSchemes, initialAttendanceSummary, initialAttendanceSessions, initialStudyPlanStudents,
}: ClassDetailTabsProps) {
  const [courses, setCourses] = useState<AssignedCourse[]>(initialCourses)

  const searchParams = useSearchParams()
  const router       = useRouter()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'overview')

  useEffect(() => {
    const tab = searchParams.get('tab') ?? 'overview'
    setActiveTab(tab)
  }, [searchParams])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.replace(`?tab=${tab}`, { scroll: false })
  }

  const bloomData = analytics?.bloomDistribution.map((b) => ({
    level:   b.level_name,
    mastery: b.percentage,
  })) ?? []

  const scoreData = analytics?.scoreDistribution ?? []
  const hasData   = analytics && analytics.studentSummaries.some((s) => s.submissions > 0)
  const topError  = analytics?.errorDistribution[0] ?? null

  const showGroups        = (groups?.groups.length ?? 0) > 0
  const showInterventions = interventions.length > 0

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
        {showGroups && (
          <TabsTrigger value="groups" className="flex items-center gap-1.5">
            <LayoutGrid className="h-3.5 w-3.5" />
            Groups
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
              {groups!.groups.length}
            </Badge>
          </TabsTrigger>
        )}
        {showInterventions && (
          <TabsTrigger value="interventions" className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Interventions
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
              {interventions.length}
            </Badge>
          </TabsTrigger>
        )}
        <TabsTrigger value="attendance" className="flex items-center gap-1.5">
          <CalendarCheck2 className="h-3.5 w-3.5" />
          Attendance
        </TabsTrigger>
        <TabsTrigger value="sow" className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Scheme of Work
        </TabsTrigger>
        <TabsTrigger value="study-plans" className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          Study Plans
        </TabsTrigger>
      </TabsList>

      {/* ── Overview (Analytics + Teachers & Subjects) ────────────────────── */}
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
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Class Average</p>
                      <p className="text-xl font-bold mt-1 leading-tight">{analytics.averagePercentage}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Students</p>
                      <p className="text-xl font-bold mt-1 leading-tight">{analytics.totalStudents}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Top Error</p>
                      <div className="mt-1">
                        {topError ? (
                          <ErrorTypeLabel
                            name={topError.error_name}
                            description={(topError as any).description ?? null}
                            className="text-xl font-bold leading-tight"
                          />
                        ) : (
                          <p className="text-xl font-bold leading-tight">—</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Top Bloom&apos;s Level</p>
                      <p className="text-xl font-bold mt-1 leading-tight truncate">
                        {analytics.bloomDistribution[0]?.level_name ?? '—'}
                      </p>
                    </CardContent>
                  </Card>
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
                            <Radar dataKey="mastery" fill="hsl(var(--primary))" fillOpacity={0.3} stroke="hsl(var(--primary))" strokeWidth={2} />
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
                          <Tooltip
                            formatter={(v) => [`${v} student${Number(v) !== 1 ? 's' : ''}`, 'Count']}
                            contentStyle={{ fontSize: 11 }}
                          />
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
                      <CardDescription className="text-xs">
                        Hover a label for a plain-language explanation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analytics.errorDistribution.length > 0 ? (
                        <div className="space-y-3 pt-1">
                          {analytics.errorDistribution.slice(0, 5).map((err, i) => (
                            <div key={err.error_code} className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <ErrorTypeLabel
                                  name={err.error_name}
                                  description={(err as any).description ?? null}
                                  className="text-xs font-medium truncate max-w-[50%]"
                                />
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs text-muted-foreground">{err.percentage}%</span>
                                  {latestAssessmentId && (
                                    <ReteachClassButton
                                      classId={classId}
                                      assessmentId={latestAssessmentId}
                                      errorType={err.error_name}
                                      className={classDetails.name}
                                      assessmentTitle="Latest Assessment"
                                      affected={Math.round((err.percentage / 100) * (analytics.totalStudents ?? 0))}
                                      total={analytics.totalStudents ?? 0}
                                      hasExistingSession={interventions.some(
                                        (i) => i.error_type === err.error_name && i.status === 'generated',
                                      )}
                                    />
                                  )}
                                </div>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width:           `${err.percentage}%`,
                                    backgroundColor: SCORE_COLORS[i] ?? '#94a3b8',
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-[160px] flex items-center justify-center text-muted-foreground text-xs">
                          No errors recorded
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {analytics.studentSummaries.filter((s) => s.submissions > 0).length > 0 && (
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
                          .filter((s) => s.submissions > 0)
                          .sort((a, b) => a.avgPct - b.avgPct)
                          .map((s) => (
                            <div key={s.studentId} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                  {s.studentName.charAt(0)}
                                </div>
                                <div>
                                  <Link
                                    href={`/dashboard/classes/${classId}/students/${s.studentId}`}
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
                                  <Link href={`/dashboard/classes/${classId}/students/${s.studentId}`}>
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

          {/* Teachers & Subjects section */}
          <div>
            <h3 className="text-xs font-semibold mb-4 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <GraduationCap className="h-3.5 w-3.5" />
              Teachers &amp; Subjects
            </h3>
            <ClassTeachersTab
              classId={classId}
              teachers={teachers}
              orgTeachers={orgTeachers}
              organizationId={classDetails.organization_id ?? ''}
              joinRequests={joinRequests}
              initialCourses={courses}
              onCourseAssigned={(c) => setCourses((prev) => [...prev, c])}
              onCourseRemoved={(courseId) => setCourses((prev) => prev.filter((c) => c.course_id !== courseId))}
            />
          </div>

        </div>
      </TabsContent>

      {/* ── Students ──────────────────────────────────────────────────────── */}
      <TabsContent value="students" className="mt-6">
        <ClassStudentsTab classId={classId} analytics={analytics} />
      </TabsContent>

      {/* ── Groups — only when data exists ───────────────────────────────── */}
      {showGroups && (
        <TabsContent value="groups" className="mt-6">
          <ClassGroupsTab
            classId={classId}
            initialData={groups}
            latestAssessmentId={latestAssessmentId ?? undefined}
          />
        </TabsContent>
      )}

      {/* ── Interventions — only when data exists ─────────────────────────── */}
      {showInterventions && (
        <TabsContent value="interventions" className="mt-6">
          <ClassInterventionsTab
            classId={classId}
            initialData={interventions}
          />
        </TabsContent>
      )}

      {/* ── Attendance ────────────────────────────────────────────────────── */}
      <TabsContent value="attendance" className="mt-6">
        <ClassAttendanceTab
          classId={classId}
          initialSummary={initialAttendanceSummary}
          initialSessions={initialAttendanceSessions}
        />
      </TabsContent>

      {/* ── Scheme of Work ────────────────────────────────────────────────── */}
      <TabsContent value="sow" className="mt-6">
        <ClassSowTab classId={classId} initialSchemes={initialSchemes} />
      </TabsContent>

      {/* ── Study Plans ───────────────────────────────────────────────────── */}
      <TabsContent value="study-plans" className="mt-6">
        <ClassStudyPlansTab classId={classId} initialStudents={initialStudyPlanStudents} />
      </TabsContent>

    </Tabs>
  )
}
