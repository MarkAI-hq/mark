'use client'

// src/components/students/print-report-button.tsx

import { useState } from 'react'
import { Printer, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PrintReportButtonProps {
  studentId: string
  classId:   string
  studentName?: string
}

export function PrintReportButton({ studentId, classId, studentName }: PrintReportButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handlePrint() {
    setLoading(true)
    try {
      const res = await fetch('/api/reports/student-performance', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentId, classId }),
      })

      if (!res.ok) {
        toast.error('Failed to generate report. Please try again.')
        return
      }

      // Stream PDF into a blob and open in new tab
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${studentName ?? 'Student'}_Report.pdf`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Report downloaded successfully.')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handlePrint} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Printer className="mr-2 h-4 w-4" />
      )}
      {loading ? 'Generating...' : 'Print Report'}
    </Button>
  )
}