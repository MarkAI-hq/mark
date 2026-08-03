'use client'

// src/components/students/class-confirmation-upload-widget.tsx
//
// The "upload a report card / results sheet so an admin can verify your class
// faster" widget shown inside every pending-approval empty state across the
// portal (dashboard, schedule, study-plans, subjects, my-pathway). It used to
// be copy-pasted (~90 lines) into each of those client components — extracted
// here so a copy/behavior fix only has to happen once.

import { useState, useTransition, useEffect, useRef } from 'react'
import { Upload, FileText, Check, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { uploadStudentDocument } from '@/lib/actions/student-onboarding'

interface Props {
  studentId?: string
}

export function ClassConfirmationUploadWidget({ studentId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<string>('term_report')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploading, startUpload] = useTransition()
  const [hasUploadedBefore, setHasUploadedBefore] = useState(false)

  useEffect(() => {
    if (studentId) {
      setHasUploadedBefore(localStorage.getItem(`proof_uploaded_${studentId}`) === 'true')
    }
  }, [studentId])

  function handleDocumentSubmit() {
    if (!selectedFile) {
      toast.error('Please select a file to upload.')
      return
    }

    const fd = new FormData()
    fd.append('file', selectedFile)
    fd.append('doc_type', docType)

    startUpload(async () => {
      const { error } = await uploadStudentDocument(fd)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Confirmation document uploaded successfully!')
      if (studentId) localStorage.setItem(`proof_uploaded_${studentId}`, 'true')
      setUploadSuccess(true)
      setHasUploadedBefore(true)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    })
  }

  return (
    <div className="w-full mt-6 border border-border/70 rounded-xl p-4 bg-muted/20 text-left space-y-4">
      <div className="flex items-start gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]">
          <Upload className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">Upload class confirmation document</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
            Optionally submit a photo of your report card or results sheet so your administrator can verify your class and accept your request faster.
          </p>
        </div>
      </div>

      {hasUploadedBefore || uploadSuccess ? (
        <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-800 dark:text-emerald-300 text-xs font-medium w-full animate-fade-up">
          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Confirmation document submitted!</p>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5 leading-normal font-normal">
              We have received your proof. An administrator is currently reviewing it to set up your subjects.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="term_report">Term Report Card</SelectItem>
                  <SelectItem value="prior_results">Prior Exam Results</SelectItem>
                  <SelectItem value="other">Other Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Choose File</Label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    setSelectedFile(e.target.files?.[0] ?? null)
                    setUploadSuccess(false)
                  }}
                  className="hidden"
                  id="class-confirmation-doc-file"
                />
                <label
                  htmlFor="class-confirmation-doc-file"
                  className="flex h-8 w-full items-center justify-center gap-1 px-3 border border-input rounded-lg bg-background hover:bg-muted text-xs cursor-pointer truncate font-medium transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{selectedFile ? selectedFile.name : 'Select PDF or Photo'}</span>
                </label>
              </div>
            </div>
          </div>

          {selectedFile && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleDocumentSubmit}
                disabled={uploading}
                className="h-8 text-xs font-bold flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Upload File to Teacher
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedFile(null)}
                disabled={uploading}
                className="h-8 text-xs text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
