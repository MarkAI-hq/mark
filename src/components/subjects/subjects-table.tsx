'use client'

import { useState }       from 'react'
import { MoreHorizontal } from 'lucide-react'
import { ColumnDef }      from '@tanstack/react-table'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button }     from '@/components/ui/button'
import { DataTable }  from '@/components/ui/data-table'
import { Subject }    from '@/lib/types'
import { ExamDialog } from '@/components/exams/exam-dialog'
import { getClasses } from '@/lib/actions/classes'

type SubjectOption = { id: string; name: string }
type ClassOption   = { class_id: string; name: string }

interface SubjectsTableProps {
  data:        Subject[]
  onEdit?:     (subject: Subject) => void
  onDelete?:   (subject: Subject) => void
  headerSlot?: React.ReactNode
  role?:       'Admin' | 'Teacher'
}

export function SubjectsTable({ data, onEdit, onDelete, headerSlot, role = 'Admin' }: SubjectsTableProps) {
  const [isExamDialogOpen,  setIsExamDialogOpen]  = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined)
  const [classes,           setClasses]           = useState<ClassOption[]>([])

  // Normalise Subject[] → { id, name }[] so ExamDialog SelectItems get
  // a valid value regardless of whether the API returns id or subject_id.
  const normalisedSubjects: SubjectOption[] = data
    .map((s: any) => ({ id: s.subject_id ?? s.id, name: s.name }))
    .filter((s): s is SubjectOption => Boolean(s.id && s.name))

  const handleCreateExamClick = async (subjectId: string) => {
    // Resolve the normalised id in case the raw subject uses subject_id
    const subject    = data.find((s: any) => (s.subject_id ?? s.id) === subjectId)
    const resolvedId = subject ? ((subject as any).subject_id ?? (subject as any).id) : subjectId

    setSelectedSubjectId(resolvedId)
    setIsExamDialogOpen(true)

    // Fetch classes fresh so the dropdown is always populated
    const { data: classData } = await getClasses()
    if (classData) {
      setClasses((classData as any[]).map((c) => ({ class_id: c.class_id, name: c.name })))
    }
  }

  const columns: ColumnDef<Subject>[] = [
    { accessorKey: 'code',        header: 'Subject Code' },
    { accessorKey: 'name',        header: 'Subject Name' },
    { accessorKey: 'description', header: 'Subject Description' },
    {
      id:     'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const subject = row.original
        const subjectId = (subject as any).subject_id ?? (subject as any).id

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">

              {/* Create Exam — available to all roles */}
              <DropdownMenuItem onClick={() => handleCreateExamClick(subjectId)}>
                Create Exam
              </DropdownMenuItem>

              {/* Edit — admin only */}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(subject)}>
                  Edit
                </DropdownMenuItem>
              )}

              {/* Delete — admin only */}
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDelete(subject)}
                >
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
    <>
      <DataTable
        columns={columns}
        data={data}
        filter={{ prompt: 'Filter subjects...', column: 'name' }}
        headerSlot={headerSlot}
      />

      {/* Single ExamDialog instance — lifted out of cell renderer.
          Subject is pre-selected and locked; classes are fetched fresh on open. */}
      <ExamDialog
        open={isExamDialogOpen}
        onOpenChange={(open) => {
          setIsExamDialogOpen(open)
          if (!open) {
            setSelectedSubjectId(undefined)
            setClasses([])
          }
        }}
        subjects={normalisedSubjects}
        classes={classes}
        initialCourseId={selectedSubjectId}
        disableCourseSelect={true}
        role={role}
      />
    </>
  )
}