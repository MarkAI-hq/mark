// src/components/tracy/typing-dots.tsx
'use client'

// Shared three-dot "thinking" indicator -- was a standalone component in
// tracy-page.tsx and the same bounce animation inlined directly in
// student-tracy.tsx's MessageBubble. Same visual, same timing; the student
// side previously only differed by dot color, which is now a prop instead
// of a second hand-copied implementation.

export function TypingDots({ dotClassName = 'bg-muted-foreground/50' }: { dotClassName?: string }) {
  return (
    <span className="inline-flex items-center gap-1 h-5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full animate-bounce ${dotClassName}`}
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
        />
      ))}
    </span>
  )
}
