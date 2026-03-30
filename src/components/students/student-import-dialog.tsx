'use client'

// src/components/students/student-import-dialog.tsx

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { UploadCloud, File as FileIcon, X, Printer, CheckCircle2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { importStudentsFromFile } from '@/lib/actions/students'
import { enrollMultipleStudents } from '@/lib/actions/enrollments'

interface StudentImportDialogProps {
  open:             boolean
  onOpenChange:     (open: boolean) => void
  classId:          string
  onImportSuccess?: () => void // ← ADDED
}

interface ImportedStudent {
  user_id:            string
  first_name:         string
  last_name:          string
  name?:              string
  student_school_id?: string
  pin?:               string
}

export function StudentImportDialog({
  open,
  onOpenChange,
  classId,
  onImportSuccess, // ← ADDED
}: StudentImportDialogProps) {
  const router                                          = useRouter()
  const [file, setFile]                                = useState<File | null>(null)
  const [isPending, startTransition]                   = useTransition()
  const [importedStudents, setImportedStudents]        = useState<ImportedStudent[]>([])
  const [showPinSheet, setShowPinSheet]                = useState(false)
  const printRef                                       = useRef<HTMLDivElement>(null)

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setFile(acceptedFiles[0])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  })

  const handleImport = () => {
    if (!file) {
      toast.error('Please select a file to import.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('file', file)

      const { data, error } = await importStudentsFromFile(classId, formData)

      if (error) {
        toast.error('Import Failed', { description: error.message })
        return
      }

      if (data) {
        const successCount = data.successful.length
        const failureCount = data.failed.length

        if (successCount === 0) {
          toast.error('Import Failed', { description: 'No students were imported.' })
          return
        }

        // Enroll all successfully created students into this class
        const isRealClass = classId && classId !== 'PLACEHOLDER_CLASS_ID'
        if (isRealClass) {
          try {
            const studentIds = (data.successful as ImportedStudent[]).map((s) => s.user_id)
            await enrollMultipleStudents(classId, studentIds)
          } catch (enrollError) {
            toast.warning('Students created but enrollment failed.', {
              description: enrollError instanceof Error ? enrollError.message : 'Please enroll manually.',
            })
          }
        }

        setImportedStudents(data.successful as ImportedStudent[])
        setShowPinSheet(true)
        onImportSuccess?.() // ← ADDED — notifies the onboarding wizard students were imported
        toast.success(
          `${successCount} student${successCount !== 1 ? 's' : ''} imported successfully.${failureCount > 0 ? ` ${failureCount} rows failed.` : ''}`
        )
        router.refresh()
      }
    })
  }

  const handlePrint = () => {
    if (!printRef.current) return

    const printId = 'student-pin-print-target'
    printRef.current.id = printId

    const style = document.createElement('style')
    style.id = 'student-pin-print-styles'
    style.innerHTML = `
      @media print {
        body > *:not([data-print-overlay]) { display: none !important; }
        [data-print-overlay] { display: block !important; }

        #${printId} {
          position: fixed !important;
          inset: 0 !important;
          width: 100% !important;
          max-height: none !important;
          overflow: visible !important;
          border: none !important;
          border-radius: 0 !important;
          z-index: 99999 !important;
        }

        #${printId} .max-h-80 {
          max-height: none !important;
          overflow: visible !important;
        }
      }
    `
    document.head.appendChild(style)

    // Temporarily clone the print node into body so @media print can isolate it
    const overlay = document.createElement('div')
    overlay.setAttribute('data-print-overlay', '')
    overlay.appendChild(printRef.current.cloneNode(true))
    document.body.appendChild(overlay)

    window.print()

    // Cleanup after print dialog closes
    setTimeout(() => {
      document.head.removeChild(style)
      document.body.removeChild(overlay)
      if (printRef.current) printRef.current.removeAttribute('id')
    }, 500)
  }

  const handleClose = () => {
    onOpenChange(false)
    setFile(null)
    setImportedStudents([])
    setShowPinSheet(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={showPinSheet ? 'max-w-2xl' : 'max-w-lg'}>
        <DialogHeader>
          <DialogTitle>
            {showPinSheet ? 'Student PIN Setup Sheet' : 'Import Students from CSV'}
          </DialogTitle>
          <DialogDescription>
            {showPinSheet
              ? 'Print this sheet and hand each student their credentials. PINs are shown once only.'
              : "Upload a CSV file with columns 'name' and optionally 'student_school_id'."
            }
          </DialogDescription>
        </DialogHeader>

        {!showPinSheet ? (
          <div className="py-4">
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer
                ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                {isDragActive
                  ? 'Drop the file here...'
                  : 'Drag & drop a CSV file here, or click to select'}
              </p>
              <p className="text-xs text-muted-foreground">CSV files only</p>
            </div>

            {file && (
              <div className="mt-4 flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-2">
            <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-700">
                <span className="font-semibold">{importedStudents.length} students</span> imported successfully.
                Print and distribute credentials below.
              </p>
            </div>

            <div ref={printRef} className="border rounded-lg overflow-hidden">
              <div className="bg-slate-900 px-4 py-3">
                <h1 className="text-white font-bold text-sm">Student Login Credentials</h1>
                <p className="text-slate-400 text-xs mt-0.5">
                  Mark-AI Labs — Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' '}— Keep confidential
                </p>
              </div>

              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="bg-slate-100">
                      <th className="text-left p-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Student Name</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Student ID</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">PIN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {importedStudents.map((student, i) => (
                      <tr key={student.user_id ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-3 font-medium">
                          {student.name ?? `${student.first_name} ${student.last_name}`.trim()}
                        </td>
                        <td className="p-3 text-slate-600">
                          {student.student_school_id ?? '—'}
                        </td>
                        <td className="p-3">
                          {student.pin ? (
                            <Badge variant="outline" className="font-mono text-sm tracking-widest font-bold border-amber-300 text-amber-700 bg-amber-50">
                              {student.pin}
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

              <div className="bg-slate-50 px-4 py-2 border-t">
                <p className="text-xs text-slate-500">
                  Login at: <span className="font-medium">your-domain.com/student/login</span>
                  {' '}· School Code: <span className="font-mono font-bold">shown in settings</span>
                  {' '}· PINs are shown once — store securely
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!showPinSheet ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || isPending}>
                {isPending ? 'Importing...' : 'Import Students'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Done
              </Button>
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print Sheet
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}