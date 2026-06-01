'use client'

// src/components/dashboard/teacher-dashboard-client.tsx

import { useState, useTransition }   from 'react'
import { formatDistanceToNow }       from 'date-fns'
import {
  Users, FileText, CheckSquare, BookOpen,
  Clock, AlertCircle, TrendingUp, FileEdit,
  GraduationCap, BarChart2, ChevronRight,
  AlertTriangle, Loader2,
}                                    from 'lucide-react'
import Link                          from 'next/link'
import { toast }                     from 'sonner'
import type { StatsResponse }        from '@/lib/actions/stats'
import type { ClassAnalytics }       from '@/lib/actions/classes'
import { publishAssessment }         from '@/lib/actions/assessments'
import { StatCard }                  from './stat-card'
import { OverviewChart }             from '@/components/charts/overview-chart'
import { ErrorTypeLabel }            from '@/components/ui/error-type-label'
import {
  Card, CardContent, CardHeader,
  CardTitle, CardDescription,
} from '@/components/ui/card'
import { Badge }      from '@/components/ui/badge'
import { Button }     from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator }  from '@/components/ui/separator'
import { Progress }   from '@/components/ui/progress'

interface ClassAnalyticsEntry {
  classId:   string
  className: string
  analytics: ClassAnalytics | null
}

interface TeacherDashboardClientProps {
  stats:          StatsResponse
  classAnalytics: ClassAnalyticsEntry[]
  user:           { name?: string; role?: string }
}

// ── DraftBanner ────────────────────────────────────────────────────────────
// Inline publish — no navigation, no confirm dialog needed.

function DraftBanner({
  id,
  title,
  dueDate,
}: {
  id:      string
  title:   string
  dueDate: string
}) {
  const [dismissed, setDismissed]    = useState(false)
  const [isPending, startTransition] = useTransition()

  const handlePublish = () => {
    startTransition(async () => {
      const { error } = await publishAssessment(id)
      if (error) {
        toast.error('Could not publish assessment', { description: error.message })
        return
      }
      toast.success(`"${title}" published — students can now submit.`)
      setDismissed(true)
    })
  }

  if (dismissed) return null

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200 truncate">
            &ldquo;{title}&rdquo; is not published
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3 flex-shrink-0" />
            Created {formatDistanceToNow(new Date(dueDate), { addSuffix: true })}
            &ensp;&middot;&ensp;Students cannot submit until published
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge
          variant="outline"
          className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-transparent dark:text-amber-400 dark:border-amber-800"
        >
          Draft
        </Badge>
        <Button
          size="sm"
          disabled={isPending}
          onClick={handlePublish}
          className="bg-amber-600 hover:bg-amber-700 text-white border-0 dark:bg-amber-700 dark:hover:bg-amber-600"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              Publishing…
            </>
          ) : (
            'Publish now'
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
          asChild
        >
          <Link href={`/dashboard/assessments/${id}`}>Review</Link>
        </Button>
      </div>
    </div>
  )
}

// ── TeacherDashboardClient ─────────────────────────────────────────────────

export function TeacherDashboardClient({
  stats,
  classAnalytics,
  user,
}: TeacherDashboardClientProps) {
  const greeting  = getGreeting()
  const name      = user?.name?.split(' ')[0] ?? 'Teacher'
  const hasDrafts = stats.upcomingDeadlines.length > 0

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}, {name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening in your classes today.
          </p>
        </div>
        <Button variant="gold" className="rounded-xl" asChild>
          <Link href="/dashboard/exam-builder/new">
            <FileEdit className="mr-2 h-4 w-4" />
            New Assessment
          </Link>
        </Button>
      </div>

      {/* ── Draft alerts — top priority ───────────────────────────────── */}
      {hasDrafts && (
        <div className="space-y-2">
          {stats.upcomingDeadlines.map((item) => (
            <DraftBanner
              key={item.id}
              id={item.id}
              title={item.title}
              dueDate={item.dueDate}
            />
          ))}
        </div>
      )}

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Students"
          value={stats.totalStudents}
          description="Across your assigned classes"
          icon={<Users className="h-4 w-4" />}
          accentColor="blue"
        />
        <StatCard
          title="Assessments"
          value={stats.totalExams}
          description="In your classes"
          icon={<FileText className="h-4 w-4" />}
          accentColor="default"
        />
        <StatCard
          title="Marked Papers"
          value={stats.markedPapers}
          description="AI-graded submissions"
          icon={<CheckSquare className="h-4 w-4" />}
          accentColor="green"
        />
        <StatCard
          title="Courses"
          value={stats.totalCourses}
          description="Your assigned courses"
          icon={<BookOpen className="h-4 w-4" />}
          accentColor="gold"
        />
      </div>

      {/* ── Chart + Activity ────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <OverviewChart data={stats.dailyMarked ?? []} />
        </div>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest AI-graded submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <CheckSquare className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No graded submissions yet.</p>
              </div>
            ) : (
              <ScrollArea className="h-[280px]">
                <div className="space-y-4">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/10">
                        <CheckSquare className="h-3.5 w-3.5 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Per-Class Intelligence ───────────────────────────────────────── */}
      {classAnalytics.length > 0 ? (
        <>
          <Separator />
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Class Intelligence</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Performance insights across your assigned classes.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {classAnalytics.map(({ classId, className, analytics }) => (
                <ClassInsightCard
                  key={classId}
                  classId={classId}
                  className={className}
                  analytics={analytics}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <Separator />
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10">
              <GraduationCap className="h-6 w-6 text-gold" />
            </div>
            <p className="text-sm font-medium">No classes assigned yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Class intelligence will appear here once your admin assigns you to classes.
            </p>
          </div>
        </>
      )}

    </div>
  )
}

// ── Class Insight Card ─────────────────────────────────────────────────────

function ClassInsightCard({
  classId,
  className,
  analytics,
}: {
  classId:   string
  className: string
  analytics: ClassAnalytics | null
}) {
  if (!analytics) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{className}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">No assessment data yet.</p>
        </CardContent>
      </Card>
    )
  }

  const topBloom = analytics.bloomDistribution[0]
  const topError = analytics.errorDistribution[0]
  const atRisk   = analytics.studentSummaries.filter((s) => s.avgPct < 50 && s.submissions > 0)

  return (
    <Card className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-gold" />
            {className}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {analytics.totalStudents} students
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Class average</span>
            <span className="text-sm font-semibold">{analytics.averagePercentage}%</span>
          </div>
          <Progress value={analytics.averagePercentage} className="h-1.5" />
        </div>

        {topBloom && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Strongest Bloom&apos;s level</span>
            <Badge variant="secondary">{topBloom.level_name}</Badge>
          </div>
        )}

        {/* Top error — now with plain-language tooltip via ErrorTypeLabel */}
        {topError && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Most common error</span>
            <Badge
              variant="outline"
              className="text-rose-600 border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400"
            >
              <ErrorTypeLabel
                name={topError.error_name}
                description={topError.description ?? null}
                className="text-xs"
              />
            </Badge>
          </div>
        )}

        {atRisk.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded-md px-2.5 py-1.5 border border-amber-100 dark:border-amber-900/50">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {atRisk.length} student{atRisk.length === 1 ? '' : 's'} below 50% — needs attention
          </div>
        )}

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full justify-between mt-1 group-hover:bg-gold/5"
        >
          <Link href={`/dashboard/teacher/classes/${classId}`}>
            <span className="flex items-center gap-1.5 text-xs">
              <Users className="h-3 w-3" />
              View full class
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}