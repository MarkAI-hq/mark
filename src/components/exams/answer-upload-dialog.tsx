'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { Upload, X, FileText } from 'lucide-react'
import Image from 'next/image'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { uploadAnswers } from '@/lib/actions/exams'
import { cn } from '@/lib/utils'
import { Student } from '@/lib/types'

interface AnswerUploadDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	examId: string
	students: Student[]
}

interface FileWithPreview {
	file: File
	preview?: string
	studentId?: string
}

export function AnswerUploadDialog({
	open,
	onOpenChange,
	examId,
	students
}: AnswerUploadDialogProps) {
	const [files, setFiles] = useState<FileWithPreview[]>([])
	const [uploading, setUploading] = useState(false)

	const onDrop = useCallback((acceptedFiles: File[]) => {
		setFiles((prev) => [
			...prev,
			...acceptedFiles.map((file) => ({
				file, // Preserve the original File instance
				preview: file.type.startsWith('image/')
					? URL.createObjectURL(file)
					: undefined
			}))
		])
	}, [])

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			'image/*': ['.jpg', '.jpeg', '.png'],
			'application/pdf': ['.pdf']
		},
		maxSize: 5 * 1024 * 1024 // 5MB
	})

	const handleStudentSelect = (fileIndex: number, studentId: string) => {
		setFiles((prev) =>
			prev.map((file, index) =>
				index === fileIndex ? { ...file, studentId } : file
			)
		)
	}

	const removeFile = (index: number) => {
		setFiles((prev) => {
			const newFiles = [...prev]
			const file = newFiles[index]
			if (file.preview) {
				URL.revokeObjectURL(file.preview)
			}
			newFiles.splice(index, 1)
			return newFiles
		})
	}

	const handleUpload = async () => {
		// Validate that all files have students assigned
		const unassignedFiles = files.filter((file) => !file.studentId)
		if (unassignedFiles.length > 0) {
			toast.error('Missing student assignments', {
				description: 'Please assign a student to each file before uploading'
			})
			return
		}

		setUploading(true)

		// Create FormData
		const formData = new FormData()

		// Create answers array
		const answers = files.map((item) => ({
			studentId: item.studentId!,
			filename: item.file.name
		}))

		// Add answers array as JSON string
		formData.append('answers', JSON.stringify(answers))

		// Add all files
		files.forEach((item) => {
			formData.append('files', item.file)
		})

		const { data, error } = await uploadAnswers(examId, formData)

		if (error) {
			toast.error('Error', {
				description: error.message
			})
		}

		if (data) {
			toast.success('Success', {
				description: 'Answer sheets uploaded successfully'
			})
			onOpenChange(false)
		}

		setUploading(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>Upload Answer Sheets</DialogTitle>
				</DialogHeader>

				<div className='space-y-4'>
					{/* Dropzone */}
					<div
						{...getRootProps()}
						className={cn(
							'border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
							'hover:border-primary/50 hover:bg-muted/50',
							isDragActive && 'border-primary/50 bg-muted/50'
						)}
					>
						<input {...getInputProps()} />
						<div className='flex flex-col items-center justify-center gap-2 text-center'>
							<Upload className='h-8 w-8 text-muted-foreground' />
							<p className='text-sm text-muted-foreground'>
								Drag & drop files here, or click to select files
							</p>
							<p className='text-xs text-muted-foreground'>
								Supported formats: JPG, PNG, PDF (up to 5MB)
							</p>
						</div>
					</div>

					{/* File List */}
					<div className='space-y-3'>
						{files.map((file, index) => (
							<div
								key={index}
								className='flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 border rounded-lg'
							>
								{/* File Info */}
								<div className='flex items-center gap-2 min-w-0'>
									{file.preview ? (
										<Image
											src={file.preview}
											alt='Preview'
											className='w-8 h-8 object-cover rounded'
											width={32}
											height={32}
										/>
									) : (
										<FileText className='w-8 h-8' />
									)}
									<span className='text-sm truncate max-w-[150px] sm:max-w-[200px]'>
										{file.file.name}
									</span>
								</div>

								{/* Student Selection & Remove */}
								<div className='flex items-center gap-2 w-full sm:w-auto ml-auto'>
									<Select
										value={file.studentId}
										onValueChange={(value) => handleStudentSelect(index, value)}
									>
										<SelectTrigger className='w-full sm:w-[180px]'>
											<SelectValue placeholder='Select student' />
										</SelectTrigger>
										<SelectContent>
											{students.map((student) => (
												<SelectItem
													key={student.id}
													value={student.id}
													disabled={files.some(
														(f) => f.studentId === student.id && f !== file
													)}
												>
													{student.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>

									<Button
										variant='ghost'
										size='icon'
										onClick={() => removeFile(index)}
									>
										<X className='w-4 h-4' />
									</Button>
								</div>
							</div>
						))}

						{files.length > 0 && (
							<p className='text-xs text-muted-foreground'>
								{files.filter((f) => !f.studentId).length} files need student
								assignment
							</p>
						)}
					</div>

					{/* Actions */}
					<div className='flex justify-end gap-4 pt-4'>
						<Button
							variant='outline'
							onClick={() => {
								onOpenChange(false)
								setFiles([])
							}}
							disabled={uploading}
						>
							Cancel
						</Button>
						<Button
							onClick={handleUpload}
							disabled={files.length === 0 || uploading}
						>
							{uploading ? 'Processing...' : 'Submit'}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
