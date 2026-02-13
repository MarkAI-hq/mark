'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Printer, PenSquare, BrainCircuit } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AppBreadcrumb } from '@/components/ui/app-breadcrumb'
import { AssignAssessmentDialog } from './assign-assessment-dialog'
import { generateCognitiveReport } from '@/lib/actions/reports'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface StudentProfileHeaderProps {
  studentName: string
  studentId: string
  classId: string
  breadcrumbItems: BreadcrumbItem[]
  hasSubmissions: boolean
  hasCognitiveProfile: boolean
  onProfileUpdate?: () => void
}

export function StudentProfileHeader({
  studentName,
  studentId,
  classId,
  breadcrumbItems,
  hasSubmissions,
  hasCognitiveProfile,
  onProfileUpdate,
}: StudentProfileHeaderProps) {
  const router = useRouter()
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handlePrintReport = async () => {
    if (isGenerating) return

    setIsGenerating(true)
    toast.info('Generating report...')

    const res = await generateCognitiveReport({
      studentName,
      className: 'Class', // replace with actual class name if available
      scores: {
        mentalEnergy: 0,
        learningStrategy: 0,
      },
      profile: {
        name: 'Cognitive Profile',
        description: '',
      },
    })

    if (res.error || !res.data) {
      toast.error(res.error?.message || 'Failed to generate report')
      setIsGenerating(false)
      return
    }

    try {
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${studentName}-cognitive-report.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success('Report downloaded')

      if (onProfileUpdate) onProfileUpdate()

      router.replace(`/dashboard/classes/${classId}/students/${studentId}`)
    } catch {
      toast.error('Unable to download report')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAssessProfile = () => {
    router.push(`/dashboard/students/${studentId}/assess`)
  }

  return (
    <>
      <AppBreadcrumb items={breadcrumbItems} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{studentName}</h1>
          <p className="text-muted-foreground">
            Student Profile & Academic Record
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasSubmissions && (
            <Button
              variant="outline"
              onClick={handlePrintReport}
              disabled={isGenerating}
              className="flex-shrink-0"
            >
              <Printer className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Print Report'}
            </Button>
          )}

          <Button 
            onClick={() => setIsAssignDialogOpen(true)}
            className="flex-shrink-0"
          >
            <PenSquare className="mr-2 h-4 w-4" />
            Assign Assessment
          </Button>

          <Button 
            onClick={handleAssessProfile}
            className="flex-shrink-0"
          >
            <BrainCircuit className="mr-2 h-4 w-4" />
            {hasCognitiveProfile ? 'Re-assess Profile' : 'Assess Profile'}
          </Button>
        </div>
      </header>

      {/* ✅ Pass studentId to the dialog */}
      <AssignAssessmentDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        studentName={studentName}
        studentId={studentId}
        classId={classId}
      />
    </>
  )
}
