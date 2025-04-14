// 'use client'

// import { useCallback, useState } from 'react'
// import { useDropzone } from 'react-dropzone'
// import { toast } from 'sonner'
// import { Upload, X, FileText } from 'lucide-react'
// import Image from 'next/image'

// import {
// 	Dialog,
// 	DialogContent,
// 	DialogHeader,
// 	DialogTitle
// } from '@/components/ui/dialog'
// import { Button } from '@/components/ui/button'
// import { uploadAnswers } from '@/lib/actions/exams'
// import { cn } from '@/lib/utils'

// interface AnswerDialogProps {
// 	open: boolean
// 	onOpenChange: (open: boolean) => void
// 	examId: string
// }

// interface FileWithPreview {
// 	answer: File
// 	preview?: string
// 	studentId?: string
// }

// export function AnswerDialog({
// 	open,
// 	onOpenChange,
// 	examId
// }: AnswerDialogProps) {
// 	const [answers, setAnswers] = useState<FileWithPreview[]>([])
// 	const [uploading, setUploading] = useState(false)

// 	const onDrop = useCallback((acceptedFiles: File[]) => {
// 		setAnswers((prev) => [
// 			...prev,
// 			...acceptedFiles.map((file) => ({
// 				answer: file, // Preserve the original File instance
// 				preview: file.type.startsWith('image/')
// 					? URL.createObjectURL(file)
// 					: undefined
// 			}))
// 		])
// 	}, [])

// 	const { getRootProps, getInputProps, isDragActive } = useDropzone({
// 		onDrop,
// 		accept: {
// 			'image/*': ['.jpg', '.jpeg', '.png'],
// 			'application/pdf': ['.pdf']
// 		},
// 		maxSize: 5 * 1024 * 1024 // 5MB
// 	})

// 	const removeFile = (index: number) => {
// 		setAnswers((prev) => {
// 			const newAnswers = [...prev]
// 			const answer = newAnswers[index]
// 			if (answer.preview) {
// 				URL.revokeObjectURL(answer.preview)
// 			}
// 			newAnswers.splice(index, 1)
// 			return newAnswers
// 		})
// 	}

// 	const handleUpload = async () => {
// 		setUploading(true)

// 		// Create FormData
// 		const formData = new FormData()

// 		// Add all files
// 		answers.forEach((item) => {
// 			formData.append('answers', item.answer)
// 		})

// 		const { data, error } = await uploadAnswers(examId, formData)

// 		if (error) {
// 			toast.error('Error', {
// 				description: error.message
// 			})
// 		}

// 		if (data) {
// 			toast.success('Success', {
// 				description: 'Answer sheets uploaded successfully'
// 			})
// 			onOpenChange(false)
// 		}

// 		setUploading(false)
// 	}

// 	return (
// 		<Dialog open={open} onOpenChange={onOpenChange}>
// 			<DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
// 				<DialogHeader>
// 					<DialogTitle>Upload Answer Sheets</DialogTitle>
// 				</DialogHeader>

// 				<div className='space-y-4'>
// 					{/* Dropzone */}
// 					<div
// 						{...getRootProps()}
// 						className={cn(
// 							'border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
// 							'hover:border-primary/50 hover:bg-muted/50',
// 							isDragActive && 'border-primary/50 bg-muted/50'
// 						)}
// 					>
// 						<input {...getInputProps()} />
// 						<div className='flex flex-col items-center justify-center gap-2 text-center'>
// 							<Upload className='h-8 w-8 text-muted-foreground' />
// 							<p className='text-sm text-muted-foreground'>
// 								Drag & drop files here, or click to select files
// 							</p>
// 							<p className='text-xs text-muted-foreground'>
// 								Supported formats: JPG, PNG, PDF (up to 5MB)
// 							</p>
// 						</div>
// 					</div>

// 					{/* File List */}
// 					<div className='space-y-3'>
// 						{answers.map((answer, index) => (
// 							<div
// 								key={index}
// 								className='flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 border rounded-lg'
// 							>
// 								{/* File Info */}
// 								<div className='flex items-center gap-2 min-w-0'>
// 									{answer.preview ? (
// 										<Image
// 											src={answer.preview}
// 											alt='Preview'
// 											className='w-8 h-8 object-cover rounded'
// 											width={32}
// 											height={32}
// 										/>
// 									) : (
// 										<FileText className='w-8 h-8' />
// 									)}
// 									<span className='text-sm truncate max-w-[150px] sm:max-w-[200px]'>
// 										{answer.answer.name}
// 									</span>
// 								</div>

// 								{/* Remove */}
// 								<div className='flex items-center gap-2 w-full sm:w-auto ml-auto'>
// 									<Button
// 										variant='ghost'
// 										size='icon'
// 										onClick={() => removeFile(index)}
// 									>
// 										<X className='w-4 h-4' />
// 									</Button>
// 								</div>
// 							</div>
// 						))}

// 						{answers.length > 0 && (
// 							<p className='text-xs text-muted-foreground'>
// 								{answers.filter((a) => !a.studentId).length} files need student
// 								assignment
// 							</p>
// 						)}
// 					</div>

// 					{/* Actions */}
// 					<div className='flex justify-end gap-4 pt-4'>
// 						<Button
// 							variant='outline'
// 							onClick={() => {
// 								onOpenChange(false)
// 								setAnswers([])
// 							}}
// 							disabled={uploading}
// 						>
// 							Cancel
// 						</Button>
// 						<Button
// 							onClick={handleUpload}
// 							disabled={answers.length === 0 || uploading}
// 						>
// 							{uploading ? 'Processing...' : 'Submit'}
// 						</Button>
// 					</div>
// 				</div>
// 			</DialogContent>
// 		</Dialog>
// 	)
// }

'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { Upload, X, FileText } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { uploadAnswers } from '@/lib/actions/exams'
import { cn } from '@/lib/utils'

interface AnswerDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	examId: string
}

interface FileWithPreview {
	answer: File
	preview?: string
	studentId?: string
}

export function AnswerDialog({
	open,
	onOpenChange,
	examId
}: AnswerDialogProps) {
	const [answers, setAnswers] = useState<FileWithPreview[]>([])
	const [uploading, setUploading] = useState(false)
	const router = useRouter();

	const onDrop = useCallback((acceptedFiles: File[]) => {
		setAnswers((prev) => [
			...prev,
			...acceptedFiles.map((file) => ({
				answer: file,
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
		maxSize: 5 * 1024 * 1024
	})

	const removeFile = (index: number) => {
		setAnswers((prev) => {
			const newAnswers = [...prev]
			const answer = newAnswers[index]
			if (answer.preview) {
				URL.revokeObjectURL(answer.preview)
			}
			newAnswers.splice(index, 1)
			return newAnswers
		})
	}

	const handleUpload = async () => {
		setUploading(true)

		const formData = new FormData()
		answers.forEach((item) => {
			formData.append('answers', item.answer)
		})

		const { data, error } = await uploadAnswers(examId, formData)

		if (error) {
			toast.error('Error', {
				description: error.message
			})
		}

		if (data) {
			toast.success('Grading done', {
				description: 'Answer sheets uploaded and processed successfully.'
			})
			onOpenChange(false)
			router.push(`/dashboard/exams/${examId}/results`);
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
					{/* Dropzone (Upload Box) */}
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
						{answers.map((answer, index) => (
							<div
								key={index}
								className='flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 border rounded-lg'
							>
								<div className='flex items-center gap-2 min-w-0'>
									{answer.preview ? (
										<Image
											src={answer.preview}
											alt='Preview'
											className='w-8 h-8 object-cover rounded'
											width={32}
											height={32}
										/>
									) : (
										<FileText className='w-8 h-8' />
									)}
									<span className='text-sm truncate max-w-[150px] sm:max-w-[200px]'>
										{answer.answer.name}
									</span>
								</div>

								<div className='flex items-center gap-2 w-full sm:w-auto ml-auto'>
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

						{answers.length > 0 && (
							<p className='text-xs text-muted-foreground'>
								{answers.filter((a) => !a.studentId).length} files need student assignment
							</p>
						)}
					</div>

					{/* Actions */}
					<div className='flex justify-end gap-4 pt-4'>
						<Button
							variant='outline'
							onClick={() => {
								onOpenChange(false)
								setAnswers([])
							}}
							disabled={uploading}
						>
							Cancel
						</Button>
						<Button
							onClick={handleUpload}
							disabled={answers.length === 0 || uploading}
						>
							{uploading ? 'Processing...' : 'Submit'}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}