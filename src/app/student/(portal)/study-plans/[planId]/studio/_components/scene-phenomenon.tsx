'use client'

import { useState } from 'react'
import { BookOpen, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { LessonProse } from '@/components/lesson/lesson-prose'

interface Props { scene: any; onReady?: () => void }

export function ScenePhenomenon({ scene, onReady }: Props) {
  const { title, content } = scene
  const { story, character_viewpoints, correct_character, discussion_prompt, resolution } = content ?? {}
  const [chosen, setChosen]       = useState<number | null>(null)
  const [reasoning, setReasoning] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const canSubmit = chosen !== null && reasoning.trim().length > 10

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2">
        <BookOpen className="h-4 w-4 text-gold shrink-0 mt-1" />
        <h2 className="font-bold text-2xl leading-tight">{title}</h2>
      </div>

      <div className="rounded-2xl border bg-card px-5 py-4 text-base leading-relaxed text-foreground/80">
        <LessonProse text={story} />
      </div>

      {!submitted ? (
        <div className="space-y-4">
          <p className="font-medium text-base"><LessonProse text={discussion_prompt} /></p>

          <div className="space-y-2.5">
            {(character_viewpoints ?? []).map((vp: { character: string; claim: string }, i: number) => (
              <button
                key={i}
                onClick={() => setChosen(i)}
                className={`w-full rounded-xl border px-4 py-3.5 text-left transition-colors ${
                  chosen === i
                    ? 'border-gold bg-gold/10 text-foreground'
                    : 'border bg-card hover:bg-muted/50 text-foreground'
                }`}
              >
                <p className="font-medium text-sm text-muted-foreground mb-0.5">{vp.character}</p>
                <p className="text-base leading-snug"><LessonProse text={vp.claim} /></p>
              </button>
            ))}
          </div>

          {chosen !== null && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Why do you agree with {(character_viewpoints ?? [])[chosen]?.character}?</p>
              <Textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Explain your reasoning…"
                className="min-h-24 resize-none text-base"
              />
              <div className="flex justify-end">
                <Button size="sm" disabled={!canSubmit} onClick={() => { setSubmitted(true); onReady?.() }}>
                  Submit my view
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">All viewpoints</p>
            {(character_viewpoints ?? []).map((vp: { character: string; claim: string }, i: number) => (
              <div
                key={i}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  i === correct_character
                    ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200'
                    : 'border bg-muted/30 text-foreground/70'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium mb-0.5">
                  {i === correct_character && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                  {vp.character}
                </div>
                <p><LessonProse text={vp.claim} /></p>
              </div>
            ))}
          </div>

          {resolution && (
            <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-5 py-4 space-y-1">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">The scientific explanation</p>
              <p className="text-blue-900 dark:text-blue-200 leading-relaxed"><LessonProse text={resolution} /></p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
