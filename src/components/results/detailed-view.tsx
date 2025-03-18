import type { StudentResult } from '@/lib/types'
import StudentCard from './student-card'

interface DetailedViewProps {
	examData: StudentResult[]
}

export default function DetailedView({ examData }: DetailedViewProps) {
	return (
		<div className='space-y-6'>
			{examData.map((result) => (
				<StudentCard key={result.id} studentData={result} />
			))}
		</div>
	)
}
