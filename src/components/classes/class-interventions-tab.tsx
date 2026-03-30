'use client'

// src/components/classes/class-interventions-tab.tsx

import { useState, useTransition }  from 'react'
import { RefreshCw }                from 'lucide-react'
import { Button }                   from '@/components/ui/button'
import { ReteachHistoryList }       from '@/components/reteach/reteach-history-list'
import { getClassReteachHistory }   from '@/lib/actions/reteach-history'
import type { ReteachSessionRecord } from '@/lib/actions/reteach-history'

interface ClassInterventionsTabProps {
  classId:     string
  initialData: ReteachSessionRecord[]
}

export function ClassInterventionsTab({
  classId,
  initialData,
}: ClassInterventionsTabProps) {
  const [records,   setRecords]      = useState(initialData)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const { data } = await getClassReteachHistory(classId)
      if (data) setRecords(data)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          All intervention sessions generated for this class.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
          {isPending ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {/* classId passed so the deliver modal can load the assessment dropdown */}
      <ReteachHistoryList
        records={records}
        classId={classId}
        emptyLabel="No class intervention sessions yet."
      />
    </div>
  )
}