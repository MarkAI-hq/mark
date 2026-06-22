'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  logStudyMinutes,
  type RollingWindow as RollingWindowData,
  type DailyPlan,
} from '@/lib/actions/study-plans'

const QUICK_LOG = [15, 30, 45]

function fmt(min: number): string {
  if (min <= 0) return '0m'
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
}

function DayCard({
  label,
  plan,
  tone,
  onLog,
  busy,
}: {
  label: string
  plan: DailyPlan | null
  tone: 'past' | 'today' | 'future'
  onLog?: (minutes: number) => void
  busy?: boolean
}) {
  const target = (plan?.target_minutes ?? 0) + (plan?.carried_in_minutes ?? 0)
  const logged = plan?.logged_minutes ?? 0
  const pct = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : 0
  const done = plan?.status === 'complete'

  return (
    <Card
      className={
        tone === 'today'
          ? 'border-gold/60 ring-1 ring-gold/30'
          : tone === 'past'
            ? 'opacity-90'
            : ''
      }
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          {done ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Done
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {fmt(logged)} / {fmt(target)}
            </span>
          )}
        </div>

        <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
          <div
            className={`h-full ${done ? 'bg-emerald-500' : 'bg-gold'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {plan && plan.carried_in_minutes > 0 && (
          <p className="text-xs text-amber-600">
            +{fmt(plan.carried_in_minutes)} rolled over from a missed day
          </p>
        )}

        {plan && plan.planned_lessons.length > 0 ? (
          <ul className="space-y-1.5">
            {plan.planned_lessons.slice(0, 4).map((l, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                <span>
                  <span className="font-medium">{l.subject}</span>
                  <span className="text-muted-foreground"> — {l.topic}</span>
                </span>
              </li>
            ))}
            {plan.planned_lessons.length > 4 && (
              <li className="text-xs text-muted-foreground">
                +{plan.planned_lessons.length - 4} more
              </li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {tone === 'past' ? 'Rest day.' : 'Nothing scheduled.'}
          </p>
        )}

        {tone === 'today' && onLog && (
          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_LOG.map((m) => (
              <Button
                key={m}
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => onLog(m)}
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {m}m
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function RollingWindow({ initial }: { initial: RollingWindowData }) {
  const router = useRouter()
  const [data, setData] = useState<RollingWindowData>(initial)
  const [busy, setBusy] = useState(false)

  async function handleLog(minutes: number) {
    setBusy(true)
    try {
      const { data: updated, error } = await logStudyMinutes(minutes)
      if (error || !updated) {
        toast({ title: 'Could not log time', variant: 'destructive' })
        return
      }
      setData((prev) => ({ ...prev, today: updated }))
      toast({ title: `Logged ${minutes} minutes`, description: 'Keep it up!' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  if (!data.has_weekly_target) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-2 p-5">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-gold" />
            <span className="font-semibold">Set a weekly study target</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose how many hours a week you want to study and we&apos;ll build a
            rolling Yesterday · Today · Tomorrow plan that adapts when you miss a day.
          </p>
          <Button
            size="sm"
            className="mt-1 font-semibold"
            onClick={() => router.push('/student/settings')}
          >
            Set my weekly target
          </Button>
        </CardContent>
      </Card>
    )
  }

  const totalLoggedThisWeek = data.week.reduce(
    (n, d) => n + (d.logged_minutes ?? 0),
    0,
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gold" />
          <h2 className="font-semibold">Your rolling plan</h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {fmt(totalLoggedThisWeek)} logged this week
          {data.weekly_target_hours
            ? ` · ${data.weekly_target_hours}h target`
            : ''}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <DayCard label="Yesterday" plan={data.yesterday} tone="past" />
        <DayCard
          label="Today"
          plan={data.today}
          tone="today"
          onLog={handleLog}
          busy={busy}
        />
        <DayCard label="Tomorrow" plan={data.tomorrow} tone="future" />
      </div>
    </div>
  )
}
