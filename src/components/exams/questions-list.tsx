'use client'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from '@/components/ui/accordion'
import { Question } from '@/lib/types'

interface QuestionsListProps {
	questions: Question[]
}

export function QuestionsList({ questions }: QuestionsListProps) {
	const sortedQuestions = [...questions].sort(
		(a, b) => a.questionNumber - b.questionNumber
	)

	return (
		<Accordion type='single' collapsible className='w-full'>
			{sortedQuestions.map((question) => (
				<AccordionItem key={question.id} value={question.id}>
					<AccordionTrigger className='hover:no-underline'>
						<div className='flex items-center gap-4 text-left'>
							<span className='font-medium'>Q{question.questionNumber}.</span>
							<span className='text-sm font-normal'>{question.text}</span>
							<span className='ml-auto text-sm text-muted-foreground'>
								{question.totalMarks} marks
							</span>
						</div>
					</AccordionTrigger>
					<AccordionContent>
						<div className='space-y-4 px-4 pt-2'>
							<h4 className='font-medium'>Marking Components:</h4>
							<ul className='list-inside list-disc space-y-2 text-sm'>
								{question.components.map((component, index) => (
									<li key={index}>
										{component.description}
										<span className='ml-2 text-muted-foreground'>
											({component.marks}{' '}
											{component.marks === 1 ? 'mark' : 'marks'})
										</span>
									</li>
								))}
							</ul>
						</div>
					</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	)
}
