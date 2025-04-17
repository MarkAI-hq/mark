import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import type { StudentResult } from '@/lib/types'
import { Badge } from '../ui/badge'

interface SummaryViewProps {
	examData: StudentResult[]
}

export const SummaryView = ({ examData }: SummaryViewProps) => {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Student Name</TableHead>
					<TableHead className='text-right'>Score</TableHead>
					<TableHead className='text-right'>Percentage Score</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{examData.map((result) => (
					<TableRow key={result.id}>
						<TableCell className='font-medium'>{result?.studentName}</TableCell>
						<TableCell className='text-right'>
							<Badge
								variant={
									result?.totalScore >= result?.maxTotalScore / 2
										? 'default'
										: 'destructive'
								}
							>
								{result?.totalScore}/{result?.maxTotalScore}
							</Badge>
						</TableCell>
						<TableCell className='font-medium text-right'>
							{Math.round((result?.totalScore / result?.maxTotalScore) * 100)}%
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
