'use client'

import {
  MoreHorizontal,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  FileText,
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { format, parseISO } from 'date-fns'
import { TZDate } from '@date-fns/tz'
import Link from 'next/link'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Assessment } from '@/lib/actions/assessments'

interface ExamsTableProps {
  data: Assessment[]
  headerSlot?: React.ReactNode
  onEdit?: (assessment: Assessment) => void
  onDelete?: (assessment: Assessment) => void
}

export function ExamsTable({
  data,
  headerSlot,
  onEdit,
  onDelete,
}: ExamsTableProps) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const columns: ColumnDef<Assessment>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'className',
      header: 'Class',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const dateStr = row.original.createdAt
        if (!dateStr) return '—' // fallback for missing createdAt
        try {
          const parsedDate = parseISO(dateStr)
          return format(new TZDate(parsedDate, tz), 'MMM d, yyyy')
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
                <Link href={`/dashboard/assessments/${assessment.assessment_id}`}>
                  <FileText className="w-4 h-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/assessments/${assessment.assessment_id}/results`}
                >
                  <ChartBarIcon className="w-4 h-4 mr-2" />
                  View Results
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(assessment)}>
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(assessment)}
                  className="text-red-600"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
