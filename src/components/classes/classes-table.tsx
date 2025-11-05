// src/components/classes/classes-table.tsx
'use client'

import { MoreHorizontal } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Class } from '@/lib/types'

interface ClassesTableProps {
  data: Class[]
  onEdit: (cls: Class) => void
  onDelete: (cls: Class) => void
  headerSlot?: React.ReactNode
}

export function ClassesTable({
  data,
  onEdit,
  onDelete,
  headerSlot,
}: ClassesTableProps) {
  const columns: ColumnDef<Class>[] = [
    {
      accessorKey: 'name',
      header: 'Class Name',
      cell: ({ row }) => {
        const cls = row.original;
        // Make the class name a link to its detail page
        return (
          <Link
            href={`/dashboard/classes/${cls.class_id}`}
            className="font-medium text-primary hover:underline"
          >
            {cls.name}
          </Link>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const description = row.getValue('description') as string | null;
        return (
          <span className="truncate text-sm text-muted-foreground">
            {description || 'No description'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const cls = row.original;
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
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/classes/${cls.class_id}`}>
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(cls)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(cls)}
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
      filter={{ prompt: 'Filter classes...', column: 'name' }}
      headerSlot={headerSlot}
    />
  );
}
