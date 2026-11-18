// Generative UI for Tracy: instead of raw HTML, Tracy picks a component from a
// small typed catalog and supplies its props as JSON. The frontend validates the
// JSON here (zod) and renders a real, themed React component — consistent,
// accessible, and able to send the student's input back into the chat. Anything
// that fails validation falls back to plain text, so a bad payload never breaks
// the conversation.
//
// Wire format — on its own line, after the lead-in text:
//   __UI__:{"component":"topic_picker","props":{…}}

import { z } from 'zod'

export const topicOption = z.object({
  label: z.string().min(1).max(120),
  /** Sent as the student's next message. Defaults to "Quiz me on <label>". */
  value: z.string().max(300).optional(),
  /** Section heading, e.g. "Term 1". Options sharing a group are shown together. */
  group: z.string().max(60).optional(),
  hint: z.string().max(140).optional(),
  recommended: z.boolean().optional(),
})

export const topicPickerSchema = z.object({
  component: z.literal('topic_picker'),
  props: z.object({
    title: z.string().max(120).optional(),
    subject: z.string().max(60).optional(),
    level: z.string().max(30).optional(),
    options: z.array(topicOption).min(1).max(12),
    allowCustom: z.boolean().default(true),
    customPlaceholder: z.string().max(80).optional(),
    /** Prepended to text the student types themselves. Use "" for a subject picker. */
    customPrefix: z.string().max(60).default('Quiz me on '),
  }),
})

export const quizQuestionSchema = z.object({
  component: z.literal('quiz_question'),
  props: z.object({
    topic: z.string().min(1).max(120),
    subject: z.string().max(60).optional(),
    level: z.string().max(30).optional(),
    /** Markdown with LaTeX ($x^2$, $\ce{H2O}$) is supported. */
    question: z.string().min(1).max(1500),
    marks: z.number().int().min(1).max(20).optional(),
    kind: z.enum(['mcq', 'short']).default('short'),
    options: z
      .array(z.object({ id: z.string().min(1).max(4), text: z.string().min(1).max(300) }))
      .min(2)
      .max(6)
      .optional(),
    hint: z.string().max(400).optional(),
    /** The syllabus learning outcome this question tests — id and wording as the curriculum gives them. */
    outcome_id: z.string().max(40).optional(),
    outcome: z.string().max(240).optional(),
    /** Lets Tracy grade the next turn reliably. Never rendered. */
    answer_key: z.string().max(400).optional(),
  }),
})

// ── Phase 2 ───────────────────────────────────────────────────────────────────

/** Bars for strengths and gaps. Every value must come from a tool result — never invented. */
export const progressCardSchema = z.object({
  component: z.literal('progress_card'),
  props: z.object({
    title: z.string().max(120).optional(),
    subject: z.string().max(60).optional(),
    level: z.string().max(30).optional(),
    /** One-line takeaway shown above the bars. */
    summary: z.string().max(240).optional(),
    items: z
      .array(
        z.object({
          label: z.string().min(1).max(80),
          /** 0–100. */
          value: z.number().min(0).max(100),
          note: z.string().max(140).optional(),
          status: z.enum(['strong', 'ok', 'needs_work']).optional(),
        }),
      )
      .min(1)
      .max(10),
  }),
})

/** A day-by-day plan the student can start from. */
export const studyPlanSchema = z.object({
  component: z.literal('study_plan'),
  props: z.object({
    title: z.string().max(120).optional(),
    subject: z.string().max(60).optional(),
    level: z.string().max(30).optional(),
    goal: z.string().max(200).optional(),
    days: z
      .array(
        z.object({
          /** "Mon", "Day 1"… */
          label: z.string().min(1).max(20),
          topic: z.string().min(1).max(120),
          focus: z.string().max(200).optional(),
          minutes: z.number().int().min(5).max(240).optional(),
          tasks: z.array(z.string().min(1).max(160)).max(5).optional(),
        }),
      )
      .min(1)
      .max(7),
  }),
})

/** A short, structured explanation: summary, steps, a worked example, a common mistake. */
export const conceptExplainerSchema = z.object({
  component: z.literal('concept_explainer'),
  props: z.object({
    topic: z.string().min(1).max(120),
    subject: z.string().max(60).optional(),
    level: z.string().max(30).optional(),
    /** Markdown with LaTeX. */
    summary: z.string().min(1).max(900),
    key_points: z.array(z.string().min(1).max(200)).max(5).optional(),
    steps: z
      .array(z.object({ title: z.string().min(1).max(100), body: z.string().min(1).max(600) }))
      .max(8)
      .optional(),
    example: z
      .object({
        prompt: z.string().min(1).max(600),
        /** Hidden until the student asks to see it. */
        solution: z.string().max(900).optional(),
      })
      .optional(),
    common_mistake: z.string().max(300).optional(),
  }),
})

/**
 * Ask for a photo of the student's own worked solution (maths, calculations,
 * labelled diagrams). The app marks it with the grading engine against
 * answer_key/marking_points (never shown) and reports back to the chat.
 */
export const workUploadSchema = z.object({
  component: z.literal('work_upload'),
  props: z.object({
    question: z.string().min(1).max(1200),
    subject: z.string().max(60).optional(),
    level: z.string().max(30).optional(),
    topic: z.string().max(120).optional(),
    outcome_id: z.string().max(60).optional(),
    outcome: z.string().max(400).optional(),
    marks: z.number().int().min(1).max(20).optional(),
    answer_key: z.string().min(1).max(1500),
    marking_points: z.array(z.string().min(1).max(240)).max(8).optional(),
    /** What to write/draw before taking the photo. */
    instructions: z.string().max(300).optional(),
  }),
})

export const generativeUiSchema = z.discriminatedUnion('component', [
  topicPickerSchema,
  quizQuestionSchema,
  progressCardSchema,
  studyPlanSchema,
  conceptExplainerSchema,
  workUploadSchema,
])

export type TopicPickerUi = z.infer<typeof topicPickerSchema>
export type QuizQuestionUi = z.infer<typeof quizQuestionSchema>
export type ProgressCardUi = z.infer<typeof progressCardSchema>
export type StudyPlanUi = z.infer<typeof studyPlanSchema>
export type ConceptExplainerUi = z.infer<typeof conceptExplainerSchema>
export type WorkUploadUi = z.infer<typeof workUploadSchema>
export type GenerativeUi = z.infer<typeof generativeUiSchema>

const UI_MARKER = /(?:^|\n)[ \t]*__UI__[ \t]*:[ \t]*/

/** First balanced JSON object in `s`, ignoring braces inside strings (LaTeX is full of them). */
export function extractBalancedJson(s: string): string | null {
  const start = s.indexOf('{')
  if (start === -1) return null
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < s.length; i++) {
    const ch = s[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return s.slice(start, i + 1)
    }
  }
  return null
}

/**
 * Models write LaTeX inside JSON strings with a single backslash, and JSON
 * quietly mangles the common cases: "\frac" -> form-feed + "rac", "\times" ->
 * tab + "imes", "\neq" -> newline + "eq", "\beta" -> backspace + "eta", and
 * "\underline" is a hard parse error. Real answers never need a tab, form-feed,
 * backspace or carriage return, so inside strings those escapes (and any
 * invalid one) are treated as a literal backslash. `\n` stays a newline unless it
 * starts a known LaTeX command (\neq, \nabla, \not, \nu, \ne, …).
 */
export function repairJsonEscapes(json: string): string {
  const latexN = /^n(?:eq|abla|ot|u|e|less|gtr|mid|parallel|subset|supset|rightarrow|leftarrow|i|exists)(?![a-zA-Z])/
  let out = ''
  let inString = false
  for (let i = 0; i < json.length; i++) {
    const ch = json[i]
    if (!inString) {
      out += ch
      if (ch === '"') inString = true
      continue
    }
    if (ch === '"') { out += ch; inString = false; continue }
    if (ch !== '\\') { out += ch; continue }

    const next = json[i + 1]
    if (next === undefined) { out += '\\\\'; continue }
    if (next === '\\' || next === '"' || next === '/') { out += ch + next; i++; continue }
    if (next === 'n') {
      if (latexN.test(json.slice(i + 1, i + 14))) out += '\\\\'
      else { out += '\\n'; i++ }
      continue
    }
    if (next === 'u' && /^[0-9a-fA-F]{4}$/.test(json.slice(i + 2, i + 6))) { out += '\\u'; i++; continue }
    out += '\\\\' // \b \f \r \t \u(non-hex) and anything else: a literal backslash
  }
  return out
}

export interface ParsedReply {
  /** Lead-in text with the marker and payload removed. */
  text: string
  ui: GenerativeUi
}

/**
 * Pull a validated UI payload out of a finished reply. Returns null when there is
 * no marker or the payload is malformed/unknown — the caller then shows the reply
 * as ordinary text (minus the marker; see `stripUiMarker`).
 */
export function parseGenerativeUi(reply: string): ParsedReply | null {
  const m = UI_MARKER.exec(reply)
  if (!m) return null
  const json = extractBalancedJson(reply.slice(m.index + m[0].length))
  if (!json) return null
  let raw: unknown
  try {
    raw = JSON.parse(repairJsonEscapes(json))
  } catch {
    return null
  }
  const parsed = generativeUiSchema.safeParse(raw)
  if (!parsed.success) return null
  return { text: reply.slice(0, m.index).trim(), ui: parsed.data }
}

/** Remove a UI marker + payload (valid or not) so raw JSON never reaches the chat. */
export function stripUiMarker(reply: string): string {
  const m = UI_MARKER.exec(reply)
  if (!m) return reply
  const rest = reply.slice(m.index + m[0].length)
  const json = extractBalancedJson(rest)
  const after = json ? rest.slice(rest.indexOf(json) + json.length) : ''
  return (reply.slice(0, m.index) + after).trim()
}

/** What a student's pick/answer is sent as, so Tracy can act on it in the next turn. */
export function topicValue(opt: { label: string; value?: string }): string {
  return opt.value?.trim() || `Quiz me on ${opt.label}`
}

export function formatAnswer(
  q: Pick<QuizQuestionUi['props'], 'kind' | 'options'>,
  choiceId: string | null,
  typed: string,
): string {
  if (q.kind === 'mcq' && choiceId) {
    const opt = q.options?.find((o) => o.id === choiceId)
    return `My answer: ${choiceId}${opt ? `) ${opt.text}` : ''}`
  }
  return `My answer: ${typed.trim()}`
}
