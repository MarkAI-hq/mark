'use client'

import { useEffect, useState } from 'react'

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import { getQuestionStats } from '@/lib/actions/exams'
import { QuestionStat } from '@/lib/types'
import { Progress } from '@/components/ui/progress'

export function QuestionAnalytics({ examId }: { examId: string }) {
	const [stats, setStats] = useState<QuestionStat[]>([])

	useEffect(() => {
		getQuestionStats(examId).then(({ data }) => {
			if (data) setStats(data)
		})
	}, [examId])

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Question</TableHead>
					<TableHead>Total Marks</TableHead>
					<TableHead>Average Score</TableHead>
					<TableHead>Score Range</TableHead>
					<TableHead className="text-right">Attempts</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{stats.map((stat) => (
					<TableRow key={stat.questionNumber}>
						<TableCell>Question {stat.questionNumber}</TableCell>
						<TableCell>{stat.totalPossibleMarks}</TableCell>
						<TableCell>
							{stat.averageScore} ({stat.percentageScore}%)
							<Progress value={stat.percentageScore} className="mt-2" />
						</TableCell>
						<TableCell>
							{stat.lowestScore} - {stat.highestScore}
						</TableCell>
						<TableCell className="text-right">{stat.attemptsCount}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
