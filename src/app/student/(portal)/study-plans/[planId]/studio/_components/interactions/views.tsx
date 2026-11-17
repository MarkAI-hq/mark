'use client'

// SPEC-05 S5-R14 — one view per template. Views are controlled: the scene owns
// the response, the check result and the reveal state; a view only renders and
// reports changes.
import { useMemo, useState } from 'react'
import type {
  ClassifyData,
  ClassifyResponse,
  ItemResult,
  MatchData,
  MatchResponse,
  NumericResponse,
  NumericSolverData,
  SequenceData,
  SequenceResponse,
} from '@/lib/interactions/shared/types'
import { LessonProse } from '@/components/lesson/lesson-prose'
import { Chip, ItemFeedback, Zone, markFor, stableShuffle } from './kit'

interface ViewProps<D, R> {
  data: D
  response: R
  onChange: (r: R) => void
  /** item results from the last Check (null before the first) */
  results: ItemResult[] | null
  locked: boolean
  seed: string
}

// ── classify ─────────────────────────────────────────────────────────────────

export function ClassifyView({ data, response, onChange, results, locked, seed }: ViewProps<ClassifyData, ClassifyResponse>) {
  const [selected, setSelected] = useState<string | null>(null)
  const items = useMemo(() => stableShuffle(data.items, seed), [data.items, seed])
  const placed = response.placements
  const pool = items.filter((i) => !placed[i.id])

  const place = (binId: string) => {
    if (!selected || locked) return
    onChange({ placements: { ...placed, [selected]: binId } })
    setSelected(null)
  }
  const unplace = () => {
    if (!selected || locked) return
    const next = { ...placed }
    delete next[selected]
    onChange({ placements: next })
    setSelected(null)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-muted/30 p-2" aria-label="Items to sort">
        <button
          type="button"
          onClick={unplace}
          disabled={!selected || !placed[selected ?? '']}
          className="min-h-[32px] w-full px-2 text-left text-xs font-medium text-muted-foreground disabled:cursor-default"
        >
          {pool.length ? 'Items to sort' : 'All items placed'}
          {selected && placed[selected] && <span className="ml-2 text-gold">tap here to take it back</span>}
        </button>
        <div className="mt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {pool.map((it) => (
            <Chip key={it.id} label={it.label} selected={selected === it.id} disabled={locked} onClick={() => setSelected(selected === it.id ? null : it.id)} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.bins.map((b) => (
          <Zone key={b.id} title={b.label} active={!!selected && !locked} onClick={() => place(b.id)} disabled={locked}>
            {items
              .filter((it) => placed[it.id] === b.id)
              .map((it) => (
                <div key={it.id} className="space-y-1">
                  <Chip
                    label={it.label}
                    selected={selected === it.id}
                    mark={markFor(results, it.id)}
                    disabled={locked}
                    onClick={() => setSelected(selected === it.id ? null : it.id)}
                  />
                  <ItemFeedback results={results} id={it.id} />
                </div>
              ))}
          </Zone>
        ))}
      </div>
    </div>
  )
}

// ── match ────────────────────────────────────────────────────────────────────

export function MatchView({ data, response, onChange, results, locked, seed }: ViewProps<MatchData, MatchResponse>) {
  const [selected, setSelected] = useState<string | null>(null)
  const right = useMemo(() => stableShuffle(data.right, seed), [data.right, seed])
  const pairs = response.pairs
  const letter = (leftId: string) => String.fromCharCode(65 + data.left.findIndex((l) => l.id === leftId))
  const ownerOf = (rightId: string) => Object.keys(pairs).find((l) => pairs[l] === rightId)

  const choose = (rightId: string) => {
    if (!selected || locked) return
    const next = { ...pairs }
    const prevOwner = ownerOf(rightId)
    if (prevOwner) delete next[prevOwner] // each right item pairs once
    next[selected] = rightId
    onChange({ pairs: next })
    setSelected(null)
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <p className="px-1 text-xs font-medium text-muted-foreground">Tap one of these…</p>
        {data.left.map((l) => (
          <div key={l.id}>
            <Chip
              label={l.label}
              selected={selected === l.id}
              mark={markFor(results, l.id)}
              disabled={locked}
              onClick={() => setSelected(selected === l.id ? null : l.id)}
              prefix={<span className="h-6 w-6 shrink-0 rounded-full border text-center text-xs font-bold leading-6">{letter(l.id)}</span>}
            />
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <p className="px-1 text-xs font-medium text-muted-foreground">…then its partner</p>
        {right.map((r) => {
          const owner = ownerOf(r.id)
          return (
            <Chip
              key={r.id}
              label={r.label}
              disabled={locked || !selected}
              onClick={() => choose(r.id)}
              ariaLabel={`${r.label}${owner ? `, paired with ${letter(owner)}` : ''}`}
              prefix={
                <span className={`h-6 w-6 shrink-0 rounded-full border text-center text-xs font-bold leading-6 ${owner ? 'bg-gold/20 border-gold' : 'border-dashed'}`}>
                  {owner ? letter(owner) : ''}
                </span>
              }
            />
          )
        })}
      </div>
    </div>
  )
}

// ── sequence ─────────────────────────────────────────────────────────────────

export function SequenceView({ data, response, onChange, results, locked, seed }: ViewProps<SequenceData, SequenceResponse>) {
  const shuffled = useMemo(() => stableShuffle(data.steps, seed), [data.steps, seed])
  const label = (id: string) => data.steps.find((s) => s.id === id)?.label ?? id
  const order = response.order
  const pool = shuffled.filter((s) => !order.includes(s.id))

  return (
    <div className="space-y-4">
      <ol className="space-y-1.5" aria-label="Your order">
        {order.length === 0 && <li className="rounded-xl border-2 border-dashed px-3 py-3 text-sm text-muted-foreground">Tap the steps below in order. They will appear here.</li>}
        {order.map((id, i) => (
          <li key={id}>
            <Chip
              label={label(id)}
              mark={results ? (results[i]?.correct ? 'correct' : 'wrong') : null}
              disabled={locked}
              onClick={() => onChange({ order: order.filter((x) => x !== id) })}
              ariaLabel={`Step ${i + 1}: ${label(id)}. Tap to take it out.`}
              prefix={<span className="w-6 shrink-0 text-center text-xs font-bold">{i + 1}</span>}
            />
          </li>
        ))}
      </ol>
      {pool.length > 0 && (
        <div className="space-y-1.5 rounded-2xl border bg-muted/30 p-2" aria-label="Steps to order">
          {pool.map((s) => (
            <Chip key={s.id} label={s.label} disabled={locked} onClick={() => onChange({ order: [...order, s.id] })} ariaLabel={`Add: ${s.label}`} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── numeric_solver ───────────────────────────────────────────────────────────

/** "540,000" / "540 000" / "1.5" → number; anything else → null. */
export function parseNumber(raw: string): number | null {
  const s = raw.replace(/[\s,]/g, '').trim()
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export function NumericView({
  data,
  response,
  onChange,
  results,
  locked,
  drafts,
  setDrafts,
}: ViewProps<NumericSolverData, NumericResponse> & { drafts: string[]; setDrafts: (d: string[]) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card px-4 py-3 text-base leading-relaxed"><LessonProse text={data.context} /></div>
      {data.steps.map((s, i) => {
        const r = results?.[i]
        const border = r ? (r.correct ? 'border-emerald-400' : 'border-rose-400') : 'border-border'
        return (
          <div key={i} className="space-y-1.5">
            <label htmlFor={`num-step-${i}`} className="block text-sm font-medium">
              <span className="mr-1 text-muted-foreground">Step {i + 1}.</span>
              <LessonProse text={s.prompt} />
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`num-step-${i}`}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                disabled={locked}
                value={drafts[i] ?? ''}
                onChange={(e) => {
                  const d = [...drafts]
                  d[i] = e.target.value
                  setDrafts(d)
                  const values = [...response.values]
                  values[i] = parseNumber(e.target.value)
                  onChange({ values })
                }}
                className={`h-11 w-full max-w-[220px] rounded-xl border-2 bg-background px-3 text-base tabular-nums ${border}`}
                aria-invalid={r ? !r.correct : undefined}
              />
              {s.unit && <span className="text-sm text-muted-foreground">{s.unit}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
