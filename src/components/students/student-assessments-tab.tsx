// src/components/students/student-assessments-tab.tsx
'use client'

import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'

import { StudentSubmission } from '@/lib/actions/student-details'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface StudentAssessmentsTabProps {
  submissions: StudentSubmission[]
}

// --- Table Columns Definition ---
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
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as StudentSubmission['status']
      const variant: 'default' | 'secondary' | 'destructive' =
        status === 'Graded'
          ? 'default'
          : status === 'Submitted'
            ? 'secondary'
            : 'destructive'
      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: 'total_score',
    header: 'Score',
    cell: ({ row }) => {
      const { total_score, max_score } = row.original
      if (total_score === null || total_score === undefined) {
        return <span className="text-muted-foreground">N/A</span>
      }
      return (
        <span>
          {total_score} / {max_score || 'N/A'}
        </span>
      )
    },
  },
  {
    accessorKey: 'submitted_at',
    header: 'Submission Date',
    cell: ({ row }) => {
      const submittedAt = row.getValue('submitted_at') as string | null
      return submittedAt ? (
        format(new Date(submittedAt), 'MMM d, yyyy, h:mm a')
      ) : (
        <span className="text-muted-foreground">Not Submitted</span>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const submission = row.original
      // Change this line to match your existing route structure
      const resultsUrl = `/dashboard/assessments/${submission.assessment_id}/results/${submission.submission_id}`
      
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
              <Link href={resultsUrl}>
                View Submission
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function StudentAssessmentsTab({
  submissions,
}: StudentAssessmentsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment History</CardTitle>
        <CardDescription>
          A record of all assessments submitted by the student.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length > 0 ? (
          <DataTable
            columns={columns}
            data={submissions}
            filter={{
              prompt: 'Search assessments...',
              column: 'assessment_title',
            }}
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