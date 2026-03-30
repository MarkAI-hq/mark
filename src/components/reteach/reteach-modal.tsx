'use client'

// src/app/(dashboard)/dashboard/classes/[classId]/students/[studentId]/_components/reteach-modal.tsx
// Button 3 — Student profile: modal overlay for longitudinal coaching session

import { useState, useTransition } from 'react'
import { toast }                   from 'sonner'
import { Loader2, Zap, Printer }   from 'lucide-react'
import { Button }                  from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea }              from '@/components/ui/scroll-area'
import { ReteachSessionContent }   from '@/components/reteach/reteach-session-content'
import { generateStudentReteach, type ReteachSession } from '@/lib/actions/reteach'

interface ReteachModalProps {
  studentId:   string
  studentName: string
  topError:    string  // e.g. "Precision Error 100%"
}

export function ReteachModal({ studentId, studentName, topError }: ReteachModalProps) {
  const [open,    setOpen]    = useState(false)
  const [session, setSession] = useState<ReteachSession | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleGenerate = () => {
    startTransition(async () => {
      const { data, error } = await generateStudentReteach(studentId)
      if (error || !data) {
        toast.error(error?.message ?? 'Failed to generate reteach session.')
        return
      }
      setSession(data)
      setOpen(true)
    })
  }

  return (
    <>
      {/* ── Trigger — sits next to error bar in Error Pattern Breakdown ── */}
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
        onClick={handleGenerate}
        disabled={isPending}
      >
        {isPending
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <Zap className="h-3 w-3" />
        }
        {isPending ? 'Generating...' : 'Build Coaching Plan'}
      </Button>

      {/* ── Modal ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="text-base">Coaching session</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {studentName} · Recurring pattern: {topError}
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs shrink-0"
                onClick={() => window.print()}
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            {session && <ReteachSessionContent session={session} />}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}