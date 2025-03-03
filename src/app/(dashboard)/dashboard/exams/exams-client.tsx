'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'

import { Button } from '@/components/ui/button'
import { ExamsTable } from '@/components/exams/exams-table'
import { DeleteSubjectDialog } from '@/components/subjects/delete-subject-dialog'
import { Exam, Subject } from '@/lib/types'
import { deleteExam } from '@/lib/actions/exams'
import { ExamDialog } from '@/components/exams/exam-dialog'
import { AnswerDialog } from '@/components/exams/answer-dialog'

interface ExamsClientProps {
	exams: Exam[]
	subjects: Subject[]
}

export function ExamsClient({ exams, subjects }: ExamsClientProps) {
	const [selectedExam, setSelectedExam] = useState<Exam>()
	const [dialogOpen, setDialogOpen] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

	const resetState = () => {
		setSelectedExam(undefined)
		setDialogOpen(false)
		setDeleteDialogOpen(false)
		setUploadDialogOpen(false)
	}

	useHotkeys('n', () => setDialogOpen(true), {
		preventDefault: true,
		description: 'Create new exam'
	})

	useHotkeys('escape', resetState, {
		preventDefault: true,
		description: 'Close dialogs'
	})

	const handleDelete = async () => {
		if (!selectedExam) return

		const { data, error } = await deleteExam(selectedExam.id)
		if (data) {
			resetState()
			toast.success('Exam deleted successfully')
		}

		if (error) {
			toast.error('Error', { description: error.message })
		}
	}

	return (
		<>
			<ExamsTable
				data={exams}
				onEdit={(exam) => {
					setSelectedExam(exam)
					setDialogOpen(true)
				}}
				onDelete={(exam) => {
					setSelectedExam(exam)
					setDeleteDialogOpen(true)
				}}
				onUpload={(exam) => {
					setSelectedExam(exam)
					setUploadDialogOpen(true)
				}}
				headerSlot={
					<Button onClick={() => setDialogOpen(true)}>
						<Plus className='mr-2 h-4 w-4' />
						New Exam
					</Button>
				}
			/>

			<DeleteSubjectDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onConfirm={handleDelete}
				subjectTitle={selectedExam?.title || ''}
			/>

			<ExamDialog
				key={selectedExam?.id || 'new'}
				open={dialogOpen}
				subjects={subjects}
				exam={selectedExam}
				onOpenChange={(open) => {
					setDialogOpen(open)
					if (!open) setSelectedExam(undefined)
				}}
			/>

			{selectedExam && (
				<AnswerDialog
					open={uploadDialogOpen}
					examId={selectedExam.id}
					onOpenChange={(open) => {
						setUploadDialogOpen(open)
						if (!open) setSelectedExam(undefined)
					}}
				/>
			)}
		</>
	)
}
