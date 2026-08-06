'use client'

// src/components/dashboard/dashboard-client.tsx

import { useState, useTransition }                      from 'react'
import { formatDistanceToNow }                          from 'date-fns'
import {
  Users, FileText, CheckSquare, BookOpen,
  Clock, TrendingUp, FileEdit, Zap,
  AlertTriangle, Loader2, ClipboardList,
}                                                        from 'lucide-react'
import Link                                              from 'next/link'
import { toast }                                         from 'sonner'
import type { StatsResponse }                            from '@/lib/actions/stats'
import type { SchoolAnalytics }                          from '@/lib/actions/analytics'
import type { LearningVelocity }                          from '@/lib/learning-velocity'
import {
  hasEnoughDataForVelocity, formatMasteryDuration,
  LEARNING_VELOCITY_MIN_OUTCOMES, LEARNING_VELOCITY_MIN_SCHEMES, LEARNING_VELOCITY_LARGE_MULTIPLIER,
}                                                        from '@/lib/learning-velocity'
import { MetricEmptyState }                              from '@/components/ui/metric-empty-state'
import { publishAssessment }                             from '@/lib/actions/assessments'
import { StatCard }                                      from './stat-card'
import { OverviewChart }                                 from '@/components/charts/overview-chart'
import { SchoolAnalyticsSection }                        from './school-analytics-section'
import { ReteachOrgImpact }                              from '@/components/reteach/reteach-org-impact'
import {
  Card, CardContent, CardHeader,
  CardTitle, CardDescription,
}                                                        from '@/components/ui/card'
import { Badge }                                         from '@/components/ui/badge'
import { Button }                                        from '@/components/ui/button'
import { ScrollArea }                                    from '@/components/ui/scroll-area'
import { Separator }                                     from '@/components/ui/separator'
import { OnboardingBanner }                              from './onboarding-banner'

// ── DraftBanner ───────────────────────────────────────────────────────────
// One banner per unpublished assessment. Publishes inline — no navigation.

interface DraftBannerProps {
  id:      string
  title:   string
  dueDate: string
}

function DraftBanner({ id, title, dueDate }: DraftBannerProps) {
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

        {/* Publish inline — no navigation needed */}
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

        {/* Fallback link if they want to review first */}
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

// ── DashboardClient ───────────────────────────────────────────────────────

interface DashboardClientProps {
  stats:            StatsResponse
  analytics:        SchoolAnalytics | null
  learningVelocity?: LearningVelocity | null
  billingStatus?:   string | null
  user:      { id: string; name?: string; role?: string; organizationName?: string } // ← ADDED organizationName
}

export function DashboardClient({ stats, analytics, learningVelocity, billingStatus, user }: DashboardClientProps) {
  const greeting  = getGreeting()
  const name      = user?.name?.split(' ')[0] ?? 'Teacher'
  const hasDrafts = stats.upcomingDeadlines.length > 0
  const [billingDismissed, setBillingDismissed] = useState(false)

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}, {name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening in your school today.
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

      {/* ── Billing alert ────────────────────────────────────────────── */}
      {billingStatus === 'past_due' && !billingDismissed && (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
          <span className="flex-1">
            <strong>Your last payment failed.</strong> Update your billing details to avoid losing access to Pro features.
          </span>
          <Button variant="outline" size="sm" className="border-rose-300 text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/40" asChild>
            <Link href="/dashboard/settings/billing">Update billing</Link>
          </Button>
          <Button variant="ghost" size="sm" className="text-rose-700 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-900/40" onClick={() => setBillingDismissed(true)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* ── Early-risk alerts ────────────────────────────────────────── */}
      {stats.atRiskCount > 0 && (
        <Link href="/dashboard/overview" className="block">
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100 transition-colors">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="flex-1">
              <strong>{stats.atRiskCount} student{stats.atRiskCount !== 1 ? 's' : ''}</strong> averaging below 50% this month — review in Monitor.
            </span>
            <span className="text-xs font-medium underline underline-offset-2">View Monitor →</span>
          </div>
        </Link>
      )}

      {stats.pendingPlanReviews > 0 && (
        <Link href="/dashboard/overview" className="block">
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 hover:bg-blue-100 transition-colors">
            <ClipboardList className="h-4 w-4 shrink-0 text-blue-500" />
            <span className="flex-1">
              <strong>{stats.pendingPlanReviews} study plan{stats.pendingPlanReviews !== 1 ? 's' : ''}</strong> have been pending for over 3 days and may need attention.
            </span>
            <span className="text-xs font-medium underline underline-offset-2">View Monitor →</span>
          </div>
        </Link>
      )}

      {/* ── Onboarding banner ─────────────────────────────────────────── */}
      <OnboardingBanner
        stats={stats}
        role={user.role as 'Admin' | 'Teacher'}
        userId={user.id}
        schoolName={user.organizationName ?? ''} // ← ADDED
      />

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          description="Enrolled across all classes"
          icon={<Users className="h-4 w-4" />}
          accentColor="blue"
          href="/dashboard/students"
        />
        <StatCard
          title="Assessments"
          value={stats.totalExams}
          description="Created by your team"
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
          description="Active this term"
          icon={<BookOpen className="h-4 w-4" />}
          accentColor="gold"
        />
      </div>

      {/* ── Chart + Activity ──────────────────────────────────────────── */}
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

      {/* ── School Intelligence ───────────────────────────────────────── */}
      {analytics && (
        <div className="pt-2">
          <SchoolAnalyticsSection analytics={analytics} />
        </div>
      )}

      {/* ── Intervention Impact ───────────────────────────────────────── */}
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-semibold tracking-tight">Intervention Impact</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          How your reteach sessions are moving the needle across the school.
        </p>
        <ReteachOrgImpact />
      </div>

      {/* ── Learning Velocity (Admin only) ──────────────────────────────── */}
      {user.role === 'Admin' && learningVelocity && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <h2 className="text-xl font-semibold tracking-tight">Learning Velocity</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              How your students&apos; time-to-mastery compares to the curriculum&apos;s own pace.
            </p>
            {!hasEnoughDataForVelocity(learningVelocity) ? (
              <MetricEmptyState
                label="Still collecting data"
                reason={
                  `${learningVelocity.actual_sample_size.toLocaleString()} of ${LEARNING_VELOCITY_MIN_OUTCOMES} mastered outcomes logged, ` +
                  `${learningVelocity.baseline_scheme_sample_size.toLocaleString()} of ${LEARNING_VELOCITY_MIN_SCHEMES} active schemes of work in place. ` +
                  `Check back once your students have more graded work — the multiplier isn't reliable below this.`
                }
              />
            ) : (
              <Card>
                <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 py-5">
                  <div>
                    <p className="text-3xl font-bold">
                      {learningVelocity.speed_multiplier}x
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">speed vs. curriculum pace</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">
                      {formatMasteryDuration(learningVelocity.actual_median_days_to_mastery)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      median actual time to mastery ({learningVelocity.actual_sample_size.toLocaleString()} outcomes)
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">
                      {formatMasteryDuration(learningVelocity.curriculum_expected_days_per_outcome)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">curriculum-paced baseline per outcome</p>
                  </div>
                </CardContent>
                {learningVelocity.speed_multiplier != null && learningVelocity.speed_multiplier >= LEARNING_VELOCITY_LARGE_MULTIPLIER && (
                  <CardContent className="pt-0 pb-4">
                    <p className="text-xs text-muted-foreground">
                      This multiplier reflects a lot of same-session mastery vs. a week-scale curriculum baseline —
                      correct, but quote it with the times above, not the multiplier alone.
                    </p>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        </>
      )}

    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}