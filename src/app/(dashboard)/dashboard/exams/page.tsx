import { Metadata } from 'next'

import { ExamsClient } from './exams-client'
import { getExams } from '@/lib/actions/exams'
import { getSubjects } from '@/lib/actions/subjects'
import { getStudents } from '@/lib/actions/students'

export const metadata: Metadata = {
	title: 'Exams - Mark',
	description: 'Manage your exams'
}

export default async function ExamsPage() {
	const [
		{ data: exams },
		{ data: subjects },
		{ data: students }
	] = await Promise.all([
		getExams(),
		getSubjects(),
		getStudents()
	])

	return (
		<div className='flex-1 space-y-4 p-8 pt-6'>
			<div className='flex items-center justify-between'>
				<h2 className='text-3xl font-bold tracking-tight'>Exams</h2>
			</div>
			<ExamsClient 
				exams={exams ?? []} 
				subjects={subjects ?? []} 
				students={students ?? []}
			/>
		</div>
	)
}
