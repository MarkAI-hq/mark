// 'use client'

// import Link from 'next/link'
// // import Image from 'next/image'
// import { ChartBarIcon } from 'lucide-react'

// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Exam } from '@/lib/types'
// import { Button } from '@/components/ui/button'

// export function ExamClient({ exam }: { exam: Exam }) {
// 	// const isPdf = exam.markingScheme?.toLowerCase().endsWith('.pdf')

// 	return (
// 		<div className='space-y-6'>
// 			<div className='flex justify-between items-center'>
// 				<h1 className='text-3xl font-bold'>{exam.title}</h1>
// 				<Link href={`/dashboard/exams/${exam.id}/results`}>
// 					<Button>
// 						<ChartBarIcon className='w-4 h-4 mr-2' />
// 						View Results
// 					</Button>
// 				</Link>
// 			</div>

// 			<Card className='col-span-full'>
// 				<CardHeader>
// 					<CardTitle>Marking Scheme</CardTitle>
// 				</CardHeader>
// 				<CardContent>
// 					{exam.markingScheme ? (
// 						// isPdf ? (
// 						// 	<iframe
// 						// 		src={exam.markingScheme}
// 						// 		className='w-full h-[600px]'
// 						// 		title='Marking Scheme (PDF)'
// 						// 	/>
// 						// ) : (
// 						// 	<Image
// 						// 		src={exam.markingScheme}
// 						// 		alt={exam.title}
// 						// 		className='w-full max-h-[600px] object-contain'
// 						// 		width={1000}
// 						// 		height={1000}
// 						// 	/>
// 						// )
// 						<iframe
// 							src={exam.markingScheme}
// 							className='w-full h-[600px]'
// 							title='Marking Scheme (PDF)'
// 						/>
// 					) : (
// 						<div className='text-muted-foreground'>
// 							Marking scheme will be displayed here once uploaded.
// 						</div>
// 					)}
// 				</CardContent>
// 			</Card>
// 		</div>
// 	)
// }

'use client'

import Link from 'next/link'
import { ChartBarIcon, PencilRuler } from 'lucide-react'
import { useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Exam } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { getStudentResults } from '@/lib/actions/exams';
import { useEffect } from 'react';
import { AnswerDialog } from '@/components/exams/answer-dialog';

export function ExamClient({ exam }: { exam: Exam }) {
	const [hasResults, setHasResults] = useState(false);
	const [isAnswerDialogOpen, setIsAnswerDialogOpen] = useState(false);

	useEffect(() => {
		getStudentResults(exam.id).then(({ data }) => {
			if (data && data.length > 0) {
				setHasResults(true);
			} else {
				setHasResults(false);
			}
		});
	}, [exam.id]);

	const handleGradeClick = () => {
		setIsAnswerDialogOpen(true);
	};

	return (
		<div className='space-y-6'>
			<div className='flex justify-between items-center'>
				<h1 className='text-3xl font-bold'>{exam.title}</h1>
				{hasResults ? (
					<Link href={`/dashboard/exams/${exam.id}/results`}>
						<Button>
							<ChartBarIcon className='w-4 h-4 mr-2' />
							View Results
						</Button>
					</Link>
				) : (
					<Button onClick={handleGradeClick}>
						<PencilRuler className='w-4 h-4 mr-2' />
						Grade Exam
					</Button>
				)}
			</div>

			<Card className='col-span-full'>
				<CardHeader>
					<CardTitle>Marking Scheme</CardTitle>
				</CardHeader>
				<CardContent>
					{exam.markingScheme ? (
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

			<AnswerDialog
				open={isAnswerDialogOpen}
				onOpenChange={setIsAnswerDialogOpen}
				examId={exam.id}
			/>
		</div>
	)
}