'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'

import { Button } from '@/components/ui/button'
import { SubjectsTable } from '@/components/subjects/subjects-table'
import { SubjectData, SubjectForm } from '@/components/subjects/subject-form'
import { DeleteSubjectDialog } from '@/components/subjects/delete-subject-dialog'
import { Subject } from '@/lib/types'
import {
	createSubject,
	updateSubject,
	deleteSubject
} from '@/lib/actions/subjects'

export function SubjectsClient({ subjects }: { subjects: Subject[] }) {
	const [open, setOpen] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [selectedSubject, setSelectedSubject] = useState<Subject>()
	const [subjectToDelete, setSubjectToDelete] = useState<Subject>()

	// Keyboard shortcuts
	useHotkeys(
		'n',
		() => {
			setSelectedSubject(undefined)
			setOpen(true)
		},
		{
			preventDefault: true,
			description: 'Create new subject'
		}
	)

	useHotkeys(
		'escape',
		() => {
			setOpen(false)
			setDeleteDialogOpen(false)
			setSelectedSubject(undefined)
			setSubjectToDelete(undefined)
		},
		{
			preventDefault: true,
			description: 'Close dialogs'
		}
	)

	const handleCreate = async (data: SubjectData) => {
		const { data: subject, error } = await createSubject(data)

		if (subject) {
			setOpen(false)
			toast.success('Subject created successfully')
		}

		if (error) {
			toast.error('Failed to create subject', {
				description: error.message
			})
		}
	}

	const handleUpdate = async (data: SubjectData) => {
		if (!selectedSubject) return

		const { data: subject, error } = await updateSubject(
			selectedSubject.id,
			data
		)

		if (subject) {
			setOpen(false)
			setSelectedSubject(undefined)
			toast.success('Subject updated successfully')
		}

		if (error) {
			toast.error('Failed to update subject', {
				description: error.message
			})
		}
	}

	const handleDelete = async () => {
		if (!subjectToDelete) return

		const { data, error } = await deleteSubject(subjectToDelete.id)

		if (data) {
			setDeleteDialogOpen(false)
			setSubjectToDelete(undefined)
			toast.success('Sucess', {
				description: data.message
			})
		}

		if (error) {
			toast.error('Failed to delete subject', {
				description: error.message
			})
		}
	}

	return (
		<>
			<SubjectsTable
				data={subjects}
				onEdit={(subject) => {
					setSelectedSubject(subject)
					setOpen(true)
				}}
				onDelete={(subject) => {
					setSubjectToDelete(subject)
					setDeleteDialogOpen(true)
				}}
				headerSlot={
					<Button onClick={() => setOpen(true)}>
						<Plus className='mr-2 h-4 w-4' /> New Subject
					</Button>
				}
			/>

			<SubjectForm
				key={selectedSubject?.id || 'new'}
				open={open}
				onOpenChange={(open) => {
					setOpen(open)
					if (!open) setSelectedSubject(undefined)
				}}
				initialData={selectedSubject}
				onSubmit={selectedSubject ? handleUpdate : handleCreate}
			/>

			<DeleteSubjectDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onConfirm={handleDelete}
				subjectTitle={subjectToDelete?.title || ''}
			/>
		</>
	)
}
