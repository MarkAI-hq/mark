'use client'

import { useState } from 'react'
import { Layers, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { validateStudentInput, copyProtectionProps } from '@/lib/utils/validation'
import { LessonProse } from '@/components/lesson/lesson-prose'

interface Props { 
  scene: any 
  onReady?: () => void 
}

export function ScenePbl({ scene, onReady }: Props) {
  const { title, content, bloom_level } = scene
  const { stage_name, challenge, guiding_questions } = content ?? {}
  const [openQ, setOpenQ] = useState<number | null>(null)
  const [response, setResponse] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  function handleSubmit() {
    // 15-word minimum check for the PBL project response
    const validation = validateStudentInput(response, challenge ?? '', 15)

    if (!validation.isValid) {
      setValidationError(validation.feedback ?? 'Invalid input')
      toast.error(validation.feedback ?? 'Invalid input')
      return
    }

    setValidationError(null)
    setSubmitted(true)
    toast.success('Your approach has been saved!')
    onReady?.() // Signals the parent player to unlock the Next button
  }

  return (
    <div className="space-y-4">
      {/* Protect the header against text copying */}
      <div className="flex items-start gap-2">
        <Layers className="h-4 w-4 text-gold shrink-0 mt-0.5" />
        <div {...copyProtectionProps}>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stage_name}</p>
          <h2 className="font-semibold text-base leading-tight">{title}</h2>
        </div>
        {bloom_level && (
          <Badge variant="outline" className="text-[10px] ml-auto shrink-0 capitalize border-gold/30 text-gold">
            {bloom_level}
          </Badge>
        )}
      </div>

      {/* Protect the challenge card against text copying */}
      <div {...copyProtectionProps} className="rounded-xl border-l-4 border-gold bg-gold/5 px-4 py-3">
        <p className="font-medium text-base"><LessonProse text={challenge} /></p>
      </div>

      {(guiding_questions ?? []).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Guiding Questions</p>
          {(guiding_questions as string[]).map((q, i) => (
            <div key={i} className="rounded-xl border overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted/30 transition-colors"
                onClick={() => setOpenQ(openQ === i ? null : i)}
              >
                <span {...copyProtectionProps}><LessonProse text={q} /></span>
                {openQ === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>
              {openQ === i && (
                <div className="border-t px-4 pb-3 pt-2">
                  <textarea
                    placeholder="Write your thinking here…"
                    rows={3}
                    disabled={submitted}
                    className="w-full bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Approach</p>
        <textarea
          value={response}
          onChange={(e) => {
            setResponse(e.target.value)
            setValidationError(null)
          }}
          disabled={submitted}
          placeholder="What is your approach to this challenge?"
          rows={4}
          className="w-full rounded-xl border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gold/30 disabled:opacity-80"
        />
        {validationError && (
          <p className="text-xs text-rose-500 font-medium">⚠️ {validationError}</p>
        )}
      </div>

      {!submitted && (
        <Button onClick={handleSubmit} size="sm" className="bg-gold hover:bg-gold/90 text-gold-foreground">
          Save Approach
        </Button>
      )}

      {submitted && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>Your approach has been successfully verified. You may now continue.</span>
        </div>
      )}
    </div>
  )
}