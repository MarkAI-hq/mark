'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Users, Trophy, Flame, Star, BookOpen, Globe, TrendingUp, Target, Zap, Award, Medal, CalendarDays, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type {
  SocialProof,
  LeaderboardResult,
  LeaderboardEntry,
  LeaderboardMetric,
} from '@/lib/actions/student-dashboard'
import { getLeaderboard } from '@/lib/actions/student-dashboard'

interface Props {
  user:               any
  classmatesData:     { classmates: { user_id: string; name: string; student_school_id: string | null; is_me: boolean }[]; class_id: string | null; org_name?: string | null; school_code?: string | null }
  socialProof:        SocialProof | null
  extras:             any[]
  enrollments:        any[]
  isMarketplace:      boolean
  classInfo:          any | null
  orgName:            string | null
  initialLeaderboard: LeaderboardResult | null
}

export function SchoolClient({ user, classmatesData, socialProof, extras, enrollments, isMarketplace, classInfo, orgName, initialLeaderboard }: Props) {
  const [tab, setTab] = useState<'class' | 'life' | 'leaderboard'>('class')

  const { classmates } = classmatesData
  const displayName = orgName ?? (isMarketplace ? 'Mirror Intelligence' : 'My School')

  const tabs = [
    { id: 'class',       label: 'My Class',    icon: Users },
    { id: 'life',        label: 'School Life', icon: Star },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ]

  function initials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Platform (marketplace) students are not enrolled in a school class
  if (isMarketplace) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Globe className="h-5 w-5 text-gold" />
            {orgName ?? 'Mirror Intelligence School'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            You&apos;re enrolled and learning toward your goal. Here&apos;s where you stand.
          </p>
        </div>

        {/* Their school + what they're studying */}
        <Card className="border-gold/20 bg-gold/5">
          <CardContent className="py-4 px-4 space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gold shrink-0" />
              <p className="text-sm font-semibold">
                {classInfo?.subject ? classInfo.subject : 'Your study programme'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Enrolled at {orgName ?? 'Mirror Intelligence School'}
              {classInfo?.term ? ` · ${classInfo.term}` : ''}. You study independently, paced to your goal.
            </p>
          </CardContent>
        </Card>

        {/* Clear next places to go — never a dead end */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/student/progress" className="rounded-xl border bg-card px-4 py-3 flex items-center justify-between gap-3 hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <Target className="h-4 w-4 text-gold shrink-0" />
              <span className="text-sm font-medium">Your progress &amp; goal</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/student/schedule" className="rounded-xl border bg-card px-4 py-3 flex items-center justify-between gap-3 hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <CalendarDays className="h-4 w-4 text-gold shrink-0" />
              <span className="text-sm font-medium">Your timetable</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
        </div>

        <Button asChild className="w-full bg-gold hover:bg-gold/90 text-gold-foreground">
          <Link href="/student/subjects">Browse subjects to study</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{displayName}</h1>
        <p className="text-muted-foreground text-sm mt-1">Your school community</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === id
                ? 'border-gold text-gold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── My Class tab ── */}
      {tab === 'class' && (
        <div className="space-y-3">
          {classInfo && (
            <Card className="border-gold/20 bg-gold/5">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <BookOpen className="h-4 w-4 text-gold shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{classInfo.subject ?? 'Class'}</p>
                    <p className="text-xs text-muted-foreground">
                      {[classInfo.grade_level, classInfo.term, classInfo.academic_year]
                        .filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{classmates.length} student{classmates.length !== 1 ? 's' : ''} in your class</p>
          </div>
          {classmates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {classInfo ? "You're the first student in this class" : 'No classmates yet'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {classInfo
                    ? 'Your classmates will appear here once they join.'
                    : "You'll see your classmates once your teacher enrolls students."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {classmates.map((cm) => (
                <Card key={cm.user_id} className={cm.is_me ? 'border-gold/40 bg-gold/5' : ''}>
                  <CardContent className="py-2.5 px-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={`text-xs ${cm.is_me ? 'bg-gold text-gold-foreground' : 'bg-muted'}`}>
                          {initials(cm.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {cm.name}
                          {cm.is_me && <span className="text-xs text-gold ml-1.5">(you)</span>}
                        </p>
                        {cm.student_school_id && (
                          <p className="text-xs text-muted-foreground">{cm.student_school_id}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── School Life tab ── */}
      {tab === 'life' && (
        <div className="space-y-3">
          {extras.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No school extras yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your school will post clubs, activities, and announcements here.
                </p>
              </CardContent>
            </Card>
          ) : (
            extras.map((extra: any, i: number) => {
              const enrolled = enrollments.some((e: any) => e.extra_id === extra.id)
              return (
                <Card key={i}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{extra.title ?? extra.name}</p>
                        {extra.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{extra.description}</p>
                        )}
                      </div>
                      {enrolled && (
                        <Badge className="text-[10px] shrink-0 bg-emerald-100 text-emerald-700">Enrolled</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* ── Leaderboard tab ── */}
      {tab === 'leaderboard' && (
        <LeaderboardPanel
          initial={initialLeaderboard}
          socialProof={socialProof}
        />
      )}
    </div>
  )
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

const METRICS: { id: LeaderboardMetric; label: string; icon: typeof Trophy }[] = [
  { id: 'overall',     label: 'Overall',     icon: Trophy },
  { id: 'performance', label: 'Performance', icon: Target },
  { id: 'activity',    label: 'Activity',    icon: Zap },
  { id: 'streak',      label: 'Streak',      icon: Flame },
]

const DIMENSIONS: { key: keyof LeaderboardEntry['breakdown']; label: string; icon: typeof Target; color: string }[] = [
  { key: 'performance', label: 'Performance', icon: Target,     color: 'bg-blue-500' },
  { key: 'activity',    label: 'Activity',    icon: Zap,        color: 'bg-violet-500' },
  { key: 'consistency', label: 'Consistency', icon: Flame,      color: 'bg-orange-500' },
  { key: 'growth',      label: 'Growth',      icon: TrendingUp, color: 'bg-emerald-500' },
]

function metricValue(e: LeaderboardEntry, metric: LeaderboardMetric): string {
  switch (metric) {
    case 'performance': return `${e.avg_score}%`
    case 'activity':    return `${e.plans_completed} done`
    case 'streak':      return `${e.streak}🔥`
    default:            return `${e.mirror_score}`
  }
}

function rankBadge(rank: number) {
  if (rank === 1) return <span className="text-base">🥇</span>
  if (rank === 2) return <span className="text-base">🥈</span>
  if (rank === 3) return <span className="text-base">🥉</span>
  return <span className="text-xs font-semibold text-muted-foreground w-5 text-center">{rank}</span>
}

function LeaderboardPanel({ initial, socialProof }: {
  initial:     LeaderboardResult | null
  socialProof: SocialProof | null
}) {
  const [scope, setScope]   = useState<'class' | 'school'>('class')
  const [metric, setMetric] = useState<LeaderboardMetric>('overall')
  const [data, setData]     = useState<LeaderboardResult | null>(initial)
  const [pending, startTransition] = useTransition()

  function refetch(nextScope: 'class' | 'school', nextMetric: LeaderboardMetric) {
    setScope(nextScope)
    setMetric(nextMetric)
    startTransition(async () => {
      const res = await getLeaderboard(nextScope, nextMetric)
      setData(res)
    })
  }

  const me = data?.me ?? null

  return (
    <div className="space-y-3">
      {/* Scope toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex rounded-lg border p-0.5 bg-muted/40">
          {(['class', 'school'] as const).map((s) => (
            <button
              key={s}
              onClick={() => refetch(s, metric)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                scope === s ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'class' ? 'My Class' : 'Whole School'}
            </button>
          ))}
        </div>
        {data && data.cohort_size > 0 && (
          <span className="text-xs text-muted-foreground">{data.cohort_size} ranked</span>
        )}
      </div>

      {/* Metric toggle */}
      <div className="flex gap-1.5 flex-wrap">
        {METRICS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => refetch(scope, id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
              metric === id
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* My standing card with dimension breakdown */}
      {me && (
        <Card className="border-gold/30 bg-gradient-to-br from-gold/10 to-transparent">
          <CardContent className="pt-4 pb-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-gold/15 border border-gold/30">
                  <span className="text-lg font-bold text-gold leading-none">#{me.rank}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">Your standing</p>
                  <p className="text-xs text-muted-foreground">
                    {me.percentile !== null
                      ? `Top ${Math.max(1, 100 - me.percentile)}% of your ${scope === 'class' ? 'class' : 'school'}`
                      : `Ranked in your ${scope}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gold leading-none">{me.mirror_score}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">Mirror Score</p>
              </div>
            </div>

            {/* Dimension bars */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
              {DIMENSIONS.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Icon className="h-3 w-3" /> {label}
                    </span>
                    <span className="font-semibold">{me.breakdown[key]}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${me.breakdown[key]}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick stats row */}
            <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {me.avg_score}% avg</span>
              <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> {me.streak}d streak</span>
              {me.badge_count > 0 && (
                <span className="flex items-center gap-1"><Award className="h-3 w-3 text-gold" /> {me.badge_count} badge{me.badge_count !== 1 ? 's' : ''}</span>
              )}
              {me.trajectory === 'improving' && (
                <span className="flex items-center gap-1 text-emerald-600"><TrendingUp className="h-3 w-3" /> improving</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* This-week social proof highlight */}
      {socialProof && socialProof.peers_completed_this_week > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          <span>
            <span className="font-semibold text-foreground">{socialProof.peers_completed_this_week}</span>{' '}
            schoolmate{socialProof.peers_completed_this_week !== 1 ? 's' : ''} completed assessments this week
          </span>
        </div>
      )}

      {/* Ranking list */}
      <div className={`space-y-1.5 transition-opacity ${pending ? 'opacity-50' : ''}`}>
        {!data || data.cohort_size === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Trophy className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No ranking yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Complete study sessions and assessments to climb the leaderboard.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {data.top.map((e) => <LeaderboardRow key={e.student_id} e={e} metric={metric} />)}
            {data.around_me.length > 0 && (
              <>
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 border-t border-dashed" />
                  <span className="text-[10px] text-muted-foreground">your position</span>
                  <div className="flex-1 border-t border-dashed" />
                </div>
                {data.around_me.map((e) => <LeaderboardRow key={e.student_id} e={e} metric={metric} />)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function LeaderboardRow({ e, metric }: { e: LeaderboardEntry; metric: LeaderboardMetric }) {
  return (
    <Card className={e.is_me ? 'border-gold/50 bg-gold/5' : ''}>
      <CardContent className="py-2 px-3">
        <div className="flex items-center gap-3">
          <div className="w-6 flex justify-center shrink-0">{rankBadge(e.rank)}</div>
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className={`text-[10px] ${e.is_me ? 'bg-gold text-gold-foreground' : 'bg-muted'}`}>
              {e.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {e.name}
              {e.is_me && <span className="text-xs text-gold ml-1.5">(you)</span>}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {metric !== 'performance' && <span>{e.avg_score}% avg</span>}
              {metric !== 'streak' && e.streak > 0 && <span className="flex items-center gap-0.5"><Flame className="h-2.5 w-2.5 text-orange-500" />{e.streak}d</span>}
              {e.trajectory === 'improving' && <span className="flex items-center gap-0.5 text-emerald-600"><TrendingUp className="h-2.5 w-2.5" /></span>}
              {e.badge_count > 0 && <span className="flex items-center gap-0.5"><Medal className="h-2.5 w-2.5 text-gold" />{e.badge_count}</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-foreground">{metricValue(e, metric)}</p>
            {metric === 'overall' && <p className="text-[10px] text-muted-foreground">Mirror</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
