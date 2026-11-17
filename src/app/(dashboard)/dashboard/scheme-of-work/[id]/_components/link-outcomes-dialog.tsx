'use client'

// src/app/(dashboard)/dashboard/scheme-of-work/[id]/_components/link-outcomes-dialog.tsx
//
// SPEC-03 S3-R2/R32 — the teacher's key to the activation gate. For one week it
// suggests the curriculum outcomes that week most likely covers (outcomes of a
// topic the week NAMES first), lets the teacher tick the right ones, and links
// them. Nothing is saved until "Link" is pressed.

import { useEffect, useState } from 'react'
import { Loader2, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  applyOutcomes, suggestOutcomes,
  type OutcomeSuggestion, type SchemeOfWorkEntry,
} from '@/lib/actions/scheme-of-work'
import { formatTopicTitle } from '@/lib/utils'

interface Props {
  schemeId: string
  entry: SchemeOfWorkEntry | null
  onClose: () => void
  onLinked: () => void
}

export function LinkOutcomesDialog({ schemeId, entry, onClose, onLinked }: Props) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<OutcomeSuggestion[]>([])
  const [picked, setPicked] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!entry) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setSuggestions([])
    // Keep the outcomes this week is already linked to ticked, if any.
    setPicked(new Set(entry.curriculum_refs ?? []))
    suggestOutcomes(schemeId, entry.id).then((res) => {
      if (cancelled) return
      setLoading(false)
      if (res.error || !res.data) {
        setError(res.error?.message ?? 'Could not load suggestions.')
        return
      }
      setSuggestions(res.data.suggestions)
      setPicked((prev) => {
        if (prev.size > 0) return prev
        // Pre-tick outcomes of the topic(s) the week names; otherwise the best match.
        const named = res.data!.suggestions.filter((s) => s.topic_match).map((s) => s.ref)
        const first = res.data!.suggestions.slice(0, 1).map((s) => s.ref)
        return new Set(named.length ? named.slice(0, 8) : first)
      })
    })
    return () => { cancelled = true }
  }, [entry, schemeId])

  function toggle(ref: string) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(ref)) next.delete(ref)
      else if (next.size < 8) next.add(ref)
      else toast.message('You can link up to 8 outcomes to one week.')
      return next
    })
  }

  async function link() {
    if (!entry || picked.size === 0) return
    setSaving(true)
    const res = await applyOutcomes(schemeId, entry.id, Array.from(picked))
    setSaving(false)
    if (res.error || !res.data) {
      toast.error(res.error?.message ?? 'Could not link outcomes.')
      return
    }
    toast.success(`Week ${entry.week_number} is linked to ${picked.size} curriculum outcome${picked.size === 1 ? '' : 's'}.`)
    res.data.warnings.forEach((w) => toast.warning(w))
    onLinked()
    onClose()
  }

  // Group suggestions by curriculum topic so the teacher sees the structure.
  const groups = suggestions.reduce<Record<string, OutcomeSuggestion[]>>((acc, s) => {
    ;(acc[s.topic_name] ??= []).push(s)
    return acc
  }, {})

  return (
    <Dialog open={!!entry} onOpenChange={(open) => { if (!open && !saving) onClose() }}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Link week {entry?.week_number} to the curriculum
          </DialogTitle>
          <DialogDescription>
            {entry ? formatTopicTitle(entry.topic) : ''} — choose the curriculum outcomes this week covers.
            The week&apos;s learning objectives become the curriculum&apos;s own wording; your original wording is kept in the week&apos;s notes.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Finding matching outcomes… the first time can take about 15 seconds.
          </div>
        )}

        {error && <p className="text-sm text-rose-600 py-2">{error}</p>}

        {!loading && !error && suggestions.length === 0 && (
          <p className="text-sm text-slate-500 py-4">
            No curriculum outcomes were found for this class and term.
          </p>
        )}

        {!loading && Object.entries(groups).map(([topicName, items]) => (
          <div key={topicName} className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-2">
              {formatTopicTitle(topicName)}
              {items[0].topic_match && <Badge variant="outline" className="text-[11px]">Matches this week&apos;s title</Badge>}
            </p>
            {items.map((s) => (
              <label
                key={s.ref}
                className="flex items-start gap-3 rounded-lg border px-3 py-2 cursor-pointer hover:bg-slate-50"
              >
                <Checkbox
                  checked={picked.has(s.ref)}
                  onCheckedChange={() => toggle(s.ref)}
                  className="mt-0.5"
                />
                <span className="text-sm text-slate-800 leading-snug">{s.text}</span>
              </label>
            ))}
          </div>
        ))}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={link} disabled={saving || picked.size === 0}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Link {picked.size || ''} outcome{picked.size === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
