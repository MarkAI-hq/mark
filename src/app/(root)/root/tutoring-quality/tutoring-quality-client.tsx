'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Circle,
  Play,
  Loader2,
  RotateCw,
} from 'lucide-react'
import type { CurriculumSummary } from '@/lib/actions/root'
import {
  createQualityEvalRun,
  getQualityEvalRunStatus,
  retryQualityScore,
  type QualityScorecard,
  type QualityConversation,
} from '@/lib/actions/quality-eval'

// ── Shared style tokens (matches root/benchmarks/page.tsx's dark console) ──

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '8px 12px',
  color: 'white',
  fontSize: 14,
  outline: 'none',
  // Without this, Chrome/Edge on Windows render the OPEN <select> popup with
  // the light UA form-control theme regardless of the closed control's own
  // inline background/color — white background, and on some builds white
  // text on white, making every option invisible. This is the actual fix;
  // the explicit background/color on each <option> below is a defensive
  // fallback, not the primary one.
  colorScheme: 'dark',
}

// Popup option-list background — matches RootShell's console ground
// (root-shell.tsx's #0c0c14), since <option> can't use the page's
// translucent rgba tokens: the native popup has no ambient dark surface
// behind it for rgba to composite against.
const optionStyle: React.CSSProperties = {
  background: '#0c0c14',
  color: 'white',
}

function rateColor(rate: number | null): string {
  if (rate === null) return '#8b8b9a'
  if (rate >= 75) return '#4ade80'
  if (rate >= 40) return '#fbbf24'
  return '#f87171'
}

function RateIcon({ rate }: { rate: number | null }) {
  if (rate === null) return <Circle className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
  const color = rateColor(rate)
  if (rate >= 75) return <CheckCircle2 className="h-4 w-4" style={{ color }} />
  if (rate >= 40) return <AlertTriangle className="h-4 w-4" style={{ color }} />
  return <XCircle className="h-4 w-4" style={{ color }} />
}

// The six Comprendo dimensions, in the order the judge reasons about them —
// diagnosis first (did it even notice), the two withholding dimensions
// together, then the two safety nets (accuracy, correctness) last.
const DIMENSIONS = [
  {
    key: 'misconception_diagnosis_rate' as const,
    label: 'Misconception Diagnosis',
    description: 'Names the specific misconception — not just "incorrect."',
  },
  {
    key: 'withholding_narrow_rate' as const,
    label: 'Never States the Answer',
    description: 'Never directly gives away the final answer.',
  },
  {
    key: 'withholding_strict_rate' as const,
    label: 'Strict Socratic Restraint',
    description: 'Points to evidence, prompts revision, leaves the thinking to the student — every turn.',
  },
  {
    key: 'factual_accuracy_rate' as const,
    label: 'Factual Accuracy',
    description: 'No false statements in the tutor’s replies.',
  },
  {
    key: 'correctness_validation_rate' as const,
    label: 'Correctness Validation',
    description: 'Never marks a correct student answer wrong.',
  },
]

function DimensionCard({
  label,
  description,
  rate,
}: {
  label: string
  description: string
  rate: number | null
}) {
  const color = rateColor(rate)
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${rate === null ? 'rgba(255,255,255,0.07)' : `${color}33`}`,
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{label}</p>
        <RateIcon rate={rate} />
      </div>
      <p className="text-3xl font-bold text-white mt-2">
        {rate === null ? '—' : `${rate}%`}
      </p>
      <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {description}
      </p>
    </div>
  )
}

// ── Run trigger + polling ───────────────────────────────────────────────────

function RunEvalButton({ curriculumId }: { curriculumId: string }) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  async function handleRun() {
    setRunning(true)
    setProgress(0)
    const { data, error } = await createQualityEvalRun(curriculumId)
    if (error || !data) {
      toast.error(error?.message ?? 'Could not start eval run')
      setRunning(false)
      setProgress(null)
      return
    }
    toast.success(`Queued ${data.scenario_count} scenario${data.scenario_count === 1 ? '' : 's'}`)

    pollRef.current = setInterval(async () => {
      const { data: status } = await getQualityEvalRunStatus(data.job_id)
      if (!status) return
      setProgress(status.progress)
      if (status.status === 'COMPLETED' || status.status === 'FAILED') {
        if (pollRef.current) clearInterval(pollRef.current)
        setRunning(false)
        setProgress(null)
        if (status.result) {
          const { completed, failed, total } = status.result
          if (completed === total) {
            toast.success(`Run complete — all ${total} scenarios scored`)
          } else if (completed > 0) {
            toast.warning(`Run complete — ${completed}/${total} scored, ${failed} failed`)
          } else {
            toast.error(`Run failed — 0/${total} scenarios scored. Check OpenRouter credits.`)
          }
        } else {
          toast.error(status.error ?? 'Eval run failed')
        }
        router.refresh()
      }
    }, 3000)
  }

  return (
    <button
      onClick={handleRun}
      disabled={running || !curriculumId}
      className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
      style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }}
    >
      {running ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {progress !== null ? `Running… ${progress}%` : 'Starting…'}
        </>
      ) : (
        <>
          <Play className="h-4 w-4" />
          Run new eval
        </>
      )}
    </button>
  )
}

// ── Conversation transcript row ─────────────────────────────────────────────

const TRIGGER_LABEL: Record<string, string> = {
  manual: 'Manual',
  schedule: 'Scheduled',
  prompt_change: 'Prompt change',
  curriculum_onboard: 'Curriculum onboard',
}

function DimensionDot({ pass, title }: { pass: boolean | null; title: string }) {
  const color = pass === null ? 'rgba(255,255,255,0.25)' : pass ? '#4ade80' : '#f87171'
  return (
    <span
      title={title}
      className="inline-block h-2 w-2 rounded-full"
      style={{ background: color }}
    />
  )
}

function RetryScoreButton({ conversationId }: { conversationId: string }) {
  const router = useRouter()
  const [retrying, setRetrying] = useState(false)

  async function handleRetry() {
    setRetrying(true)
    const { error } = await retryQualityScore(conversationId)
    setRetrying(false)
    if (error) {
      toast.error('Retry failed', { description: error.message })
      return
    }
    toast.success('Conversation scored')
    router.refresh()
  }

  return (
    <button
      onClick={handleRetry}
      disabled={retrying}
      className="flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 transition-colors disabled:opacity-50"
      style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}
    >
      {retrying ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <RotateCw className="h-3 w-3" />
      )}
      {retrying ? 'Scoring…' : 'Retry scoring'}
    </button>
  )
}

function ConversationRow({ conversation }: { conversation: QualityConversation }) {
  const [open, setOpen] = useState(false)
  const c = conversation
  const scored = c.clean_pass !== null

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <DimensionDot pass={c.misconception_diagnosis} title="Misconception diagnosis" />
            <DimensionDot pass={c.withholding_narrow} title="Never states the answer" />
            <DimensionDot pass={c.withholding_strict?.overall_pass ?? null} title="Strict Socratic restraint" />
            <DimensionDot pass={c.factual_accuracy} title="Factual accuracy" />
            <DimensionDot pass={c.correctness_validation} title="Correctness validation" />
          </div>
          {!scored ? (
            <>
              <span
                className="text-xs font-medium rounded-full px-2 py-0.5"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
              >
                Not yet scored
              </span>
              <RetryScoreButton conversationId={c.conversation_id} />
            </>
          ) : c.clean_pass ? (
            <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>
              Clean pass
            </span>
          ) : (
            <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
              Failed a dimension
            </span>
          )}
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {TRIGGER_LABEL[c.triggered_by] ?? c.triggered_by} · {c.tracy_model} · {c.turns} turns
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {new Date(c.created_at).toLocaleString()}
          </span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            {open ? 'Hide transcript' : 'View transcript'}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-2 rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
          {!scored && (
            <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.4)' }}>
              This conversation completed but the judge call never returned a verdict
              (commonly an OpenRouter credit/rate issue) — the transcript is real, just unscored.
            </p>
          )}
          {c.judge_notes && (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Judge: </span>
              {c.judge_notes}
            </p>
          )}
          <div className="space-y-2 pt-1">
            {c.transcript.map((turn, i) => (
              <div key={i} className="text-sm">
                <span
                  className="text-xs font-semibold uppercase tracking-wide mr-2"
                  style={{ color: turn.role === 'user' ? '#7F77DD' : '#c9a84c' }}
                >
                  {turn.role === 'user' ? 'Student' : 'Tracy'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.75)' }}>{turn.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main client component ───────────────────────────────────────────────────

export function TutoringQualityClient({
  curricula,
  selectedId,
  scorecard,
  conversations,
}: {
  curricula: CurriculumSummary[]
  selectedId: string
  scorecard: QualityScorecard | null
  conversations: QualityConversation[]
}) {
  const router = useRouter()

  // conversations can be non-empty while scorecard is null (an independent
  // fetch that failed) — fall back to an all-null scorecard rather than
  // letting the dimension cards below crash on a null dereference.
  const sc: QualityScorecard = scorecard ?? {
    curriculum_id: selectedId,
    total_conversations: 0,
    clean_pass_rate: null,
    misconception_diagnosis_rate: null,
    withholding_narrow_rate: null,
    withholding_strict_rate: null,
    factual_accuracy_rate: null,
    correctness_validation_rate: null,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={selectedId}
          onChange={(e) => router.push(`/root/tutoring-quality?curriculum_id=${e.target.value}`)}
          style={inputStyle}
        >
          {curricula.length === 0 && (
            <option value="" style={optionStyle}>No curricula loaded</option>
          )}
          {curricula.map((c) => (
            <option key={c.schema_id} value={c.schema_id} style={optionStyle}>
              {c.subject} ({c.curriculum_body?.toUpperCase()} {c.curriculum_level?.toUpperCase()})
            </option>
          ))}
        </select>
        {selectedId && <RunEvalButton curriculumId={selectedId} />}
      </div>

      {conversations.length === 0 ? (
        <div
          className="rounded-xl py-10 text-center text-sm"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}
        >
          No conversations tested yet for this curriculum.{' '}
          {selectedId && 'Click "Run new eval" to generate scenarios from its curriculum misconceptions and test Tracy for real.'}
        </div>
      ) : (
        <>
          {/* Hero: clean pass rate — the AND of every dimension below */}
          <div
            className="rounded-xl p-6 flex items-center justify-between"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${rateColor(sc.clean_pass_rate)}33`,
            }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Clean Pass Rate
              </p>
              <p className="text-5xl font-bold text-white mt-1">
                {sc.clean_pass_rate === null ? '—' : `${sc.clean_pass_rate}%`}
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Passes all six dimensions in the same conversation — the honest headline number.
              </p>
            </div>
            <RateIcon rate={sc.clean_pass_rate} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DIMENSIONS.map((d) => (
              <DimensionCard
                key={d.key}
                label={d.label}
                description={d.description}
                rate={sc[d.key]}
              />
            ))}
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Conversations</h2>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {conversations.length} total
                {conversations.length !== sc.total_conversations &&
                  ` · ${sc.total_conversations} scored`}
              </span>
            </div>
            <div className="space-y-2">
              {conversations.map((c) => (
                <ConversationRow key={c.conversation_id} conversation={c} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
