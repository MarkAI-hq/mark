'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Student } from '@/lib/types'
import { createStudent, updateStudent, deleteStudent } from '@/lib/actions/students'
import { StudentsTable } from '@/components/students/students-table'
import { StudentForm, StudentFormData } from '@/components/students/student-form'
import { DeleteStudentDialog } from '@/components/students/delete-student-dialog'
import { StudentImportDialog } from '@/components/students/student-import-dialog'
import { Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StudentsClientProps {
  initialStudents: Student[]
}

export function StudentsClient({ initialStudents }: StudentsClientProps) {
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const openForm = (student?: Student) => {
    setSelectedStudent(student || null)
    setIsFormOpen(true)
  }

  const handleFormSubmit = (formData: StudentFormData) => {
    startTransition(async () => {
      const action = selectedStudent
        ? updateStudent(selectedStudent.user_id, formData)
        : createStudent(formData)

      try {
        const result = await action
        if (selectedStudent) {
          setStudents((prev) =>
            prev.map((s) => (s.user_id === result.user_id ? result : s)),
          )
          toast.success('Student updated successfully.')
        } else {
          setStudents((prev) => [result, ...prev])
          toast.success('Student created successfully.')
        }
        setIsFormOpen(false)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'An unknown error occurred.',
        )
      }
    })
  }

  const handleDeleteConfirm = () => {
    if (!studentToDelete) return

    startTransition(async () => {
      try {
        await deleteStudent(studentToDelete.user_id)
        setStudents((prev) => prev.filter((s) => s.user_id !== studentToDelete.user_id))
        const studentName = `${studentToDelete.first_name} ${studentToDelete.last_name || ''}`.trim()
        toast.success(`Student "${studentName}" deleted.`)
        setStudentToDelete(null)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete student.',
        )
      }
    })
  }

  return (
    <>
      {/* The generic type is now correctly used, and all required accessor props are provided. */}
      <StudentsTable<Student>
        data={students}
        onRemove={setStudentToDelete}
        onEdit={openForm}
        getId={(s) => s.user_id}
        getName={(s) => `${s.first_name} ${s.last_name || ''}`.trim()}
        getEmail={(s) => s.email}
        // ADDED: Provide the getStatus accessor to display the enrollment status.
        getStatus={(s) => s.enrollment_status}
        headerSlot={
          <div className="flex gap-2">
            <Button onClick={() => openForm()}>
              <Plus className="mr-2 h-4 w-4" />
              New Student
            </Button>
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import from CSV
            </Button>
          </div>
        }
      />

      <StudentForm
        key={selectedStudent?.user_id || 'new'}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        isSubmitting={isPending}
        student={selectedStudent || undefined}
      />

      <DeleteStudentDialog
        open={!!studentToDelete}
        onOpenChange={() => setStudentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        studentName={
          studentToDelete
            ? `${studentToDelete.first_name} ${studentToDelete.last_name || ''}`.trim()
            : ''
        }
      />

      <StudentImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        classId="PLACEHOLDER_CLASS_ID"
      />
    </>
  )
}
