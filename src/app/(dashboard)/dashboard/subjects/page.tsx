import { Metadata } from 'next'

import { SubjectsClient } from './subjects-client'
import { getSubjects } from '@/lib/actions/subjects'

export const metadata: Metadata = {
	title: 'Subjects - Mark',
	description: 'Manage subjects'
}

export default async function SubjectsPage() {
	const { data: subjects } = await getSubjects()

	return (
		<div className='flex-1 space-y-4 p-8 pt-6'>
			<div className='flex items-center justify-between mb-4'>
				<div className='text-3xl font-bold tracking-tight'>Subjects
					<h4 className='pt-3 text-lg font-normal text-muted-foreground'>Click the + New Subject button or press C to start grading.</h4>
				</div>
			</div>
			<SubjectsClient subjects={subjects ?? []} />
		</div>
	)
}
