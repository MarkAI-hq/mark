'use client'

import { useState } from 'react'
import {
  GraduationCap, Eye, Package, MessageCircle,
  ChevronDown, ChevronRight, Printer,
  TrendingUp, TrendingDown, Minus, BookOpen, AlertTriangle,
  CheckCircle2, Circle, ArrowUpRight, ClipboardCheck, Info,
} from 'lucide-react'
import { selfInitiateFromEntry } from '@/lib/actions/study-plans'
import { ReportCard } from '@/components/report-card/report-card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type {
  GradebookResponse, SubjectGradebook, NcdcLevel, GradeBand, GradingScale,
  TriangulationCategory, GradebookTopic,
} from '@/lib/actions/study-plans'

// icon_hint (from the curriculum's assessment_model) → lucide icon. Unknown
// hints fall back to a generic icon so a new curriculum's categories still render.
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  eye: <Eye className="h-4 w-4" />,
  package: <Package className="h-4 w-4" />,
  'message-circle': <MessageCircle className="h-4 w-4" />,
}
function categoryIcon(hint: string | null): React.ReactNode {
  return (hint && CATEGORY_ICONS[hint]) ?? <ClipboardCheck className="h-4 w-4" />
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ncdcLabel(level: NcdcLevel | null): string {
  if (level === 'all')  return 'All LOs achieved ✓'
  if (level === 'some') return 'Some LOs achieved ↗'
  if (level === 'none') return 'Not yet evidenced ○'
  return 'Not yet assessed —'
}

function ncdcColor(level: NcdcLevel | null): string {
  if (level === 'all')  return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
  if (level === 'some') return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30'
  if (level === 'none') return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20'
  return 'text-muted-foreground bg-muted/40'
}

function gradeBadgeColor(label: string | undefined): string {
  if (!label) return 'text-muted-foreground bg-muted/30'
  if (label === 'A' || label === 'EE') return 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40'
  if (label === 'B' || label === 'ME') return 'text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/40'
  if (label === 'C' || label === 'AE') return 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40'
  if (label === 'D') return 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40'
  return 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/40'
}

function statusDot(sub: SubjectGradebook, passMark: string, scale: GradingScale): string {
  if (sub.mastery_pct === null) return 'bg-muted-foreground/30'
  if (sub.is_passing) return 'bg-emerald-500'
  const passIdx = scale.grades.findIndex(g => g.label === passMark)
  const gradeIdx = sub.grade_band ? scale.grades.findIndex(g => g.label === sub.grade_band!.label) : -1
  if (gradeIdx - passIdx === 1) return 'bg-amber-500'
  return 'bg-rose-500'
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7)  return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

// ── WeekHeatmap ────────────────────────────────────────────────────────────

function WeekHeatmap({
  activity_weeks,
  total_weeks,
  current_week,
}: {
  activity_weeks: { week: number; count: number }[]
  total_weeks: number
  current_week: number
}) {
  return (
    <div className="flex flex-col gap-1 print:hidden">
      <div className="flex items-center gap-[3px] flex-wrap">
        {Array.from({ length: total_weeks }, (_, i) => i + 1).map((wk) => {
          const bucket = activity_weeks.find(w => w.week === wk)
          const cnt = bucket?.count ?? 0
          const isPast    = wk < current_week
          const isCurrent = wk === current_week
          const isFuture  = wk > current_week
          let bg = 'bg-muted/20 dark:bg-muted/10'
          if (!isFuture) {
            if (cnt === 0 && isPast) bg = 'bg-muted/30 dark:bg-muted/20'
            else if (cnt >= 3) bg = 'bg-[#c9a03c] dark:bg-[#c9a03c]'
            else if (cnt >= 1) bg = 'bg-amber-300 dark:bg-amber-700/60'
          }
          return (
            <div
              key={wk}
              title={`Week ${wk}: ${cnt} plan${cnt !== 1 ? 's' : ''}`}
              className={`h-4 w-4 rounded-sm ${bg} ${isFuture ? 'opacity-30' : ''} ${
                isCurrent ? 'ring-1 ring-amber-400 dark:ring-amber-500' : ''
              }`}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-[3px] flex-wrap">
        {Array.from({ length: total_weeks }, (_, i) => i + 1).map((wk) => (
          <div
            key={wk}
            className={`w-4 text-center text-[8px] leading-none ${
              wk === current_week
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-muted-foreground/50'
            }`}
          >
            {wk}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── GradeRing (SVG donut) ──────────────────────────────────────────────────

function GradeRing({
  pct,
  band,
  is_passing,
  no_data,
}: {
  pct: number | null
  band: GradeBand | null
  is_passing: boolean
  no_data: boolean
}) {
  const r = 26
  const circ = 2 * Math.PI * r
  const fill = no_data ? 0 : (pct ?? 0) / 100
  const dashOffset = circ * (1 - fill)

  let stroke = '#94a3b8'
  if (!no_data && band) {
    if (is_passing) {
      if (band.label === 'A' || band.label === 'EE') stroke = '#10b981'
      else if (band.label === 'B' || band.label === 'ME') stroke = '#14b8a6'
      else stroke = '#3b82f6'
    } else {
      const passOffset = band ? (band.minPct < 50 ? band.minPct : 50) : 50
      stroke = passOffset < 40 ? '#f43f5e' : '#f59e0b'
    }
  }

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" role="img" aria-label={
        no_data ? 'No grade data yet' : `Grade ${band?.label ?? '—'}, ${pct ?? 0}%${is_passing ? ', passing' : ', not yet passing'}`
      }>
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor"
          className="text-muted/20" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={stroke} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={dashOffset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset .5s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-none" style={{ color: stroke }}>
          {no_data ? '—' : (band?.label ?? '—')}
        </span>
        {!no_data && band && (
          <span className="text-[9px] text-muted-foreground leading-tight">
            {band.points}pt
          </span>
        )}
      </div>
    </div>
  )
}

// ── TriangulationPanel ─────────────────────────────────────────────────────

function TriangulationPanel({
  triangulation,
  sourceLabel,
}: {
  triangulation: TriangulationCategory[]
  sourceLabel: string | null
}) {
  if (!triangulation.length) return null

  const gridCols = triangulation.length >= 3 ? 'sm:grid-cols-3'
    : triangulation.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-1'

  return (
    <div className="space-y-1">
      <div className={`grid grid-cols-1 ${gridCols} gap-2`}>
        {triangulation.map((c) => (
          <div key={c.key}
            className="flex items-start gap-2 rounded-lg border border-[#e8e8e6] dark:border-[#2a2a2a] p-2.5 bg-[#fafaf9] dark:bg-[#141414]"
          >
            <span className="mt-0.5 text-muted-foreground shrink-0">{categoryIcon(c.icon_hint)}</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">{c.label}</p>
              {c.description && (
                <p className="text-[10px] text-muted-foreground leading-snug mb-1">{c.description}</p>
              )}
              <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ncdcColor(c.level)}`}>
                {ncdcLabel(c.level)}
              </span>
            </div>
          </div>
        ))}
      </div>
      {sourceLabel && (
        <p className="text-[10px] text-muted-foreground px-1 leading-snug">
          Attitudes and generic skills are embedded in Learning Outcomes and are not assessed separately — {sourceLabel}
        </p>
      )}
    </div>
  )
}

// ── TopicRequirementInfo ─────────────────────────────────────────────────
// Click-to-expand icon showing what a topic requires and its share of the
// national exam, sourced from the curriculum's own topic weights — not
// specific to any one subject or country's syllabus.

function TopicRequirementInfo({ topic }: { topic: GradebookTopic }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          aria-label="What this topic requires"
        >
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-xs space-y-2" align="start">
        {topic.exam_weight_pct != null && (
          <p>
            <span className="font-semibold">{topic.exam_weight_pct}%</span>{' '}
            <span className="text-muted-foreground">of the national exam for this subject.</span>
          </p>
        )}
        {topic.requirement_statement && (
          <p className="text-muted-foreground leading-snug">{topic.requirement_statement}</p>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ── TopicList ──────────────────────────────────────────────────────────────

function TopicList({ topics }: { topics: SubjectGradebook['topics'] }) {
  const [starting, setStarting] = useState<string | null>(null)

  async function handleStart(entryId: string) {
    setStarting(entryId)
    try {
      await selfInitiateFromEntry(entryId)
    } finally {
      setStarting(null)
    }
  }

  return (
    <div className="divide-y divide-[#e8e8e6] dark:divide-[#2a2a2a]">
      {topics.map((t) => (
        <div key={t.entry_id} className="flex items-center justify-between gap-3 py-2.5 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] text-muted-foreground shrink-0 w-6">W{t.week_number}</span>
            {t.achievement === 'all' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            ) : t.achievement === 'some' ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            )}
            <span className="text-sm truncate">{t.topic}</span>
            {(t.requirement_statement || t.exam_weight_pct != null) && (
              <TopicRequirementInfo topic={t} />
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ncdcColor(t.achievement)}`}>
              {ncdcLabel(t.achievement)}
            </span>
            {t.achievement !== 'all' && (
              <button
                onClick={() => handleStart(t.sow_entry_id)}
                disabled={starting === t.sow_entry_id}
                className="text-[11px] font-semibold text-[#c9a03c] dark:text-[#e6bc5a] hover:underline disabled:opacity-50 whitespace-nowrap"
              >
                {starting === t.sow_entry_id
                  ? 'Loading…'
                  : t.has_plan
                    ? 'Continue →'
                    : 'Start lesson →'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── ClassSnapshot ──────────────────────────────────────────────────────────

function ClassSnapshot({ sub }: { sub: SubjectGradebook }) {
  const { class_avg_pct, class_top_pct, class_bottom_pct, class_percentile, score_distribution, mastery_pct } = sub
  if (class_avg_pct === null) {
    return <p className="text-sm text-muted-foreground">Not enough class data yet.</p>
  }

  const maxCount = Math.max(...score_distribution.map(d => d.count), 1)
  const bucketLabels = ['E (0–49%)', 'D (50–59%)', 'C (60–69%)', 'B (70–79%)', 'A (80–100%)']
  const bucketColors = [
    'bg-rose-400 dark:bg-rose-600',
    'bg-amber-400 dark:bg-amber-600',
    'bg-blue-400 dark:bg-blue-600',
    'bg-teal-400 dark:bg-teal-600',
    'bg-emerald-400 dark:bg-emerald-600',
  ]

  const myBucketIdx = mastery_pct == null ? -1
    : mastery_pct >= 80 ? 4
    : mastery_pct >= 70 ? 3
    : mastery_pct >= 60 ? 2
    : mastery_pct >= 50 ? 1
    : 0

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Class avg', val: `${class_avg_pct}%` },
          { label: 'Top',       val: `${class_top_pct}%` },
          { label: 'Bottom',    val: `${class_bottom_pct}%` },
          { label: 'My score',  val: mastery_pct != null ? `${mastery_pct}%` : '—' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-xs font-bold">{s.val}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {score_distribution.map((d, i) => (
          <div key={d.range} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-20 shrink-0">{bucketLabels[i]}</span>
            <div className="flex-1 h-3 rounded-sm bg-muted/20 overflow-hidden">
              <div
                className={`h-full rounded-sm ${bucketColors[i]} ${i === myBucketIdx ? 'ring-1 ring-offset-1 ring-foreground/30' : ''}`}
                style={{ width: `${(d.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-4 text-right">{d.count}</span>
            {i === myBucketIdx && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">← you</span>
            )}
          </div>
        ))}
      </div>

      {class_percentile != null && (
        <p className="text-xs text-muted-foreground">
          You are in the top{' '}
          <span className="font-semibold text-foreground">{100 - class_percentile}%</span>
          {' '}of your class in {sub.subject}
        </p>
      )}
    </div>
  )
}

// ── SubjectCard ────────────────────────────────────────────────────────────

function SubjectCard({
  sub,
  scale,
  termCurrentWeek,
}: {
  sub: SubjectGradebook
  scale: GradingScale
  termCurrentWeek: number
}) {
  const [openTriang, setOpenTriang] = useState(false)
  const [openTopics, setOpenTopics]  = useState(false)
  const [openClass,  setOpenClass]   = useState(false)

  const noData  = sub.mastery_pct === null && sub.plans_completed === 0
  const passMark = scale.passMark

  const thisWeekTopics = sub.topics.filter(t => t.week_number === termCurrentWeek)
  const needsAttention = !sub.is_passing && sub.mastery_pct !== null

  return (
    <div className={`rounded-2xl border bg-white dark:bg-[#141414] overflow-hidden transition-opacity ${noData ? 'opacity-60' : ''}`}
      style={{ borderColor: needsAttention ? '#fcd34d40' : 'var(--border)' }}
    >
      {/* Card header */}
      <div className="p-4 flex items-start gap-3">
        <div className={`h-2.5 w-2.5 rounded-full mt-2 shrink-0 ${statusDot(sub, passMark, scale)}`} />
        <GradeRing
          pct={sub.mastery_pct}
          band={sub.grade_band}
          is_passing={sub.is_passing}
          no_data={noData}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h2 className="font-bold text-base">{sub.subject}</h2>
            <span className="text-xs text-muted-foreground">{sub.grade_level}</span>
          </div>
          {sub.grade_band ? (
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${gradeBadgeColor(sub.grade_band.label)}`}>
                Grade {sub.grade_band.label}
              </span>
              <span className="text-xs text-muted-foreground">{sub.grade_band.descriptor}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{sub.mastery_pct}%</span>
              {needsAttention && (
                <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  Below pass mark
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">No activity yet this term</p>
          )}
          <div className="mt-1 text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
            <span>{sub.plans_completed} lesson{sub.plans_completed !== 1 ? 's' : ''}</span>
            <span>{sub.topics.length} topics</span>
            {sub.last_active_at && <span>last active {relativeTime(sub.last_active_at)}</span>}
          </div>
        </div>
      </div>

      {/* CA / Exam scores */}
      {!noData && (
        <div className="border-t border-[#e8e8e6] dark:border-[#1f1f1f] px-4 py-2.5 flex items-center gap-6 bg-[#fafaf9] dark:bg-[#0e0e0e]">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">CA (20%)</p>
            <p className="text-sm font-bold">
              {sub.continuous_score != null ? `${sub.continuous_score}/20` : '—'}
            </p>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Exam (80%)</p>
            <p className="text-sm font-bold text-muted-foreground">
              {sub.exam_score != null ? `${sub.exam_score}/80` : 'Pending'}
            </p>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Grade Pts</p>
            <p className="text-sm font-bold">{sub.grade_points ?? '—'}</p>
          </div>
        </div>
      )}

      {/* Heatmap */}
      {!noData && (
        <div className="border-t border-[#e8e8e6] dark:border-[#1f1f1f] px-4 py-3 print:hidden">
          <WeekHeatmap
            activity_weeks={sub.activity_weeks}
            total_weeks={sub.activity_weeks.length}
            current_week={termCurrentWeek}
          />
        </div>
      )}

      {/* Collapsible sections */}
      <div className="border-t border-[#e8e8e6] dark:border-[#1f1f1f]">
        {/* Triangulation */}
        <button
          onClick={() => setOpenTriang(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            Evidence of Learning (NCDC Triangulation)
          </span>
          {openTriang
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>
        {openTriang && (
          <div className="px-4 pb-4">
            <TriangulationPanel triangulation={sub.triangulation} sourceLabel={sub.assessment_model_source} />
          </div>
        )}
      </div>

      {sub.topics.length > 0 && (
        <div className="border-t border-[#e8e8e6] dark:border-[#1f1f1f]">
          <button
            onClick={() => setOpenTopics(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              Topic Achievement ({sub.topics.filter(t => t.achievement === 'all').length}/{sub.topics.length} complete)
            </span>
            {openTopics
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
          {openTopics && (
            <div className="px-4 pb-4">
              <TopicList topics={sub.topics} />
            </div>
          )}
        </div>
      )}

      <div className="border-t border-[#e8e8e6] dark:border-[#1f1f1f]">
        <button
          onClick={() => setOpenClass(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            Class Performance
          </span>
          {openClass
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>
        {openClass && (
          <div className="px-4 pb-4">
            <ClassSnapshot sub={sub} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── This Week Tab ──────────────────────────────────────────────────────────

function ThisWeekTab({
  subjects,
  currentWeek,
  scale,
}: {
  subjects: SubjectGradebook[]
  currentWeek: number
  scale: GradingScale
}) {
  const [starting, setStarting] = useState<string | null>(null)

  async function handleStart(entryId: string) {
    setStarting(entryId)
    try {
      await selfInitiateFromEntry(entryId)
    } finally {
      setStarting(null)
    }
  }

  const rows = subjects.flatMap(sub => {
    const thisWeekEntry = sub.topics.find(t => t.week_number === currentWeek)
    return thisWeekEntry ? [{ sub, entry: thisWeekEntry }] : []
  })

  const warnings = rows.filter(r => !r.sub.is_passing && r.sub.mastery_pct !== null)

  if (!rows.length) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        No SoW entries for week {currentWeek} yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {warnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {warnings.map(w => w.sub.subject).join(' and ')} {warnings.length === 1 ? 'is' : 'are'} below pass mark — this week&apos;s topics need attention.
          </p>
        </div>
      )}

      <div className="rounded-2xl border bg-white dark:bg-[#141414] overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto] text-[11px] font-semibold text-muted-foreground border-b border-[#e8e8e6] dark:border-[#1f1f1f] px-4 py-2">
          <span>Subject</span>
          <span>This week&apos;s topic</span>
          <span className="text-right">Activity</span>
        </div>
        {rows.map(({ sub, entry }) => {
          const weekPlans = sub.activity_weeks.find(w => w.week === currentWeek)?.count ?? 0
          const needsAttention = !sub.is_passing && sub.mastery_pct !== null

          return (
            <div
              key={sub.scheme_id}
              className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 px-4 py-3 border-b border-[#e8e8e6] dark:border-[#1f1f1f] last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                {needsAttention && (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
                <span className="text-sm font-medium truncate">{sub.subject}</span>
                {sub.grade_band && (
                  <span className={`text-[10px] font-bold px-1.5 rounded-full ${gradeBadgeColor(sub.grade_band.label)}`}>
                    {sub.grade_band.label}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm truncate">{entry.topic}</p>
                <span className={`text-[10px] ${ncdcColor(entry.achievement)} px-1.5 py-0.5 rounded-full`}>
                  {ncdcLabel(entry.achievement)}
                </span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                {weekPlans > 0 ? (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: Math.min(weekPlans, 5) }).map((_, i) => (
                      <div key={i} className="h-3 w-1.5 rounded-sm bg-[#c9a03c] dark:bg-[#c9a03c]" />
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-1">{weekPlans}</span>
                  </div>
                ) : entry.achievement !== 'all' ? (
                  <button
                    onClick={() => handleStart(entry.sow_entry_id)}
                    disabled={starting === entry.sow_entry_id}
                    className="text-[11px] font-semibold text-[#c9a03c] dark:text-[#e6bc5a] hover:underline disabled:opacity-50 whitespace-nowrap"
                  >
                    {starting === entry.sow_entry_id ? 'Loading…' : 'Start lesson →'}
                  </button>
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Print Report Card ──────────────────────────────────────────────────────

// ── Main GradesClient ──────────────────────────────────────────────────────

interface Props {
  user:      any
  gradebook: GradebookResponse | null
  error:     string | null
}

export function GradesClient({ user, gradebook, error }: Props) {
  const [tab, setTab] = useState<'term' | 'week'>('term')

  if (error) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Could not load grades: {error}
      </div>
    )
  }

  if (!gradebook) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading gradebook…</div>
    )
  }

  if (gradebook.no_enrollment) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-3">
        <GraduationCap className="h-12 w-12 text-muted-foreground/40 mx-auto" />
        <h2 className="font-bold text-lg">Not yet enrolled in a class</h2>
        <p className="text-sm text-muted-foreground">
          Ask your teacher to enrol you in a class with a Scheme of Work and your gradebook will appear here.
        </p>
      </div>
    )
  }

  const { scale, term, subjects, uce_result } = gradebook
  const userName: string = user?.name ?? user?.email ?? 'Student'
  const currentWeek = term?.current_week ?? 1

  // Marketplace students self-print; school-managed report cards are issued by
  // the class teacher / admin from the student detail page.
  const isMarketplace = user?.enrollment_source === 'marketplace'
  const schoolName: string =
    user?.school_name ?? user?.organization_name ?? 'Mirror Intelligence'

  const totalGradePoints = subjects.reduce((s, sub) => s + (sub.grade_points ?? 0), 0)
  const passingCount = subjects.filter(s => s.is_passing).length

  return (
    <>
      {/* Print-only report card — marketplace students only */}
      {isMarketplace && (
        <ReportCard
          gradebook={gradebook}
          student={{ name: userName }}
          school={{ name: schoolName }}
        />
      )}

      {/* Screen view */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 print:hidden">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="font-bold text-xl">My Gradebook</h1>
              {term && (
                <p className="text-xs text-muted-foreground">
                  {term.label} · {term.academic_year} · Week {term.current_week}/{term.total_weeks}
                </p>
              )}
            </div>
          </div>
          {isMarketplace ? (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print report</span>
            </button>
          ) : (
            <span className="hidden sm:inline text-xs text-muted-foreground">
              Report cards are issued by your school
            </span>
          )}
        </div>

        {/* At-a-glance strip */}
        {subjects.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-white dark:bg-[#141414] p-3 text-center">
              <p className="text-lg font-bold">{passingCount}/{subjects.length}</p>
              <p className="text-[11px] text-muted-foreground">Subjects passing</p>
            </div>
            <div className="rounded-xl border bg-white dark:bg-[#141414] p-3 text-center">
              <p className="text-lg font-bold">
                {subjects.reduce((s, sub) => s + sub.plans_completed, 0)}
              </p>
              <p className="text-[11px] text-muted-foreground">Lessons done</p>
            </div>
            <div className="rounded-xl border bg-white dark:bg-[#141414] p-3 text-center">
              <p className="text-lg font-bold">{totalGradePoints}</p>
              <p className="text-[11px] text-muted-foreground">Grade pts</p>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 rounded-xl bg-muted/40 p-1 w-fit">
          {(['term', 'week'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-white dark:bg-[#1a1a1a] text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'term' ? 'This Term' : 'This Week'}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'term' ? (
          <div className="space-y-4">
            {subjects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No subjects found in your Scheme of Work.
              </div>
            ) : (
              subjects.map(sub => (
                <SubjectCard
                  key={sub.scheme_id}
                  sub={sub}
                  scale={scale}
                  termCurrentWeek={currentWeek}
                />
              ))
            )}
          </div>
        ) : (
          <ThisWeekTab
            subjects={subjects}
            currentWeek={currentWeek}
            scale={scale}
          />
        )}

        {/* UCE outlook footer — Uganda's new curriculum has no Division I-IV
            aggregate; certificate qualification is a Result 1/2/3 category
            computed across all subjects instead. See getUceResultCategory()
            in mark-api/src/config/grading-scales.ts. */}
        {uce_result && (
          <div className="rounded-2xl border bg-white dark:bg-[#141414] p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm">UCE Outlook</h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                uce_result.result === 1
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  : uce_result.result === 3
                  ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                  : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
              }`}>
                {uce_result.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{uce_result.detail}</p>
            <p className="text-xs text-foreground font-medium">{uce_result.actionable}</p>
            <p className="text-[10px] text-muted-foreground pt-1">
              Grading is per-subject only under the new curriculum — no Division I–IV aggregate.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
