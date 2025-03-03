'use client'

import {
	MoreHorizontal,
	Upload,
	PencilIcon,
	TrashIcon,
	ChartBarIcon,
	FileText
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Exam } from '@/lib/types'

interface ExamsTableProps {
	data: Exam[]
	headerSlot?: React.ReactNode
	onEdit?: (exam: Exam) => void
	onDelete?: (exam: Exam) => void
	onUpload: (exam: Exam) => void
}

export function ExamsTable({
	data,
	headerSlot,
	onEdit,
	onDelete,
	onUpload
}: ExamsTableProps) {
	const columns: ColumnDef<Exam>[] = [
		{
			accessorKey: 'title',
			header: 'Title'
		},
		{
			accessorKey: 'courseName',
			header: 'Subject'
		},
		// {
		// 	accessorKey: 'totalMarks',
		// 	header: 'Total Marks'
		// },
		// {
		// 	accessorKey: 'questionCount',
		// 	header: 'Questions'
		// },
		{
			accessorKey: 'createdAt',
			header: 'Created',
			cell: ({ row }) => {
				return format(parseISO(row.original.createdAt), 'MMM d, yyyy')
			}
		},
		{
			accessorKey: 'updatedAt',
			header: 'Updated',
			cell: ({ row }) => {
				return format(parseISO(row.original.updatedAt), 'MMM d, yyyy')
			}
		},
		{
			id: 'actions',
			header: 'Actions',
			cell: ({ row }) => {
				const exam = row.original

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='ghost' className='h-8 w-8 p-0'>
								<span className='sr-only'>Open menu</span>
								<MoreHorizontal className='h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem asChild>
								<Link href={`/dashboard/exams/${exam.id}`}>
									<FileText className='w-4 h-4 mr-2' />
									View Details
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link href={`/dashboard/exams/${exam.id}/results`}>
									<ChartBarIcon className='w-4 h-4 mr-2' />
									View Results
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onUpload(exam)}>
								<Upload className='mr-2 h-4 w-4' />
								Upload Answers
							</DropdownMenuItem>
							{onEdit && (
								<DropdownMenuItem onClick={() => onEdit(exam)}>
									<PencilIcon className='w-4 h-4 mr-2' />
									Edit
								</DropdownMenuItem>
							)}
							{onDelete && (
								<DropdownMenuItem
									onClick={() => onDelete(exam)}
									className='text-red-600'
								>
									<TrashIcon className='w-4 h-4 mr-2' />
									Delete
								</DropdownMenuItem>
							)}
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
			filter={{ prompt: 'Filter exams...', column: 'title' }}
			headerSlot={headerSlot}
		/>
	)
}
