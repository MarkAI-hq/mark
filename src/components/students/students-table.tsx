'use client'

import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import React from 'react'

interface StudentsTableProps<TData> {
  data: TData[]
  onRemove: (item: TData) => void
  onEdit: (item: TData) => void
  getId: (item: TData) => string
  getName: (item: TData) => string
  getEmail: (item: TData) => string
  getStatus?: (item: TData) => string
  headerSlot?: React.ReactNode
  // ADDED: Optional classId prop for contextual linking.
  classId?: string
}

export function StudentsTable<TData>({
  data,
  onRemove,
  onEdit,
  getId,
  getName,
  getEmail,
  getStatus,
  headerSlot,
  classId, // ADDED: Destructure the new prop.
}: StudentsTableProps<TData>) {
  const tableData = data.map((item) => ({
    ...item,
    name: getName(item),
  }))

  const columns: ColumnDef<TData & { name: string }>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const item = row.original
        // UPDATED: The link is now contextual. It uses the classId if provided.
        const href = classId
          ? `/dashboard/classes/${classId}/students/${getId(item)}`
          : `/dashboard/students/${getId(item)}`
        return (
          <Link href={href} className="font-medium text-primary hover:underline">
            {row.getValue('name')}
          </Link>
        )
      },
    },
    {
      accessorFn: (row) => getEmail(row),
      id: 'email',
      header: 'Email',
    },
    ...(getStatus
      ? [
          {
            accessorFn: (row: TData) => getStatus(row),
            id: 'status',
            header: 'Enrollment Status',
            cell: ({ row }: { row: { original: TData } }) => {
              const status = getStatus(row.original)
              return <Badge variant="secondary">{status}</Badge>
            },
          } as ColumnDef<TData & { name: string }>,
        ]
      : []),
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const item = row.original
        // UPDATED: The "View Details" link is also contextual now.
        const href = classId
          ? `/dashboard/classes/${classId}/students/${getId(item)}`
          : `/dashboard/students/${getId(item)}`
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(item)}>
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={href}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => alert(`Creating assessment for ${getName(item)}`)}
              >
                Create Assessment
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onRemove(item)}
              >
                Delete Student
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={tableData}
        filter={{ prompt: 'Search students...', column: 'name' }}
        headerSlot={headerSlot}
      />
    </div>
  )
}
