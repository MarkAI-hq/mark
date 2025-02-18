import { Metadata } from 'next'
import { ExamResultsClient } from './results-client'
import { getExam } from '@/lib/actions/exams'

export const metadata: Metadata = {
	title: 'Exam Results - Mark',
	description: 'View exam results and analytics'
}

export default async function ExamResultsPage({
	params
}: {
	params: Promise<{ slug: string }>
}) {
	const slug = (await params).slug
	const { data: exam } = await getExam(slug)

	return (
		<div className='flex-1 space-y-4'>
			<div className='flex items-center justify-between'>
				<h2 className='text-3xl font-bold tracking-tight'>
					Results: {exam?.title}
				</h2>
			</div>
			<ExamResultsClient examId={slug} />
		</div>
	)
}
