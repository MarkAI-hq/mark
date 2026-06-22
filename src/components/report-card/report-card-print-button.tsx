'use client'

// src/components/report-card/report-card-print-button.tsx
//
// Teacher/admin action: fetch a specific student's gradebook and print the
// formal report card. Renders the card into a portal at <body> root and toggles
// a body class so that, while printing, everything except the card is hidden
// (see `.printing-report-card` rules in globals.css).

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { FileText, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getStudentGradebook } from '@/lib/actions/study-plans'
import type { GradebookResponse } from '@/lib/actions/study-plans'
import { ReportCard } from './report-card'

interface Props {
  studentId:   string
  studentName: string
  className?:  string | null
  schoolName:  string
}

export function ReportCardPrintButton({ studentId, studentName, className, schoolName }: Props) {
  const [loading, setLoading]     = useState(false)
  const [gradebook, setGradebook] = useState<GradebookResponse | null>(null)
  const [mounted, setMounted]     = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const cleanup = () => document.body.classList.remove('printing-report-card')
    window.addEventListener('afterprint', cleanup)
    return () => window.removeEventListener('afterprint', cleanup)
  }, [])

  const handlePrint = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await getStudentGradebook(studentId)
      if (res.error || !res.data) {
        toast.error(res.error?.message ?? 'Could not load gradebook for this student')
        return
      }
      if (res.data.no_enrollment || res.data.subjects.length === 0) {
        toast.error('No gradebook data yet — student has no graded subjects')
        return
      }
      setGradebook(res.data)
      // Let the portal render before opening the print dialog.
      requestAnimationFrame(() => {
        document.body.classList.add('printing-report-card')
        window.print()
      })
    } catch {
      toast.error('Unable to generate report card. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={handlePrint} disabled={loading} className="flex-shrink-0">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
        Report Card
      </Button>

      {mounted && gradebook && createPortal(
        <div className="report-card-host">
          <ReportCard
            gradebook={gradebook}
            student={{ name: studentName, className }}
            school={{ name: schoolName }}
          />
        </div>,
        document.body,
      )}
    </>
  )
}
