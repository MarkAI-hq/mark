'use client'

// src/components/students/student-assessments-tab.tsx

import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'

import { StudentSubmission } from '@/lib/actions/student-details'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface StudentAssessmentsTabProps {
  submissions: StudentSubmission[]
}

function StatusBadge({ status }: { status: string }) {
  const s = (status ?? '').toUpperCase()
  if (s === 'COMPLETED') return <Badge variant="default">Graded</Badge>
  if (s === 'PROCESSING' || s === 'IN_PROGRESS') return <Badge variant="secondary">Processing</Badge>
  if (s === 'PENDING' || s === 'SUBMITTED') return <Badge variant="outline">Pending</Badge>
  if (s === 'FAILED') return <Badge variant="destructive">Failed</Badge>
  return <Badge variant="secondary">{status}</Badge>
}

const columns: ColumnDef<StudentSubmission>[] = [
  {
    accessorKey: 'assessment_title',
    header: 'Assessment',
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.assessment_title || 'Untitled Assessment'}
      </span>
    ),
  },
  {
    accessorKey: 'grading_status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('grading_status')} />,
  },
  {
    accessorKey: 'total_score',
    header: 'Score',
    cell: ({ row }) => {
      const { total_score, max_score } = row.original
      if (total_score === null || total_score === undefined) {
        return <span className="text-muted-foreground">—</span>
      }
      return <span>{total_score} / {max_score ?? '?'}</span>
    },
  },
  {
    accessorKey: 'submitted_at',
    header: 'Submission Date',
    cell: ({ row }) => {
      const v = row.getValue('submitted_at') as string | null
      return v
        ? format(new Date(v), 'MMM d, yyyy, h:mm a')
        : <span className="text-muted-foreground">—</span>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const s = row.original
      const href = `/dashboard/assessments/${s.assessment_id}/results/${s.submission_id}`
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={href}>View Submission</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function StudentAssessmentsTab({ submissions }: StudentAssessmentsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment History</CardTitle>
        <CardDescription>A record of all assessments submitted by the student.</CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length > 0 ? (
          <DataTable
            columns={columns}
            data={submissions}
            filter={{ prompt: 'Search assessments...', column: 'assessment_title' }}
          />
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No assessment submissions found.
          </div>
        )}
      </CardContent>
    </Card>
  )
}