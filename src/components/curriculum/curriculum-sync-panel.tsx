'use client'

// src/components/curriculum/curriculum-sync-panel.tsx

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { createSubjects } from '@/lib/actions/subjects'
import { createClass } from '@/lib/actions/classes'

export interface CurriculumSyncItem {
  key:   string
  label: string
}

interface CurriculumSyncPanelProps {
  kind:  'subject' | 'class'
  items: CurriculumSyncItem[]
}

export function CurriculumSyncPanel({ kind, items }: CurriculumSyncPanelProps) {
  const [checked,   setChecked]   = useState<Record<string, boolean>>(
    Object.fromEntries(items.map(i => [i.key, true])),
  )
  const [dismissed, setDismissed] = useState(false)
  const [isPending, startT]       = useTransition()

  if (dismissed || items.length === 0) return null

  const checkedCount = items.filter(i => checked[i.key]).length
  const noun = kind === 'subject' ? 'subject' : 'class'

  const handleAdd = () => {
    const selected = items.filter(i => checked[i.key])
    if (selected.length === 0) return

    startT(async () => {
      if (kind === 'subject') {
        const { error } = await createSubjects(selected.map(s => ({ name: s.label })))
        if (error) {
          toast.error(`Some subjects could not be added: ${error.message}`)
        } else {
          toast.success(`${selected.length} subject${selected.length === 1 ? '' : 's'} added from your curriculum.`)
          setDismissed(true)
        }
      } else {
        const results = await Promise.allSettled(
          selected.map(c => createClass({ name: c.label, grade_level: c.label })),
        )
        const failCount = results.filter(r => r.status === 'rejected').length
        if (failCount > 0) {
          toast.warning(`${failCount} class(es) failed to add — you can add them manually.`)
        } else {
          toast.success(`${selected.length} class${selected.length === 1 ? '' : 'es'} added from your curriculum.`)
        }
        setDismissed(true)
      }
    })
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <Sparkles className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            {items.length} {noun}{items.length === 1 ? '' : 's'} found in your curriculum
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            These are part of the national curriculum for your school but aren&apos;t set up yet.
          </p>
        </div>
      </div>

      <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
        {items.map(i => (
          <label
            key={i.key}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/60 cursor-pointer"
          >
            <Checkbox
              checked={!!checked[i.key]}
              onCheckedChange={() => setChecked(prev => ({ ...prev, [i.key]: !prev[i.key] }))}
            />
            <span className="text-sm text-amber-900">{i.label}</span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleAdd} disabled={isPending || checkedCount === 0}>
          {isPending ? 'Adding…' : `Add ${checkedCount} selected`}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDismissed(true)} disabled={isPending}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
