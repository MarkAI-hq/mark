'use client'

// src/components/students/student-profile-header.tsx

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Printer, PenSquare, BrainCircuit, Loader2, KeyRound, Copy, Check, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AppBreadcrumb } from '@/components/ui/app-breadcrumb'
import { AssignAssessmentDialog } from './assign-assessment-dialog'
import { StudentForm, StudentFormData } from '@/components/students/student-form'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { resetStudentPin, updateStudent } from '@/lib/actions/students'
import type { Student } from '@/lib/types'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface StudentProfileHeaderProps {
  studentName:         string
  studentId:           string
  classId:             string
  breadcrumbItems:     BreadcrumbItem[]
  hasSubmissions:      boolean
  hasCognitiveProfile: boolean
  student:             Student
  onProfileUpdate?:    () => void
  // Teacher view — hides Edit, Reset PIN, Print Report, Assign Assessment, Assess Profile
  readOnly?:           boolean
}

// ── Reset PIN dialog ───────────────────────────────────────────────────────

function ResetPinDialog({
  studentName, studentId, open, onClose,
}: {
  studentName: string; studentId: string; open: boolean; onClose: () => void
}) {
  const [pin,     setPin]     = useState<string | null>(null)
  const [copied,  setCopied]  = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    setLoading(true)
    try {
      const result = await resetStudentPin(studentId)
      setPin(result.pin)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset PIN')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!pin) return
    navigator.clipboard.writeText(pin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => { setPin(null); setCopied(false); onClose() }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-500" />
            Reset PIN
          </DialogTitle>
          <DialogDescription>
            {pin
              ? 'New PIN generated. Save it now — it will not be shown again.'
              : `Generate a new PIN for ${studentName}. The old PIN will stop working immediately.`}
          </DialogDescription>
        </DialogHeader>

        {pin ? (
          <div className="py-2 space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Student</span>
                <span className="font-medium">{studentName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">New PIN</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-bold tracking-widest text-amber-600">{pin}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Student logs in with their School Code, Student ID and this PIN.
            </p>
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              This will immediately invalidate the student's current PIN. Make sure to give them the new one.
            </p>
          </div>
        )}

        <DialogFooter>
          {pin ? (
            <Button onClick={handleClose} className="w-full">Done</Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
              <Button onClick={handleReset} disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset PIN
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main header ────────────────────────────────────────────────────────────

export function StudentProfileHeader({
  studentName,
  studentId,
  classId,
  breadcrumbItems,
  hasSubmissions,
  hasCognitiveProfile,
  student,
  onProfileUpdate,
  readOnly = false,
}: StudentProfileHeaderProps) {
  const router = useRouter()

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isResetPinOpen,     setIsResetPinOpen]     = useState(false)
  const [isEditOpen,         setIsEditOpen]         = useState(false)
  const [isGenerating,       setIsGenerating]       = useState(false)
  const [isPending,          startTransition]       = useTransition()

  const handlePrintReport = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    toast.info('Generating report...')
    try {
      const res = await fetch('/api/reports/student-performance', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentId, classId }),
      })
      if (!res.ok) { toast.error(await res.text() || 'Failed to generate report'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${studentName.replace(/\s+/g, '_')}_Performance_Report.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      toast.success('Report downloaded successfully')
      onProfileUpdate?.()
    } catch {
      toast.error('Unable to download report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditSubmit = (formData: StudentFormData) => {
    startTransition(async () => {
      try {
        await updateStudent(studentId, formData)
        toast.success('Student updated successfully.')
        setIsEditOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update student.')
      }
    })
  }

  return (
    <>
      <AppBreadcrumb items={breadcrumbItems} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{studentName}</h1>
          <p className="text-muted-foreground">Student Profile &amp; Academic Record</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Admin-only: Edit, Reset PIN, Print Report */}
          {!readOnly && (
            <>
              <Button variant="outline" onClick={() => setIsEditOpen(true)} className="flex-shrink-0">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>

              <Button variant="outline" onClick={() => setIsResetPinOpen(true)} className="flex-shrink-0 border-amber-200 text-amber-700 hover:bg-amber-50">
                <KeyRound className="mr-2 h-4 w-4" />
                Reset PIN
              </Button>

              {hasSubmissions && (
                <Button variant="outline" onClick={handlePrintReport} disabled={isGenerating} className="flex-shrink-0">
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                  {isGenerating ? 'Generating...' : 'Print Report'}
                </Button>
              )}
            </>
          )}

          {/* Teacher duties: always visible */}
          <Button onClick={() => setIsAssignDialogOpen(true)} className="flex-shrink-0">
            <PenSquare className="mr-2 h-4 w-4" />
            Assign Assessment
          </Button>

          <Button onClick={() => router.push(`/dashboard/students/${studentId}/assess`)} className="flex-shrink-0">
            <BrainCircuit className="mr-2 h-4 w-4" />
            {hasCognitiveProfile ? 'Re-assess Profile' : 'Assess Profile'}
          </Button>
        </div>
      </header>

      {/* Always rendered — teachers need these */}
      <AssignAssessmentDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        studentName={studentName}
        studentId={studentId}
        classId={classId}
      />

      {/* Admin-only dialogs */}
      {!readOnly && (
        <>
          <ResetPinDialog
            studentName={studentName}
            studentId={studentId}
            open={isResetPinOpen}
            onClose={() => setIsResetPinOpen(false)}
          />
          <StudentForm
            key={`edit-${studentId}`}
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onSubmit={handleEditSubmit}
            isSubmitting={isPending}
            student={student}
          />
        </>
      )}
    </>
  )
}