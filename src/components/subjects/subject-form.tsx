'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Subject } from '@/lib/types'

const formSchema = z.object({
	code: z.string().min(1, 'Code is required'),
	title: z.string().min(1, 'Title is required'),
	description: z.string().optional(),
})

export type SubjectData = z.infer<typeof formSchema>

interface SubjectFormProps {
	open: boolean
	initialData?: Subject
	onOpenChange: (open: boolean) => void
	onSubmit: (data: SubjectData) => Promise<void>
}

export function SubjectForm({ open, initialData, onOpenChange, onSubmit }: SubjectFormProps) {
	const form = useForm<SubjectData>({
		resolver: zodResolver(formSchema),
		defaultValues: initialData || {
			code: '',
			title: '',
			description: '',
		},
	})

	useHotkeys('enter', () => {
		form.handleSubmit(onSubmit)()
	}, {
		enableOnFormTags: true,
		preventDefault: true,
		description: 'Submit form'
	})

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{initialData ? 'Edit Subject' : 'Create Subject'}
					</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						<FormField
							control={form.control}
							name='code'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Code</FormLabel>
									<FormControl>
										<Input placeholder='Enter subject code' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='title'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Input placeholder='Enter subject title' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='description'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder='Enter subject description'
											className='resize-none'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className='flex justify-end gap-4 pt-4'>
							<Button
								type='button'
								variant='outline'
								onClick={() => onOpenChange(false)}
								disabled={form.formState.isSubmitting}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={form.formState.isSubmitting}>
								{form.formState.isSubmitting
									? initialData
										? 'Saving...'
										: 'Creating...'
									: initialData
									? 'Save Changes'
									: 'Create Subject'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
} 