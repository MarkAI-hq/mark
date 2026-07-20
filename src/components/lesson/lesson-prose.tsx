'use client'

import ReactMarkdown, { type Components } from 'react-markdown'

// AI-generated lesson content (questions, explanations, options, bullets)
// often comes back with markdown emphasis (**bold**, bullet dashes, stray
// headings) even though scene components render these fields as plain
// strings — so the literal asterisks/hashes showed up in the UI instead of
// being formatted. This renders that markdown inline, collapsing block
// elements (paragraphs/headings) to inline-safe equivalents so it can drop
// into existing <p>/<span>/<button> layouts without invalid nesting.
const INLINE_COMPONENTS: Components = {
  p: ({ children }) => <>{children}</>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
  ),
  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-1">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  a: ({ children }) => <>{children}</>,
  h1: ({ children }) => <strong className="font-semibold">{children}</strong>,
  h2: ({ children }) => <strong className="font-semibold">{children}</strong>,
  h3: ({ children }) => <strong className="font-semibold">{children}</strong>,
}

export function LessonProse({ text }: { text?: string | null }) {
  if (!text) return null
  return <ReactMarkdown components={INLINE_COMPONENTS}>{text}</ReactMarkdown>
}
