'use client'

import Link from 'next/link'
import { ChartBarIcon, PencilRuler } from 'lucide-react'
import { useState, useEffect } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Exam } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { getStudentResults } from '@/lib/actions/exams'
// FIXED: The problematic import for AnswerDialog has been removed.

export function ExamClient({ exam }: { exam: Exam }) {
  const [hasResults, setHasResults] = useState(false)
  // FIXED: The state for the obsolete dialog has been removed.
  // const [isAnswerDialogOpen, setIsAnswerDialogOpen] = useState(false);

  useEffect(() => {
    getStudentResults(exam.id).then(({ data }) => {
      if (data && data.length > 0) {
        setHasResults(true)
      } else {
        setHasResults(false)
      }
    })
  }, [exam.id])

  const handleGradeClick = () => {
    // This button is part of the old workflow.
    // The new workflow is on the /assessments/[id] page.
    // For now, we can disable it or show a message.
    alert('Grading is now handled on the new Assessment Detail page.')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{exam.title}</h1>
        {hasResults ? (
          <Link href={`/dashboard/exams/${exam.id}/results`}>
            <Button>
              <ChartBarIcon className="w-4 h-4 mr-2" />
              View Results
            </Button>
          </Link>
        ) : (
          <Button onClick={handleGradeClick}>
            <PencilRuler className="w-4 h-4 mr-2" />
            Grade Exam
          </Button>
        )}
      </div>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Marking Scheme</CardTitle>
        </CardHeader>
        <CardContent>
          {exam.markingScheme ? (
            <iframe
              src={exam.markingScheme}
              className="w-full h-[600px]"
              title="Marking Scheme (PDF)"
            />
          ) : (
            <div className="text-muted-foreground">
              Marking scheme will be displayed here once uploaded.
            </div>
          )}
        </CardContent>
      </Card>

      {/* FIXED: The obsolete AnswerDialog component has been removed. */}
    </div>
  )
}
