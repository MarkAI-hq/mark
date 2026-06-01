'use client'

// src/components/students/student-interventions-tab.tsx

import { useState, useTransition }   from 'react'
import { RefreshCw }                 from 'lucide-react'
import { Button }                    from '@/components/ui/button'
import { Separator }                 from '@/components/ui/separator'
import { ReteachHistoryList }        from '@/components/reteach/reteach-history-list'
import { GapAttributionCard }        from '@/components/gap-attribution/gap-attribution-card'
import { getStudentReteachHistory }  from '@/lib/actions/reteach-history'
import type { ReteachSessionRecord } from '@/lib/actions/reteach-history'
import type { StudentGapAttribution } from '@/lib/actions/gap-attribution'

interface StudentInterventionsTabProps {
  studentId:       string
  initialData:     ReteachSessionRecord[]
  /** Optional — if provided, the deliver modal can load the assessment dropdown */
  classId?:        string
  gapAttribution?: StudentGapAttribution[]
}

export function StudentInterventionsTab({
  studentId,
  initialData,
  classId,
  gapAttribution = [],
}: StudentInterventionsTabProps) {
  const [records,   setRecords]      = useState(initialData)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const { data } = await getStudentReteachHistory(studentId)
      if (data) setRecords(data)
    })
  }

  return (
    <div className="space-y-6">
      {/* B3: Gap attribution diagnoses */}
      {gapAttribution.length > 0 && (
        <>
          <GapAttributionCard
            gaps={gapAttribution}
            studentId={studentId}
          />
          <Separator />
        </>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            All intervention sessions generated for this student.
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

        <ReteachHistoryList
          records={records}
          classId={classId}
          emptyLabel="No intervention sessions yet for this student."
        />
      </div>
    </div>
  )
}