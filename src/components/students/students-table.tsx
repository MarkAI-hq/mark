'use client'

import { MoreHorizontal } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Student } from '@/lib/types'

interface StudentsTableProps {
	data: Student[]
	onEdit: (student: Student) => void
	onDelete: (student: Student) => void
	headerSlot?: React.ReactNode
}

export function StudentsTable({
	data,
	onEdit,
	onDelete,
	headerSlot
}: StudentsTableProps) {
	const columns: ColumnDef<Student>[] = [
		{
			accessorKey: 'name',
			header: 'Name'
		},
		{
			accessorKey: 'class',
			header: 'Class'
		},
		{
			accessorKey: 'stream',
			header: 'Stream',
			cell: ({ row }) => row.original.stream || '-'
		},
		{
			id: 'actions',
			header: 'Actions',
			cell: ({ row }) => {
				const student = row.original

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='ghost' className='h-8 w-8 p-0'>
								<span className='sr-only'>Open menu</span>
								<MoreHorizontal className='h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem onClick={() => onEdit(student)}>
								Edit
							</DropdownMenuItem>
							<DropdownMenuItem
								className='text-red-600'
								onClick={() => onDelete(student)}
							>
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)
			}
		}
	]

	return (
		<DataTable
			columns={columns}
			data={data}
			filter={{ prompt: 'Filter students...', column: 'name' }}
			headerSlot={headerSlot}
		/>
	)
}
