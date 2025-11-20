'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useHotkeys } from 'react-hotkeys-hook'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { Exam, Subject } from '@/lib/types'

const formSchema = z.object({
	title: z.string().min(2, {
		message: 'Title must be at least 2 characters.'
	}),
	courseId: z.string({
		required_error: 'Please select a subject.'
	}),
	totalMarks: z.coerce
		.number()
		.min(1, { message: 'Total marks must be at least 1.' }),
	questionCount: z.coerce
		.number()
		.min(1, { message: 'Question count must be at least 1.' }),
	description: z.string().optional()
})

type FormData = z.infer<typeof formSchema>

interface ExamFormProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	initialData?: Exam
	subjects: Subject[]
	onSubmit: (data: FormData) => Promise<void>
}

export function ExamForm({
	open,
	onOpenChange,
	initialData,
	subjects,
	onSubmit
}: ExamFormProps) {
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: initialData || {
			title: '',
			courseId: '',
			totalMarks: 100,
			questionCount: 1,
			description: ''
		}
	})

	useHotkeys('mod+enter', () => {
		if (open && !form.formState.isSubmitting) {
			form.handleSubmit(onSubmit)()
		}
	}, {
		preventDefault: true,
		enableOnFormTags: true,
		description: 'Submit form'
	})

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{initialData ? 'Edit Exam' : 'Create Exam'}
					</DialogTitle>
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
										<Input
											placeholder='Midterm Exam'
											{...field}
										/>
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
												<SelectItem
													key={subject.id}
													value={subject.id}
												>
													{subject.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className='grid grid-cols-2 gap-4'>
							<FormField
								control={form.control}
								name='totalMarks'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Total Marks</FormLabel>
										<FormControl>
											<Input
												type='number'
												min={1}
												placeholder='100'
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='questionCount'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Question Count</FormLabel>
										<FormControl>
											<Input
												type='number'
												min={1}
												placeholder='10'
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name='description'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder='Brief description of the exam'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className='flex justify-end space-x-2'>
							<Button
								type='button'
								variant='outline'
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={form.formState.isSubmitting}>
								{form.formState.isSubmitting
									? 'Saving...'
									: initialData
									? 'Save Changes'
									: 'Create Exam'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
} 