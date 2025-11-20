'use client'

import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { AssessmentSubmission } from '@/lib/actions/submissions'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface SubmissionsListClientProps {
  initialSubmissions: AssessmentSubmission[]
  assessmentId: string
}

export function SubmissionsListClient({
  initialSubmissions,
  assessmentId,
}: SubmissionsListClientProps) {
  const columns: ColumnDef<AssessmentSubmission>[] = [
    {
      accessorKey: 'student_name',
      header: 'Student Name',
    },
    {
      accessorKey: 'grading_status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.grading_status
        if (!status) return <Badge variant="outline">Not Submitted</Badge>
        
        const variant: 'default' | 'secondary' | 'destructive' =
          status === 'COMPLETED'
            ? 'default'
            : status === 'PROCESSING'
            ? 'secondary'
            : 'destructive'
        return <Badge variant={variant}>{status}</Badge>
      },
    },
    {
      accessorKey: 'total_score',
      header: 'Score',
      cell: ({ row }) => {
        const score = row.original.total_score
        return score === null || score === undefined ? (
          <span className="text-muted-foreground">N/A</span>
        ) : (
          <span>{score}</span>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const submission = row.original
        return (
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/dashboard/assessments/${assessmentId}/results/${submission.submission_id}`}
            >
              View Report <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={initialSubmissions}
      filter={{ prompt: 'Search students...', column: 'student_name' }}
    />
  )
}
