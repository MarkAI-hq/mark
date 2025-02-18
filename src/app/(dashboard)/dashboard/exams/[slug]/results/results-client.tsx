'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResultsOverview } from '@/components/results/results-overview'
import { StudentResults } from '@/components/results/student-results'
import { QuestionAnalytics } from '@/components/results/question-analytics'
import { ExamStats } from '@/lib/types'
import { getExamStats } from '@/lib/actions/exams'

interface ExamResultsClientProps {
	examId: string
}

export function ExamResultsClient({ examId}: ExamResultsClientProps) {
	const [stats, setStats] = useState<ExamStats>()

	useEffect(() => {
		getExamStats(examId).then(({ data }) => {
			if (data) setStats(data)
		})
	}, [examId])

	if (!stats) return null

	return (
		<Tabs defaultValue='overview' className='space-y-4'>
			<TabsList>
				<TabsTrigger value='overview'>Overview</TabsTrigger>
				<TabsTrigger value='students'>Students</TabsTrigger>
				<TabsTrigger value='questions'>Questions</TabsTrigger>
			</TabsList>

			<TabsContent value='overview' className='space-y-4'>
				<ResultsOverview stats={stats} />
			</TabsContent>

			<TabsContent value='students' className='space-y-4'>
				<StudentResults examId={examId} />
			</TabsContent>

			<TabsContent value='questions' className='space-y-4'>
				<QuestionAnalytics examId={examId} />
			</TabsContent>
		</Tabs>
	)
}
