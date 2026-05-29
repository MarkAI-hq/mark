'use client'

// src/components/grading/inline-enroll-dialog.tsx
// Nested enrollment dialog — lives inside BatchGradingDialog.
// Teacher never leaves the grading workflow.

import { useState, useTransition, useRef, useCallback } from 'react'
import { useDropzone }   from 'react-dropzone'
import { useForm }       from 'react-hook-form'
import { zodResolver }   from '@hookform/resolvers/zod'
import { z }             from 'zod'
import { toast }         from 'sonner'
import {
  UserPlus, UploadCloud, FileIcon, X,
  CheckCircle2, Printer, Loader2, ArrowLeft,
} from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button }    from '@/components/ui/button'
import { Badge }     from '@/components/ui/badge'
import { Input }     from '@/components/ui/input'
import { Label }     from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Form, FormControl, FormField, FormItem,
  FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form'
import { createStudent }           from '@/lib/actions/students'
import { importStudentsFromFile }  from '@/lib/actions/students'
import { enrollStudent, enrollMultipleStudents } from '@/lib/actions/enrollments'
import type { CreateStudentData }  from '@/lib/actions/students'

type StudentFormData = CreateStudentData

// ── Types ──────────────────────────────────────────────────────────────────

interface InlineEnrollDialogProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  classId:      string
  onEnrolled:   (count: number) => void  // signals parent to refresh + unlock
}

interface ImportedStudent {
  user_id:            string
  first_name:         string
  last_name:          string
  name?:              string
  student_school_id?: string
  pin?:               string
}

// ── Manual form schema ─────────────────────────────────────────────────────

const manualSchema = z.object({
  name:              z.string().min(2, 'Full name must be at least 2 characters.'),
  student_school_id: z.string().optional(),
  date_of_birth:     z.string().optional(),
  gender:            z.string().optional(),
  guardian_name:     z.string().optional(),
  guardian_phone:    z.string().optional(),
  guardian_email:    z.string().email('Invalid email.').optional().or(z.literal('')),
})

// ── Manual tab ─────────────────────────────────────────────────────────────

function ManualTab({ classId, onSuccess }: { classId: string; onSuccess: (count: number) => void }) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<StudentFormData>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      name: '', student_school_id: '', date_of_birth: '',
      gender: '', guardian_name: '', guardian_phone: '', guardian_email: '',
    },
  })

  const handleSubmit = (data: StudentFormData) => {
    startTransition(async () => {
      try {
        const student = await createStudent(data)
        await enrollStudent(classId, student.user_id)
        toast.success(`${data.name} enrolled successfully.`)
        form.reset()
        onSuccess(1)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to add student.')
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name <span className="text-rose-500">*</span></FormLabel>
              <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="student_school_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student ID</FormLabel>
                <FormControl><Input placeholder="Auto-generated" {...field} /></FormControl>
                <FormDescription className="text-xs">Leave blank to auto-assign</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <FormControl><Input placeholder="e.g. Female" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Guardian Details (Optional)
        </p>

        <FormField
          control={form.control}
          name="guardian_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Guardian Name</FormLabel>
              <FormControl><Input placeholder="Parent or guardian's full name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="guardian_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl><Input placeholder="+256 700 000000" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="guardian_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input placeholder="guardian@email.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" />Adding…</>
              : <><UserPlus className="h-4 w-4" />Add & Enroll Student</>
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}

// ── CSV tab ────────────────────────────────────────────────────────────────

function CsvTab({ classId, onSuccess }: { classId: string; onSuccess: (count: number, students: ImportedStudent[]) => void }) {
  const [file,      setFile]      = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:   { 'text/csv': ['.csv'] },
    multiple: false,
  })

  const handleImport = () => {
    if (!file) return
    startTransition(async () => {
      const formData = new FormData()
      formData.append('file', file)
      const { data, error } = await importStudentsFromFile(classId, formData)
      if (error) { toast.error('Import failed', { description: error.message }); return }
      if (!data || data.successful.length === 0) {
        const firstError = data?.failed?.[0]?.error
        toast.error('No students were imported.', {
          description: firstError ?? 'Check your CSV format — ensure a "name" column exists.',
        })
        return
      }
      try {
        await enrollMultipleStudents(classId, data.successful.map(s => s.user_id))
      } catch (err) {
        toast.warning('Students created but enrollment failed.', {
          description: err instanceof Error ? err.message : 'Please enroll manually.',
        })
      }
      const count = data.successful.length
      const failed = data.failed.length
      toast.success(
        `${count} student${count !== 1 ? 's' : ''} imported.${failed > 0 ? ` ${failed} rows failed.` : ''}`,
      )
      onSuccess(count, data.successful as ImportedStudent[])
    })
  }

  return (
    <div className="space-y-4 pt-2">
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-8 w-8 mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          {isDragActive ? 'Drop the file here…' : 'Drag & drop a CSV, or click to select'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Columns: <span className="font-mono">name</span>, optionally <span className="font-mono">student_school_id</span>
        </p>
      </div>

      {file && (
        <div className="flex items-center justify-between p-2 border rounded-md">
          <div className="flex items-center gap-2">
            <FileIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{file.name}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFile(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleImport}
          disabled={!file || isPending}
          className="gap-2"
        >
          {isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" />Importing…</>
            : <><UploadCloud className="h-4 w-4" />Import & Enroll</>
          }
        </Button>
      </div>
    </div>
  )
}

// ── PIN sheet (shown after CSV import) ────────────────────────────────────

function PinSheet({
  students,
  onDone,
}: {
  students:  ImportedStudent[]
  onDone:    () => void
}) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (!printRef.current) return
    const printId = 'inline-enroll-pin-print'
    printRef.current.id = printId
    const style = document.createElement('style')
    style.innerHTML = `@media print { body > *:not([data-print-overlay]) { display: none !important; } [data-print-overlay] { display: block !important; } #${printId} { position: fixed !important; inset: 0 !important; width: 100% !important; max-height: none !important; overflow: visible !important; border: none !important; z-index: 99999 !important; } #${printId} .max-h-64 { max-height: none !important; overflow: visible !important; } }`
    document.head.appendChild(style)
    const overlay = document.createElement('div')
    overlay.setAttribute('data-print-overlay', '')
    overlay.appendChild(printRef.current.cloneNode(true))
    document.body.appendChild(overlay)
    window.print()
    setTimeout(() => {
      document.head.removeChild(style)
      document.body.removeChild(overlay)
      if (printRef.current) printRef.current.removeAttribute('id')
    }, 500)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <p className="text-sm text-emerald-700">
          <span className="font-semibold">{students.length} students</span> enrolled.
          Print credentials and hand them out, then continue grading.
        </p>
      </div>

      <div ref={printRef} className="border rounded-lg overflow-hidden">
        <div className="bg-slate-900 px-4 py-3">
          <h1 className="text-white font-bold text-sm">Student Login Credentials</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Mirror Intelligence Labs — {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} — Keep confidential
          </p>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0">
              <tr className="bg-slate-100">
                <th className="text-left p-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Student Name</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Student ID</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">PIN</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((s, i) => (
                <tr key={s.user_id ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-3 font-medium">
                    {s.name ?? `${s.first_name} ${s.last_name}`.trim()}
                  </td>
                  <td className="p-3 text-slate-600">{s.student_school_id ?? '—'}</td>
                  <td className="p-3">
                    {s.pin ? (
                      <Badge variant="outline" className="font-mono text-sm tracking-widest font-bold border-amber-300 text-amber-700 bg-amber-50">
                        {s.pin}
                      </Badge>
                    ) : (
                      <span className="text-slate-400 text-xs">Not available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onDone} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Continue to grading
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print sheet
        </Button>
      </div>
    </div>
  )
}

// ── Main dialog ────────────────────────────────────────────────────────────

export function InlineEnrollDialog({
  open,
  onOpenChange,
  classId,
  onEnrolled,
}: InlineEnrollDialogProps) {
  const [pinStudents, setPinStudents] = useState<ImportedStudent[] | null>(null)

  const handleManualSuccess = (count: number) => {
    onEnrolled(count)
    onOpenChange(false)
  }

  const handleCsvSuccess = (count: number, students: ImportedStudent[]) => {
    setPinStudents(students)
    onEnrolled(count)
  }

  const handleClose = () => {
    setPinStudents(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {pinStudents ? 'Student Credentials' : 'Enroll Students'}
          </DialogTitle>
          <DialogDescription>
            {pinStudents
              ? 'Print and distribute before continuing to grading.'
              : 'Add students to this class without leaving the grading workflow.'
            }
          </DialogDescription>
        </DialogHeader>

        {pinStudents ? (
          <PinSheet
            students={pinStudents}
            onDone={handleClose}
          />
        ) : (
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="manual" className="flex-1 gap-2">
                <UserPlus className="h-4 w-4" />
                Add manually
              </TabsTrigger>
              <TabsTrigger value="csv" className="flex-1 gap-2">
                <UploadCloud className="h-4 w-4" />
                Upload CSV
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-4">
              <ManualTab classId={classId} onSuccess={handleManualSuccess} />
            </TabsContent>

            <TabsContent value="csv" className="mt-4">
              <CsvTab classId={classId} onSuccess={handleCsvSuccess} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}