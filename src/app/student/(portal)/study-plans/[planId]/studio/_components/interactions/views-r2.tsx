'use client'

// SPEC-05 Revision 2 (S5-R20, S5-R23–R30) — views for the eight remaining
// templates. Same contract as views.tsx: controlled, tap-to-select primary,
// real <button>s/<input>s for keyboard, ≥ 44 px targets, works at 360 px, no
// network after load (label_diagram's image is part of the lesson), and no
// expression evaluation in the browser (answers are stamped by the API).
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { sliderIndex } from '@/lib/interactions/shared/checkers'
import {
  CONCEPT_LINKS,
  type ConceptMapData,
  type ConceptMapResponse,
  type GraphPlotData,
  type GraphResponse,
  type HighlightEvidenceData,
  type HighlightResponse,
  type ItemResult,
  type LabelDiagramData,
  type LabelFlowData,
  type PlacementResponse,
  type ScenarioDecisionData,
  type ScenarioResponse,
  type SliderExplorerData,
  type SliderResponse,
  type TableCompleteData,
  type TableResponse,
} from '@/lib/interactions/shared/types'
import { LessonProse } from '@/components/lesson/lesson-prose'
import { Chip, ItemFeedback, markFor, stableShuffle, type Mark } from './kit'
import { parseNumber } from './views'

interface ViewProps<D, R> {
  data: D
  response: R
  onChange: (r: R) => void
  results: ItemResult[] | null
  locked: boolean
  seed: string
}

const MARK_BORDER = (m: Mark) => (m === 'correct' ? 'border-emerald-400' : m === 'wrong' ? 'border-rose-400' : 'border-border')

function Context({ text }: { text?: string }) {
  if (!text) return null
  return <div className="rounded-2xl border bg-card px-4 py-3 text-base leading-relaxed"><LessonProse text={text} /></div>
}

// ── table_complete ───────────────────────────────────────────────────────────

export function TableView({ data, response, onChange, results, locked }: ViewProps<TableCompleteData, TableResponse>) {
  return (
    <div className="space-y-3">
      <Context text={data.context} />
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[280px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted/50">
              {data.columns.map((c, i) => (
                <th key={i} scope="col" className="border-b px-2 py-2 text-left font-semibold">{c ? <LessonProse text={c} /> : <span className="sr-only">row</span>}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, r) => (
              <tr key={r} className="border-b last:border-b-0">
                {row.cells.map((cell, c) => {
                  if (!('blank' in cell)) return <td key={c} className="px-2 py-2 align-middle"><LessonProse text={cell.given} /></td>
                  const mark = markFor(results, cell.id)
                  const unit = cell.blank === 'number' ? cell.unit : undefined
                  return (
                    <td key={c} className="px-1.5 py-1.5 align-middle">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode={cell.blank === 'number' ? 'decimal' : 'text'}
                          autoComplete="off"
                          aria-label={`${data.columns[c] || 'Cell'}, row ${r + 1}`}
                          aria-invalid={mark ? mark === 'wrong' : undefined}
                          disabled={locked}
                          value={response.values[cell.id] ?? ''}
                          onChange={(e) => onChange({ values: { ...response.values, [cell.id]: e.target.value } })}
                          className={`h-11 w-full min-w-[72px] rounded-lg border-2 bg-background px-2 text-base ${MARK_BORDER(mark)}`}
                        />
                        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── label_flow ───────────────────────────────────────────────────────────────

/** Layered layout: longest path from the sources, back edges (cycles) ignored. */
export function layerNodes(nodes: LabelFlowData['nodes'], edges: LabelFlowData['edges']): string[][] {
  const ids = nodes.map((n) => n.id)
  const out = new Map(ids.map((i) => [i, [] as string[]]))
  const indeg = new Map(ids.map((i) => [i, 0]))
  // drop back edges found by DFS so a declared cycle still lays out
  const state = new Map<string, number>()
  const forward: Array<[string, string]> = []
  const adj = new Map(ids.map((i) => [i, edges.filter((e) => e.from === i).map((e) => e.to)]))
  const dfs = (n: string) => {
    state.set(n, 1)
    for (const m of adj.get(n) ?? []) {
      if (state.get(m) === 1) continue // back edge
      forward.push([n, m])
      if (!state.get(m)) dfs(m)
    }
    state.set(n, 2)
  }
  ids.forEach((i) => { if (!state.get(i)) dfs(i) })
  forward.forEach(([a, b]) => { out.get(a)?.push(b); indeg.set(b, (indeg.get(b) ?? 0) + 1) })
  const level = new Map<string, number>()
  const queue = ids.filter((i) => !indeg.get(i))
  queue.forEach((i) => level.set(i, 0))
  while (queue.length) {
    const n = queue.shift() as string
    for (const m of out.get(n) ?? []) {
      level.set(m, Math.max(level.get(m) ?? 0, (level.get(n) ?? 0) + 1))
      indeg.set(m, (indeg.get(m) ?? 1) - 1)
      if (!indeg.get(m)) queue.push(m)
    }
  }
  const layers: string[][] = []
  ids.forEach((i) => {
    const l = level.get(i) ?? 0
    ;(layers[l] ??= []).push(i)
  })
  return layers.filter(Boolean)
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(320)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.floor(e.contentRect.width))))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

export function LabelFlowView({ data, response, onChange, results, locked, seed }: ViewProps<LabelFlowData, PlacementResponse>) {
  const [selected, setSelected] = useState<string | null>(null)
  const [ref, width] = useWidth<HTMLDivElement>()
  const bank = useMemo(() => stableShuffle(data.labels, seed), [data.labels, seed])
  const layers = useMemo(() => layerNodes(data.nodes, data.edges), [data.nodes, data.edges])
  const placed = response.placements
  const labelOf = (id?: string) => data.labels.find((l) => l.id === id)?.label
  const used = new Set(Object.values(placed))

  const GAP = 10
  const ROW = 96
  const NODE_H = 64
  const maxPer = Math.max(...layers.map((l) => l.length))
  const nodeW = Math.min(180, Math.floor((width - GAP * (maxPer + 1)) / maxPer))
  const pos = new Map<string, { x: number; y: number }>()
  layers.forEach((layer, li) => {
    const total = layer.length * nodeW + (layer.length - 1) * GAP
    const start = (width - total) / 2
    layer.forEach((id, k) => pos.set(id, { x: start + k * (nodeW + GAP), y: li * ROW }))
  })
  const height = layers.length * ROW - (ROW - NODE_H)

  const tapBlank = (nodeId: string) => {
    if (locked) return
    if (selected) {
      const next = { ...placed }
      for (const k of Object.keys(next)) if (next[k] === selected) delete next[k] // a label answers one blank
      next[nodeId] = selected
      onChange({ placements: next })
      setSelected(null)
    } else if (placed[nodeId]) {
      const next = { ...placed }
      delete next[nodeId]
      onChange({ placements: next })
    }
  }

  return (
    <div className="space-y-4">
      <div ref={ref} className="relative w-full" style={{ height }} aria-label="Flow diagram">
        <svg className="pointer-events-none absolute inset-0" width={width} height={height} aria-hidden>
          <defs>
            <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="fill-muted-foreground" />
            </marker>
          </defs>
          {data.edges.map((e, i) => {
            const a = pos.get(e.from)
            const b = pos.get(e.to)
            if (!a || !b) return null
            const x1 = a.x + nodeW / 2
            const x2 = b.x + nodeW / 2
            const back = b.y <= a.y
            const d = back
              ? `M${a.x + nodeW},${a.y + NODE_H / 2} C${width - 4},${a.y + NODE_H / 2} ${width - 4},${b.y + NODE_H / 2} ${b.x + nodeW},${b.y + NODE_H / 2}`
              : `M${x1},${a.y + NODE_H} L${x2},${b.y}`
            return <path key={i} d={d} fill="none" strokeWidth="2" className="stroke-muted-foreground" markerEnd="url(#flow-arrow)" />
          })}
        </svg>
        {data.nodes.map((n) => {
          const p = pos.get(n.id)
          if (!p) return null
          const style = { left: p.x, top: p.y, width: nodeW, height: NODE_H }
          if (!n.blank) {
            return (
              <div key={n.id} style={style} className="absolute flex items-center justify-center rounded-xl border bg-muted/40 px-2 text-center text-xs font-medium leading-tight">
                <LessonProse text={n.label ?? ''} />
              </div>
            )
          }
          const mark = markFor(results, n.id)
          const lab = labelOf(placed[n.id])
          return (
            <button
              key={n.id}
              type="button"
              style={style}
              disabled={locked}
              onClick={() => tapBlank(n.id)}
              aria-label={lab ? `Box filled with ${lab}. Tap to ${selected ? 'replace' : 'empty'}.` : 'Empty box. Choose a label, then tap here.'}
              className={`absolute flex items-center justify-center rounded-xl border-2 px-2 text-center text-xs leading-tight ${
                mark ? (mark === 'correct' ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-rose-400 bg-rose-50 dark:bg-rose-900/20') : selected ? 'border-gold border-dashed bg-gold/5' : 'border-dashed border-border bg-card'
              }`}
            >
              {lab ? <LessonProse text={lab} /> : <span className="text-muted-foreground">?</span>}
            </button>
          )
        })}
      </div>
      <div className="rounded-2xl border bg-muted/30 p-2" aria-label="Labels">
        <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">Labels — tap one, then tap a box</p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {bank.map((l) => (
            <Chip key={l.id} label={l.label} selected={selected === l.id} disabled={locked} onClick={() => setSelected(selected === l.id ? null : l.id)} prefix={used.has(l.id) ? <span className="text-xs text-gold">✓</span> : undefined} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── highlight_evidence ───────────────────────────────────────────────────────

export function HighlightView({ data, response, onChange, results, locked }: ViewProps<HighlightEvidenceData, HighlightResponse>) {
  const selected = new Set(response.selected)
  const toggle = (id: string) => {
    if (locked) return
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange({ selected: Array.from(next) })
  }
  return (
    <div className="space-y-3">
      {data.task && <p className="text-sm font-medium"><LessonProse text={data.task} /></p>}
      <div className="rounded-2xl border bg-card p-3 text-base leading-[2.1]">
        {data.units.map((u) => {
          const on = selected.has(u.id)
          const r = results?.find((x) => x.id === u.id)
          const missed = !!results && !r?.correct && data.targets.includes(u.id) && !on
          const cls = r ? (r.correct ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-1 ring-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 ring-1 ring-rose-400') : on ? 'bg-gold/25 ring-1 ring-gold' : 'hover:bg-muted'
          return (
            <span key={u.id}>
              <button
                type="button"
                disabled={locked}
                aria-pressed={on}
                onClick={() => toggle(u.id)}
                className={`inline rounded-md px-1 py-1.5 text-left transition-colors disabled:cursor-default ${cls} ${missed ? 'underline decoration-rose-400 decoration-2' : ''}`}
              >
                {u.text}
              </button>{' '}
            </span>
          )
        })}
      </div>
      {results && data.notes && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {data.targets.filter((t) => data.notes?.[t]).map((t) => <li key={t}>• <LessonProse text={data.notes![t]} /></li>)}
        </ul>
      )}
    </div>
  )
}

// ── concept_map ──────────────────────────────────────────────────────────────

export function ConceptMapView({ data, response, onChange, results, locked }: ViewProps<ConceptMapData, ConceptMapResponse>) {
  const [from, setFrom] = useState<string | null>(null)
  const [to, setTo] = useState<string | null>(null)
  const label = (id: string) => data.nodes.find((n) => n.id === id)?.label ?? id
  const links = response.links

  const tapNode = (id: string) => {
    if (locked) return
    if (!from) setFrom(id)
    else if (from === id) { setFrom(null); setTo(null) }
    else setTo(id)
  }
  const addLink = (lab: string) => {
    if (!from || !to) return
    const rest = links.filter((l) => !((l.from === from && l.to === to) || (l.from === to && l.to === from)))
    onChange({ links: [...rest, { from, to, label: lab }] })
    setFrom(null)
    setTo(null)
  }
  const resultFor = (l: { from: string; to: string; label: string }) => {
    if (!results) return null
    const edge = data.edges.find((e) => e.from === l.from && e.to === l.to)
    const id = edge ? edge.id : `extra:${l.from}>${l.to}`
    return markFor(results, id)
  }
  const missing = results ? data.edges.filter((e) => !results.find((r) => r.id === e.id)?.correct && !links.some((l) => l.from === e.from && l.to === e.to)) : []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3" aria-label="Concepts">
        {data.nodes.map((n) => (
          <Chip
            key={n.id}
            label={n.label}
            selected={from === n.id || to === n.id}
            disabled={locked}
            onClick={() => tapNode(n.id)}
            prefix={from === n.id ? <span className="text-xs font-bold text-gold">1</span> : to === n.id ? <span className="text-xs font-bold text-gold">2</span> : undefined}
          />
        ))}
      </div>
      {from && !to && <p className="text-xs text-muted-foreground">Now tap the concept that “{label(from)}” links to.</p>}
      {from && to && (
        <div className="space-y-2 rounded-2xl border border-gold/50 bg-gold/5 p-3">
          <p className="text-sm font-medium">{label(from)} <ArrowRight className="inline h-4 w-4" /> … <ArrowRight className="inline h-4 w-4" /> {label(to)}</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose the link">
            {CONCEPT_LINKS.map((c) => (
              <button key={c} type="button" onClick={() => addLink(c)} className="min-h-[44px] rounded-full border bg-card px-3 text-sm hover:bg-muted">{c}</button>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        <p className="px-1 text-xs font-medium text-muted-foreground">Your links ({links.length})</p>
        {links.length === 0 && <p className="rounded-xl border-2 border-dashed px-3 py-3 text-sm text-muted-foreground">Tap a concept, then another, then choose how they are linked.</p>}
        {links.map((l) => {
          const m = resultFor(l)
          return (
            <div key={`${l.from}>${l.to}`} className={`flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-sm ${MARK_BORDER(m)}`}>
              <span className="flex-1">{label(l.from)} <span className="font-semibold text-gold">→ {l.label} →</span> {label(l.to)}</span>
              {!locked && (
                <button type="button" aria-label={`Remove link ${label(l.from)} ${l.label} ${label(l.to)}`} onClick={() => onChange({ links: links.filter((x) => x !== l) })} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )
        })}
        {missing.length > 0 && <p className="px-1 text-xs text-rose-700 dark:text-rose-300">{missing.length} link{missing.length > 1 ? 's are' : ' is'} still missing.</p>}
      </div>
    </div>
  )
}

// ── graph_plot ───────────────────────────────────────────────────────────────

export function GraphView({ data, response, onChange, results, locked }: ViewProps<GraphPlotData, GraphResponse>) {
  const g = data.grid
  const [activeLine, setActiveLine] = useState(data.lines?.[0]?.id ?? '')
  const [ref, width] = useWidth<HTMLDivElement>()
  const [entry, setEntry] = useState({ x: '', y: '' })
  const nx = Math.round((g.xmax - g.xmin) / g.step)
  const ny = Math.round((g.ymax - g.ymin) / g.step)
  const PAD = 26
  const size = Math.min(width, 520)
  const cell = (size - PAD * 2) / Math.max(nx, ny)
  const W = PAD * 2 + cell * nx
  const H = PAD * 2 + cell * ny
  const sx = (x: number) => PAD + ((x - g.xmin) / g.step) * cell
  const sy = (y: number) => H - PAD - ((y - g.ymin) / g.step) * cell
  const pts = response.points ?? []
  const lines = response.lines ?? {}
  const same = (a: number[], b: number[]) => a[0] === b[0] && a[1] === b[1]

  const tap = (x: number, y: number) => {
    if (locked) return
    if (data.mode === 'points') {
      const has = pts.some((p) => same(p, [x, y]))
      onChange({ points: has ? pts.filter((p) => !same(p, [x, y])) : [...pts, [x, y]] })
    } else if (activeLine) {
      const cur = lines[activeLine] ?? []
      const next = cur.some((p) => same(p, [x, y])) ? cur.filter((p) => !same(p, [x, y])) : [...cur, [x, y] as [number, number]].slice(-2)
      onChange({ lines: { ...lines, [activeLine]: next } })
    }
  }
  const addTyped = () => {
    const x = parseNumber(entry.x)
    const y = parseNumber(entry.y)
    if (x === null || y === null || x < g.xmin || x > g.xmax || y < g.ymin || y > g.ymax) return
    tap(x, y)
    setEntry({ x: '', y: '' })
  }
  const pointMark = (p: [number, number]): Mark => {
    if (!results) return null
    const r = results.find((i) => i.id === `${p[0]},${p[1]}` || i.id === `extra:${p[0]},${p[1]}`)
    return r ? (r.correct ? 'correct' : 'wrong') : null
  }
  const xs = Array.from({ length: nx + 1 }, (_, i) => g.xmin + i * g.step)
  const ys = Array.from({ length: ny + 1 }, (_, i) => g.ymin + i * g.step)
  const labelEvery = Math.ceil(Math.max(nx, ny) / 10)

  return (
    <div className="space-y-3">
      <Context text={data.context} />
      {data.mode === 'line' && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Line to draw">
          {(data.lines ?? []).map((l) => {
            const m = markFor(results, l.id)
            return (
              <button key={l.id} type="button" aria-pressed={activeLine === l.id} onClick={() => setActiveLine(l.id)} className={`min-h-[44px] rounded-full border-2 px-3 text-sm ${activeLine === l.id ? 'border-gold bg-gold/10' : MARK_BORDER(m)}`}>
                <LessonProse text={l.label} /> <span className="text-xs text-muted-foreground">({(lines[l.id] ?? []).length}/2)</span>
              </button>
            )
          })}
        </div>
      )}
      <div ref={ref} className="w-full">
        <svg width={W} height={H} className="mx-auto block touch-manipulation select-none rounded-xl border bg-card" role="img" aria-label="Coordinate grid">
          {xs.map((x) => <line key={`vx${x}`} x1={sx(x)} x2={sx(x)} y1={PAD} y2={H - PAD} className={x === 0 ? 'stroke-foreground' : 'stroke-border'} strokeWidth={x === 0 ? 1.5 : 1} />)}
          {ys.map((y) => <line key={`hy${y}`} y1={sy(y)} y2={sy(y)} x1={PAD} x2={W - PAD} className={y === 0 ? 'stroke-foreground' : 'stroke-border'} strokeWidth={y === 0 ? 1.5 : 1} />)}
          {xs.filter((_, i) => i % labelEvery === 0).map((x) => <text key={`lx${x}`} x={sx(x)} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">{x}</text>)}
          {ys.filter((_, i) => i % labelEvery === 0).map((y) => <text key={`ly${y}`} x={10} y={sy(y) + 3} textAnchor="middle" className="fill-muted-foreground text-[10px]">{y}</text>)}
          {data.mode === 'line' && (data.lines ?? []).map((l) => {
            const p = lines[l.id]
            if (!p || p.length !== 2 || same(p[0], p[1])) return null
            const [a, b] = p
            const ext = (t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
            const [p1, p2] = [ext(-50), ext(50)]
            return <line key={l.id} x1={sx(p1[0])} y1={sy(p1[1])} x2={sx(p2[0])} y2={sy(p2[1])} className={l.id === activeLine ? 'stroke-gold' : 'stroke-muted-foreground'} strokeWidth="2.5" clipPath="url(#grid-clip)" />
          })}
          <clipPath id="grid-clip"><rect x={PAD} y={PAD} width={W - PAD * 2} height={H - PAD * 2} /></clipPath>
          {xs.flatMap((x) => ys.map((y) => (
            <rect key={`t${x},${y}`} x={sx(x) - cell / 2} y={sy(y) - cell / 2} width={cell} height={cell} fill="transparent" onClick={() => tap(x, y)} className={locked ? '' : 'cursor-pointer'} />
          )))}
          {data.mode === 'points' && pts.map((p) => {
            const m = pointMark(p)
            return <circle key={`p${p}`} cx={sx(p[0])} cy={sy(p[1])} r={Math.max(5, cell / 4)} className={m === 'correct' ? 'fill-emerald-500' : m === 'wrong' ? 'fill-rose-500' : 'fill-gold'} pointerEvents="none" />
          })}
          {data.mode === 'line' && Object.entries(lines).flatMap(([id, p]) => p.map((q) => (
            <circle key={`${id}${q}`} cx={sx(q[0])} cy={sy(q[1])} r={Math.max(5, cell / 4)} className={id === activeLine ? 'fill-gold' : 'fill-muted-foreground'} pointerEvents="none" />
          )))}
        </svg>
      </div>
      {!locked && (
        <div className="flex flex-wrap items-end gap-2" aria-label="Add a point by typing">
          <label className="text-xs">x<input value={entry.x} onChange={(e) => setEntry({ ...entry, x: e.target.value })} inputMode="decimal" className="ml-1 h-11 w-16 rounded-lg border-2 bg-background px-2 text-base" /></label>
          <label className="text-xs">y<input value={entry.y} onChange={(e) => setEntry({ ...entry, y: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addTyped()} inputMode="decimal" className="ml-1 h-11 w-16 rounded-lg border-2 bg-background px-2 text-base" /></label>
          <button type="button" onClick={addTyped} className="min-h-[44px] rounded-lg border px-3 text-sm hover:bg-muted">Add / remove point</button>
        </div>
      )}
      {data.mode === 'points' && <p className="text-xs text-muted-foreground">Points plotted: {pts.length ? pts.map((p) => `(${p[0]}, ${p[1]})`).join(', ') : 'none yet'}</p>}
    </div>
  )
}

// ── slider_explorer ──────────────────────────────────────────────────────────

export function SliderView({
  data,
  response,
  onChange,
  results,
  locked,
  drafts,
  setDrafts,
}: ViewProps<SliderExplorerData, SliderResponse> & { drafts: string[]; setDrafts: (d: string[]) => void }) {
  const [at, setAt] = useState<Record<string, number>>(() => Object.fromEntries(data.params.map((p) => [p.name, p.initial])))
  const idx = sliderIndex(data.params, at)
  const out = idx >= 0 ? data.table[idx] : null
  return (
    <div className="space-y-4">
      <Context text={data.context} />
      <div className="space-y-3 rounded-2xl border bg-card p-4">
        {data.params.map((p) => (
          <label key={p.name} className="block space-y-1">
            <span className="flex justify-between text-sm font-medium">
              <span>{p.label}</span>
              <span className="tabular-nums">{at[p.name]}{p.unit ? ` ${p.unit}` : ''}</span>
            </span>
            <input
              type="range"
              min={p.min}
              max={p.max}
              step={p.step}
              value={at[p.name]}
              onChange={(e) => setAt({ ...at, [p.name]: Number(e.target.value) })}
              className="h-11 w-full accent-[hsl(var(--gold,45_90%_50%))]"
            />
          </label>
        ))}
        <div className="rounded-xl bg-muted/50 px-3 py-2 text-center" aria-live="polite">
          <span className="text-sm text-muted-foreground">{data.output.label}: </span>
          <span className="text-2xl font-bold tabular-nums">{out === null ? '—' : Number(out.toPrecision(6))}</span>
          {data.output.unit && <span className="ml-1 text-sm text-muted-foreground">{data.output.unit}</span>}
        </div>
      </div>
      {data.questions.map((q, i) => {
        const r = results?.[i]
        return (
          <div key={q.id} className="space-y-1.5">
            <label htmlFor={`slider-q-${i}`} className="block text-sm font-medium"><LessonProse text={q.prompt} /></label>
            <div className="flex items-center gap-2">
              <input
                id={`slider-q-${i}`}
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
                className={`h-11 w-full max-w-[220px] rounded-xl border-2 bg-background px-3 text-base tabular-nums ${r ? (r.correct ? 'border-emerald-400' : 'border-rose-400') : 'border-border'}`}
              />
              {data.output.unit && <span className="text-sm text-muted-foreground">{data.output.unit}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── scenario_decision ────────────────────────────────────────────────────────

export function ScenarioView({ data, response, onChange, results, locked }: ViewProps<ScenarioDecisionData, ScenarioResponse>) {
  return (
    <div className="space-y-4">
      <Context text={data.setting} />
      {data.decisions.map((dec, n) => {
        const chosen = response.choices[dec.id]
        const r = results?.find((x) => x.id === dec.id)
        return (
          <fieldset key={dec.id} className="space-y-1.5">
            <legend className="mb-1 text-sm font-semibold">{data.decisions.length > 1 ? `${n + 1}. ` : ''}<LessonProse text={dec.prompt} /></legend>
            {dec.options.map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                selected={chosen === o.id}
                mark={r && chosen === o.id ? (r.correct ? 'correct' : 'wrong') : null}
                disabled={locked}
                onClick={() => onChange({ choices: { ...response.choices, [dec.id]: o.id } })}
              />
            ))}
            {r?.feedback && (
              <p className={`rounded-lg px-3 py-2 text-sm ${r.correct ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200' : 'bg-rose-50 text-rose-900 dark:bg-rose-900/20 dark:text-rose-200'}`}>
                <span className="font-medium">What happens: </span><LessonProse text={r.feedback} />
              </p>
            )}
          </fieldset>
        )
      })}
    </div>
  )
}

// ── label_diagram ────────────────────────────────────────────────────────────

export function LabelDiagramView({ data, response, onChange, results, locked, seed }: ViewProps<LabelDiagramData, PlacementResponse>) {
  const [selected, setSelected] = useState<string | null>(null)
  const [broken, setBroken] = useState(false)
  const bank = useMemo(() => stableShuffle(data.labels, seed), [data.labels, seed])
  const placed = response.placements
  const labelOf = (id?: string) => data.labels.find((l) => l.id === id)?.label
  const used = new Set(Object.values(placed))

  const tapSpot = (id: string) => {
    if (locked) return
    if (selected) {
      const next = { ...placed }
      for (const k of Object.keys(next)) if (next[k] === selected) delete next[k]
      next[id] = selected
      onChange({ placements: next })
      setSelected(null)
    } else if (placed[id]) {
      const next = { ...placed }
      delete next[id]
      onChange({ placements: next })
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-2xl border bg-white">
        {data.image_url && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.image_url} alt="Diagram to label" className="block h-auto w-full" onError={() => setBroken(true)} />
        ) : (
          <div className="flex aspect-square items-center justify-center p-6 text-center text-sm text-muted-foreground">The diagram could not load. Refresh the page to try again.</div>
        )}
        {data.hotspots.map((h, i) => {
          const [ymin, xmin, ymax, xmax] = h.box
          const [my, mx] = h.marker ?? [(ymin + ymax) / 2, (xmin + xmax) / 2]
          const lab = labelOf(placed[h.id])
          const m = markFor(results, h.id)
          return (
            <button
              key={h.id}
              type="button"
              disabled={locked}
              onClick={() => tapSpot(h.id)}
              aria-label={`Part ${i + 1}${lab ? `: labelled ${lab}` : ', not labelled yet'}`}
              style={{ top: `${my / 10}%`, left: `${mx / 10}%` }}
              className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold shadow ${
                m === 'correct' ? 'border-emerald-500 bg-emerald-500 text-white' : m === 'wrong' ? 'border-rose-500 bg-rose-500 text-white' : lab ? 'border-gold bg-gold text-black' : selected ? 'border-gold border-dashed bg-white text-slate-900' : 'border-slate-700 bg-white text-slate-900'
              }`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
      <ol className="space-y-1.5" aria-label="Parts">
        {data.hotspots.map((h, i) => {
          const lab = labelOf(placed[h.id])
          return (
            <li key={h.id}>
              <Chip
                label={lab ?? 'Not labelled yet'}
                mark={markFor(results, h.id)}
                selected={false}
                disabled={locked}
                onClick={() => tapSpot(h.id)}
                ariaLabel={`Part ${i + 1}: ${lab ?? 'not labelled yet'}. ${selected ? 'Tap to place the chosen label here.' : lab ? 'Tap to take the label off.' : 'Choose a label first.'}`}
                prefix={<span className="h-6 w-6 shrink-0 rounded-full border text-center text-xs font-bold leading-6">{i + 1}</span>}
              />
              <ItemFeedback results={results} id={h.id} />
            </li>
          )
        })}
      </ol>
      <div className="rounded-2xl border bg-muted/30 p-2" aria-label="Labels">
        <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">Labels — tap one, then tap a number on the diagram or a part in the list</p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {bank.map((l) => (
            <Chip key={l.id} label={l.label} selected={selected === l.id} disabled={locked} onClick={() => setSelected(selected === l.id ? null : l.id)} prefix={used.has(l.id) ? <span className="text-xs text-gold">✓</span> : undefined} />
          ))}
        </div>
      </div>
    </div>
  )
}
