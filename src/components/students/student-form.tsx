'use client'

import { Dispatch, SetStateAction, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

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
import { Button } from '@/components/ui/button'
import { Student } from '@/lib/types'
import { createStudent, updateStudent } from '@/lib/actions/students'

const formSchema = z.object({
	name: z.string().min(2, {
		message: 'Name must be at least 2 characters.'
	}),
	class: z.string().min(1, {
		message: 'Class is required.'
	}),
	stream: z.string().optional()
})

type FormData = z.infer<typeof formSchema>

interface StudentFormProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	student?: Student
	setFormOpen: Dispatch<SetStateAction<boolean>>
}

export function StudentForm({
	open,
	onOpenChange,
	student,
	setFormOpen
}: StudentFormProps) {
	
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: student?.name || '',
			class: student?.class || '',
			stream: student?.stream || ''
		}
	})

	// Reset form when student prop changes
	useEffect(() => {
		if (student) {
			form.reset({
				name: student.name,
				class: student.class,
				stream: student.stream
			})
		}
	}, [form, student])

	const onSubmit = async (data: {
		name: string
		class: string
		stream?: string
	}) => {
		const { data: result, error } = student
			? await updateStudent(student.id, data)
			: await createStudent(data)

		if (error) {
			toast.error('Error', {
				description: error.message
			})
		}

		if (result) {
			toast.success('Success', {
				description: student
					? 'Student updated successfully'
					: 'Student created successfully'
			})
			form.reset()
			setFormOpen(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>
						{student ? 'Edit Student' : 'Add Student'}
					</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						<FormField
							control={form.control}
							name='name'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder='John Doe' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='class'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Class</FormLabel>
									<FormControl>
										<Input placeholder='Form 4' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='stream'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Stream (Optional)</FormLabel>
									<FormControl>
										<Input placeholder='East' {...field} />
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
								{form.formState.isSubmitting ? 'Saving...' : 'Save'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
