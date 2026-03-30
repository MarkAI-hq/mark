'use client'

// src/app/(dashboard)/dashboard/classes/[id]/_components/class-detail-tabs.tsx

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import {
  Brain, AlertTriangle, BarChart2, Users, BookOpen,
  TrendingUp, TrendingDown, Minus, GraduationCap, Plus, Trash2, Zap, LayoutGrid,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger }                from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge }          from '@/components/ui/badge'
import { Button }         from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label }          from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ErrorTypeLabel } from '@/components/ui/error-type-label'
import { ClassStudentsTab }      from './class-students-tab'
import { ClassTeachersTab }      from './class-teachers-tab'
import { ReteachClassButton }    from '@/components/reteach/reteach-class-button'
import { ClassInterventionsTab } from '@/components/classes/class-interventions-tab'
import { ClassGroupsTab }        from '@/components/classes/class-groups-tab'
import { getCourses }            from '@/lib/actions/courses'
import { assignCourseToClass, removeCourseFromClass } from '@/lib/actions/classes'
import type { Class, AssignedCourse, Course }         from '@/lib/types'
import type { ClassAnalytics, ClassTeacher, ClassGroupsData } from '@/lib/actions/classes'
import type { OrganizationUser }                      from '@/lib/actions/organizations'
import type { ReteachSessionRecord }                  from '@/lib/actions/reteach-history'

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
}

const SCORE_COLORS = ['#ef4444', '#f97316', '#fbbf24', '#60a5fa', '#34d399']

// ── Assign Course Dialog ───────────────────────────────────────────────────

function AssignCourseDialog({
  classId,
  teachers,
  onAssigned,
}: {
  classId:    string
  teachers:   ClassTeacher[]
  onAssigned: (course: AssignedCourse) => void
}) {
  const [open,      setOpen]      = useState(false)
  const [courses,   setCourses]   = useState<Course[]>([])
  const [courseId,  setCourseId]  = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleOpen = async () => {
    setOpen(true)
    const { data } = await getCourses()
    if (data) setCourses(data)
  }

  const handleSubmit = () => {
    if (!courseId)  return toast.warning('Please select a course.')
    if (!teacherId) return toast.warning('Please select a teacher.')
    startTransition(async () => {
      try {
        await assignCourseToClass(classId, courseId, teacherId)
        const course  = courses.find((c) => c.id === courseId)!
        const teacher = teachers.find((t) => t.teacher_id === teacherId)!
        onAssigned({
          id:                 `${courseId}-${teacherId}`,
          course_id:          courseId,
          course_title:       course.title,
          course_code:        course.code,
          course_description: course.description ?? null,
          teacher_id:         teacherId,
          teacher_name:       teacher.first_name,
          teacher_lastname:   teacher.last_name,
          assigned_at:        new Date().toISOString(),
        } as AssignedCourse)
        toast.success(`"${course.title}" assigned successfully.`)
        setOpen(false)
        setCourseId('')
        setTeacherId('')
      } catch (err: any) {
        toast.error(err.message ?? 'Failed to assign course.')
      }
    })
  }

  const activeTeachers = teachers.filter((t) => t.status === 'active')

  return (
    <>
      <Button size="sm" onClick={handleOpen}>
        <Plus className="h-4 w-4 mr-1.5" />
        Assign Course
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Course to Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder={courses.length === 0 ? 'Loading...' : 'Select course'} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                      {c.code && <span className="text-muted-foreground ml-1.5">· {c.code}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Responsible Teacher</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder={activeTeachers.length === 0 ? 'No active teachers' : 'Select teacher'} />
                </SelectTrigger>
                <SelectContent>
                  {activeTeachers.map((t) => (
                    <SelectItem key={t.teacher_id} value={t.teacher_id}>
                      {t.first_name} {t.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeTeachers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Assign and activate a teacher first from the Teachers tab.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending || !courseId || !teacherId}>
              {isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── ClassDetailTabs ────────────────────────────────────────────────────────

export function ClassDetailTabs({
  classId, classDetails, courses: initialCourses, analytics,
  teachers, orgTeachers, latestAssessmentId, interventions, groups,
}: ClassDetailTabsProps) {
  const [courses,   setCourses]      = useState<AssignedCourse[]>(initialCourses)
  const [isPending, startTransition] = useTransition()

  const searchParams = useSearchParams()
  const router       = useRouter()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'students')

  useEffect(() => {
    const tab = searchParams.get('tab') ?? 'students'
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
  const hasData   = analytics && analytics.averagePercentage > 0

  // Top error — pulled out for use in JSX stat tile
  const topError = analytics?.errorDistribution[0] ?? null

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList>
        <TabsTrigger value="analytics" className="flex items-center gap-1.5">
          <BarChart2 className="h-3.5 w-3.5" />
          Analytics
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
        <TabsTrigger value="groups" className="flex items-center gap-1.5">
          <LayoutGrid className="h-3.5 w-3.5" />
          Groups
          {groups && groups.groups.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
              {groups.groups.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="courses" className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Courses
        </TabsTrigger>
        <TabsTrigger value="teachers" className="flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5" />
          Teachers
          {teachers.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
              {teachers.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="interventions" className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          Interventions
          {interventions.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
              {interventions.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      {/* ── Analytics ─────────────────────────────────────────────────────── */}
      <TabsContent value="analytics" className="mt-6">
        {!hasData ? (
          <EmptyState
            icon={BarChart2}
            message="No graded submissions yet. Analytics will appear once assessments have been marked for this class."
          />
        ) : (
          <div className="space-y-4">

            {/* ── Stat tiles ─────────────────────────────────────────────── */}
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

              {/* Top Error — separate card so ErrorTypeLabel renders as JSX with tooltip */}
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Top Bloom's Level</p>
                  <p className="text-xl font-bold mt-1 leading-tight truncate">
                    {analytics.bloomDistribution[0]?.level_name ?? '—'}
                  </p>
                </CardContent>
              </Card>

            </div>

            {/* ── Charts ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    Cognitive Depth
                  </CardTitle>
                  <CardDescription className="text-xs">Bloom's taxonomy for this class</CardDescription>
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
                  <CardDescription className="text-xs">How this class's scores spread</CardDescription>
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

            {/* ── Student Performance ────────────────────────────────────── */}
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
      </TabsContent>

      {/* ── Students ──────────────────────────────────────────────────────── */}
      <TabsContent value="students" className="mt-6">
        <ClassStudentsTab classId={classId} analytics={analytics} />
      </TabsContent>

      {/* ── Groups ────────────────────────────────────────────────────────── */}
      <TabsContent value="groups" className="mt-6">
        <ClassGroupsTab
          classId={classId}
          initialData={groups}
          latestAssessmentId={latestAssessmentId ?? undefined}
        />
      </TabsContent>

      {/* ── Courses ───────────────────────────────────────────────────────── */}
      <TabsContent value="courses" className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {courses.length} course{courses.length !== 1 ? 's' : ''} assigned
          </p>
          <AssignCourseDialog
            classId={classId}
            teachers={teachers}
            onAssigned={(course) => setCourses((prev) => [...prev, course])}
          />
        </div>
        {courses.length === 0 ? (
          <EmptyState icon={BookOpen} message="No courses assigned yet. Use the button above to assign a course." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{course.course_title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{course.course_code}</p>
                      {course.course_description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{course.course_description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-3">
                        {course.teacher_name} {course.teacher_lastname}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        startTransition(async () => {
                          try {
                            await removeCourseFromClass(classId, course.course_id)
                            setCourses((prev) => prev.filter((c) => c.id !== course.id))
                            toast.success(`"${course.course_title}" removed.`)
                          } catch (err: any) {
                            toast.error(err.message ?? 'Failed to remove course.')
                          }
                        })
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* ── Teachers ──────────────────────────────────────────────────────── */}
      <TabsContent value="teachers" className="mt-6">
        <ClassTeachersTab
          classId={classId}
          teachers={teachers}
          orgTeachers={orgTeachers}
        />
      </TabsContent>

      {/* ── Interventions ─────────────────────────────────────────────────── */}
      <TabsContent value="interventions" className="mt-6">
        <ClassInterventionsTab
          classId={classId}
          initialData={interventions}
        />
      </TabsContent>

    </Tabs>
  )
}