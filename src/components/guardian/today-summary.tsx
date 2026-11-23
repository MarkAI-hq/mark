// src/components/guardian/today-summary.tsx
//
// The "today" summary (#4): automated numbers + the teacher's human note.
// Rendered for guardians on the child overview, and for teachers above the
// note box so they see exactly what the parent will see.

import { CalendarCheck, CheckCircle2, Clock, BookOpen, MessageSquareQuote } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTopicTitle } from '@/lib/utils'
import type { DailySummary } from '@/lib/actions/daily-summary'

export function TodaySummary({ summary, audience = 'guardian' }: { summary: DailySummary; audience?: 'guardian' | 'teacher' }) {
  const { first_name, minutes, target_minutes, lessons, points_mastered, coach_notes, studied } = summary
  const description = studied
    ? audience === 'guardian'
      ? `Here's how ${first_name}'s learning went today.`
      : `What ${first_name}'s guardians will see tonight.`
    : `${first_name} hasn't logged any study time yet today.`

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck className="h-4 w-4 text-gold" />
          Today
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {studied && (
          <ul className="space-y-2">
            {minutes > 0 && (
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  <span className="font-medium tabular-nums">{minutes} min</span> studied
                  {target_minutes ? <span className="text-muted-foreground"> of a {target_minutes}-min goal</span> : null}
                </span>
              </li>
            )}
            {lessons.length > 0 && (
              <li className="flex items-start gap-2">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {lessons.length} lesson{lessons.length === 1 ? '' : 's'}:{' '}
                  {lessons
                    .map((l) => `${formatTopicTitle(l.topic)}${l.score !== null ? ` (${l.score}%)` : ''}`)
                    .join(', ')}
                </span>
              </li>
            )}
            {points_mastered.length > 0 && (
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                <div className="min-w-0">
                  <span>
                    {points_mastered.length} learning point{points_mastered.length === 1 ? '' : 's'} mastered
                  </span>
                  <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {points_mastered.slice(0, 5).map((p) => (
                      <li key={p} className="[overflow-wrap:anywhere]">• {p}</li>
                    ))}
                  </ul>
                </div>
              </li>
            )}
          </ul>
        )}

        {coach_notes.map((n, i) => (
          <blockquote key={i} className="flex gap-2 rounded-lg border-l-2 border-gold bg-gold/5 px-3 py-2">
            <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
            <div className="min-w-0">
              <p className="[overflow-wrap:anywhere]">{n.note}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">— {n.author}</p>
            </div>
          </blockquote>
        ))}
      </CardContent>
    </Card>
  )
}
