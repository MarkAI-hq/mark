'use client'

// src/components/students/student-assessments-tab-wrapper.tsx

import { useState, useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StudentAssessmentsTab } from '@/components/students/student-assessments-tab'
import { getStudentSubmissions } from '@/lib/actions/student-details'

interface StudentAssessmentsTabWrapperProps {
  studentId:           string
  initialSubmissions:  Awaited<ReturnType<typeof getStudentSubmissions>>['data']
}

export function StudentAssessmentsTabWrapper({
  studentId,
  initialSubmissions,
}: StudentAssessmentsTabWrapperProps) {
  const [submissions, setSubmissions]   = useState(initialSubmissions ?? [])
  const [isPending,   startTransition]  = useTransition()

  function handleRefresh() {
    startTransition(async () => {
      const res = await getStudentSubmissions(studentId)
      if (res.data) setSubmissions(res.data)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Check whether assignments have been graded.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
          {isPending ? 'Checking…' : 'Refresh'}
        </Button>
      </div>

      <StudentAssessmentsTab submissions={submissions} />
    </div>
  )
}