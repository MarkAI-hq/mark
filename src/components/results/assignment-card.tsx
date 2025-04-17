'use client'

import type { StudentResult } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { AssessmentQuestionCard } from './assessmet-question-card'

export function AssignmentCard({ studentData }: { studentData: StudentResult }) {
  return (
    <Card className='overflow-hidden'>
      <CardContent className='p-0'>
        <div className='p-6'>
          <div className='flex justify-between items-start mb-4'>
            <h2 className='text-2xl font-bold'>{studentData?.studentName}</h2>
          </div>
          <AssessmentQuestionCard questions={studentData.assignments} />
        </div>
      </CardContent>
    </Card>
  )
}
