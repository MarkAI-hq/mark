// Small connector words stay lowercase (unless first/last word) — standard
// title-case convention, applied for display only. Source data (e.g.
// scheme_of_work topic names) stays untouched; this never feeds back into
// any matching/lookup logic.
const LOWERCASE_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of',
  'on', 'or', 'the', 'to', 'with',
])

export function titleCase(input: string): string {
  const words = input.trim().toLowerCase().split(/\s+/)
  return words
    .map((word, i) => {
      if (i > 0 && i < words.length - 1 && LOWERCASE_WORDS.has(word)) return word
      // Preserve parenthetical / slash-joined segments, e.g. "indices" in "(indices)".
      return word.replace(/[a-z]+/g, (chunk) => chunk[0].toUpperCase() + chunk.slice(1))
    })
    .join(' ')
}
