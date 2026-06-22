'use client'

import { useState } from 'react'
import { Layers, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Props { scene: any }

export function ScenePbl({ scene }: Props) {
  const { title, content, bloom_level } = scene
  const { stage_name, challenge, guiding_questions } = content ?? {}
  const [openQ, setOpenQ] = useState<number | null>(null)
  const [response, setResponse] = useState('')

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <Layers className="h-4 w-4 text-gold shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stage_name}</p>
          <h2 className="font-semibold text-base leading-tight">{title}</h2>
        </div>
        {bloom_level && (
          <Badge variant="outline" className="text-[10px] ml-auto shrink-0 capitalize border-gold/30 text-gold">
            {bloom_level}
          </Badge>
        )}
      </div>

      <div className="rounded-xl border-l-4 border-gold bg-gold/5 px-4 py-3">
        <p className="font-medium text-base">{challenge}</p>
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
                <span>{q}</span>
                {openQ === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>
              {openQ === i && (
                <div className="border-t px-4 pb-3 pt-2">
                  <textarea
                    placeholder="Write your thinking here…"
                    rows={3}
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
          onChange={(e) => setResponse(e.target.value)}
          placeholder="What is your approach to this challenge?"
          rows={4}
          className="w-full rounded-xl border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gold/30"
        />
      </div>
    </div>
  )
}
