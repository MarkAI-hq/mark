'use client'

import { useState, useEffect } from 'react'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { getStudentResults } from '@/lib/actions/exams'
import { StudentResult } from '@/lib/types'


export function StudentResults({ examId }: { examId: string }) {
	const [results, setResults] = useState<StudentResult[]>([])

	const [search, setSearch] = useState('')

	useEffect(() => {
		getStudentResults(examId).then(({ data }) => {
			if (data) setResults(data)
		})
	}, [examId])

	const filteredResults = results.filter((result) =>
		result.studentName.toLowerCase().includes(search.toLowerCase())
	)

	return (
		<div className='space-y-4'>
			<Input
				placeholder='Search students...'
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				className='max-w-sm'
			/>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Student</TableHead>
						<TableHead className='text-right'>Score</TableHead>
						<TableHead className='text-right'>Total Marks</TableHead>
						{/* <TableHead className='text-right'>Percentage</TableHead> */}
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredResults.map((result) => (
						<TableRow key={result?.studentId}>
							<TableCell>{result?.studentName}</TableCell>
							<TableCell className='text-right'>{result?.totalScore}</TableCell>
							{/* <TableCell className='text-right'>{result.totalMarks}</TableCell>
							<TableCell className='text-right'>{result.percentage}%</TableCell> */}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}
