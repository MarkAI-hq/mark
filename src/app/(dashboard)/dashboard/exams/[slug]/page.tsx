import { Metadata } from 'next'

import { ExamClient } from './exam-client'
import { getExam } from '@/lib/actions/exams'

export const metadata: Metadata = {
	title: 'Exam Details - Mark',
	description: 'View exam details and questions'
}

export default async function ExamPage({
	params
}: {
	params: Promise<{ slug: string }>
}) {
	const slug = (await params).slug
	const { data: exam } = await getExam(slug)

	if (!exam) {
		return (
			<div className='flex h-[calc(100vh-80px)] items-center justify-center'>
				<div className='text-center'>
					<h2 className='text-2xl font-semibold'>Exam Not Found</h2>
					<p className='mt-2 text-muted-foreground'>
						The exam you are looking for does not exist or has been removed.
					</p>
				</div>
			</div>
		)
	}

	return <ExamClient exam={exam} />
}
