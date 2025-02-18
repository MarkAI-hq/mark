'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { StudentForm } from '@/components/students/student-form'
import { StudentsTable } from '@/components/students/students-table'
import { DeleteStudentDialog } from '@/components/students/delete-student-dialog'
import { deleteStudent } from '@/lib/actions/students'
import { Student } from '@/lib/types'

interface StudentsClientProps {
	students: Student[]
}

export function StudentsClient({ students }: StudentsClientProps) {
	const [formOpen, setFormOpen] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [selectedStudent, setSelectedStudent] = useState<Student>()

	const handleDelete = async () => {
		if (!selectedStudent) return

		const { data: deleted, error } = await deleteStudent(selectedStudent.id)

		if (error) {
			toast.error('Error', {
				description: error.message
			})
		}

		if (deleted) {
			toast.success('Success', {
				description: 'Student deleted successfully'
			})
			setDeleteDialogOpen(false)
			setSelectedStudent(undefined)
		}
	}

	return (
		<>
			<StudentsTable
				data={students}
				headerSlot={
					<Button onClick={() => setFormOpen(true)}>
						<Plus className='mr-2 h-4 w-4' />
						Add Student
					</Button>
				}
				onEdit={(student) => {
					setSelectedStudent(student)
					setFormOpen(true)
				}}
				onDelete={(student) => {
					setSelectedStudent(student)
					setDeleteDialogOpen(true)
				}}
			/>

			<StudentForm
				open={formOpen}
				onOpenChange={(open) => {
					setFormOpen(open)
					if (!open) setSelectedStudent(undefined)
				}}
				student={selectedStudent}
				setFormOpen={setFormOpen}
			/>

			<DeleteStudentDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onConfirm={handleDelete}
				studentName={selectedStudent?.name ?? ''}
			/>
		</>
	)
}
