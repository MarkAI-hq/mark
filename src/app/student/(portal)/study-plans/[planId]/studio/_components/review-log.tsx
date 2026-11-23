'use client'

// End-of-lesson review log (#9): "jot down tricky concepts, failed problems,
// or questions to revisit". Pre-filled from what the student actually missed
// (ticked by default — they can untick), plus their own words. Saving pulls
// the lesson's spaced review forward; the items show up on the Study Plans
// page until the student ticks them off.

import { useState } from 'react'
import { Check, Loader2, NotebookPen, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveReviewLog } from '@/lib/actions/review-log'

export function ReviewLog({ planId, missed }: { planId: string; missed: string[] }) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set(missed))
  const [own, setOwn] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<{ count: number; due: string | null } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  if (saved) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
        <Check className="h-4 w-4 shrink-0" />
        <span>
          {saved.count} item{saved.count === 1 ? '' : 's'} on your review list
          {saved.due ? ` — back on ${new Date(saved.due).toLocaleDateString(undefined, { weekday: 'long' })}` : ''}.
        </span>
      </div>
    )
  }

  function toggle(t: string) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  function addOwn() {
    const t = draft.replace(/\s+/g, ' ').trim()
    if (!t) return
    setOwn((o) => (o.some((x) => x.toLowerCase() === t.toLowerCase()) ? o : [...o, t].slice(0, 6)))
    setDraft('')
  }

  async function save() {
    const items = [
      ...missed.filter((m) => picked.has(m)).map((text) => ({ text, source: 'missed' as const })),
      ...own.map((text) => ({ text, source: 'self' as const })),
    ]
    if (!items.length) {
      setDismissed(true)
      return
    }
    setSaving(true)
    const { data, error } = await saveReviewLog(planId, items)
    setSaving(false)
    if (error || !data) {
      toast.error(error?.message ?? 'Could not save your review list')
      return
    }
    setSaved({ count: data.saved, due: data.due_at })
  }

  const total = missed.filter((m) => picked.has(m)).length + own.length

  return (
    <section aria-label="What needs review" className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-medium">Anything still tricky?</p>
          <p className="text-xs text-muted-foreground">
            Add it to your review list and we&apos;ll bring it back soon — before it fades.
          </p>
        </div>
      </div>

      {missed.length > 0 && (
        <ul className="space-y-1.5">
          {missed.map((m) => (
            <li key={m}>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={picked.has(m)}
                  onChange={() => toggle(m)}
                  className="mt-1 h-3.5 w-3.5 shrink-0 accent-gold"
                />
                <span className="min-w-0">{m}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {own.length > 0 && (
        <ul className="space-y-1.5">
          {own.map((o) => (
            <li key={o} className="flex items-start gap-2 text-sm">
              <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
              <span className="min-w-0 flex-1">{o}</span>
              <button
                type="button"
                onClick={() => setOwn((x) => x.filter((y) => y !== o))}
                aria-label={`Remove ${o}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          addOwn()
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Still unsure why we carry in base 5"
          maxLength={300}
          className="h-9 text-sm"
          aria-label="Something to revisit"
        />
        <Button type="submit" size="sm" variant="outline" className="h-9 shrink-0 gap-1" disabled={!draft.trim()}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </form>

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
          Nothing to add
        </Button>
        <Button
          size="sm"
          onClick={save}
          disabled={saving || total === 0}
          className="gap-1.5 bg-gold text-gold-foreground hover:bg-gold/90"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saving ? 'Saving…' : total ? `Save ${total} to review list` : 'Save to review list'}
        </Button>
      </div>
    </section>
  )
}
