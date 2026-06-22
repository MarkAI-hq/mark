'use client'

import { Target } from 'lucide-react'

interface Props {
  scene: any
}

export function SceneOutcomesIntro({ scene }: Props) {
  const { outcomes = [], framing = '', topic = '' } = scene.content ?? {}

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5">
        <Target className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
          Learning outcomes
        </span>
      </div>

      <h2 className="font-bold text-2xl leading-tight">
        What you will learn: {topic}
      </h2>

      {framing && (
        <p className="text-base text-foreground/80 leading-relaxed">{framing}</p>
      )}

      <div className="rounded-2xl border bg-card px-5 py-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          By the end of this lesson you will be able to:
        </p>
        <ol className="space-y-2.5">
          {outcomes.map((outcome: string, i: number) => (
            <li key={i} className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-base leading-snug">{outcome}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
