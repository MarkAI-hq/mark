'use client'

// SPEC-05 S5-R14/R16 — curriculum-routed interactive activity. Checked in the
// browser by the SAME pure checker the API uses (lib/interactions/shared,
// synced from mark-api). Flow: Check → wrong items marked (misconception
// feedback where tagged) → Try again → Show answer + explanation. Next unlocks
// after the first Check; the first attempt is what counts.
import { useMemo, useState } from 'react'
import { Puzzle, RotateCcw, Eye, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LessonProse } from '@/components/lesson/lesson-prose'
import { checkInteraction, INTERACTIVE_PASS_SCORE } from '@/lib/interactions/shared/checkers'
import type {
  CheckResult,
  ClassifyData,
  ConceptMapData,
  GraphPlotData,
  HighlightEvidenceData,
  InteractionResponse,
  InteractiveContent,
  LabelDiagramData,
  LabelFlowData,
  MatchData,
  NumericSolverData,
  ScenarioDecisionData,
  SequenceData,
  SliderExplorerData,
  TableCompleteData,
} from '@/lib/interactions/shared/types'
import { ClassifyView, MatchView, NumericView, SequenceView } from './interactions/views'
import {
  ConceptMapView,
  GraphView,
  HighlightView,
  LabelDiagramView,
  LabelFlowView,
  ScenarioView,
  SliderView,
  TableView,
} from './interactions/views-r2'
import { SceneUnknown } from './scene-unknown'
import type { SceneResponse } from './lesson-player'

const KNOWN = new Set([
  'classify', 'match', 'sequence', 'numeric_solver',
  // SPEC-05 Revision 2
  'table_complete', 'label_flow', 'highlight_evidence', 'concept_map',
  'graph_plot', 'slider_explorer', 'scenario_decision', 'label_diagram',
])

/** Every blank cell of a table, in reading order. */
const tableBlanks = (d: TableCompleteData) =>
  d.rows.flatMap((r) => r.cells).filter((c): c is Extract<typeof c, { blank: unknown }> => 'blank' in c)

function emptyResponse(c: InteractiveContent): InteractionResponse {
  switch (c.template) {
    case 'classify': return { placements: {} }
    case 'match': return { pairs: {} }
    case 'sequence': return { order: [] }
    case 'numeric_solver': return { values: (c.data as NumericSolverData).steps.map(() => null) }
    case 'table_complete': return { values: {} }
    case 'label_flow':
    case 'label_diagram': return { placements: {} }
    case 'highlight_evidence': return { selected: [] }
    case 'concept_map': return { links: [] }
    case 'graph_plot': return (c.data as GraphPlotData).mode === 'points' ? { points: [] } : { lines: {} }
    case 'slider_explorer': return { values: (c.data as SliderExplorerData).questions.map(() => null) }
    case 'scenario_decision': return { choices: {} }
  }
}

function correctResponse(c: InteractiveContent): InteractionResponse {
  switch (c.template) {
    case 'classify':
      return { placements: Object.fromEntries((c.data as ClassifyData).items.map((i) => [i.id, i.bin])) }
    case 'match':
      return { pairs: Object.fromEntries((c.data as MatchData).pairs) }
    case 'sequence':
      return { order: (c.data as SequenceData).steps.map((s) => s.id) }
    case 'numeric_solver':
      return { values: (c.data as NumericSolverData).steps.map((s) => s.answer) }
    case 'table_complete':
      return {
        values: Object.fromEntries(
          tableBlanks(c.data as TableCompleteData).map((b) => [b.id, b.blank === 'number' ? String(b.answer) : b.accepted[0]]),
        ),
      }
    case 'label_flow':
      return { placements: Object.fromEntries((c.data as LabelFlowData).answers) }
    case 'label_diagram':
      return { placements: Object.fromEntries((c.data as LabelDiagramData).answers) }
    case 'highlight_evidence':
      return { selected: [...(c.data as HighlightEvidenceData).targets] }
    case 'concept_map':
      return { links: (c.data as ConceptMapData).edges.map((e) => ({ from: e.from, to: e.to, label: e.label })) }
    case 'graph_plot': {
      const d = c.data as GraphPlotData
      if (d.mode === 'points') return { points: [...(d.points ?? [])] }
      // two lattice points on each line, inside the grid
      const g = d.grid
      const lines: Record<string, Array<[number, number]>> = {}
      for (const l of d.lines ?? []) {
        const on: Array<[number, number]> = []
        for (let x = g.xmin; x <= g.xmax + 1e-9 && on.length < 2; x += g.step) {
          const y = l.m * x + l.c
          const k = (y - g.ymin) / g.step
          if (y >= g.ymin - 1e-9 && y <= g.ymax + 1e-9 && Math.abs(k - Math.round(k)) < 1e-9) on.push([x, y])
        }
        lines[l.id] = on
      }
      return { lines }
    }
    case 'slider_explorer':
      return { values: (c.data as SliderExplorerData).questions.map((q) => q.answer) }
    case 'scenario_decision':
      return {
        choices: Object.fromEntries(
          (c.data as ScenarioDecisionData).decisions.map((d) => [d.id, d.options.find((o) => o.verdict === 'best')?.id ?? '']),
        ),
      }
  }
}

function isComplete(c: InteractiveContent, r: InteractionResponse): boolean {
  switch (c.template) {
    case 'classify': return (c.data as ClassifyData).items.every((i) => (r as any).placements?.[i.id])
    case 'match': return (c.data as MatchData).left.every((l) => (r as any).pairs?.[l.id])
    case 'sequence': return (r as any).order?.length === (c.data as SequenceData).steps.length
    case 'numeric_solver': return ((r as any).values ?? []).every((v: unknown) => typeof v === 'number')
    case 'table_complete': return tableBlanks(c.data as TableCompleteData).every((b) => ((r as any).values?.[b.id] ?? '').trim() !== '')
    case 'label_flow': return (c.data as LabelFlowData).answers.every(([n]) => (r as any).placements?.[n])
    case 'label_diagram': return (c.data as LabelDiagramData).answers.every(([h]) => (r as any).placements?.[h])
    case 'highlight_evidence': return ((r as any).selected ?? []).length > 0
    case 'concept_map': return ((r as any).links ?? []).length > 0
    case 'graph_plot': {
      const d = c.data as GraphPlotData
      return d.mode === 'points'
        ? ((r as any).points ?? []).length > 0
        : (d.lines ?? []).every((l) => ((r as any).lines?.[l.id] ?? []).length === 2)
    }
    case 'slider_explorer': return ((r as any).values ?? []).every((v: unknown) => typeof v === 'number')
    case 'scenario_decision': return (c.data as ScenarioDecisionData).decisions.every((d) => (r as any).choices?.[d.id])
  }
}

interface Props {
  scene: any
  onReady?: () => void
  onResponse?: (response: SceneResponse) => void
}

export function SceneInteractive({ scene, onReady, onResponse }: Props) {
  const content = scene?.content as InteractiveContent | undefined
  if (!content || !KNOWN.has(content.template) || !content.data) return <SceneUnknown scene={scene} onReady={onReady} />
  return <InteractiveBody scene={scene} content={content} onReady={onReady} onResponse={onResponse} />
}

function InteractiveBody({ scene, content, onReady, onResponse }: Props & { content: InteractiveContent }) {
  const [response, setResponse] = useState<InteractionResponse>(() => emptyResponse(content))
  const [drafts, setDrafts] = useState<string[]>([])
  const [result, setResult] = useState<CheckResult | null>(null)
  const [firstDone, setFirstDone] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const seed = useMemo(() => `${scene?.title ?? ''}|${content.outcome_ref}`, [scene?.title, content.outcome_ref])

  const complete = isComplete(content, response)
  const allRight = !!result && result.score === 1
  const locked = revealed || allRight

  function change(r: InteractionResponse) {
    setResponse(r)
    setResult(null) // a changed answer has not been checked yet
  }

  function check() {
    const r = checkInteraction(content, response)
    setResult(r)
    if (!firstDone) {
      setFirstDone(true)
      onReady?.()
      onResponse?.({
        type: 'interactive',
        correct: r.score >= INTERACTIVE_PASS_SCORE,
        score: Math.round(r.score * 100),
        template: content.template,
        misconception_hits: r.misconception_hits,
      })
    }
  }

  function tryAgain() {
    // keep what was right; clear only what was wrong
    const wrong = new Set((result?.items ?? []).filter((i) => !i.correct).map((i) => i.id))
    setResult(null)
    if (content.template === 'numeric_solver') {
      setDrafts((d) => d.map((x, i) => (wrong.has(String(i)) ? '' : x)))
    }
    if (content.template === 'slider_explorer') {
      const ids = (content.data as SliderExplorerData).questions.map((q) => q.id)
      setDrafts((d) => d.map((x, i) => (wrong.has(ids[i]) ? '' : x)))
    }
    setResponse((prev) => {
      switch (content.template) {
        case 'classify': {
          const p = { ...(prev as any).placements }
          wrong.forEach((id) => delete p[id])
          return { placements: p }
        }
        case 'match': {
          const p = { ...(prev as any).pairs }
          wrong.forEach((id) => delete p[id])
          return { pairs: p }
        }
        case 'sequence': {
          const order: string[] = (prev as any).order
          const firstWrong = order.findIndex((_, i) => wrong.has((content.data as SequenceData).steps[i]?.id))
          return { order: firstWrong < 0 ? order : order.slice(0, firstWrong) }
        }
        case 'numeric_solver': {
          const values = [...(prev as any).values]
          wrong.forEach((id) => (values[Number(id)] = null))
          return { values }
        }
        case 'table_complete': {
          const v = { ...(prev as any).values }
          wrong.forEach((id) => delete v[id])
          return { values: v }
        }
        case 'label_flow':
        case 'label_diagram': {
          const p = { ...(prev as any).placements }
          wrong.forEach((id) => delete p[id])
          return { placements: p }
        }
        case 'highlight_evidence':
          // drop wrong picks, keep correct ones; missed targets stay unselected
          return { selected: ((prev as any).selected as string[]).filter((id) => !wrong.has(id)) }
        case 'concept_map': {
          const d = content.data as ConceptMapData
          const wrongEdges = new Set(d.edges.filter((e) => wrong.has(e.id)).map((e) => `${e.from}>${e.to}`))
          return {
            links: ((prev as any).links as Array<{ from: string; to: string; label: string }>).filter(
              (l) => !wrong.has(`extra:${l.from}>${l.to}`) && !wrongEdges.has(`${l.from}>${l.to}`),
            ),
          }
        }
        case 'graph_plot': {
          if ((content.data as GraphPlotData).mode === 'points') {
            return { points: ((prev as any).points as Array<[number, number]>).filter((p) => !wrong.has(`extra:${p[0]},${p[1]}`)) }
          }
          const l = { ...(prev as any).lines }
          wrong.forEach((id) => delete l[id])
          return { lines: l }
        }
        case 'slider_explorer': {
          const ids = (content.data as SliderExplorerData).questions.map((q) => q.id)
          return { values: ((prev as any).values as Array<number | null>).map((v, i) => (wrong.has(ids[i]) ? null : v)) }
        }
        case 'scenario_decision': {
          const ch = { ...(prev as any).choices }
          wrong.forEach((id) => delete ch[id])
          return { choices: ch }
        }
      }
    })
  }

  function reveal() {
    const r = correctResponse(content)
    setResponse(r)
    if (content.template === 'numeric_solver' || content.template === 'slider_explorer') setDrafts((r as any).values.map(String))
    setResult(checkInteraction(content, r))
    setRevealed(true)
    if (!firstDone) {
      // Showing the answer without trying counts as a first attempt of 0.
      setFirstDone(true)
      onReady?.()
      onResponse?.({ type: 'interactive', correct: false, score: 0, template: content.template, misconception_hits: [] })
    }
  }

  const common = { response: response as any, onChange: change, results: result?.items ?? null, locked, seed }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2">
        <Puzzle className="mt-1 h-4 w-4 shrink-0 text-gold" />
        <h2 className="text-2xl font-bold leading-tight">{scene.title}</h2>
      </div>
      <p className="text-base text-muted-foreground"><LessonProse text={content.instructions} /></p>

      {content.template === 'classify' && <ClassifyView data={content.data as ClassifyData} {...common} />}
      {content.template === 'match' && <MatchView data={content.data as MatchData} {...common} />}
      {content.template === 'sequence' && <SequenceView data={content.data as SequenceData} {...common} />}
      {content.template === 'numeric_solver' && (
        <NumericView data={content.data as NumericSolverData} {...common} drafts={drafts} setDrafts={setDrafts} />
      )}
      {content.template === 'table_complete' && <TableView data={content.data as TableCompleteData} {...common} />}
      {content.template === 'label_flow' && <LabelFlowView data={content.data as LabelFlowData} {...common} />}
      {content.template === 'highlight_evidence' && (
        <HighlightView
          data={{ ...(content.data as HighlightEvidenceData), task: (content.data as HighlightEvidenceData).task.trim() === content.instructions.trim() ? '' : (content.data as HighlightEvidenceData).task }}
          {...common}
        />
      )}
      {content.template === 'concept_map' && <ConceptMapView data={content.data as ConceptMapData} {...common} />}
      {content.template === 'graph_plot' && <GraphView data={content.data as GraphPlotData} {...common} />}
      {content.template === 'slider_explorer' && (
        <SliderView data={content.data as SliderExplorerData} {...common} drafts={drafts} setDrafts={setDrafts} />
      )}
      {content.template === 'scenario_decision' && <ScenarioView data={content.data as ScenarioDecisionData} {...common} />}
      {content.template === 'label_diagram' && <LabelDiagramView data={content.data as LabelDiagramData} {...common} />}

      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        {!result && !locked && (
          <Button onClick={check} disabled={!complete} className="min-h-[44px] gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Check
          </Button>
        )}
        {result && !allRight && !revealed && (
          <>
            <Button onClick={tryAgain} variant="outline" className="min-h-[44px] gap-1.5">
              <RotateCcw className="h-4 w-4" /> Try again
            </Button>
            <Button onClick={reveal} variant="ghost" className="min-h-[44px] gap-1.5 text-muted-foreground">
              <Eye className="h-4 w-4" /> Show answer
            </Button>
            <span className="text-sm text-muted-foreground">Some answers need another look.</span>
          </>
        )}
        {!result && !locked && !complete && (
          <span className="text-xs text-muted-foreground">Finish every item, then check.</span>
        )}
        {allRight && !revealed && <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">All correct.</span>}
      </div>

      {(allRight || revealed) && content.explanation && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
          <p className="mb-1 font-medium">Why</p>
          <p className="leading-relaxed"><LessonProse text={content.explanation} /></p>
        </div>
      )}
    </div>
  )
}
