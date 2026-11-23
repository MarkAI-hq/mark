'use client'

// Teacher/admin: add today's observation for a student. Shows the summary the
// guardian will receive first, so the note adds context rather than repeating
// the numbers ("got frustrated halfway, pushed through after the hints").

import { useEffect, useState } from 'react'
import { Loader2, NotebookPen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { TodaySummary } from '@/components/guardian/today-summary'
import {
  addCoachNote,
  getCoachNotes,
  getStudentToday,
  type CoachNote,
  type DailySummary,
} from '@/lib/actions/daily-summary'

export function CoachNoteCard({ studentId }: { studentId: string }) {
  const [today, setToday] = useState<DailySummary | null>(null)
  const [notes, setNotes] = useState<CoachNote[]>([])
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const [t, n] = await Promise.all([getStudentToday(studentId), getCoachNotes(studentId)])
    if (t.data) setToday(t.data)
    if (n.data) setNotes(n.data)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  async function save() {
    const note = draft.trim()
    if (!note) return
    setSaving(true)
    const { error } = await addCoachNote(studentId, note)
    setSaving(false)
    if (error) {
      toast.error(error.message ?? 'Could not save the note')
      return
    }
    setDraft('')
    toast.success("Note added — it goes out with tonight's update")
    void load()
  }

  const earlier = notes.filter((n) => n.note_date !== today?.date).slice(0, 5)

  return (
    <div className="space-y-4">
      {today && <TodaySummary summary={today} audience="teacher" />}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <NotebookPen className="h-4 w-4 text-gold" />
            Add a note for the guardians
          </CardTitle>
          <CardDescription>
            One or two sentences on how today went — effort, mood, a breakthrough. The numbers above are sent automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={600}
            rows={3}
            placeholder="e.g. Arrived on time, got stuck on bearings halfway, but pushed through after reviewing the hints."
            className="resize-none text-sm"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">{draft.length}/600</span>
            <Button size="sm" onClick={save} disabled={saving || !draft.trim()} className="gap-1.5 bg-gold text-gold-foreground hover:bg-gold/90">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? 'Saving…' : 'Add note'}
            </Button>
          </div>
          {earlier.length > 0 && (
            <div className="border-t pt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Earlier notes</p>
              <ul className="space-y-2">
                {earlier.map((n) => (
                  <li key={n.id} className="text-xs">
                    <span className="text-muted-foreground">
                      {new Date(`${n.note_date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} ·{' '}
                      {[n.author_first, n.author_last].filter(Boolean).join(' ')}:
                    </span>{' '}
                    <span className="[overflow-wrap:anywhere]">{n.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
