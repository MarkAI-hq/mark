'use client'

import { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Subject } from '@/lib/types'
import { ExamDialog } from '@/components/exams/exam-dialog';

interface SubjectsTableProps {
    data: Subject[]
    onEdit: (subject: Subject) => void
    onDelete: (subject: Subject) => void
    headerSlot?: React.ReactNode
}

export function SubjectsTable({
    data,
    onEdit,
    onDelete,
    headerSlot
}: SubjectsTableProps) {
    const [isExamDialogOpen, setIsExamDialogOpen] = useState(false)
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined)

    const handleCreateExamClick = (subjectId: string) => {
        setSelectedSubjectId(subjectId)
        setIsExamDialogOpen(true)
    }

    const columns: ColumnDef<Subject>[] = [
        {
            accessorKey: 'code',
            header: 'Subject Code'
        },
        {
            accessorKey: 'title',
            header: 'Subject Name'
        },
        {
            accessorKey: 'description',
            header: 'Subject Description'
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const subject = row.original

                return (
                    <>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='ghost' className='h-8 w-8 p-0'>
                                    <span className='sr-only'>Open menu</span>
                                    <MoreHorizontal className='h-4 w-4' />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                                <DropdownMenuItem onClick={() => onEdit(subject)}>
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCreateExamClick(subject.id)}>
                                    Create Exam
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className='text-red-600'
                                    onClick={() => onDelete(subject)}
                                >
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <ExamDialog
                            open={isExamDialogOpen}
                            onOpenChange={setIsExamDialogOpen}
                            subjects={data}
                            initialCourseId={selectedSubjectId}
                            disableCourseSelect={true}
                        />
                    </>
                )
            }
        }
    ]

    return (
        <DataTable
            columns={columns}
            data={data}
            filter={{ prompt: 'Filter subjects...', column: 'title' }}
            headerSlot={headerSlot}
        />
    )
}
