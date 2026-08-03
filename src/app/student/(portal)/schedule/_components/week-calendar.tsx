'use client'

// src/app/student/(portal)/schedule/_components/week-calendar.tsx
//
// A real calendar grid (day / 3-day / week) instead of a flat per-day list —
// physical classes and self-paced study blocks both render as timed events.
// Clicking an event opens a read-only "view event" popup, the same shape as
// Google Calendar's — students can't edit or move anything here, only see it.

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin, BookOpen, Clock } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface CalendarEvent {
  day_of_week: string
  start_time: string // HH:MM
  end_time: string   // HH:MM
  subject: string
  topic?: string
  room?: string
  kind: 'class' | 'study'
  estimated_minutes?: number
  sow_entry_id?: string
}

interface Props {
  days: string[] // e.g. ['monday', ..., 'friday'], in display order
  blocksByDay: Record<string, CalendarEvent[]>
}

type ViewMode = 'day' | '3day' | 'week'

const DAY_LABEL: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

const HOUR_HEIGHT = 48 // px per hour

export function WeekCalendar({ days, blocksByDay }: Props) {
  const [view, setView] = useState<ViewMode>('week')
  const [anchor, setAnchor] = useState(0) // index into `days` for day/3day views
  const [selected, setSelected] = useState<CalendarEvent | null>(null)

  // Open-pace study blocks carry no clock time (there's no fixed schedule to
  // grid them into) — this view is inherently timed, so those are left out
  // here rather than crashing; they still show in the "This Week" list tab.
  const timedBlocksByDay = useMemo(() => {
    const out: Record<string, CalendarEvent[]> = {}
    for (const d of days) {
      out[d] = (blocksByDay[d] ?? []).filter((e) => !!e.start_time && !!e.end_time)
    }
    return out
  }, [days, blocksByDay])

  const allEvents = days.flatMap((d) => timedBlocksByDay[d] ?? [])
  const { startHour, endHour } = useMemo(() => {
    if (allEvents.length === 0) return { startHour: 7, endHour: 17 }
    const starts = allEvents.map((e) => Math.floor(toMinutes(e.start_time) / 60))
    const ends = allEvents.map((e) => Math.ceil(toMinutes(e.end_time) / 60))
    return {
      startHour: Math.max(0, Math.min(...starts) - 1),
      endHour: Math.min(23, Math.max(...ends) + 1),
    }
  }, [allEvents])

  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
  const visibleDays =
    view === 'week' ? days
    : view === '3day' ? days.slice(anchor, anchor + 3)
    : days.slice(anchor, anchor + 1)

  const canGoBack = anchor > 0
  const canGoForward = anchor + (view === '3day' ? 3 : 1) < days.length

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* View toggle + navigation */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/20">
        <div className="flex items-center gap-1">
          {view !== 'week' && (
            <>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={!canGoBack} onClick={() => setAnchor((a) => Math.max(0, a - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={!canGoForward} onClick={() => setAnchor((a) => a + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          <span className="text-xs font-medium text-muted-foreground ml-1">
            {visibleDays.map((d) => DAY_LABEL[d] ?? d).join(' – ')}
          </span>
        </div>
        <div className="inline-flex rounded-lg border p-0.5 bg-background">
          {(['day', '3day', 'week'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); setAnchor(0) }}
              aria-pressed={view === v}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                view === v ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v === 'day' ? 'Day' : v === '3day' ? '3 Day' : 'Week'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex overflow-x-auto">
        {/* Hour rail */}
        <div className="shrink-0 w-12 border-r">
          <div className="h-6" />
          {hours.map((h) => (
            <div key={h} style={{ height: HOUR_HEIGHT }} className="text-[10px] text-muted-foreground text-right pr-1.5 -mt-1.5">
              {h % 12 === 0 ? 12 : h % 12}{h < 12 ? 'a' : 'p'}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {visibleDays.map((day) => (
          <div key={day} className="flex-1 min-w-[110px] border-r last:border-r-0 relative">
            <div className="h-6 flex items-center justify-center text-[11px] font-semibold border-b bg-muted/10 sticky top-0">
              {DAY_LABEL[day] ?? day}
            </div>
            <div className="relative" style={{ height: hours.length * HOUR_HEIGHT }}>
              {hours.map((h, i) => (
                <div key={h} className="absolute left-0 right-0 border-t border-border/50" style={{ top: i * HOUR_HEIGHT }} />
              ))}
              {(timedBlocksByDay[day] ?? []).map((event, i) => {
                const top = (toMinutes(event.start_time) / 60 - startHour) * HOUR_HEIGHT
                const height = Math.max(20, ((toMinutes(event.end_time) - toMinutes(event.start_time)) / 60) * HOUR_HEIGHT)
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(event)}
                    style={{ top, height }}
                    className={`absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-left overflow-hidden text-[10px] leading-tight border transition-opacity hover:opacity-80 ${
                      event.kind === 'class'
                        ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                        : 'bg-gold/15 border-gold/30 text-foreground'
                    }`}
                  >
                    <p className="font-medium truncate">{event.subject}</p>
                    {event.topic && <p className="truncate opacity-80">{event.topic}</p>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Read-only "view event" popup — same shape as Google Calendar's, but
          nothing here is editable or draggable. */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-sm">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.subject}
                  <Badge variant="outline" className={selected.kind === 'class' ? 'text-blue-600 border-blue-300' : 'text-gold border-gold/40'}>
                    {selected.kind === 'class' ? 'Physical class' : 'Study block'}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                {selected.topic && (
                  <div className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{selected.topic}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{selected.start_time}–{selected.end_time}</span>
                </div>
                {selected.room && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{selected.room}</span>
                  </div>
                )}
              </div>
              {selected.kind === 'study' && (
                <Button asChild size="sm" className="w-full bg-gold hover:bg-gold/90 text-gold-foreground">
                  <Link href="/student/study-plans">Go to Study Plans</Link>
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
