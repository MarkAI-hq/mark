'use client'

// src/components/dashboard/dashboard-client.tsx

import { useState, useTransition }                      from 'react'
import { formatDistanceToNow }                          from 'date-fns'
import {
  Users, FileText, CheckSquare, BookOpen,
  Clock, TrendingUp, FileEdit, Zap,
  AlertTriangle, Loader2,
}                                                        from 'lucide-react'
import Link                                              from 'next/link'
import { toast }                                         from 'sonner'
import type { StatsResponse }                            from '@/lib/actions/stats'
import type { SchoolAnalytics }                          from '@/lib/actions/analytics'
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
  stats:     StatsResponse
  analytics: SchoolAnalytics | null
  user:      { id: string; name?: string; role?: string; organizationName?: string } // ← ADDED organizationName
}

export function DashboardClient({ stats, analytics, user }: DashboardClientProps) {
  const greeting  = getGreeting()
  const name      = user?.name?.split(' ')[0] ?? 'Teacher'
  const hasDrafts = stats.upcomingDeadlines.length > 0

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

    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}