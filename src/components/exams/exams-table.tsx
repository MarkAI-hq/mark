'use client'

// src/components/exams/exams-table.tsx

import {
  MoreHorizontal, PencilIcon, TrashIcon,
  ChartBarIcon, FileText, Send, CheckCircle2,
} from 'lucide-react'
import { ColumnDef }         from '@tanstack/react-table'
import { format, parseISO }  from 'date-fns'
import { TZDate }            from '@date-fns/tz'
import Link                  from 'next/link'

import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button }    from '@/components/ui/button'
import { Badge }     from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Assessment } from '@/lib/actions/assessments'

interface ExamsTableProps {
  data:        Assessment[]
  headerSlot?: React.ReactNode
  onEdit?:     (assessment: Assessment) => void
  onDelete?:   (assessment: Assessment) => void
  onPublish?:  (assessment: Assessment) => void
}

export function ExamsTable({ data, headerSlot, onEdit, onDelete, onPublish }: ExamsTableProps) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const columns: ColumnDef<Assessment>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: 'className',
      header: 'Class',
      cell: ({ row }) =>
        row.original.className ?? (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'is_published',
      header: 'Status',
      cell: ({ row }) =>
        row.original.is_published ? (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            Published
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            Draft
          </Badge>
        ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const dateStr = row.original.createdAt
        if (!dateStr) return '—'
        try {
          return format(new TZDate(parseISO(dateStr), tz), 'MMM d, yyyy')
        } catch {
          return 'Invalid date'
        }
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const assessment = row.original
        const isDraft    = !assessment.is_published

        return (
          <div className="flex items-center gap-2">

            {/* Inline Publish button — visible only for drafts, no menu required */}
            {isDraft && onPublish && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/40"
                onClick={() => onPublish(assessment)}
              >
                <Send className="h-3 w-3 mr-1.5" />
                Publish
              </Button>
            )}

            {/* ··· menu for secondary actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/assessments/${assessment.assessment_id}`}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/assessments/${assessment.assessment_id}/results`}>
                    <ChartBarIcon className="w-4 h-4 mr-2" />
                    View Results
                  </Link>
                </DropdownMenuItem>

                {isDraft && (onEdit || onDelete) && <DropdownMenuSeparator />}

                {isDraft && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(assessment)}>
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}

                {isDraft && onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(assessment)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      filter={{ prompt: 'Filter assessments...', column: 'title' }}
      headerSlot={headerSlot}
    />
  )
}