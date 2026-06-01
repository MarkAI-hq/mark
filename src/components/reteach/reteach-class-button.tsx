'use client'

// src/components/reteach/reteach-class-button.tsx

import { useTransition, useState } from 'react'
import { useRouter }               from 'next/navigation'
import { Loader2, Zap, CheckCircle2 } from 'lucide-react'
import { Button }                  from '@/components/ui/button'
import { ReteachGenerationConfirmDialog } from '@/components/reteach/reteach-generation-confirm-dialog'

interface ReteachClassButtonProps {
  classId:             string
  assessmentId:        string
  errorTypeId?:        string
  errorType:           string
  className:           string
  assessmentTitle:     string
  affected:            number
  total:               number
  hasExistingSession?: boolean
}

export function ReteachClassButton({
  classId,
  assessmentId,
  errorTypeId,
  errorType,
  className,
  assessmentTitle,
  affected,
  total,
  hasExistingSession = false,
}: ReteachClassButtonProps) {
  const router                       = useRouter()
  const [isPending, startTransition] = useTransition()
  const [done,      setDone]         = useState(hasExistingSession)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const doNavigate = () => {
    setDone(true)
    startTransition(() => {
      const params = new URLSearchParams({
        classId,
        ...(errorTypeId ? { errorTypeId } : {}),
        className,
        assessmentTitle,
        errorType,
        affected: String(affected),
        total:    String(total),
      })
      router.push(
        `/dashboard/classes/${classId}/reteach/${assessmentId}?${params.toString()}`,
      )
    })
  }

  const handleGenerate = () => {
    if (isPending) return
    setConfirmOpen(true)
  }

  const handleViewExisting = () => {
    router.push(`/dashboard/classes/${classId}?tab=interventions`)
  }

  if (done && !isPending) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 text-xs border-green-200 text-green-700 bg-green-50 shrink-0"
        onClick={handleViewExisting}
      >
        <CheckCircle2 className="h-3 w-3" />
        View Session
      </Button>
    )
  }

  return (
    <>
      {/* M5: Confirm dialog before generating */}
      <ReteachGenerationConfirmDialog
        open={confirmOpen}
        context={{
          assessmentTitle,
          errorType,
          errorCount: { on: affected, of: total },
          scope:      'class',
        }}
        onConfirm={() => { setConfirmOpen(false); doNavigate() }}
        onCancel={() => setConfirmOpen(false)}
        isLoading={isPending}
      />

      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 shrink-0"
        onClick={handleGenerate}
        disabled={isPending}
      >
        {isPending
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <Zap className="h-3 w-3" />
        }
        {isPending ? 'Loading...' : 'Get Intervention'}
      </Button>
    </>
  )
}