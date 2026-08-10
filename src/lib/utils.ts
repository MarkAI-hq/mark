import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Curriculum topic names are sometimes authored ALL CAPS in the source
// syllabus documents (verbatim official section headers) — fine as data,
// but reads as shouting and scans badly in UI (schedule lists, topic chips,
// "due for review" cards). Purely a display transform, never touches the
// underlying data, and leaves already-mixed-case strings untouched so
// genuinely human-authored titles aren't mangled.
const TITLE_CASE_MINOR_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of',
  'on', 'or', 'per', 'the', 'to', 'vs', 'via', 'with',
])

function titleCaseWord(word: string, isFirst: boolean): string {
  if (!word) return word
  const lower = word.toLowerCase()
  if (!isFirst && TITLE_CASE_MINOR_WORDS.has(lower)) return lower
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

function titleCaseSegment(segment: string): string {
  let atStart = true
  return segment
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token) || !token) return token
      const out = titleCaseWord(token, atStart)
      atStart = false
      return out
    })
    .join('')
}

/** Multi-topic weeks are joined with " / " and sub-clauses with ": " —
 *  title-case each piece independently so each still reads as its own
 *  clause instead of one long shouted run-on string. */
export function formatTopicTitle(raw: string | null | undefined): string {
  if (!raw) return raw ?? ''
  const letters = raw.replace(/[^A-Za-z]/g, '')
  const isShouting = letters.length > 3 && letters === letters.toUpperCase()
  if (!isShouting) return raw
  return raw
    .split(' / ')
    .map((part) => part.split(': ').map(titleCaseSegment).join(': '))
    .join(' / ')
}

// Some backend-generated prose interpolates a raw (ALL-CAPS) topic string
// into an otherwise normal sentence, e.g. "Week 8 · LOCATION AND SIZE OF
// AFRICA is coming up — prepare early". formatTopicTitle can't fix that —
// the sentence as a whole isn't shouting, only the embedded span is — so
// this finds uppercase-initial runs and title-cases just those via the same
// logic, leaving the surrounding prose untouched. Apply to any freeform
// backend string (a "reason", a nudge message) that may embed a topic name,
// instead of hunting down and fixing each generation site individually.
const EMBEDDED_CAPS_RUN = /[A-Z][A-Z0-9/:,'&-]*(?:\s[A-Z0-9/:,'&-]+)*/g

export function formatEmbeddedCaps(text: string | null | undefined): string {
  if (!text) return text ?? ''
  return text.replace(EMBEDDED_CAPS_RUN, (match) => formatTopicTitle(match))
}

/** Some scheme-of-work entries bundle several distinct syllabus topics into
 *  one week's `topic` field, joined by " / " (valid curriculum structuring —
 *  see formatTopicTitle above) — but dumping the full run-on string as a
 *  card/hero headline overwhelms the student. Use the first clause as the
 *  headline everywhere a topic is a title, not a label, and surface
 *  `extraCount` as a "+N more" affordance instead of silently hiding that
 *  the week covers more ground. */
export function splitTopicHeadline(raw: string | null | undefined): { headline: string; extraCount: number } {
  const formatted = formatTopicTitle(raw)
  const clauses = formatted.split(' / ')
  return { headline: clauses[0] ?? '', extraCount: clauses.length - 1 }
}
