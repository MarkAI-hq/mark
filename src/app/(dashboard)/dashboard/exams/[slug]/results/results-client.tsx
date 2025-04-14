'use client'

import { useEffect, useState } from 'react'
import { ExamStats, StudentResult } from '@/lib/types'
import { getExamStats, getStudentResults } from '@/lib/actions/exams'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { QuestionAnalytics } from '@/components/results/question-analytics'
import SummaryView from '@/components/results/summary-view'
import DetailedView from '@/components/results/detailed-view'
// import FollowUpAssignments from '@/components/results/followup-assignments'
interface ExamResultsClientProps {
	examId: string
}

export function ExamResultsClient({ examId }: ExamResultsClientProps) {
	const [stats, setStats] = useState<ExamStats>()
	const [activeTab, setActiveTab] = useState('summary')
	const [examData, setExamData] = useState<StudentResult[]>([])

	useEffect(() => {
		// Get student results
		getStudentResults(examId).then(({ data }) => {
			if (data) setExamData(data)
		})

		// Get exam stats
		getExamStats(examId).then(({ data }) => {
			if (data) {
				setStats(data)
			}
		})
	}, [examId])

	if (!stats) return null

	return (
		<Tabs
			defaultValue='summary'
			value={activeTab}
			onValueChange={setActiveTab}
			className='w-full'
		>
			<TabsList className='grid w-full grid-cols-4 mb-6'>
				<TabsTrigger value='summary'>Summary</TabsTrigger>
				<TabsTrigger value='detailed'>Details</TabsTrigger>
				<TabsTrigger value='questions'>Question Analytics</TabsTrigger>
				<TabsTrigger value='follow-up'>Follow-up Assignments</TabsTrigger>
			</TabsList>
			<TabsContent value='summary'>
				<SummaryView examData={examData} />
			</TabsContent>
			<TabsContent value='detailed'>
				<DetailedView examData={examData} />
			</TabsContent>
			<TabsContent value='questions' className='space-y-4'>
				<QuestionAnalytics examId={examId} />
			</TabsContent>
			<TabsContent value='follow-up'>
				{/* <FollowUpAssignments examId={examId} /> */}
				<></>
			</TabsContent>
		</Tabs>
	)
}
