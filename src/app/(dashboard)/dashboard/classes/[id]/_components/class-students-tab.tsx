'use client'

// src/app/(dashboard)/dashboard/classes/[id]/_components/class-students-tab.tsx

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Upload, Users, Copy, Check, KeyRound, Download, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { StudentImportDialog } from '@/components/students/student-import-dialog'
import { StudentForm, StudentFormData } from '@/components/students/student-form'
import { createStudent } from '@/lib/actions/students'
import { enrollStudent } from '@/lib/actions/enrollments'
import type { ClassAnalytics } from '@/lib/actions/classes'

interface ClassStudentsTabProps {
  classId:          string
  className?:       string
  analytics:        ClassAnalytics | null
  // readOnly: hides Export Reports, Import CSV, Add Student buttons (teacher view)
  readOnly?:        boolean
  // studentBasePath: base path for View links (default: /dashboard/classes)
  studentBasePath?: string
}

interface CreatedStudentPin {
  name:              string
  student_school_id: string | null
  pin:               string
}

function PctBadge({ pct }: { pct: number }) {
  if (pct >= 80) return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Excellent</Badge>
  if (pct >= 65) return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Good</Badge>
  if (pct >= 50) return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Developing</Badge>
  return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">At Risk</Badge>
}

function PinRevealDialog({ student, onClose }: { student: CreatedStudentPin | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  if (!student) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(student.pin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={!!student} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-500" />
            Student Created
          </DialogTitle>
          <DialogDescription>Save this PIN now — it will not be shown again.</DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{student.name}</span>
            </div>
            {student.student_school_id && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Student ID</span>
                <span className="font-medium">{student.student_school_id}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">PIN</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold tracking-widest text-amber-600">{student.pin}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Student logs in at <span className="font-medium">/student/login</span> using
            their School Code, Student ID and this PIN.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ClassStudentsTab({
  classId,
  className,
  analytics,
  readOnly        = false,
  studentBasePath = '/dashboard/classes',
}: ClassStudentsTabProps) {
  const router                                       = useRouter()
  const [isImportOpen,   setIsImportOpen]   = useState(false)
  const [isFormOpen,     setIsFormOpen]     = useState(false)
  const [createdStudent, setCreatedStudent] = useState<CreatedStudentPin | null>(null)
  const [isExporting,    setIsExporting]    = useState(false)
  const [isPending,      startTransition]   = useTransition()

  const students        = analytics?.studentSummaries ?? []
  const exportableCount = students.filter(s => s.submissions > 0).length

  // ── Bulk PDF export ────────────────────────────────────────────────────
  const handleBulkExport = async () => {
    if (exportableCount === 0) {
      toast.error('No students have graded submissions to export.')
      return
    }

    setIsExporting(true)
    const toastId = toast.loading(`Generating ${exportableCount} report${exportableCount !== 1 ? 's' : ''}…`)

    try {
      const exportable = students.filter(s => s.submissions > 0)
      const res = await fetch('/api/reports/class-bulk-pdf', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          classId,
          className: className ?? 'class',
          studentIds: exportable.map(s => ({ id: s.studentId, name: s.studentName })),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Export failed')
      }

      const failed   = res.headers.get('X-Failed-Students')
      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      const safeName = (className ?? 'class').replace(/\s+/g, '_')
      a.href         = url
      a.download     = `${safeName}_Reports.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.dismiss(toastId)
      if (failed) {
        toast.warning(`Downloaded with some failures. Could not generate: ${failed}`)
      } else {
        toast.success(`${exportableCount} report${exportableCount !== 1 ? 's' : ''} exported.`)
      }
    } catch (err) {
      toast.dismiss(toastId)
      toast.error(err instanceof Error ? err.message : 'Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // ── Add student ────────────────────────────────────────────────────────
  const handleAddStudent = (formData: StudentFormData, photo?: File) => {
    startTransition(async () => {
      try {
        const result = await createStudent(formData, photo) as any
        await enrollStudent(classId, result.user_id)

        if (result?.warning) {
          toast.warning(result.warning)
        }

        if (result?.pin) {
          setCreatedStudent({
            name:              result.name ?? `${result.first_name} ${result.last_name}`.trim(),
            student_school_id: result.student_school_id ?? null,
            pin:               result.pin,
          })
        } else if (!result?.warning) {
          toast.success('Student created and enrolled successfully.')
        }

        router.refresh()
        setIsFormOpen(false)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create student.')
      }
    })
  }

  return (
    <>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {students.length} student{students.length !== 1 ? 's' : ''} in this class
        </p>
        {/* Admin-only actions hidden in readOnly (teacher) mode */}
        {!readOnly && (
          <div className="flex gap-2">
            {exportableCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkExport}
                disabled={isExporting}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                {isExporting
                  ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  : <Download className="mr-2 h-3.5 w-3.5" />
                }
                {isExporting ? 'Exporting…' : `Export Reports (${exportableCount})`}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
              <Upload className="mr-2 h-3.5 w-3.5" />
              Import CSV
            </Button>
            <Button size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add Student
            </Button>
          </div>
        )}
      </div>

      {/* ── Student list ──────────────────────────────────────────────── */}
      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
          <Users className="h-10 w-10 mb-3 opacity-25" />
          <p className="text-sm font-medium">No students yet</p>
          {!readOnly && (
            <>
              <p className="text-xs mt-1 mb-4">Add students one by one or import from a CSV file</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  Import CSV
                </Button>
                <Button size="sm" onClick={() => setIsFormOpen(true)}>
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Add Student
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-0">
            <div className="divide-y">
              {students.map((s) => (
                <div key={s.studentId} className="flex items-center justify-between py-3 first:pt-4 last:pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {s.studentName.charAt(0)}
                    </div>
                    <p className="text-sm font-medium">{s.studentName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.submissions > 0 && <PctBadge pct={s.avgPct} />}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`${studentBasePath}/${classId}/students/${s.studentId}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin-only dialogs — not rendered in readOnly mode */}
      {!readOnly && (
        <>
          <StudentImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} classId={classId} />
          <StudentForm key="new-student" open={isFormOpen} onOpenChange={setIsFormOpen} onSubmit={handleAddStudent} isSubmitting={isPending} />
        </>
      )}
      <PinRevealDialog student={createdStudent} onClose={() => setCreatedStudent(null)} />
    </>
  )
}