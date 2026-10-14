// src/components/tracy/tracy-protocol.ts
//
// Shared parsing primitives for Tracy's chat marker protocol. Both the
// teacher chat (tracy-page.tsx) and the student chat (student-tracy.tsx)
// POST to /api/tracy and get back the same SSE event shapes and the same
// trailing __ARTIFACT__/__CONFIRM__/__NEXT__/__WIDGET__ markers in the final
// reply text — this used to be two independently-typed, independently-
// maintained copies of the exact same regexes and JSON-brace-matcher. Kept
// here once so a protocol change (like today's `usageRemaining` field) only
// needs updating in one place's types, even though each page still renders
// what it gets back completely differently.

// Markers are meant to be appended on their own line, but the model doesn't
// always emit the leading newline — it sometimes puts the marker right after
// trailing prose separated only by a space. Matching on `\s` (not just `\n`)
// as the leading boundary catches both cases so raw "__NEXT__:{...}" JSON
// never leaks into the rendered chat bubble.
export const ARTIFACT_RE = /(?:^|\s)(?:__)?ARTIFACT(?:__)?\s*:\s*(\{[\s\S]*)/
export const CONFIRM_RE  = /(?:^|\s)(?:__)?CONFIRM(?:__)?\s*:\s*(\{[\s\S]*)/
export const NEXT_RE     = /(?:^|\s)(?:__)?NEXT(?:__)?\s*:\s*(\{[\s\S]*)/
// Teacher-only marker — student chat has no widget rendering surface.
export const WIDGET_RE         = /(?:^|\s)(?:__)?WIDGET(?:__)?\s*:\s*([\s\S]+)/
export const NEXT_RE_IN_WIDGET = /\s(?:__)?NEXT(?:__)?\s*:\s*(\{[\s\S]*)/

export interface ConfirmationOption {
  label: string
  value: string
}

export interface ConfirmationPayload {
  message: string
  options: ConfirmationOption[]
}

export interface ToolStatus {
  name:   string
  label:  string
  status: 'running' | 'done' | 'failed'
}

// Tracy's SSE event stream, as emitted by /api/tracy. `usageRemaining` on a
// `done` event is omitted entirely for non-free-tier users -- absence means
// "no limit", not "unknown".
export type TracySseEvent =
  | { type: 'tool_call';   name: string; label: string }
  | { type: 'tool_result'; name: string; success: boolean }
  | { type: 'text_delta';  delta: string }
  | { type: 'error';       message: string }
  | { type: 'done'; reply?: string; sessionId?: string; usageRemaining?: number; [key: string]: unknown }

// Finds the first balanced {...} object starting at the first "{" in str.
// Used to pull the JSON payload out of a matched marker's capture group,
// which may have trailing prose or another marker appended after it.
export function extractJson(str: string): string | null {
  const start = str.indexOf('{')
  if (start === -1) return null
  let depth = 0
  for (let i = start; i < str.length; i++) {
    if (str[i] === '{') depth++
    else if (str[i] === '}') {
      depth--
      if (depth === 0) return str.slice(start, i + 1)
    }
  }
  return null
}
