'use client'

// Shared chat message layer for every Tracy surface (student portal, dashboard,
// guardian). One look, one tool-trace behaviour, so tool calling reads the same
// everywhere: live step while it runs, then a collapsed "Used N tools" row that
// stays on the message and expands into a timeline.

import { useState, type ReactNode } from 'react'
import { ChevronRight, Check, X, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import 'katex/contrib/mhchem'
import type { ToolStatus } from '@/components/tracy/tracy-protocol'
import { useAssistantName } from '@/hooks/use-assistant-name'

const stripEllipsis = (s: string) => s.replace(/(…|\.\.\.)$/, '')

/** Models sometimes write \( … \) / \[ … \]; remark-math wants $ … $ / $$ … $$. */
export function normalizeMath(text: string): string {
  return text
    .replace(/\\\[([\s\S]+?)\\\]/g, (_m, inner) => `\n$$${inner}$$\n`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_m, inner) => `$${inner}$`)
}

/** Markdown with GFM tables, LaTeX maths and chemistry ($\ce{H2O}$) — used by every Tracy chat. */
export function MathMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
      rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: 'ignore' }]]}
    >
      {normalizeMath(children)}
    </ReactMarkdown>
  )
}

/** Hide wire-protocol markers (and any partial one) from text that is still streaming. */
export function stripStreamingMarkers(text: string): string {
  const cut = text.search(/__?(NEXT|ARTIFACT|CONFIRM|WIDGET|UI|RESULT)__?:|\bNEXT:|(?:^|\s)WIDGET\s*:/)
  return (cut === -1 ? text : text.slice(0, cut)).trimEnd()
}

/** Inline-only maths ($x^2$) for short labels: no paragraph wrapper, so it sits inside a line of text. */
export function MathInline({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[[remarkMath, { singleDollarTextMath: true }]]}
      rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: 'ignore' }]]}
      components={{ p: ({ children: inner }) => <>{inner}</> }}
    >
      {normalizeMath(children)}
    </ReactMarkdown>
  )
}

// ── Tool trace ────────────────────────────────────────────────────────────────

export function ToolTrace({ tools, live }: { tools: ToolStatus[]; live: boolean }) {
  const [open, setOpen] = useState(false)
  if (tools.length === 0) return null

  const running = tools.find((t) => t.status === 'running')
  const failed = tools.filter((t) => t.status === 'failed').length
  const headline = live
    ? stripEllipsis(running?.label ?? tools[tools.length - 1].label ?? 'Working') + '…'
    : `Used ${tools.length} tool${tools.length === 1 ? '' : 's'}${failed ? ` · ${failed} failed` : ''}`

  return (
    <div className="mb-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex items-center gap-2 text-left text-[12.5px] text-muted-foreground hover:text-foreground transition-colors"
      >
        {live ? (
          <span className="h-3 w-3 shrink-0 rounded-full border-[1.5px] border-[#b88a1f]/30 border-t-[#b88a1f] animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5 shrink-0 text-[#4f7d3f]" strokeWidth={2.2} />
        )}
        <span className={live ? 'animate-pulse' : ''}>{headline}</span>
        <ChevronRight className={`h-3 w-3 shrink-0 opacity-60 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <ol className="mt-2 ml-[5px] border-l border-border pl-4 space-y-2">
          {tools.map((t, i) => (
            <li key={`${t.name}-${i}`} className="relative flex items-center gap-2 text-[12px] text-muted-foreground">
              <span className="absolute -left-[21px] flex h-[11px] w-[11px] items-center justify-center rounded-full bg-background">
                {t.status === 'running' ? (
                  <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-[#b88a1f]/30 border-t-[#b88a1f] animate-spin" />
                ) : t.status === 'done' ? (
                  <Check className="h-2.5 w-2.5 text-[#4f7d3f]" strokeWidth={3} />
                ) : (
                  <X className="h-2.5 w-2.5 text-red-500" strokeWidth={3} />
                )}
              </span>
              <span className={t.status === 'running' ? 'text-foreground' : ''}>{stripEllipsis(t.label)}</span>
              {t.status === 'failed' && <span className="text-red-500/80">didn&apos;t complete</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// ── Messages ──────────────────────────────────────────────────────────────────

export function UserMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-lg bg-muted px-4 py-2.5 text-[14.5px] leading-[1.55] text-foreground">
        {children}
      </div>
    </div>
  )
}

export function AssistantMessage({
  content,
  streaming = false,
  tools = [],
  children,
}: {
  content: string
  /** True while the reply is still being generated. */
  streaming?: boolean
  tools?: ToolStatus[]
  /** Extra UI under the text (suggestion chips, artifact cards…). */
  children?: ReactNode
}) {
  const assistant = useAssistantName()
  const text = streaming ? stripStreamingMarkers(content) : content
  const waiting = streaming && !text

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#b88a1f]/12 text-[#b88a1f]">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.9} />
      </div>
      <div className="min-w-0 flex-1 text-[14.5px] leading-[1.7] text-foreground">
        <ToolTrace tools={tools} live={streaming} />
        {waiting && tools.length === 0 && (
          <span className="inline-flex gap-1 py-2" aria-label={`${assistant} is thinking`}>
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </span>
        )}
        {text && (
          <div className="prose prose-sm max-w-none dark:prose-invert [&_*]:text-foreground [&_a]:text-[#b88a1f] [&_p]:my-0 [&_p+p]:mt-3 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_pre]:bg-muted [&_code]:text-[13px]">
            <MathMarkdown>{text}</MathMarkdown>
            {streaming && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-foreground/70 animate-pulse" />}
          </div>
        )}
        {!streaming && children}
      </div>
    </div>
  )
}
