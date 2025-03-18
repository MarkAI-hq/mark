'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import QuestionDetails from './question-details'
import type { StudentResult } from '@/lib/types'


export default function StudentCard({ studentData }: { studentData: StudentResult }) {
	const [isExpanded, setIsExpanded] = useState(false)

	return (
		<Card className='overflow-hidden'>
			<CardContent className='p-0'>
				<div className='p-6'>
					<div className='flex justify-between items-start mb-4'>
						<h2 className='text-2xl font-bold'>{studentData?.studentName}</h2>
						<div className='text-right'>
							{/* <Badge
								className='font-semibold'
								variant={
									studentData.score >= studentData.maxTotalScore / 2 ? 'default' : 'destructive'
								}
							>
								Score: {studentData.totalScore}/{studentData.maxTotalScore}
							</Badge> */}
							<p className='font-semibold'>
								Score: {studentData?.totalScore}/{studentData?.maxTotalScore}
							</p>
						</div>
					</div>
					<p className='text-gray-700 dark:text-gray-300'>
						{studentData.feedback}
					</p>

					<button
						className='flex items-center mt-4 text-primary font-medium'
						onClick={() => setIsExpanded(!isExpanded)}
					>
						{isExpanded ? 'Hide Question Details' : 'Show Question Details'}
						{isExpanded ? (
							<ChevronUp className='ml-2 h-4 w-4' />
						) : (
							<ChevronDown className='ml-2 h-4 w-4' />
						)}
					</button>
				</div>

				{isExpanded && (
					<div className='border-t'>
						{studentData?.questions?.map((question, index) => (
							<QuestionDetails key={index} questionData={question} />
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
