// src/components/students/learning-toolkits.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb, BookMarked } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { LearningTool, StudentCognitiveProfile } from '@/lib/actions/student-dashboard'
// Path: src/components/student/learning-toolkits.tsx

interface ToolCardProps {
  tool: LearningTool
}

function ToolCard({ tool }: ToolCardProps) {
  const [open, setOpen] = useState(false)
  const hasHowTo = !!tool.how_to

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={() => (hasHowTo ? setOpen((o) => !o) : undefined)}
        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors
          ${hasHowTo ? 'hover:bg-gold/5 cursor-pointer' : 'cursor-default'}`}
        aria-expanded={hasHowTo ? open : undefined}
        disabled={!hasHowTo}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold mt-0.5">
          <Lightbulb className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-sm font-semibold">{tool.name}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
        </div>

        {hasHowTo && (
          <div className="shrink-0 mt-1">
            {open
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        )}
      </button>

      {open && tool.how_to && (
        <div className="px-4 pb-4 border-t bg-gold/5">
          <div className="pt-3 space-y-1">
            <p className="text-xs font-semibold text-gold uppercase tracking-wide">
              How to use it
            </p>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {tool.how_to}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Public component ───────────────────────────────────────────────────────

interface Props {
  profile:  StudentCognitiveProfile
  tools:    LearningTool[]
}

export function LearningToolkits({ profile, tools }: Props) {
  if (!tools.length) return null

  return (
    <Card className="border-gold/20 bg-gold/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BookMarked className="h-4 w-4 text-gold" />
          Your Learning Toolkit
        </CardTitle>
        <CardDescription>
          {profile.profile_focus
            ?? `Personalised strategies for ${profile.profile_name ?? 'your learning profile'}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </CardContent>
    </Card>
  )
}