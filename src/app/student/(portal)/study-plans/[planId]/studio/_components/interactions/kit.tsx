'use client'

// SPEC-05 S5-R14 interaction kit: tap-to-select-then-tap-target is the primary
// mode (reliable on low-end Android), every control is a real <button> so the
// keyboard works with no extra code, targets are ≥ 44 px, nothing loads after
// the lesson does.
import type { ReactNode } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { LessonProse } from '@/components/lesson/lesson-prose'
import type { ItemResult } from '@/lib/interactions/shared/types'

/** Deterministic shuffle (same order on every render, refresh and device). */
export function stableShuffle<T extends { id: string }>(items: T[], seed: string): T[] {
  const hash = (s: string) => {
    let h = 2166136261
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
    return h >>> 0
  }
  const out = [...items].sort((a, b) => hash(seed + a.id) - hash(seed + b.id))
  // never present an ordering activity already solved
  if (out.length > 1 && out.every((x, i) => x.id === items[i].id)) out.push(out.shift() as T)
  return out
}

export type Mark = 'correct' | 'wrong' | null

export function markFor(results: ItemResult[] | null, id: string): Mark {
  const r = results?.find((x) => x.id === id)
  return r ? (r.correct ? 'correct' : 'wrong') : null
}

const MARK_CLS: Record<'correct' | 'wrong', string> = {
  correct: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200',
  wrong: 'border-rose-400 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-200',
}

export function Chip({
  label,
  selected,
  mark,
  disabled,
  onClick,
  prefix,
  ariaLabel,
}: {
  label: string
  selected?: boolean
  mark?: Mark
  disabled?: boolean
  onClick?: () => void
  prefix?: ReactNode
  ariaLabel?: string
}) {
  const base = mark
    ? MARK_CLS[mark]
    : selected
      ? 'border-gold bg-gold/15 ring-2 ring-gold/40'
      : 'border-border bg-card hover:bg-muted/50'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={`min-h-[44px] w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm leading-snug transition-colors disabled:cursor-default ${base}`}
    >
      {prefix}
      <span className="flex-1"><LessonProse text={label} /></span>
      {mark === 'correct' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="correct" />}
      {mark === 'wrong' && <XCircle className="h-4 w-4 shrink-0 text-rose-500" aria-label="needs another look" />}
    </button>
  )
}

/** A tappable drop zone (a group, a slot) — tapping it places the selected item. */
export function Zone({
  title,
  active,
  onClick,
  disabled,
  children,
  ariaLabel,
}: {
  title: string
  active: boolean
  onClick: () => void
  disabled?: boolean
  children?: ReactNode
  ariaLabel?: string
}) {
  return (
    <div className={`rounded-2xl border-2 border-dashed p-2 transition-colors ${active ? 'border-gold bg-gold/5' : 'border-border'}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel ?? `Place here: ${title}`}
        className="min-h-[44px] w-full rounded-lg px-2 py-1.5 text-left text-sm font-semibold disabled:cursor-default"
      >
        <LessonProse text={title} />
        {active && <span className="ml-2 text-xs font-normal text-gold">tap to place here</span>}
      </button>
      {children && <div className="mt-1 space-y-1.5">{children}</div>}
    </div>
  )
}

export function ItemFeedback({ results, id }: { results: ItemResult[] | null; id: string }) {
  const r = results?.find((x) => x.id === id)
  if (!r || r.correct || !r.feedback) return null
  return <p className="px-1 text-xs text-rose-700 dark:text-rose-300"><LessonProse text={r.feedback} /></p>
}
