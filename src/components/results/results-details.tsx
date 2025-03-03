'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StudentResult } from '@/lib/types'
import { getStudentResults } from '@/lib/actions/exams'

export function ExamResults({ examId }: { examId: string }) {
	const [results, setResults] = useState<StudentResult[]>([])
	const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(
		null
	)

	useEffect(() => {
		getStudentResults(examId).then(({ data }) => {
			if (data) setResults(data)
		})
	}, [examId])

	return (
		<Tabs defaultValue='summary' className='w-full'>
			<TabsList className='grid w-full grid-cols-2'>
				<TabsTrigger value='summary'>Summary</TabsTrigger>
				<TabsTrigger value='details' disabled={!selectedStudent}>
					{selectedStudent
						? `${selectedStudent.studentName}'s Details`
						: 'Student Details'}
				</TabsTrigger>
			</TabsList>
			<TabsContent value='summary'>
				<SummaryTable students={results} onSelectStudent={setSelectedStudent} />
			</TabsContent>
			<TabsContent value='details'>
				{selectedStudent && <StudentDetails student={selectedStudent} />}
			</TabsContent>
		</Tabs>
	)
}

function SummaryTable({
	students,
	onSelectStudent
}: {
	students: StudentResult[]
	onSelectStudent: (student: StudentResult) => void
}) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Student Name</TableHead>
					<TableHead>Total Score</TableHead>
					<TableHead>Action</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{students.map((student, index) => (
					<TableRow key={index}>
						<TableCell>{student.studentName}</TableCell>
						<TableCell>
							<Badge variant={student?.score >= 10 ? 'default' : 'destructive'}>
								{student.score}/13
							</Badge>
						</TableCell>
						<TableCell>
							<Button onClick={() => onSelectStudent(student)}>
								View Details
							</Button>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}

function StudentDetails({ student }: { student: StudentResult }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex justify-between items-center'>
					<span>{student.studentName}</span>
					<Badge variant={student?.score >= 10 ? 'default' : 'destructive'}>
						Score: {student?.score}/13
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className='mb-4 text-sm text-gray-600 dark:text-gray-300'>
					{student.feedback}
				</p>
				<Accordion type='single' collapsible className='w-full'>
					<AccordionItem value='questions'>
						<AccordionTrigger>Question Details</AccordionTrigger>
						<AccordionContent>
							<div className='space-y-4'>
								{student.questions.map((q, qIndex) => (
									<div key={qIndex} className='border-b pb-2'>
										<div className='flex justify-between items-center mb-2'>
											<span className='font-semibold'>{q.question}</span>
											<Badge
												variant={q?.score === 1 ? 'default' : 'destructive'}
											>
												Score: {q?.score}/1
											</Badge>
										</div>
										<p className='text-sm mb-1'>{q.feedback}</p>
										{q.issues.length > 0 && (
											<div className='text-sm text-red-500 dark:text-red-400'>
												Issues: {q.issues.join(', ')}
											</div>
										)}
									</div>
								))}
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</CardContent>
		</Card>
	)
}
