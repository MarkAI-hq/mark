'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Class, AssignedCourse, Student } from '@/lib/types'
import { createStudent, CreateStudentData } from '@/lib/actions/students'
import {
  enrollStudentInClass,
  getEnrolledStudents,
  EnrolledStudent,
  removeStudentFromClass,
} from '@/lib/actions/enrollments'
import { StudentForm } from '@/components/students/student-form'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { StudentsTable } from '@/components/students/students-table'

interface ClassDetailClientProps {
  classDetails: Class
  initialCourses: AssignedCourse[]
}

export function ClassDetailClient({
  classDetails,
}: ClassDetailClientProps) {
  const router = useRouter()
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>(
    [],
  )
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false)
  const [studentToRemove, setStudentToRemove] =
    useState<EnrolledStudent | null>(null)
  const [isPending, startTransition] = useTransition()
  const [newlyCreatedStudent, setNewlyCreatedStudent] = useState<Student | null>(
    null,
  )

  const fetchStudents = useCallback(async () => {
    const { data, error } = await getEnrolledStudents(classDetails.class_id)
    if (data) {
      setEnrolledStudents(data)
    } else if (error) {
      toast.error('Failed to fetch enrolled students.')
    }
  }, [classDetails.class_id])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const handleCreateAndEnrollStudent = async (formData: CreateStudentData) => {
    startTransition(async () => {
      try {
        const newStudent = await createStudent(formData)
        toast.success(`Student "${newStudent.first_name}" created.`)

        await enrollStudentInClass(classDetails.class_id, newStudent.user_id)
        toast.success('Student enrolled in class successfully.')

        await fetchStudents()

        setIsStudentFormOpen(false)
        setNewlyCreatedStudent(newStudent)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'An unknown error occurred.',
        )
      }
    })
  }

  const handleRemoveStudentClick = (student: EnrolledStudent) => {
    setStudentToRemove(student)
  }

  const handleEditStudentClick = (student: EnrolledStudent) => {
    toast.info(`Editing for ${student.first_name} is not yet implemented.`)
  }

  const handleConfirmRemove = () => {
    if (!studentToRemove) return
    startTransition(async () => {
      try {
        await removeStudentFromClass(
          classDetails.class_id,
          studentToRemove.student_id,
        )
        toast.success('Student removed from class.')
        setEnrolledStudents((prev) =>
          prev.filter((s) => s.student_id !== studentToRemove.student_id),
        )
        setStudentToRemove(null)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to remove student.',
        )
      }
    })
  }

  const beginCognitiveAssessment = () => {
    if (!newlyCreatedStudent) return
    toast.info(
      `Starting cognitive assessment for ${newlyCreatedStudent.first_name}.`,
    )
    router.push(
      `/dashboard/students/${newlyCreatedStudent.user_id}/assess`,
    )
    setNewlyCreatedStudent(null)
  }

  return (
    <>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-5 sm:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Class Details</CardTitle>
              <CardDescription>
                {classDetails.description || 'No description provided.'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Enrolled Students ({enrolledStudents.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsStudentFormOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Import Students
                  </Button>
                </div>
              </div>
              <CardDescription>
                Manage the students enrolled in this class.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentsTable<EnrolledStudent>
                data={enrolledStudents}
                onRemove={handleRemoveStudentClick}
                onEdit={handleEditStudentClick}
                getId={(s) => s.student_id}
                getName={(s) => `${s.first_name} ${s.last_name || ''}`.trim()}
                getEmail={(s) => s.email}
                getStatus={(s) => s.status}
                // ADDED: Pass the classId to the table for contextual linking.
                classId={classDetails.class_id}
              />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          {/* ... (Assigned Courses card remains the same) ... */}
        </div>
      </div>

      <StudentForm
        open={isStudentFormOpen}
        onOpenChange={setIsStudentFormOpen}
        onSubmit={handleCreateAndEnrollStudent}
        isSubmitting={isPending}
      />

      <ConfirmDialog
        open={!!newlyCreatedStudent}
        onOpenChange={() => setNewlyCreatedStudent(null)}
        onConfirm={beginCognitiveAssessment}
        title="Student Enrolled"
        description={`Student "${newlyCreatedStudent?.first_name}" has been successfully created and enrolled. Would you like to begin their initial cognitive profile assessment now?`}
        confirmText="Yes, Begin Assessment"
        cancelText="Do it Later"
      />

      <ConfirmDialog
        open={!!studentToRemove}
        onOpenChange={() => setStudentToRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Are you sure?"
        description={`This will remove ${studentToRemove?.first_name} from this class. This action cannot be undone.`}
        confirmText="Yes, Remove from Class"
        isDestructive
      />
    </>
  )
}
