'use client'

// src/app/(dashboard)/dashboard/assessments/[assessmentId]/results/[submissionId]/_components/reteach-panel.tsx
// Button 1 — Results page: slide-out panel that stays alongside the submission view

import { useState, useTransition } from 'react'
import { toast }                   from 'sonner'
import { Loader2, Zap, X, Printer } from 'lucide-react'
import { Button }                  from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea }              from '@/components/ui/scroll-area'
import { ReteachSessionContent }   from '@/components/reteach/reteach-session-content'
import { generateSubmissionReteach, type ReteachSession } from '@/lib/actions/reteach'

interface ReteachPanelProps {
  submissionId: string
  studentName:  string
  errorType:    string  // e.g. "Precision Error" — shown in the trigger button
}

export function ReteachPanel({ submissionId, studentName, errorType }: ReteachPanelProps) {
  const [open,    setOpen]    = useState(false)
  const [session, setSession] = useState<ReteachSession | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleGenerate = () => {
    startTransition(async () => {
      const { data, error } = await generateSubmissionReteach(submissionId)
      if (error || !data) {
        toast.error(error?.message ?? 'Failed to generate reteach session.')
        return
      }
      setSession(data)
      setOpen(true)
    })
  }

  const handlePrint = () => window.print()

  return (
    <>
      {/* ── Trigger button — sits under "Identified Issues" ── */}
      <Button
        size="sm"
        variant="outline"
        className="mt-2 w-full gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
        onClick={handleGenerate}
        disabled={isPending}
      >
        {isPending
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Zap className="h-3.5 w-3.5" />
        }
        {isPending ? 'Generating session...' : 'Get intervention plan'}
      </Button>

      {/* ── Slide-out panel ── */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg flex flex-col p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle className="text-base">Reteach session</SheetTitle>
                <SheetDescription className="text-xs mt-0.5">
                  {studentName} · {errorType}
                </SheetDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={handlePrint}
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            {session && <ReteachSessionContent session={session} />}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}