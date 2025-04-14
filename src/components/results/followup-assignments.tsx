import type { StudentResult } from '@/lib/types'
import StudentCard from './student-card'

interface FollowUpAssignmentsProps {
    examData: StudentResult[]
}

export default function FollowUpAssignments({ examData }: FollowUpAssignmentsProps) {
    return (
        <div className='space-y-6'>
            {examData.map((result) => (
                <StudentCard key={result.id} studentData={result} />
            ))}
        </div>
    )
}
