'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import {
  ChevronLeft, BookOpen, FileText, MessageSquare, Target, ChevronDown,
} from 'lucide-react'
import type { CurriculumSchema } from '@/types/curricula'

// ── Theme-aware CSS variable shortcuts ───────────────────────────────────────
// These resolve via the app's :root / .dark CSS variables automatically.
const V = {
  card:    'hsl(var(--card))',
  bg:      'hsl(var(--background))',
  muted:   'hsl(var(--muted))',
  border:  'hsl(var(--border))',
  fg:      'hsl(var(--foreground))',
  fgMute:  'hsl(var(--muted-foreground))',
  gold:    'hsl(var(--gold))',
  goldBg:  'hsl(var(--gold) / 0.12)',
  goldBdr: 'hsl(var(--gold) / 0.28)',
} as const

// ── Fixed semantic colours (KUSA — same across light/dark) ───────────────────
const KUSA: Record<string, { bg: string; color: string; label: string }> = {
  k: { bg: '#1a3324', color: '#5aa872', label: 'Knowledge'     },
  u: { bg: '#192740', color: '#5b9bd5', label: 'Understanding' },
  s: { bg: '#33280f', color: '#d2a63c', label: 'Skills'        },
  a: { bg: '#2a1a3a', color: '#b07cc4', label: 'Attitudes'     },
  v: { bg: '#10302c', color: '#4cb3a6', label: 'Values'        },
}

const BLOOM: Record<string, { hex: string; label: string }> = {
  remember:   { hex: '#6b7280', label: 'Remember'   },
  understand: { hex: '#3b82f6', label: 'Understand' },
  apply:      { hex: '#10b981', label: 'Apply'      },
  analyse:    { hex: '#f59e0b', label: 'Analyse'    },
  evaluate:   { hex: '#ef4444', label: 'Evaluate'   },
  create:     { hex: '#8b5cf6', label: 'Create'     },
}

// ── Data-cleaning helpers ────────────────────────────────────────────────────

const KUSA_WORD_MAP: Record<string, string> = {
  knowledge: 'k', understanding: 'u', skills: 's', attitudes: 'a', values: 'v',
}
const VALID_KUSA = new Set(['k', 'u', 's', 'a', 'v'])

/**
 * Extract clean LO text and KUSA codes from any of three raw formats:
 *  1. Source JSON:      "a) understand... (k,u)"  — letter prefix + parens at end
 *  2. Corpus chunk:    "Subject | ... Learning Outcome (a): text KUSA: knowledge"
 *  3. Enriched schema: lo.text is already clean, lo.kusa_map is populated
 */
function cleanLoText(raw: string, existingKusa: string[]): { text: string; kusa: string[] } {
  let s = (raw ?? '').trim()

  // ── Format 2: corpus provenance prefix ───────────────────────────────────
  const loMatch = s.match(/Learning\s+Outcome\s*\([^)]*\):\s*/i)
  if (loMatch && loMatch.index != null) {
    s = s.slice(loMatch.index + loMatch[0].length).trim()
  }

  // Strip trailing "KUSA: word1, word2" (corpus format)
  let kusa = [...existingKusa]
  const kusaWordMatch = s.match(/\s+KUSA:\s*(.+?)\.?\s*$/i)
  if (kusaWordMatch && kusaWordMatch.index != null) {
    s = s.slice(0, kusaWordMatch.index).trim()
    if (kusa.length === 0) {
      kusa = kusaWordMatch[1].toLowerCase()
        .split(/[,\s]+/)
        .map(w => KUSA_WORD_MAP[w.trim()])
        .filter(Boolean) as string[]
    }
  }

  // ── Format 1: source JSON (k,u) parenthesised codes at end ───────────────
  // Extract all (...) groups from the END of the string, then strip them
  if (kusa.length === 0) {
    const parenGroups = [...s.matchAll(/\(([^)]+)\)/g)]
    const parsedKusa = parenGroups
      .flatMap(m => m[1].toLowerCase().split(/[,\s]+/))
      .map(c => c.trim())
      .filter(c => VALID_KUSA.has(c))
    if (parsedKusa.length > 0) kusa = parsedKusa
    // Strip all trailing (…) groups from text
    s = s.replace(/(\s*\([^)]*\))+\s*$/, '').trim()
  }

  // Strip leftover "a. " or "a) " letter prefix
  s = s.replace(/^[a-z]\s*[.)]\s*/i, '').trim()
  if (s.length > 8) s = s.replace(/\.$/, '').trim()

  return { text: s, kusa }
}

/**
 * Strip NCDC letter/number prefixes from topic names:
 * "A: ROOT AND STEM Tuber Growing" → "Root and Stem Tuber Growing"
 * "2B. Legume and Oil Seed Growing" → "Legume and Oil Seed Growing"
 */
function cleanTopicName(raw: string): string {
  return (raw ?? '').replace(/^\d*[A-Z][.:\s]?\s+/i, '').trim()
}

function termLabel(t: string) { return t.replace('term_', 'Term ').trim() }
function termSort(a: string, b: string) {
  if (a === 'General') return 1
  if (b === 'General') return -1
  return a.localeCompare(b, undefined, { numeric: true })
}
function titleCase(s: string) {
  return s.split(/\s+/).map((w, i) => {
    const small = ['and', 'or', 'of', 'in', 'the', 'a', 'an', 'to', 'for', 'with', 'by']
    if (i > 0 && small.includes(w.toLowerCase())) return w.toLowerCase()
    if (/^[IVX]+$/.test(w)) return w
    if (w.length <= 3 && /^[A-Z]+$/.test(w)) return w
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  }).join(' ')
}
function primaryTerm(topic: any): string {
  const terms: string[] = topic.corpus_provenance?.terms ?? []
  return terms.length > 0 ? termLabel(terms[0]) : 'General'
}
function bloomHex(l?: string) { return BLOOM[l?.toLowerCase() ?? '']?.hex ?? '#6b7280' }
function bloomLabel(l?: string) { return BLOOM[l?.toLowerCase() ?? '']?.label ?? l ?? '' }

// ── KUSAV chip ────────────────────────────────────────────────────────────────

function KChip({ code }: { code: string }) {
  const k = KUSA[code.toLowerCase()]
  if (!k) return null
  return (
    <span title={k.label} style={{
      width: 23, height: 23, borderRadius: 7, background: k.bg, color: k.color,
      display: 'inline-grid', placeItems: 'center', fontSize: 11, fontWeight: 700,
      flexShrink: 0, lineHeight: 1,
    }}>
      {code.toUpperCase()}
    </span>
  )
}

// ── Outcome row ───────────────────────────────────────────────────────────────

function OutcomeRow({ lo, idx }: { lo: any; idx: number }) {
  const letter = String.fromCharCode(97 + idx)
  const { text, kusa } = cleanLoText(lo.text ?? '', lo.kusa_map ?? [])
  const words = text.split(/\s+/)
  const verb  = words.shift() ?? ''
  const rest  = words.join(' ')

  return (
    <div
      className="flex gap-3 rounded-xl border border-transparent transition-all duration-150"
      style={{ padding: '12px 10px', cursor: 'default' }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.background = V.muted
        el.style.borderColor = V.border
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.background = 'transparent'
        el.style.borderColor = 'transparent'
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 8, background: V.muted,
        border: `1px solid ${V.border}`, display: 'grid', placeItems: 'center',
        fontSize: 13, fontWeight: 700, color: V.fgMute, flexShrink: 0, marginTop: 1,
      }}>
        {letter}
      </div>
      <div style={{ flex: 1, fontSize: 14.5, lineHeight: 1.55, color: V.fg, fontWeight: 500 }}>
        <span style={{ color: V.gold, fontWeight: 600, textTransform: 'capitalize' }}>{verb}</span>
        {rest ? ' ' + rest : ''}
      </div>
      {kusa.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginTop: 2 }}>
          {kusa.map(k => <KChip key={k} code={k} />)}
        </div>
      )}
    </div>
  )
}

// ── Activity row ──────────────────────────────────────────────────────────────

function ActivityRow({ text, idx }: { text: string; idx: number }) {
  // Detect sub-items: lines that start with "a. ", "b. ", "i. ", "i) " etc.
  const isSub = /^[a-z]\s*[.)]\s+/i.test(text.trim()) || /^\d+\.\s+/.test(text.trim())
  return (
    <div
      style={{
        display: 'flex', gap: 12, padding: isSub ? '8px 10px 8px 34px' : '12px 10px',
        borderRadius: 10, transition: 'background .15s',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = V.muted}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
    >
      {!isSub && (
        <div style={{
          width: 24, height: 24, borderRadius: 7, background: V.muted, border: `1px solid ${V.border}`,
          color: V.gold, display: 'grid', placeItems: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
        }}>
          {idx + 1}
        </div>
      )}
      <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.6, color: isSub ? V.fgMute : V.fg }}>{text}</div>
    </div>
  )
}

// ── Assessment row ────────────────────────────────────────────────────────────

function AssessmentRow({ text, idx }: { text: string; idx: number }) {
  return (
    <div
      style={{ display: 'flex', gap: 12, padding: '12px 10px', borderRadius: 10, transition: 'background .15s' }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = V.muted}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
    >
      <div style={{
        width: 24, height: 24, borderRadius: 7, background: V.muted, border: `1px solid ${V.border}`,
        color: V.fgMute, display: 'grid', placeItems: 'center',
        fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
      }}>
        {idx + 1}
      </div>
      <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.6, color: V.fg }}>{text}</div>
    </div>
  )
}

// ── Misconception row ─────────────────────────────────────────────────────────

function MisconRow({ m }: { m: any }) {
  return (
    <div
      style={{
        display: 'flex', gap: 11, padding: '12px 10px',
        borderRadius: 11, alignItems: 'flex-start', transition: 'background .15s',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = V.muted}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
    >
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
        flexShrink: 0, letterSpacing: '.02em',
        background: 'hsl(var(--destructive) / 0.12)',
        color: 'hsl(var(--destructive))',
      }}>
        Error
      </span>
      <div style={{ fontSize: 14, lineHeight: 1.5, color: V.fg, paddingTop: 3 }}>
        {m.description}
        {m.correct_understanding && (
          <p style={{ margin: '5px 0 0', fontSize: 13, color: '#4cb3a6' }}>
            ✓ {m.correct_understanding}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Topic card ────────────────────────────────────────────────────────────────

function TopicCard({
  topic, seqNum, totalPeriods, openDefault,
}: {
  topic: any; seqNum: number; totalPeriods: number; openDefault?: boolean
}) {
  const los:           any[]    = topic.learning_outcomes    ?? []
  const activities:    string[] = topic.suggested_activities  ?? []
  const assessment:    string[] = topic.assessment_strategies ?? []
  const misconceptions: any[]   = topic.misconceptions        ?? []

  const panes = [
    { label: 'Outcomes',       count: los.length            },
    { label: 'Activities',     count: activities.length     },
    { label: 'Assessment',     count: assessment.length     },
    { label: 'Misconceptions', count: misconceptions.length },
  ]
  const firstFilled = panes.findIndex(p => p.count > 0)

  const [open, setOpen] = useState(openDefault ?? false)
  const [seg,  setSeg]  = useState(firstFilled >= 0 ? firstFilled : 0)

  const prov        = topic.corpus_provenance as any | undefined
  const rawName     = (topic.name ?? topic.topic_name ?? topic.title ?? '') as string
  const displayName = titleCase(cleanTopicName(rawName))
  const periods     = (prov?.periods ?? 0) as number
  const pageRef     = prov?.page_ref as number | undefined
  const classes     = (prov?.class_levels ?? []) as string[]
  const terms       = (prov?.terms ?? []) as string[]
  const sourceDoc   = prov?.source_doc as string | undefined
  const share       = totalPeriods > 0 && periods > 0 ? Math.round(periods / totalPeriods * 100) : 0

  return (
    <div style={{
      background: V.card, border: `1px solid ${V.border}`,
      borderRadius: 16, overflow: 'hidden', marginBottom: 10,
    }}>
      {/* ── Card header ── */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 14,
          padding: '16px 18px', cursor: 'pointer', transition: 'background .15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = V.muted}
        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
      >
        {/* Fraunces number badge */}
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: V.goldBg, border: `1px solid ${V.goldBdr}`, color: V.gold,
          display: 'grid', placeItems: 'center',
          fontFamily: '"Fraunces","Georgia",serif', fontWeight: 600, fontSize: 15,
          flexShrink: 0, marginTop: 2,
        }}>
          {seqNum}
        </div>

        {/* Title + pips */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            margin: 0, fontFamily: '"Fraunces","Georgia",serif',
            fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em',
            color: V.fg, lineHeight: 1.3,
          }}>
            {displayName}
          </h3>
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center',
            marginTop: 5, fontSize: 12, color: V.fgMute, gap: 0,
          }}>
            {(classes.length > 0 || terms.length > 0) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, paddingRight: 10 }}>
                {classes.length > 0 && (
                  <span style={{ color: V.gold, fontWeight: 600 }}>{classes.join(' · ')}</span>
                )}
                {classes.length > 0 && terms.length > 0 && (
                  <span style={{ margin: '0 2px', opacity: 0.4 }}>·</span>
                )}
                {terms.length > 0 && <span>{terms.map(termLabel).join(', ')}</span>}
              </span>
            )}
            {pageRef != null && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0 10px', borderLeft: `1px solid ${V.border}`,
              }}>
                p. {pageRef}
              </span>
            )}
            {sourceDoc && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0 10px', borderLeft: `1px solid ${V.border}`, color: V.gold,
              }}>
                {sourceDoc}
              </span>
            )}
          </div>
        </div>

        {/* Periods + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {periods > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: '"Fraunces","Georgia",serif',
                fontSize: 17, fontWeight: 600, color: V.fg, lineHeight: 1,
              }}>
                {periods}
              </div>
              <div style={{ fontSize: 10.5, color: V.fgMute, marginTop: 2 }}>
                periods{share > 0 ? ` · ${share}%` : ''}
              </div>
            </div>
          )}
          <div style={{
            color: V.fgMute, transition: 'transform .25s',
            transform: open ? 'rotate(180deg)' : 'none',
          }}>
            <ChevronDown style={{ width: 18, height: 18 }} />
          </div>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ borderTop: `1px solid ${V.border}` }}>
          {/* Competency */}
          {topic.competency_statement && (
            <div style={{
              padding: '14px 18px', background: V.muted,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <Target style={{ width: 16, height: 16, color: V.gold, flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '.1em',
                  textTransform: 'uppercase', color: V.fgMute, marginBottom: 3,
                }}>
                  Competency
                </div>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: V.fg, maxWidth: 760 }}>
                  {topic.competency_statement}
                </p>
              </div>
            </div>
          )}

          {/* Segmented control */}
          <div style={{ display: 'flex', gap: 4, padding: '12px 18px 0' }}>
            {panes.map(({ label, count }, i) => count > 0 ? (
              <button
                key={i}
                onClick={() => setSeg(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
                  color:      seg === i ? V.gold     : V.fgMute,
                  background: seg === i ? V.goldBg   : V.muted,
                  border:     `1px solid ${seg === i ? V.goldBdr : V.border}`,
                  padding: '7px 13px', borderRadius: 9, cursor: 'pointer', transition: 'all .15s',
                }}
              >
                {label}
                <span style={{
                  fontSize: 11, padding: '1px 6px', borderRadius: 999,
                  background: seg === i ? V.goldBdr : V.border,
                  color: seg === i ? V.gold : V.fgMute,
                }}>
                  {count}
                </span>
              </button>
            ) : null)}
          </div>

          {/* Pane content */}
          <div style={{ padding: '6px 18px 18px' }}>
            {panes[seg]?.label === 'Outcomes' && los.map((lo: any, i: number) => (
              <OutcomeRow key={lo.id ?? i} lo={lo} idx={i} />
            ))}
            {panes[seg]?.label === 'Activities' && activities.map((a: string, i: number) => (
              <ActivityRow key={i} text={a} idx={i} />
            ))}
            {panes[seg]?.label === 'Assessment' && assessment.map((s: string, i: number) => (
              <AssessmentRow key={i} text={s} idx={i} />
            ))}
            {panes[seg]?.label === 'Misconceptions' && misconceptions.map((m: any, i: number) => (
              <MisconRow key={m.misconception_id ?? i} m={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Term divider ──────────────────────────────────────────────────────────────

function TermDivider({ term, count, periods }: { term: string; count: number; periods: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 12px' }}>
      <span style={{
        fontFamily: '"Fraunces","Georgia",serif',
        fontSize: 13, fontWeight: 600, color: V.gold, flexShrink: 0,
      }}>
        {term}
      </span>
      <span style={{ fontSize: 12, color: V.fgMute, flexShrink: 0 }}>
        {count} topic{count !== 1 ? 's' : ''}{periods > 0 ? ` · ${periods} periods` : ''}
      </span>
      <div style={{ flex: 1, height: 1, background: V.border }} />
    </div>
  )
}

// ── KUSAV legend ──────────────────────────────────────────────────────────────

function KUSALegend() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'transparent', border: 0, fontFamily: 'inherit',
          fontSize: 12, fontWeight: 600, color: V.gold, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        KUSAV legend
        <ChevronDown style={{
          width: 13, height: 13, transition: '.2s',
          transform: open ? 'rotate(180deg)' : 'none',
        }} />
      </button>
      {open && (
        <div style={{
          marginTop: 8, background: V.card, border: `1px solid ${V.border}`,
          borderRadius: 12, padding: '12px 16px',
          display: 'flex', gap: 24, flexWrap: 'wrap',
        }}>
          {Object.entries(KUSA).map(([k, { bg, color, label }]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: V.fgMute }}>
              <span style={{
                width: 22, height: 22, borderRadius: 6, background: bg, color,
                display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>
                {k.toUpperCase()}
              </span>
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip({ topics }: { topics: any[] }) {
  const totalLOs = topics.reduce((s, t) => s + (t.learning_outcomes?.length ?? 0), 0)
  const totalPer = topics.reduce((s, t) => s + ((t.corpus_provenance?.periods ?? 0) as number), 0)
  const termSet  = new Set(topics.flatMap(t => (t.corpus_provenance?.terms ?? []) as string[]))

  const dist: Record<string, number> = { k: 0, u: 0, s: 0, a: 0, v: 0 }
  for (const t of topics) {
    for (const lo of (t.learning_outcomes ?? [])) {
      // Use cleaned kusa — parse from text if kusa_map empty
      const { kusa } = cleanLoText(lo.text ?? '', lo.kusa_map ?? [])
      for (const code of kusa) if (code in dist) dist[code]++
    }
  }
  const total = Object.values(dist).reduce((a, b) => a + b, 0)
  const pct = (k: string) => total > 0 ? Math.round(dist[k] / total * 100) : 0

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <div style={{
        display: 'flex', background: V.card, border: `1px solid ${V.border}`,
        borderRadius: 13, padding: 4,
      }}>
        {[
          { val: topics.length,     label: 'Topics'   },
          { val: totalLOs,          label: 'Outcomes' },
          { val: totalPer,          label: 'Periods'  },
          { val: termSet.size || 1, label: 'Terms'    },
        ].map(({ val, label }) => (
          <div key={label} style={{ padding: '8px 14px', borderRadius: 10 }}>
            <div style={{
              fontFamily: '"Fraunces","Georgia",serif',
              fontSize: 18, fontWeight: 700, lineHeight: 1, color: V.fg,
            }}>
              {val}
            </div>
            <div style={{ fontSize: 11, color: V.fgMute, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div style={{
          display: 'flex', background: V.card, border: `1px solid ${V.border}`,
          borderRadius: 13, padding: 4,
        }}>
          {Object.entries(KUSA).map(([k, { color, label }]) => {
            const p = pct(k)
            if (p === 0) return null
            return (
              <div key={k} style={{ padding: '8px 14px', borderRadius: 10 }}>
                <div style={{
                  fontFamily: '"Fraunces","Georgia",serif',
                  fontSize: 15, fontWeight: 700, lineHeight: 1, color,
                }}>
                  {p}%
                </div>
                <div style={{ fontSize: 11, color: V.fgMute, marginTop: 3 }}>{label}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Papers tab ────────────────────────────────────────────────────────────────

function PapersTab({ papers }: { papers: any[] }) {
  if (!papers.length) return (
    <p className="text-sm text-center py-12" style={{ color: V.fgMute }}>No paper structure defined.</p>
  )
  return (
    <div className="space-y-6">
      {papers.map((p: any) => (
        <div key={p.paper_number}>
          <div className="flex items-baseline gap-3 mb-4">
            <h3 style={{ fontFamily: '"Fraunces","Georgia",serif', fontSize: 16, color: V.fg, margin: 0 }}>
              Paper {p.paper_number} — {p.paper_name}
            </h3>
            <span style={{ fontSize: 13, color: V.fgMute }}>{p.duration_minutes / 60}h · {p.marks} marks</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${V.border}` }}>
                {['Section', 'Compulsory', 'Available', 'To Answer', 'Marks/Item'].map(h => (
                  <th key={h} className="pb-2 text-left text-xs font-medium" style={{ color: V.fgMute }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(p.sections ?? []).map((s: any) => (
                <tr key={s.section_id} style={{ borderBottom: `1px solid ${V.border}` }}>
                  <td className="py-2.5 font-medium" style={{ color: V.fg }}>{s.label}</td>
                  <td className="py-2.5" style={{ color: s.compulsory ? '#34d399' : V.fgMute }}>
                    {s.compulsory ? 'Yes' : 'No'}
                  </td>
                  <td className="py-2.5" style={{ color: V.fg }}>{s.items_available}</td>
                  <td className="py-2.5" style={{ color: V.fg }}>{s.items_to_answer}</td>
                  <td className="py-2.5" style={{ color: V.fg }}>{s.marks_per_item}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

// ── Command words tab ─────────────────────────────────────────────────────────

function CommandWordsTab({ words }: { words: any[] }) {
  if (!words.length) return (
    <p className="text-sm text-center py-12" style={{ color: V.fgMute }}>No command words defined.</p>
  )
  return (
    <div className="space-y-4">
      {words.map((cw: any) => (
        <div key={cw.word} style={{ borderBottom: `1px solid ${V.border}` }} className="pb-4">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="font-bold" style={{ color: V.fg }}>{cw.word}</span>
            {cw.bloom_level && (
              <span className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ color: bloomHex(cw.bloom_level), background: `${bloomHex(cw.bloom_level)}18` }}>
                {bloomLabel(cw.bloom_level)}
              </span>
            )}
          </div>
          {cw.definition && <p className="text-sm mb-1" style={{ color: V.fg }}>{cw.definition}</p>}
          {cw.expected_response_pattern && (
            <p className="text-xs italic" style={{ color: V.fgMute }}>Expected: {cw.expected_response_pattern}</p>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Thresholds tab ────────────────────────────────────────────────────────────

function ThresholdsTab({ schema }: { schema: CurriculumSchema }) {
  const th      = schema.audit_thresholds as any
  const gr      = schema.grading_instructions as any
  const weights = th?.scoring_weights as Record<string, number> | undefined
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: V.fgMute }}>Pass Bands</p>
        <div className="flex gap-6">
          {(['pass', 'flag', 'fail'] as const).map(band => {
            const color = band === 'pass' ? '#10b981' : band === 'flag' ? '#f59e0b' : '#ef4444'
            return (
              <div key={band}>
                <p className="text-2xl font-bold" style={{ color }}>{th?.overall?.[band] ?? '—'}%</p>
                <p className="text-xs mt-0.5 capitalize" style={{ color: V.fgMute }}>{band}</p>
              </div>
            )
          })}
        </div>
      </div>
      {weights && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: V.fgMute }}>Scoring Weights</p>
          <div className="space-y-3">
            {Object.entries(weights).map(([dim, w]) => (
              <div key={dim} className="flex items-center gap-3">
                <span className="text-sm w-56 flex-shrink-0 capitalize" style={{ color: V.fgMute }}>
                  {dim.replace(/_/g, ' ')}
                </span>
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: V.muted }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.round(w * 100)}%`, background: V.gold }} />
                </div>
                <span className="text-sm font-semibold w-10 text-right" style={{ color: V.gold }}>
                  {Math.round(w * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {gr && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: V.fgMute }}>Grading Rules</p>
          <div className="space-y-2">
            {[
              ['Accept alternatives',    gr.accept_alternatives],
              ['Penalise contradiction', gr.penalise_contradiction],
              ['Penalise vagueness',     gr.penalise_vagueness],
              ['Require units',          gr.require_units],
              ['Language tolerance',     gr.language_tolerance],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex justify-between py-1.5"
                style={{ borderBottom: `1px solid ${V.border}` }}>
                <span className="text-sm" style={{ color: V.fgMute }}>{label}</span>
                <span className="text-sm font-medium capitalize"
                  style={{ color: typeof val === 'boolean' ? (val ? '#34d399' : V.fgMute) : V.fg }}>
                  {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val ?? '—')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'topics',     label: 'Syllabus',      icon: BookOpen      },
  { id: 'papers',     label: 'Papers',        icon: FileText      },
  { id: 'commands',   label: 'Command Words', icon: MessageSquare },
  { id: 'thresholds', label: 'Assessment',    icon: Target        },
]

export function CurriculumDetailClient({ schema }: { schema: CurriculumSchema }) {
  const m            = schema.metadata as any
  const topics: any[] = (schema.topics as any[]) ?? []
  const papers        = (schema.paper_structure as any)?.papers ?? []
  const commandWords  = [
    ...((schema.command_words as any)?.overrides        ?? []),
    ...((schema.command_words as any)?.subject_specific ?? []),
  ]

  const [tab,         setTab]         = useState('topics')
  const [classFilter, setClassFilter] = useState('All')

  const allClassLevels = useMemo(() => {
    const seen = new Set<string>()
    for (const t of topics) for (const cl of (t.corpus_provenance?.class_levels ?? [])) seen.add(cl)
    return [...seen].sort()
  }, [topics])

  const classCounts = useMemo(() => {
    const c: Record<string, number> = { All: topics.length }
    for (const cl of allClassLevels) {
      c[cl] = topics.filter(t => (t.corpus_provenance?.class_levels ?? []).includes(cl)).length
    }
    return c
  }, [topics, allClassLevels])

  const visibleTopics = useMemo(
    () => classFilter === 'All' ? topics : topics.filter(t => (t.corpus_provenance?.class_levels ?? []).includes(classFilter)),
    [topics, classFilter],
  )

  const termGroups = useMemo(() => {
    const map = new Map<string, { topics: any[]; periods: number }>()
    for (const t of visibleTopics) {
      const term = primaryTerm(t)
      if (!map.has(term)) map.set(term, { topics: [], periods: 0 })
      map.get(term)!.topics.push(t)
      map.get(term)!.periods += (t.corpus_provenance?.periods ?? 0) as number
    }
    let counter = 0
    return [...map.entries()]
      .sort(([a], [b]) => termSort(a, b))
      .map(([term, data]) => ({
        term, periods: data.periods,
        entries: data.topics.map(t => ({ topic: t, seqNum: ++counter })),
      }))
  }, [visibleTopics])

  // Only show term dividers when there are multiple real terms
  const showTermDividers = termGroups.length > 1 || (termGroups.length === 1 && termGroups[0].term !== 'General')

  const totalPeriods = useMemo(
    () => visibleTopics.reduce((s, t) => s + ((t.corpus_provenance?.periods ?? 0) as number), 0),
    [visibleTopics],
  )

  const sourceMap = useMemo(() => {
    const m2 = new Map<string, number[]>()
    for (const t of visibleTopics) {
      const prov = t.corpus_provenance
      if (!prov?.source_doc) continue
      if (!m2.has(prov.source_doc)) m2.set(prov.source_doc, [])
      if (prov.page_ref) m2.get(prov.source_doc)!.push(prov.page_ref as number)
    }
    return m2
  }, [visibleTopics])

  const totalOutcomes = visibleTopics.reduce((s, t) => s + (t.learning_outcomes?.length ?? 0), 0)

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 64 }}>
      {/* Back */}
      <Link
        href="/dashboard/curricula"
        className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
        style={{ color: V.fgMute }}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Curriculum Library
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{
            fontFamily: '"Fraunces","Georgia",serif',
            fontSize: 26, fontWeight: 600, color: V.fg, margin: 0, lineHeight: 1.15,
          }}>
            {m.subject}
          </h1>
          {m.subject_code && (
            <span style={{
              fontSize: 12, fontFamily: 'monospace', padding: '2px 6px', borderRadius: 6,
              background: V.muted, color: V.fgMute,
            }}>
              {m.subject_code}
            </span>
          )}
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 999,
            ...(m.status === 'final'
              ? { background: 'rgba(16,185,129,0.12)', color: '#34d399' }
              : { background: V.muted, color: V.fgMute }),
          }}>
            {m.status ?? 'draft'}
          </span>
        </div>
        <p style={{ fontSize: 13, color: V.fgMute, margin: 0 }}>
          {[m.curriculum_body, m.curriculum_level, m.country, m.version ? `v${m.version}` : null]
            .filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* Stats strip */}
      <StatsStrip topics={topics} />

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, borderBottom: `1px solid ${V.border}`,
        marginTop: 20, marginBottom: 20,
      }}>
        {TABS.filter(t => t.id !== 'commands' || commandWords.length > 0).map(({ id, label, icon: Icon }) => {
          const on = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 14px', fontSize: 13.5, fontWeight: 600,
                color: on ? V.gold : V.fgMute,
                background: 'transparent', border: 0,
                borderBottom: `2px solid ${on ? V.gold : 'transparent'}`,
                marginBottom: -1, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'color .15s',
              }}
            >
              <Icon style={{ width: 15, height: 15 }} />
              {label}
            </button>
          )
        })}
      </div>

      {/* ── Syllabus tab ── */}
      {tab === 'topics' && (
        <div>
          {/* Class filter + KUSAV legend row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {allClassLevels.length > 1 && ['All', ...allClassLevels].map(cl => {
              const on = classFilter === cl
              return (
                <button
                  key={cl}
                  onClick={() => setClassFilter(cl)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 13px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                    background: on ? V.gold    : V.card,
                    border:     `1px solid ${on ? V.gold : V.border}`,
                    color:      on ? 'hsl(var(--gold-foreground))' : V.fg,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                  }}
                >
                  {cl}
                  <span style={{
                    fontSize: 11, padding: '1px 6px', borderRadius: 999,
                    background: on ? 'rgba(0,0,0,.15)' : V.muted,
                    color: on ? 'hsl(var(--gold-foreground))' : V.fgMute,
                  }}>
                    {classCounts[cl] ?? 0}
                  </span>
                </button>
              )
            })}
            <div style={{ marginLeft: 'auto' }}>
              <KUSALegend />
            </div>
          </div>

          {/* Topics — term-grouped or flat */}
          {termGroups.map(({ term, periods, entries }, gi) => (
            <div key={term}>
              {showTermDividers && (
                <TermDivider term={term} count={entries.length} periods={periods} />
              )}
              {entries.map(({ topic, seqNum }) => (
                <TopicCard
                  key={topic.topic_id ?? seqNum}
                  topic={topic}
                  seqNum={seqNum}
                  totalPeriods={totalPeriods}
                  openDefault={gi === 0 && seqNum === 1}
                />
              ))}
            </div>
          ))}

          {/* Sources */}
          {sourceMap.size > 0 && (
            <div style={{ marginTop: 36, paddingTop: 28, borderTop: `1px solid ${V.border}` }}>
              <p style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '.1em',
                textTransform: 'uppercase', color: V.fgMute, marginBottom: 10,
              }}>
                Sources
              </p>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {[...sourceMap.entries()].map(([doc, pages], i) => {
                  const range = pages.length > 0 ? `pp. ${Math.min(...pages)}–${Math.max(...pages)}` : ''
                  return (
                    <li key={i} style={{ fontSize: 12, color: V.fgMute, display: 'flex', gap: 8, marginBottom: 4 }}>
                      <span style={{ opacity: 0.5 }}>[{i + 1}]</span>
                      {doc}{range ? `, ${range}` : ''}
                    </li>
                  )
                })}
              </ol>
            </div>
          )}

          {/* Footer */}
          <div style={{ fontSize: 11.5, color: V.fgMute, textAlign: 'center', padding: '20px 0', opacity: 0.6 }}>
            {visibleTopics.length} topics · {totalOutcomes} outcomes · {totalPeriods} periods
            {' — '}{m.subject}{m.curriculum_level ? ` ${m.curriculum_level}` : ''}
          </div>
        </div>
      )}

      {tab === 'papers'     && <PapersTab      papers={papers}      />}
      {tab === 'commands'   && <CommandWordsTab words={commandWords} />}
      {tab === 'thresholds' && <ThresholdsTab   schema={schema}      />}
    </div>
  )
}
