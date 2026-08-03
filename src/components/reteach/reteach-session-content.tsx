'use client'

// src/components/reteach/reteach-session-content.tsx
// Shared content renderer — used by panel, modal, and full page

import { useState, useTransition } from 'react'
import { toast }     from 'sonner'
import { Badge }     from '@/components/ui/badge'
import { Button }    from '@/components/ui/button'
import { Textarea }  from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  BookOpen, MessageSquare, Lightbulb,
  AlertCircle, CheckCircle2, Brain, Clock,
  FileText, ChevronDown, ChevronRight, GraduationCap,
  Target, ClipboardList, NotebookPen,
  Link2, Calendar, HelpCircle, Pencil, Save, X,
  Square, SquareCheckBig, FlipHorizontal,
} from 'lucide-react'
import type { ReteachSession, RemediationActivityType } from '@/lib/actions/reteach'
import { updateSessionContent } from '@/lib/actions/reteach-history'
import { SourcesConsulted } from '@/components/common/sources-consulted'
import { WordOriginCard } from '@/components/reteach/word-origin-card'

interface ReteachSessionContentProps {
  session:    ReteachSession
  /** D4: When true, shows edit controls */
  editable?:  boolean
  sessionId?: string
  onSaved?:   (updated: ReteachSession) => void
  /** 'teacher' (default) shows the original teacher-facing framing/labels.
   *  'student' relabels the two section headers for a student viewing their
   *  own remediation session directly, instead of a teacher printing it. */
  viewerRole?: 'teacher' | 'student'
}

const SCOPE_LABEL: Record<ReteachSession['scope'], string> = {
  individual:   'Individual Session',
  class:        'Whole-Class Session',
  longitudinal: 'Coaching Session',
  group:        'Small-Group Session',
}

const SCOPE_COLOR: Record<ReteachSession['scope'], string> = {
  individual:   'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  class:        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  longitudinal: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  group:        'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
}

const STRATEGY_LABEL: Record<RemediationActivityType, string> = {
  visual_mapping:                    'Visual Mapping',
  inquiry_based:                     'Inquiry-Based Learning',
  problem_based:                     'Problem-Based Learning',
  worked_example_fading:             'Worked Example Fading',
  concrete_representational_abstract: 'Concrete → Representational → Abstract',
  structured_note_taking:            'Structured Note-Taking',
  structured_decision_making:        'Structured Decision-Making',
}

export function ReteachSessionContent({ session, editable, sessionId, onSaved, viewerRole = 'teacher' }: ReteachSessionContentProps) {
  const [anchorOpen,    setAnchorOpen]    = useState(false)
  const [cornellOpen,   setCornellOpen]   = useState(false)
  const [editMode,      setEditMode]      = useState(false)
  const [draft,         setDraft]         = useState(session)
  const [isPending,     startTransition]  = useTransition()

  // H3: interactive state
  const [checkedQs,   setCheckedQs]   = useState<Set<number>>(new Set())
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())

  const tg = editMode ? draft.teacher_guide      : session.teacher_guide
  const ws = editMode ? draft.student_worksheet  : session.student_worksheet

  const patchExplanation = (field: 'opening' | 'core_concept' | 'worked_example', value: string) => {
    setDraft(d => ({
      ...d,
      teacher_guide: {
        ...d.teacher_guide,
        scripted_explanation: { ...d.teacher_guide.scripted_explanation, [field]: value },
      },
    }))
  }

  const handleSave = () => {
    if (!sessionId) return
    startTransition(async () => {
      const { data, error } = await updateSessionContent(sessionId, draft)
      if (error || !data) {
        toast.error(error?.message ?? 'Failed to save.')
        return
      }
      toast.success('Session content saved.')
      setEditMode(false)
      onSaved?.(draft)
    })
  }

  const handleCancel = () => {
    setDraft(session)
    setEditMode(false)
  }

  const toggleCheck = (i: number) => setCheckedQs(prev => {
    const next = new Set(prev)
    if (next.has(i)) next.delete(i); else next.add(i)
    return next
  })

  const toggleFlip = (i: number) => setFlippedCards(prev => {
    const next = new Set(prev)
    if (next.has(i)) next.delete(i); else next.add(i)
    return next
  })

  return (
    <div className="space-y-6">

      {/* D4: Edit toolbar */}
      {editable && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {editMode ? 'Editing session — changes save to the database.' : 'Teacher edits allowed before delivery.'}
          </p>
          {editMode ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={handleCancel} disabled={isPending}>
                <X className="h-3 w-3" /> Cancel
              </Button>
              <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave} disabled={isPending}>
                <Save className="h-3 w-3" />
                {isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setEditMode(true)}>
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          )}
        </div>
      )}

      {/* ── J1: Etymology — appears first to build semantic intuition ── */}
      {session.etymology_note && (
        <WordOriginCard note={session.etymology_note} variant="block" defaultOpen />
      )}

      {/* ── Header meta ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={SCOPE_COLOR[session.scope]}>
          {SCOPE_LABEL[session.scope]}
        </Badge>
        <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
          <Clock className="mr-1 h-3 w-3" />
          {session.duration_minutes} min
        </Badge>
        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
          {session.target_error}
        </Badge>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          {session.target_bloom_level}
        </Badge>
      </div>

      {/* ── F5: Curriculum anchor (collapsed by default) ─────────────── */}
      {(session.lo_id || session.lo_text) && (
        <div className="rounded-lg border border-border bg-muted overflow-hidden">
          <button
            type="button"
            onClick={() => setAnchorOpen(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Grounded in curriculum
                {session.lo_id ? ` — ${session.lo_id}` : ''}
              </span>
            </div>
            {anchorOpen
              ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
              : <ChevronRight className="h-3 w-3 text-muted-foreground" />
            }
          </button>

          {anchorOpen && (
            <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-border">
              {session.lo_text && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                    Intended Learning Outcome
                  </p>
                  <p className="text-xs text-foreground leading-relaxed">{session.lo_text}</p>
                </div>
              )}
              {session.remediation_type && (
                <div className="flex items-center gap-1.5">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Strategy:{' '}
                    <span className="font-medium">
                      {STRATEGY_LABEL[session.remediation_type] ?? session.remediation_type}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TEACHER GUIDE section header ─────────────────────────────── */}
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          {viewerRole === 'student' ? 'Walk through it' : 'Teacher Guide'}
        </h3>
        <span className="text-xs text-muted-foreground">
          {viewerRole === 'student' ? '(read this first)' : '(teacher reads this)'}
        </span>
      </div>

      {/* ── Scripted explanation ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-foreground">Scripted explanation</h4>
        </div>

        <div className="rounded-lg border bg-muted p-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Opening</p>
            {editMode ? (
              <Textarea
                value={draft.teacher_guide.scripted_explanation.opening}
                onChange={e => patchExplanation('opening', e.target.value)}
                rows={3}
                className="text-sm"
              />
            ) : (
              <p className="text-sm text-foreground leading-relaxed">{tg.scripted_explanation.opening}</p>
            )}
          </div>
          <Separator />
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Core concept</p>
            {editMode ? (
              <Textarea
                value={draft.teacher_guide.scripted_explanation.core_concept}
                onChange={e => patchExplanation('core_concept', e.target.value)}
                rows={4}
                className="text-sm"
              />
            ) : (
              <p className="text-sm text-foreground leading-relaxed">{tg.scripted_explanation.core_concept}</p>
            )}
          </div>
          <Separator />
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Worked example</p>
            {editMode ? (
              <Textarea
                value={draft.teacher_guide.scripted_explanation.worked_example}
                onChange={e => patchExplanation('worked_example', e.target.value)}
                rows={4}
                className="text-sm"
              />
            ) : (
              <p className="text-sm text-foreground leading-relaxed">{tg.scripted_explanation.worked_example}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── L3: Self-explanation prompts (after worked example) ────── */}
      {session.self_explanation_prompts && session.self_explanation_prompts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">Self-explanation prompts</h4>
            <span className="text-xs text-muted-foreground">(ask after each step)</span>
          </div>
          {session.self_explanation_prompts.map((p, i) => (
            <div key={i} className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
              <p className="text-[10px] font-medium text-indigo-500 uppercase mb-1">After: {p.after_step}</p>
              <p className="text-xs text-indigo-800">💭 Ask: {p.prompt}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Example questions — H3: flashcard flip mode ──────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-foreground">Example questions</h4>
          <span className="text-xs text-muted-foreground">(teacher-led, with model answers)</span>
        </div>
        <div className="space-y-2">
          {tg.example_questions.map((q, i) => {
            const flipped = flippedCards.has(i)
            return (
              <div key={i} className="rounded-lg border p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{i + 1}. {q.question}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border">
                      {q.bloom_level}
                    </Badge>
                    <button
                      type="button"
                      title={flipped ? 'Hide answer' : 'Reveal answer'}
                      onClick={() => toggleFlip(i)}
                      className="rounded p-0.5 hover:bg-muted transition-colors"
                    >
                      <FlipHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                {flipped && (
                  <p className="text-xs text-muted-foreground leading-relaxed border-t pt-1.5">
                    <span className="font-medium text-muted-foreground">Expected: </span>
                    {q.expected_answer}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Expected misconceptions ──────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-foreground">Expected misconceptions</h4>
        </div>
        <div className="space-y-2">
          {tg.expected_misconceptions.map((m, i) => (
            <div key={i} className="rounded-lg border border-amber-100 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-1">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                Student might say: &ldquo;{m.misconception}&rdquo;
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                <span className="font-medium">Respond: </span>{m.correction}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cognitive tip (optional) ─────────────────────────────────── */}
      {tg.cognitive_tip && (
        <div className="rounded-lg border border-purple-100 bg-purple-50 p-3 space-y-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Brain className="h-3.5 w-3.5 text-purple-600" />
            <p className="text-xs font-medium text-purple-800">Cognitive profile tip</p>
          </div>
          <p className="text-xs text-purple-700 leading-relaxed">{tg.cognitive_tip}</p>
        </div>
      )}

      {/* ── Success criteria ─────────────────────────────────────────── */}
      <div className="rounded-lg border border-emerald-100 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-3 space-y-1">
        <div className="flex items-center gap-1.5 mb-1">
          <Lightbulb className="h-3.5 w-3.5 text-emerald-600" />
          <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">How you know it worked</p>
        </div>
        <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">{tg.success_criteria}</p>
      </div>

      {/* ── Exit ticket (optional) ───────────────────────────────────── */}
      {tg.exit_ticket && (
        <div className="rounded-lg border border-teal-100 bg-teal-50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
              <p className="text-xs font-medium text-teal-800">
                Exit ticket — run this before students leave
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-600 border-teal-200">
              {tg.exit_ticket.time_estimate_minutes} min
            </Badge>
          </div>
          <p className="text-sm font-medium text-teal-900">{tg.exit_ticket.question}</p>
          <ul className="space-y-0.5">
            {tg.exit_ticket.expected_indicators.map((ind, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-teal-500 mt-0.5 shrink-0" />
                <span className="text-xs text-teal-700">{ind}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Separator />

      {/* ── STUDENT WORKSHEET section header ─────────────────────────── */}
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          {viewerRole === 'student' ? 'Now try it yourself' : 'Student Worksheet'}
        </h3>
        <span className="text-xs text-muted-foreground">
          {viewerRole === 'student' ? '(work through these on your own)' : '(print and hand to student — no answers)'}
        </span>
      </div>

      {/* ── Practice questions — H3: interactive checklist ──────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-foreground">Practice questions</h4>
          <span className="text-xs text-muted-foreground">(students work independently)</span>
          {checkedQs.size > 0 && (
            <span className="text-xs text-emerald-600 font-medium ml-auto">
              {checkedQs.size}/{ws.practice_questions.length} done
            </span>
          )}
        </div>
        <div className="space-y-2">
          {ws.practice_questions.map((q, i) => {
            const checked = checkedQs.has(i)
            return (
              <div key={i} className={`rounded-lg border p-3 space-y-1.5 transition-colors ${checked ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCheck(i)}
                      className="mt-0.5 shrink-0"
                      title={checked ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {checked
                        ? <SquareCheckBig className="h-4 w-4 text-emerald-600" />
                        : <Square className="h-4 w-4 text-muted-foreground/60" />
                      }
                    </button>
                    <p className={`text-sm font-medium ${checked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {i + 1}. {q.question}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 bg-muted text-muted-foreground border-border">
                    {q.bloom_level}
                  </Badge>
                </div>
                {!checked && (
                  <div className="space-y-0.5 mt-1">
                    {Array.from({ length: q.answer_lines }).map((_, j) => (
                      <div key={j} className="h-4 border-b border-dashed border-border" />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Strategy-specific templates ──────────────────────────────── */}
      {ws.diagram_template && (
        <div className="rounded-lg border border-border bg-muted p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Diagram template</p>
          <p className="text-xs text-muted-foreground leading-relaxed italic">{ws.diagram_template}</p>
        </div>
      )}

      {ws.table_template && (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted">
                {ws.table_template.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-medium text-muted-foreground border-r last:border-r-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ws.table_template.rows }).map((_, i) => (
                <tr key={i} className="border-t">
                  {ws.table_template!.headers.map((_, j) => (
                    <td key={j} className="px-3 py-3 border-r last:border-r-0 text-muted-foreground/60">
                      &nbsp;
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ws.decision_tree_prompt && (
        <div className="rounded-lg border border-border bg-muted p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Decision framework</p>
          <p className="text-xs text-muted-foreground leading-relaxed italic">{ws.decision_tree_prompt}</p>
        </div>
      )}

      {/* ── Student exit ticket ──────────────────────────────────────── */}
      <div className="rounded-lg border border-teal-100 bg-teal-50 p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
          <p className="text-xs font-medium text-teal-800">Exit ticket (student response)</p>
        </div>
        <p className="text-sm font-medium text-teal-900">{ws.exit_ticket_prompt}</p>
        <div className="space-y-0.5 mt-1">
          {Array.from({ length: ws.exit_ticket_response_lines }).map((_, i) => (
            <div key={i} className="h-5 border-b border-dashed border-teal-200" />
          ))}
        </div>
      </div>

      {/* ── L4: Spaced review schedule ───────────────────────────────── */}
      {session.review_schedule && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium text-foreground">Review schedule</h4>
              <span className="text-xs text-muted-foreground">(spaced repetition — verbal checks)</span>
            </div>
            {(['day_1', 'day_3', 'day_7'] as const).map((key) => (
              <div key={key} className="flex gap-3 items-start">
                <span className="text-[10px] font-bold text-muted-foreground w-10 shrink-0 mt-0.5">
                  {key === 'day_1' ? 'Day 1' : key === 'day_3' ? 'Day 3' : 'Day 7'}
                </span>
                <p className="text-xs text-foreground leading-relaxed">{session.review_schedule![key]}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── I1: Cornell notes template ───────────────────────────────── */}
      {session.cornell_notes && (
        <>
          <Separator />
          <div className="rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setCornellOpen(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 bg-muted hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <NotebookPen className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Cornell Notes Template</span>
              </div>
              {cornellOpen
                ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                : <ChevronRight className="h-3 w-3 text-muted-foreground" />
              }
            </button>
            {cornellOpen && (
              <div className="border-t">
                <div className="grid grid-cols-3 min-h-32">
                  <div className="border-r p-3 space-y-2 bg-muted/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Cue Questions</p>
                    {session.cornell_notes.cue_questions.map((q, i) => (
                      <p key={i} className="text-xs text-muted-foreground italic">{q}</p>
                    ))}
                  </div>
                  <div className="col-span-2 p-3 space-y-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Notes</p>
                    {session.cornell_notes.note_sections.map((s, i) => (
                      <div key={i}>
                        <p className="text-xs font-medium text-foreground">{s.heading}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{s.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t bg-muted p-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Summary</p>
                  <p className="text-xs text-muted-foreground italic leading-relaxed">{session.cornell_notes.summary}</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── I2: Zettelkasten notes (longitudinal only) ───────────────── */}
      {session.zettelkasten_notes && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium text-foreground">Concept connections</h4>
              <span className="text-xs text-muted-foreground">(Zettelkasten — link your ideas)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {session.zettelkasten_notes.atomic_notes.map((note) => (
                <div key={note.id} className="rounded-lg border p-2.5 space-y-1 bg-muted">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground">{note.id}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted rounded px-1">{note.tag}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">{note.concept}</p>
                  <p className="text-[10px] text-muted-foreground italic leading-relaxed">{note.definition}</p>
                  {note.links_to.length > 0 && (
                    <p className="text-[10px] text-blue-500">→ {note.links_to.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">Connection prompt</p>
              <p className="text-xs text-blue-600 italic">{session.zettelkasten_notes.connection_prompt}</p>
            </div>
          </div>
        </>
      )}

      {session.sources_consulted && session.sources_consulted.length > 0 && (
        <>
          <Separator />
          <SourcesConsulted citations={session.sources_consulted} />
        </>
      )}

    </div>
  )
}
