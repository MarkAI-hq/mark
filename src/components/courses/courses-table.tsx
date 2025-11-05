// src/components/courses/courses-table.tsx
'use client'

import { MoreHorizontal } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Course } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

interface CoursesTableProps {
  data: Course[]
  onEdit: (course: Course) => void
  onDelete: (course: Course) => void
  headerSlot?: React.ReactNode
}

export function CoursesTable({
  data,
  onEdit,
  onDelete,
  headerSlot,
}: CoursesTableProps) {
  const columns: ColumnDef<Course>[] = [
    {
      accessorKey: 'code',
      header: 'Course Code',
    },
    {
      accessorKey: 'title',
      header: 'Course Title',
    },
    {
      accessorKey: 'grade_level',
      header: 'Grade Level',
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active');
        return isActive ? (
          <Badge variant="default">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const course = row.original;
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
              <DropdownMenuItem onClick={() => onEdit(course)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(course)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      filter={{ prompt: 'Filter courses...', column: 'title' }}
      headerSlot={headerSlot}
    />
  );
}
