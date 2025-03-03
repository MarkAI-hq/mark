'use client'

import Link from 'next/link'
// import Image from 'next/image'
import { ChartBarIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Exam } from '@/lib/types'
import { Button } from '@/components/ui/button'

export function ExamClient({ exam }: { exam: Exam }) {
	// const isPdf = exam.markingScheme?.toLowerCase().endsWith('.pdf')

	return (
		<div className='space-y-6'>
			<div className='flex justify-between items-center'>
				<h1 className='text-3xl font-bold'>{exam.title}</h1>
				<Link href={`/dashboard/exams/${exam.id}/results`}>
					<Button>
						<ChartBarIcon className='w-4 h-4 mr-2' />
						View Results
					</Button>
				</Link>
			</div>

			<Card className='col-span-full'>
				<CardHeader>
					<CardTitle>Marking Scheme</CardTitle>
				</CardHeader>
				<CardContent>
					{exam.markingScheme ? (
						// isPdf ? (
						// 	<iframe
						// 		src={exam.markingScheme}
						// 		className='w-full h-[600px]'
						// 		title='Marking Scheme (PDF)'
						// 	/>
						// ) : (
						// 	<Image
						// 		src={exam.markingScheme}
						// 		alt={exam.title}
						// 		className='w-full max-h-[600px] object-contain'
						// 		width={1000}
						// 		height={1000}
						// 	/>
						// )
						<iframe
							src={exam.markingScheme}
							className='w-full h-[600px]'
							title='Marking Scheme (PDF)'
						/>
					) : (
						<div className='text-muted-foreground'>
							Marking scheme will be displayed here once uploaded.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
