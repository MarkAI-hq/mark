import type { StudentResult } from '@/lib/types'
import { AssignmentCard } from './assignment-card'

export function Assignment({ examData }: { examData: StudentResult[] }) {
    return <div className='space-y-6'>
        {examData.map((result) => (
            <AssignmentCard key={result.id} studentData={result} />
        ))}
    </div>
}
