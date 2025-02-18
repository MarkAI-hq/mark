'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { z } from 'zod'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription
} from '@/components/ui/dialog'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Subject, Exam } from '@/lib/types'
import { createExam, updateExam } from '@/lib/actions/exams'
import { cn } from '@/lib/utils'

// Schema for create
const createSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	courseId: z.string().uuid('Please select a subject'),
	scheme: z
		.instanceof(File, { message: 'Please upload a marking guide' })
		.refine(
			(file) => file.type === 'application/pdf',
			'Only PDF files are allowed'
		)
		.refine(
			(file) => file.size <= 5 * 1024 * 1024,
			'File size must be less than 5MB'
		)
})

// Schema for update - all fields optional but at least one required
const updateSchema = z
	.object({
		title: z.string().min(1, 'Title is required').optional(),
		courseId: z.string().uuid('Please select a subject').optional(),
		scheme: z
			.instanceof(File)
			.refine(
				(file) => file.type === 'application/pdf',
				'Only PDF files are allowed'
			)
			.refine(
				(file) => file.size <= 5 * 1024 * 1024,
				'File size must be less than 5MB'
			)
			.optional()
	})
	.refine((data) => Object.values(data).some(Boolean), {
		message: 'At least one field must be provided'
	})

interface ExamDialogProps {
	open: boolean
	subjects: Subject[]
	onOpenChange: (open: boolean) => void
	exam?: Exam
}

export function ExamDialog({
	open,
	subjects,
	onOpenChange,
	exam
}: ExamDialogProps) {
	const router = useRouter()
	const [pdfPreview, setPdfPreview] = useState<string>()

	const form = useForm<
		z.infer<typeof createSchema> | z.infer<typeof updateSchema>
	>({
		resolver: zodResolver(exam?.id ? updateSchema : createSchema),
		defaultValues: {
			title: exam?.title || '',
			courseId: exam?.courseId || '',
			scheme: undefined
		}
	})

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			const file = acceptedFiles[0]
			if (file) {
				form.setValue('scheme', file)

				const reader = new FileReader()
				reader.onloadend = () => {
					setPdfPreview(reader.result as string)
				}
				reader.readAsDataURL(file)
			}
		},
		[form]
	)

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			'application/pdf': ['.pdf']
		},
		multiple: false,
		maxSize: 5 * 1024 * 1024 // 5MB
	})

	const clearFile = () => {
		form.setValue('scheme', undefined)
		setPdfPreview(undefined)
	}

	async function onSubmit(
		data: z.infer<typeof createSchema> | z.infer<typeof updateSchema>
	) {
		const formData = new FormData()
		// Only append fields that have values
		if (data.title) formData.append('title', data.title)
		if (data.courseId) formData.append('courseId', data.courseId)
		if (data.scheme) formData.append('scheme', data.scheme)

		const { data: saved, error } = exam?.id
			? await updateExam(exam.id, formData)
			: await createExam(formData)

		if (saved) {
			onOpenChange(false)
			form.reset()
			setPdfPreview(undefined)
			toast.success('Success', {
				description: exam?.id
					? 'Exam updated successfully'
					: 'Exam created successfully'
			})
			router.push(`/dashboard/exams/${saved.id}`)
		}

		if (error) {
			toast.error('Error', {
				description: error.message
			})
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>{exam?.id ? 'Edit Exam' : 'Create Exam'}</DialogTitle>
					<DialogDescription>
						{exam?.id
							? 'Update the exam details. At least one field must be changed.'
							: 'Add a new exam to your course.'}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						<FormField
							control={form.control}
							name='title'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Input placeholder='Enter exam title' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='courseId'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Subject</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder='Select a subject' />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{subjects.map((subject) => (
												<SelectItem key={subject.id} value={subject.id}>
													{subject.title}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='scheme'
							render={({ field: { value } }) => (
								<FormItem>
									<FormLabel>Marking / Assessment Guide</FormLabel>
									<FormControl>
										<div
											{...getRootProps({
												className: cn(
													'relative cursor-pointer rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 transition-colors hover:border-gray-400 dark:hover:border-gray-600',
													isDragActive && 'border-primary bg-primary/5'
												)
											})}
										>
											{/* Do not override getInputProps */}
											<input {...getInputProps()} />
											<div className='flex flex-col items-center justify-center gap-2 text-center'>
												<Upload className='h-8 w-8 text-muted-foreground' />
												{value || pdfPreview ? (
													<div className='relative w-full max-w-sm'>
														<div className='flex items-center justify-between rounded-md border bg-muted p-2'>
															<div className='flex items-center gap-2'>
																<div className='h-10 w-10 shrink-0 rounded bg-white'>
																	<embed
																		src={pdfPreview}
																		type='application/pdf'
																		className='h-full w-full rounded object-cover'
																	/>
																</div>
																<div className='flex flex-col'>
																	<p className='text-sm font-medium'>
																		{value?.name}
																	</p>
																	<p className='text-xs text-muted-foreground'>
																		{((value?.size ?? 0) / 1024 / 1024).toFixed(
																			2
																		)}
																		MB
																	</p>
																</div>
															</div>
															<Button
																type='button'
																variant='ghost'
																size='icon'
																className='h-8 w-8'
																onClick={(e) => {
																	e.stopPropagation()
																	clearFile()
																}}
															>
																<X className='h-4 w-4' />
															</Button>
														</div>
													</div>
												) : (
													<div className='text-sm'>
														<p className='font-medium'>
															{isDragActive
																? 'Drop the file here'
																: 'Click or drag & drop'}
														</p>
														<p className='text-muted-foreground'>
															PDF file (max 5MB)
														</p>
													</div>
												)}
											</div>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className='flex justify-end gap-4 pt-4'>
							<Button
								type='button'
								variant='outline'
								onClick={() => {
									onOpenChange(false)
									form.reset()
									setPdfPreview(undefined)
								}}
								disabled={form.formState.isSubmitting}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={form.formState.isSubmitting}>
								{form.formState.isSubmitting
									? exam?.id
										? 'Updating...'
										: 'Creating...'
									: exam?.id
									? 'Update Exam'
									: 'Create Exam'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
