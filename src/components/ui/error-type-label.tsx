'use client'

// src/components/ui/error-type-label.tsx
// One change from original: description is string | null, not string

import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ErrorTypeLabelProps {
  name:        string
  description: string | null   // nullable — matches DB and ErrorDistribution shape
  className?:  string
}

export function ErrorTypeLabel({ name, description, className }: ErrorTypeLabelProps) {
  if (!description) {
    return <span className={className}>{name}</span>
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 ${className ?? ''}`}>
            {name}
            <Info className="h-3 w-3 shrink-0 text-muted-foreground/60" />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[220px] text-xs leading-snug"
        >
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}