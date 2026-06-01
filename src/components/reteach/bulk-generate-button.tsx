'use client'

// src/components/reteach/bulk-generate-button.tsx
// C3: Bulk generate individual reteach sessions for all submissions in an assessment

import { useState, useTransition } from 'react'
import { toast }                   from 'sonner'
import { Zap, Loader2 }            from 'lucide-react'
import { Button }                  from '@/components/ui/button'
import { bulkGenerateReteach }     from '@/lib/actions/reteach-history'

interface Props {
  assessmentId: string
}

export function BulkGenerateButton({ assessmentId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ generated: number; failed: number } | null>(null)

  function handleBulk() {
    startTransition(async () => {
      const { data, error } = await bulkGenerateReteach(assessmentId)
      if (error) {
        toast.error(error.message)
        return
      }
      if (data) {
        setResult(data)
        toast.success(
          `Generated ${data.generated} individual session${data.generated !== 1 ? 's' : ''}` +
          (data.failed ? ` · ${data.failed} failed` : ''),
        )
      }
    })
  }

  if (result) {
    return (
      <p className="text-xs text-muted-foreground">
        {result.generated} session{result.generated !== 1 ? 's' : ''} generated
      </p>
    )
  }

  return (
    <Button size="sm" variant="outline" onClick={handleBulk} disabled={isPending}>
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      ) : (
        <Zap className="h-3.5 w-3.5 mr-1.5" />
      )}
      Bulk generate sessions
    </Button>
  )
}
