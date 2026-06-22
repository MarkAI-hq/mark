'use client'

import { useState }       from 'react'
import { MoreHorizontal, Upload, BookOpen } from 'lucide-react'
import { ColumnDef }      from '@tanstack/react-table'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button }     from '@/components/ui/button'
import { DataTable }  from '@/components/ui/data-table'
import { Subject }    from '@/lib/types'
import { ExamDialog } from '@/components/exams/exam-dialog'
import { CurriculumExamDialog } from '@/components/exams/curriculum-exam-dialog'
import { getClasses } from '@/lib/actions/classes'

type SubjectOption = { id: string; name: string }
type ClassOption   = { class_id: string; name: string }

type ExamPath = 'selector' | 'document' | 'curriculum' | null

interface SubjectsTableProps {
  data:        Subject[]
  onEdit?:     (subject: Subject) => void
  onDelete?:   (subject: Subject) => void
  headerSlot?: React.ReactNode
  role?:       'Admin' | 'Teacher'
}

export function SubjectsTable({ data, onEdit, onDelete, headerSlot, role = 'Admin' }: SubjectsTableProps) {
  const [examPath,          setExamPath]          = useState<ExamPath>(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined)
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('')
  const [classes,           setClasses]           = useState<ClassOption[]>([])

  // Normalise Subject[] → { id, name }[] so ExamDialog SelectItems get
  // a valid value regardless of whether the API returns id or subject_id.
  const normalisedSubjects: SubjectOption[] = data
    .map((s: any) => ({ id: s.subject_id ?? s.id, name: s.name }))
    .filter((s): s is SubjectOption => Boolean(s.id && s.name))

  const handleCreateExamClick = async (subjectId: string) => {
    const subject    = data.find((s: any) => (s.subject_id ?? s.id) === subjectId)
    const resolvedId = subject ? ((subject as any).subject_id ?? (subject as any).id) : subjectId
    const name       = (subject as any)?.name ?? ''

    setSelectedSubjectId(resolvedId)
    setSelectedSubjectName(name)
    setExamPath('selector')

    const { data: classData } = await getClasses()
    if (classData) {
      setClasses((classData as any[]).map((c) => ({ class_id: c.class_id, name: c.name })))
    }
  }

  const closeAll = () => { setExamPath(null); setSelectedSubjectId(undefined); setSelectedSubjectName(''); setClasses([]) }

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

      {/* Path selector — choose between From Document and From Curriculum */}
      <Dialog open={examPath === 'selector'} onOpenChange={(open) => { if (!open) closeAll() }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Create Exam</DialogTitle>
            <DialogDescription>
              Choose how you want to create an exam for <strong>{selectedSubjectName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2 pb-1">
            <button
              className="flex flex-col items-start gap-3 rounded-xl border-2 border-slate-200 p-4 text-left transition-colors hover:border-amber-400 hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              onClick={() => setExamPath('document')}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                <Upload className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">From Document</p>
                <p className="text-xs text-slate-500 mt-0.5">Upload a marking guide or past paper — Mirror detects the curriculum and generates questions from it.</p>
              </div>
            </button>
            <button
              className="flex flex-col items-start gap-3 rounded-xl border-2 border-slate-200 p-4 text-left transition-colors hover:border-amber-400 hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              onClick={() => setExamPath('curriculum')}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                <BookOpen className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">From Curriculum</p>
                <p className="text-xs text-slate-500 mt-0.5">Generate directly from the uploaded curriculum schema — no file needed. Topics and Bloom&apos;s levels are inherited automatically.</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Path A: From Document */}
      <ExamDialog
        open={examPath === 'document'}
        onOpenChange={(open) => { if (!open) closeAll() }}
        subjects={normalisedSubjects}
        classes={classes}
        initialCourseId={selectedSubjectId}
        disableCourseSelect={true}
        role={role}
      />

      {/* Path B: From Curriculum */}
      {selectedSubjectId && (
        <CurriculumExamDialog
          open={examPath === 'curriculum'}
          onOpenChange={(open) => { if (!open) closeAll() }}
          subjectId={selectedSubjectId}
          subjectName={selectedSubjectName}
        />
      )}
    </>
  )
}