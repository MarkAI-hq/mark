'use client'

import { ChartBarIcon } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuestionsList } from '@/components/exams/questions-list'
import { Exam } from '@/lib/types'
import { Button } from '@/components/ui/button'

export function ExamClient({ exam }: { exam: Exam }) {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">{exam.title}</h1>
				<Link href={`/dashboard/exams/${exam.id}/results`}>
					<Button>
						<ChartBarIcon className="w-4 h-4 mr-2" />
						View Results
					</Button>
				</Link>
			</div>
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Subject</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{exam.courseName}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Total Marks</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{exam.totalMarks}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Questions</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{exam.questionCount}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Answers Graded</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>0</div>
					</CardContent>
				</Card>

				<Card className='col-span-full'>
					<CardHeader>
						<CardTitle>Questions</CardTitle>
					</CardHeader>
					<CardContent>
						{exam.questions ? (
							<QuestionsList questions={exam.questions} />
						) : (
							<div className='text-muted-foreground'>
								Questions will be displayed here once the assessment guide is
								processed.
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
