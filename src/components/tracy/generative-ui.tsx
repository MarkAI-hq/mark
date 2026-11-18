'use client'
import { noPasteProps } from '@/lib/no-paste'

// Renders the typed components Tracy can choose from (see generative-ui-protocol.ts).
// Every component follows the same rules: theme tokens only, modest radius, a
// gold accent, keyboard-operable, and read-only once it is no longer the active
// card — so older cards in the transcript don't invite stale answers.
//
// Placement: a topic picker is short, so it lives inline in the chat. A quiz
// question is long (stem + options + answer box), so inline it is only a compact
// summary; the full card opens in the side panel and stays in view while the
// student works, instead of scrolling the question out of sight.

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, Check, Clock, Lightbulb, PanelRightOpen, Play, Star } from 'lucide-react'
import { MathInline, MathMarkdown } from '@/components/tracy/chat-message'
import { WorkUploadCard } from '@/components/tracy/work-upload-card'
import { formatTopicTitle } from '@/lib/utils'
import {
  formatAnswer,
  topicValue,
  type ConceptExplainerUi,
  type GenerativeUi,
  type ProgressCardUi,
  type QuizQuestionUi,
  type StudyPlanUi,
  type TopicPickerUi,
} from '@/components/tracy/generative-ui-protocol'

/** What the student has done on a quiz card. Owned by the parent so it survives the panel closing. */
export interface QuizDraft {
  choice: string | null
  typed: string
  hintOpen: boolean
  sent: boolean
}

export const EMPTY_QUIZ_DRAFT: QuizDraft = { choice: null, typed: '', hintOpen: false, sent: false }

interface CardProps<T> {
  ui: T
  /** Only the newest card accepts input. */
  active: boolean
  onSend: (message: string) => void
}

const CARD = 'w-full overflow-hidden rounded-lg border border-border bg-card text-card-foreground'
const GOLD_TEXT = 'text-[#8a6713] dark:text-[#c9a03c]'

function Eyebrow({ parts }: { parts: (string | undefined)[] }) {
  const text = parts.filter(Boolean).join(' · ')
  if (!text) return null
  return <p className={`text-[11px] font-bold uppercase tracking-[.12em] ${GOLD_TEXT}`}>{text}</p>
}

// ── Topic picker ──────────────────────────────────────────────────────────────

function TopicPickerCard({ ui, active, onSend }: CardProps<TopicPickerUi>) {
  const { title, subject, level, options, allowCustom, customPlaceholder, customPrefix } = ui.props
  const [picked, setPicked] = useState<string | null>(null)
  const [custom, setCustom] = useState('')
  const locked = !active || picked !== null

  // Keep the author's order, but bring options of the same group together.
  const groups = useMemo(() => {
    const order: string[] = []
    const byGroup = new Map<string, { label: string; value?: string; hint?: string; recommended?: boolean; index: number }[]>()
    options.forEach((o, index) => {
      const g = o.group ?? ''
      if (!byGroup.has(g)) { byGroup.set(g, []); order.push(g) }
      byGroup.get(g)!.push({ ...o, index })
    })
    return order.map((g) => ({ name: g, items: byGroup.get(g)! }))
  }, [options])

  function pick(key: string, message: string) {
    if (locked) return
    setPicked(key)
    onSend(message)
  }

  function submitCustom() {
    const text = custom.trim()
    if (!text) return
    pick('custom', `${customPrefix ?? ''}${text}`)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={CARD}>
      <div className="border-b border-border px-4 py-3">
        <Eyebrow parts={[level, subject]} />
        <p className="mt-0.5 text-[15px] font-semibold text-foreground">{title ?? 'Pick one to start'}</p>
      </div>

      <div className="divide-y divide-border">
        {groups.map((g) => (
          <div key={g.name || 'all'} role="group" aria-label={g.name || 'Options'}>
            {g.name && (
              <p className="bg-muted/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.name}</p>
            )}
            {g.items.map((o) => {
              const key = `opt-${o.index}`
              const selected = picked === key
              return (
                <button
                  key={key}
                  type="button"
                  disabled={locked}
                  onClick={() => pick(key, topicValue(o))}
                  aria-pressed={selected}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    selected ? 'bg-[#b88a1f]/10' : locked ? 'opacity-60' : 'hover:bg-muted/60'
                  }`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[12px] font-semibold ${
                    selected ? 'border-[#b88a1f] bg-[#b88a1f] text-white' : 'border-border text-muted-foreground'
                  }`}>
                    {selected ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : o.index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium text-foreground">{formatTopicTitle(o.label)}</span>
                    {o.hint && <span className="block text-[12px] text-muted-foreground">{o.hint}</span>}
                  </span>
                  {o.recommended && (
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-md bg-[#b88a1f]/12 px-2 py-0.5 text-[11px] font-semibold ${GOLD_TEXT}`}>
                      <Star className="h-3 w-3" strokeWidth={2} /> Recommended
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {allowCustom && (
        <form
          onSubmit={(e) => { e.preventDefault(); submitCustom() }}
          className="flex items-center gap-2 border-t border-border bg-muted/30 px-3 py-2.5"
        >
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            disabled={locked}
            placeholder={customPlaceholder ?? 'Or type your own topic…'}
            aria-label="Type your own"
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground focus:border-[#b88a1f]/60 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={locked || !custom.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#b88a1f] px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#9a7619] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Go <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </form>
      )}
    </motion.div>
  )
}

// ── Quiz question ─────────────────────────────────────────────────────────────

interface QuizCardProps extends CardProps<QuizQuestionUi> {
  draft?: QuizDraft
  onDraftChange?: (draft: QuizDraft) => void
  /** True only when the server confirmed the question passed its syllabus checks. */
  verified?: boolean
}

function QuizQuestionCard({ ui, active, onSend, draft, onDraftChange, verified }: QuizCardProps) {
  const q = ui.props
  // Controlled by the parent when it provides a draft (so closing the panel keeps the answer).
  const [local, setLocal] = useState<QuizDraft>(EMPTY_QUIZ_DRAFT)
  const d = draft ?? local
  const update = (patch: Partial<QuizDraft>) => {
    const next = { ...d, ...patch }
    if (onDraftChange) onDraftChange(next)
    else setLocal(next)
  }

  const locked = !active || d.sent
  const ready = q.kind === 'mcq' ? d.choice !== null : d.typed.trim().length > 0

  function submit() {
    if (locked || !ready) return
    update({ sent: true })
    onSend(formatAnswer(q, d.choice, d.typed))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={CARD}>
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <Eyebrow parts={[q.level, q.subject]} />
          <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">{formatTopicTitle(q.topic)}</p>
        </div>
        {q.marks && (
          <span className="shrink-0 rounded-md border border-border px-2 py-0.5 text-[11.5px] font-semibold text-muted-foreground">
            {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
          </span>
        )}
      </div>

      <div className="px-4 py-4">
        {q.outcome && (
          <p className="mb-3 rounded-md bg-muted/50 px-3 py-2 text-[12px] leading-snug text-muted-foreground">
            <span className="font-semibold text-foreground">Syllabus outcome: </span>
            <MathInline>{q.outcome}</MathInline>
            {verified && (
              <span className="mt-1 flex items-center gap-1 text-[11.5px] font-medium text-[#4f7d3f] dark:text-[#7fb36b]">
                <Check className="h-3 w-3" strokeWidth={2.5} /> Checked against the syllabus
              </span>
            )}
          </p>
        )}
        <div className="prose prose-sm max-w-none text-[15px] leading-relaxed dark:prose-invert [&_*]:text-foreground [&_p]:my-0">
          <MathMarkdown>{q.question}</MathMarkdown>
        </div>

        {q.kind === 'mcq' && q.options ? (
          <div role="radiogroup" aria-label="Choose an answer" className="mt-4 space-y-2">
            {q.options.map((o) => {
              const selected = d.choice === o.id
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={locked}
                  onClick={() => update({ choice: o.id })}
                  className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                    selected ? 'border-[#b88a1f] bg-[#b88a1f]/10' : 'border-border hover:bg-muted/60'
                  } ${locked && !selected ? 'opacity-60' : ''}`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[12px] font-semibold ${
                    selected ? 'border-[#b88a1f] bg-[#b88a1f] text-white' : 'border-border text-muted-foreground'
                  }`}>{o.id}</span>
                  <span className="text-[14px] text-foreground"><MathMarkdown>{o.text}</MathMarkdown></span>
                </button>
              )
            })}
          </div>
        ) : (
          <textarea
            {...noPasteProps('tracy-quiz')}
            value={d.typed}
            onChange={(e) => update({ typed: e.target.value })}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit() }}
            disabled={locked}
            rows={4}
            placeholder="Write your answer here — show your working if you like."
            aria-label="Your answer"
            className="mt-4 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus:border-[#b88a1f]/60 disabled:opacity-60"
          />
        )}

        {d.hintOpen && q.hint && (
          <div className="mt-3 flex gap-2 rounded-md border border-[#b88a1f]/25 bg-[#b88a1f]/8 px-3 py-2 text-[13px] text-foreground">
            <Lightbulb className={`mt-0.5 h-4 w-4 shrink-0 ${GOLD_TEXT}`} strokeWidth={1.8} />
            <div className="[&_p]:my-0"><MathMarkdown>{q.hint}</MathMarkdown></div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-2.5">
        {q.hint && !d.sent ? (
          <button
            type="button"
            onClick={() => update({ hintOpen: !d.hintOpen })}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Lightbulb className="h-3.5 w-3.5" strokeWidth={1.8} /> {d.hintOpen ? 'Hide hint' : 'Need a hint?'}
          </button>
        ) : <span className="text-[12.5px] text-muted-foreground">{d.sent ? 'Answer sent — see the chat for feedback' : ''}</span>}

        <button
          type="button"
          onClick={submit}
          disabled={locked || !ready}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#b88a1f] px-3.5 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#9a7619] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {d.sent ? <><Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Sent</> : <>Submit answer <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} /></>}
        </button>
      </div>
    </motion.div>
  )
}

/** The in-chat stand-in for a quiz question: identifies it and reopens the side panel. */
function QuizSummaryCard({ ui, sent, onOpen }: { ui: QuizQuestionUi; sent: boolean; onOpen: () => void }) {
  const q = ui.props
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`${CARD} flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50`}
    >
      <span className="min-w-0 flex-1">
        <Eyebrow parts={[q.level, q.subject, q.marks ? `${q.marks} ${q.marks === 1 ? 'mark' : 'marks'}` : undefined]} />
        <span className="mt-0.5 block truncate text-[14px] font-semibold text-foreground">{formatTopicTitle(q.topic)}</span>
        <span className="block text-[12px] text-muted-foreground">{sent ? 'Answered' : 'Question ready — open it beside the chat'}</span>
      </span>
      <span className={`inline-flex shrink-0 items-center gap-1.5 text-[12.5px] font-semibold ${GOLD_TEXT}`}>
        <PanelRightOpen className="h-4 w-4" strokeWidth={1.8} /> {sent ? 'Review' : 'Open'}
      </span>
    </motion.button>
  )
}

// ── Progress card ─────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  strong:     { bar: 'bg-[#4f7d3f]', text: 'text-[#4f7d3f] dark:text-[#7fb36b]', label: 'Strong' },
  ok:         { bar: 'bg-[#b88a1f]', text: 'text-[#8a6713] dark:text-[#c9a03c]', label: 'Getting there' },
  needs_work: { bar: 'bg-red-500',   text: 'text-red-600 dark:text-red-400',     label: 'Needs work' },
} as const

function statusFor(value: number, status?: keyof typeof STATUS_STYLE): keyof typeof STATUS_STYLE {
  if (status) return status
  return value >= 70 ? 'strong' : value >= 45 ? 'ok' : 'needs_work'
}

function ProgressCard({ ui }: { ui: ProgressCardUi }) {
  const { title, subject, level, summary, items } = ui.props
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={CARD}>
      <div className="border-b border-border px-4 py-3">
        <Eyebrow parts={[level, subject]} />
        <p className="mt-0.5 text-[15px] font-semibold text-foreground">{title ?? 'Your progress'}</p>
        {summary && <p className="mt-1 text-[13px] text-muted-foreground"><MathInline>{summary}</MathInline></p>}
      </div>

      <ul className="divide-y divide-border">
        {items.map((item, i) => {
          const s = STATUS_STYLE[statusFor(item.value, item.status)]
          const pct = Math.round(item.value)
          return (
            <li key={`${item.label}-${i}`} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-[14px] font-medium text-foreground"><MathInline>{formatTopicTitle(item.label)}</MathInline></span>
                <span className="flex shrink-0 items-baseline gap-2">
                  <span className={`text-[11px] font-semibold uppercase tracking-wide ${s.text}`}>{s.label}</span>
                  <span className="text-[14px] font-semibold tabular-nums text-foreground">{pct}%</span>
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={item.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
              >
                <motion.div
                  className={`h-full rounded-full ${s.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                />
              </div>
              {item.note && <p className="mt-1.5 text-[12px] text-muted-foreground"><MathInline>{item.note}</MathInline></p>}
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}

// ── Study plan ────────────────────────────────────────────────────────────────

function StudyPlanCard({ ui, active, onSend }: CardProps<StudyPlanUi>) {
  const { title, subject, level, goal, days } = ui.props
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [started, setStarted] = useState<number | null>(null)
  const locked = !active || started !== null
  const total = days.reduce((n, d) => n + (d.minutes ?? 0), 0)

  function start(index: number) {
    if (locked) return
    const d = days[index]
    setStarted(index)
    onSend(`Let's start ${d.label}: ${d.topic}`)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={CARD}>
      <div className="border-b border-border px-4 py-3">
        <Eyebrow parts={[level, subject]} />
        <p className="mt-0.5 text-[15px] font-semibold text-foreground">{title ?? 'Your study plan'}</p>
        {goal && <p className="mt-1 text-[13px] text-muted-foreground">{goal}</p>}
      </div>

      <ol className="divide-y divide-border">
        {days.map((d, i) => (
          <li key={`${d.label}-${i}`} className="flex gap-3 px-4 py-3">
            <span className="mt-0.5 flex h-7 min-w-[2.75rem] shrink-0 items-center justify-center rounded-md border border-border px-1.5 text-[11.5px] font-semibold text-muted-foreground">
              {d.label}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[14px] font-semibold text-foreground"><MathInline>{formatTopicTitle(d.topic)}</MathInline></p>
                {d.minutes && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" strokeWidth={1.8} /> {d.minutes} min
                  </span>
                )}
              </div>
              {d.focus && <p className="mt-0.5 text-[12.5px] text-muted-foreground"><MathInline>{d.focus}</MathInline></p>}
              {d.tasks && d.tasks.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {d.tasks.map((t, ti) => {
                    const key = `${i}-${ti}`
                    const checked = !!done[key]
                    return (
                      <li key={key}>
                        <label className="flex cursor-pointer items-start gap-2 text-[13px] text-foreground">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setDone((p) => ({ ...p, [key]: !p[key] }))}
                            className="mt-1 h-3.5 w-3.5 accent-[#b88a1f]"
                          />
                          <span className={checked ? 'text-muted-foreground line-through' : ''}><MathInline>{t}</MathInline></span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            <button
              type="button"
              disabled={locked}
              onClick={() => start(i)}
              aria-label={`Start ${d.label}: ${d.topic}`}
              className={`mt-0.5 inline-flex h-7 shrink-0 items-center gap-1 rounded-md border px-2.5 text-[12px] font-semibold transition-colors ${
                started === i
                  ? 'border-[#b88a1f] bg-[#b88a1f]/10 text-[#8a6713] dark:text-[#c9a03c]'
                  : 'border-border text-foreground hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40'
              }`}
            >
              {started === i ? <><Check className="h-3 w-3" strokeWidth={2.5} /> Started</> : <><Play className="h-3 w-3" strokeWidth={2} /> Start</>}
            </button>
          </li>
        ))}
      </ol>

      {total > 0 && (
        <p className="border-t border-border bg-muted/30 px-4 py-2 text-[12px] text-muted-foreground">
          About {total >= 60 ? `${Math.round((total / 60) * 10) / 10} h` : `${total} min`} across {days.length} {days.length === 1 ? 'day' : 'days'}
        </p>
      )}
    </motion.div>
  )
}

// ── Concept explainer ─────────────────────────────────────────────────────────

function ConceptExplainerCard({ ui, active, onSend }: CardProps<ConceptExplainerUi>) {
  const { topic, subject, level, summary, key_points, steps, example, common_mistake } = ui.props
  const [showSolution, setShowSolution] = useState(false)
  const [acted, setActed] = useState(false)
  const locked = !active || acted

  function act(message: string) {
    if (locked) return
    setActed(true)
    onSend(message)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={CARD}>
      <div className="border-b border-border px-4 py-3">
        <Eyebrow parts={[level, subject]} />
        <p className="mt-0.5 text-[16px] font-semibold text-foreground">{formatTopicTitle(topic)}</p>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="prose prose-sm max-w-none text-[14.5px] leading-relaxed dark:prose-invert [&_*]:text-foreground [&_p]:my-0">
          <MathMarkdown>{summary}</MathMarkdown>
        </div>

        {key_points && key_points.length > 0 && (
          <ul className="space-y-1.5">
            {key_points.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-[13.5px] text-foreground">
                <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${GOLD_TEXT}`} strokeWidth={2.5} />
                <span className="[&_p]:my-0"><MathMarkdown>{p}</MathMarkdown></span>
              </li>
            ))}
          </ul>
        )}

        {steps && steps.length > 0 && (
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#b88a1f]/12 text-[12px] font-semibold text-[#8a6713] dark:text-[#c9a03c]">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-foreground">{s.title}</p>
                  <div className="prose prose-sm mt-0.5 max-w-none text-[13.5px] dark:prose-invert [&_*]:text-foreground [&_p]:my-0">
                    <MathMarkdown>{s.body}</MathMarkdown>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}

        {example && (
          <div className="rounded-md border border-border bg-muted/30 px-3.5 py-3">
            <p className={`text-[11px] font-bold uppercase tracking-[.12em] ${GOLD_TEXT}`}>Worked example</p>
            <div className="prose prose-sm mt-1.5 max-w-none text-[14px] dark:prose-invert [&_*]:text-foreground [&_p]:my-0">
              <MathMarkdown>{example.prompt}</MathMarkdown>
            </div>
            {example.solution && (
              <>
                <button
                  type="button"
                  onClick={() => setShowSolution((v) => !v)}
                  aria-expanded={showSolution}
                  className="mt-2 text-[12.5px] font-semibold text-foreground underline underline-offset-2 hover:opacity-70"
                >
                  {showSolution ? 'Hide solution' : 'Show solution'}
                </button>
                {showSolution && (
                  <div className="prose prose-sm mt-2 max-w-none border-t border-border pt-2 text-[14px] dark:prose-invert [&_*]:text-foreground [&_p]:my-0">
                    <MathMarkdown>{example.solution}</MathMarkdown>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {common_mistake && (
          <div className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/8 px-3 py-2.5 text-[13px] text-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={1.8} />
            <div><span className="font-semibold">Watch out: </span><MathInline>{common_mistake}</MathInline></div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/30 px-4 py-2.5">
        <button
          type="button"
          disabled={locked}
          onClick={() => act(`Explain ${topic} another way`)}
          className="rounded-md border border-border px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Explain another way
        </button>
        <button
          type="button"
          disabled={locked}
          onClick={() => act(`Quiz me on ${topic}`)}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#b88a1f] px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#9a7619] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Quiz me on this <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </motion.div>
  )
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

interface GenerativeUiProps extends CardProps<GenerativeUi> {
  /** 'inline' (in the chat) shows a quiz question as a summary; 'aside' shows the full card. */
  variant?: 'inline' | 'aside'
  /** Quiz only: reopen the side panel from the inline summary. */
  onOpen?: () => void
  draft?: QuizDraft
  onDraftChange?: (draft: QuizDraft) => void
  verified?: boolean
}

export function GenerativeUI({ ui, active, onSend, variant = 'inline', onOpen, draft, onDraftChange, verified }: GenerativeUiProps) {
  switch (ui.component) {
    case 'topic_picker':
      return <TopicPickerCard ui={ui} active={active} onSend={onSend} />
    case 'quiz_question':
      if (variant === 'inline' && onOpen) {
        return <QuizSummaryCard ui={ui} sent={!!draft?.sent} onOpen={onOpen} />
      }
      return <QuizQuestionCard ui={ui} active={active} onSend={onSend} draft={draft} onDraftChange={onDraftChange} verified={verified} />
    case 'progress_card':
      return <ProgressCard ui={ui} />
    case 'study_plan':
      return <StudyPlanCard ui={ui} active={active} onSend={onSend} />
    case 'concept_explainer':
      return <ConceptExplainerCard ui={ui} active={active} onSend={onSend} />
    case 'work_upload':
      return <WorkUploadCard ui={ui} active={active} onSend={onSend} />
  }
}
