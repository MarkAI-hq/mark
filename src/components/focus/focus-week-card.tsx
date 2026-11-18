'use client'

// "Focus this week" (Focus Mode v1, spec §5.8). Self-fetching so the dashboard
// props stay unchanged; refreshes when a focus session finishes.

import { useEffect, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Timer } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getMyFocusSummary, type FocusSummary } from '@/lib/actions/focus'
import { SYSTEMS } from '@/lib/focus/systems'
import { useOptionalFocus } from './focus-provider'

const DAY = new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' })

export function FocusWeekCard() {
  const focus = useOptionalFocus()
  const phase = focus?.view.phase
  const [summary, setSummary] = useState<FocusSummary | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    // Load on mount and again whenever a session returns to idle (after ending).
    if (phase && phase !== 'idle') return
    let alive = true
    getMyFocusSummary(7)
      .then((res) => {
        if (!alive) return
        if (res.error) setFailed(true)
        else {
          setFailed(false)
          setSummary(res.data)
        }
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [phase])

  if (failed && !summary) return null

  const data = (summary?.minutes_by_day ?? []).map((d) => ({
    day: DAY.format(new Date(`${d.date}T00:00:00Z`)),
    minutes: d.minutes,
  }))
  const empty = !summary || summary.sessions_total === 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-4 w-4 text-gold" />
          Focus this week
        </CardTitle>
        <CardDescription>
          {empty
            ? 'Start a focus session from the Focus button at the bottom right.'
            : 'Minutes studied in focus sessions over the last 7 days'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Minutes" value={summary ? String(summary.focus_minutes) : '–'} />
          <Stat label="Sessions" value={summary ? String(summary.sessions_completed) : '–'} />
          <Stat
            label="Most used"
            value={summary?.most_used_system ? SYSTEMS[summary.most_used_system].label : '–'}
          />
        </div>
        {!empty && (
          <div className="mt-4" style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [`${v} min`, 'Focus']}
                  contentStyle={{ fontSize: 12 }}
                  cursor={{ fill: 'rgba(201,168,76,0.08)' }}
                />
                <Bar dataKey="minutes" fill="#C9A84C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
