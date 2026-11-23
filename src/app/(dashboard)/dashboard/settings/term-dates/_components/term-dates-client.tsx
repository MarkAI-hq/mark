'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarDays, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  saveSchoolTerms,
  type CalendarTerm,
  type SchoolTerms,
  type TermStatus,
} from '@/lib/actions/academic-calendar'

const SOURCE_LABEL: Record<SchoolTerms['source'], string> = {
  school: "Your school's dates",
  national: 'National calendar',
  national_estimated: 'National calendar (estimated)',
  none: 'No calendar',
}

function weeksBetween(start: string, end: string): number | null {
  const s = Date.parse(start)
  const e = Date.parse(end)
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return null
  return Math.ceil(((e - s) / 86_400_000 + 1) / 7)
}

export function TermDatesClient({
  year,
  initial,
  status,
}: {
  year: number
  initial: SchoolTerms
  status: TermStatus | null
}) {
  const router = useRouter()
  const [terms, setTerms] = useState<CalendarTerm[]>(
    initial.terms.map(({ term, label, start, end }) => ({ term, label, start, end })),
  )
  const [source, setSource] = useState(initial.source)
  const [saving, startSaving] = useTransition()

  const update = (i: number, patch: Partial<CalendarTerm>) =>
    setTerms((prev) => prev.map((t, j) => (j === i ? { ...t, ...patch } : t)))

  function save(next: CalendarTerm[]) {
    startSaving(async () => {
      const { data, error } = await saveSchoolTerms(year, next)
      if (error || !data) {
        toast.error(error?.message ?? 'Could not save term dates')
        return
      }
      setTerms(data.terms.map(({ term, label, start, end }) => ({ term, label, start, end })))
      setSource(data.source)
      toast.success(
        next.length
          ? 'Term dates saved. Schemes of work now follow these dates.'
          : 'Back on the national calendar.',
      )
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">Term Dates</h3>
        <p className="text-sm text-muted-foreground">
          Lessons, pacing, predictions and the assistant all use these dates to know which term it is
          and how many weeks are left. Change them only if your school&apos;s calendar differs from the
          national one.
        </p>
      </div>

      {status && status.phase !== 'unknown' && (
        <div className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm">
          <CalendarDays className="h-4 w-4 mt-0.5 text-gold shrink-0" />
          <div>
            <p className="font-medium">Today</p>
            <p className="text-muted-foreground">{status.summary}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">{year} terms</CardTitle>
            <CardDescription>First and last teaching day of each term.</CardDescription>
          </div>
          <Badge variant={source === 'school' ? 'default' : 'secondary'}>{SOURCE_LABEL[source]}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Term</th>
                  <th className="pb-2 font-medium">Starts</th>
                  <th className="pb-2 font-medium">Ends</th>
                  <th className="pb-2 font-medium text-right">Weeks</th>
                </tr>
              </thead>
              <tbody>
                {terms.map((t, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-2 pr-3">
                      <Input
                        value={t.label}
                        onChange={(e) => update(i, { label: e.target.value })}
                        className="h-9 min-w-[110px]"
                        aria-label={`Term ${i + 1} name`}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        type="date"
                        value={t.start}
                        onChange={(e) => update(i, { start: e.target.value })}
                        className="h-9"
                        aria-label={`${t.label} start date`}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        type="date"
                        value={t.end}
                        onChange={(e) => update(i, { end: e.target.value })}
                        className="h-9"
                        aria-label={`${t.label} end date`}
                      />
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {weeksBetween(t.start, t.end) ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => save(terms)} disabled={saving || terms.length === 0}>
              {saving ? 'Saving…' : 'Save term dates'}
            </Button>
            {source === 'school' && (
              <Button variant="ghost" onClick={() => save([])} disabled={saving} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Use the national calendar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
