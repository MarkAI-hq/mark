'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { Upload, X, FileText, User, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { getEnrolledStudents, EnrolledStudent } from '@/lib/actions/enrollments'
import { startBatchGrading } from '@/lib/actions/grading'

interface BatchGradingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessmentId: string
  classId: string
}

interface FileWithPreview {
  file: File
  preview?: string
  assignedStudentId?: string
}

export function BatchGradingDialog({
  open,
  onOpenChange,
  assessmentId,
  classId,
}: BatchGradingDialogProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [isPending, startTransition] = useTransition()

  // --- DEBUGGING CHECKPOINT 1: Data Fetching ---
  useEffect(() => {
    if (open && classId) {
      console.log('[DEBUG] Dialog opened. Fetching students for classId:', classId);
      getEnrolledStudents(classId).then((response) => {
        console.log('[DEBUG] Received response from getEnrolledStudents:', response);
        const { data, error } = response;
        if (error) {
          toast.error('Failed to fetch student list.', { description: error.message })
          return
        }
        const activeStudents = data?.filter(s => s.status === 'active') || [];
        console.log(`[DEBUG] Found ${activeStudents.length} active students.`);
        setStudents(activeStudents)
      })
    }
  }, [open, classId])

  // --- DEBUGGING CHECKPOINT 2: File Handling ---
  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('[DEBUG] onDrop triggered. Accepted files:', acceptedFiles);
    const newFiles = acceptedFiles.map((file) => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      const file = newFiles[index]
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const assignStudent = (index: number, studentId: string) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      const file = newFiles[index]
      if (file) {
        file.assignedStudentId = studentId
      }
      return newFiles
    })
  }

  // --- DEBUGGING CHECKPOINT 3: Submission ---
  const handleSubmit = () => {
    console.log('[DEBUG] handleSubmit triggered.');
    const unassignedFiles = files.filter((f) => !f.assignedStudentId)
    if (unassignedFiles.length > 0) {
      console.log('[DEBUG] Submission blocked: Unassigned files found.');
      toast.warning('Please assign a student to every file before submitting.')
      return
    }

    startTransition(async () => {
      console.log('[DEBUG] Starting transition for submission...');
      const formData = new FormData()
      
      const submissionIds = files.map((f) => f.assignedStudentId!);
      console.log('[DEBUG] Created submissionIds array:', submissionIds);

      formData.append('submissions', JSON.stringify(submissionIds))
      
      files.forEach((f, index) => {
        formData.append('files', f.file)
        console.log(`[DEBUG] Appended file ${index}:`, f.file.name);
      })
      
      console.log('[DEBUG] Calling startBatchGrading server action...');
      const response = await startBatchGrading(assessmentId, formData)
      console.log('[DEBUG] Received response from startBatchGrading:', response);

      const { data, error } = response;

      if (error) {
        toast.error('Submission Failed', { description: error.message })
        return
      }

      if (data) {
        toast.success('Grading Started', {
          description: `${data.submissionCount} submissions have been queued for AI grading.`,
        })
        handleClose()
      }
    })
  }

  const handleClose = () => {
    setFiles([])
    onOpenChange(false)
  }

  const assignedStudentIds = new Set(files.map(f => f.assignedStudentId).filter(Boolean));
  const unassignedStudentCount = files.filter(f => !f.assignedStudentId).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Upload and Grade Student Submissions</DialogTitle>
          <DialogDescription>
            Upload student answer sheets and assign each file to a student for AI grading.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col min-h-0">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer flex flex-col items-center justify-center text-center h-[200px]',
                'hover:border-primary/50 hover:bg-muted/50',
                isDragActive && 'border-primary bg-primary/5',
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium">
                Drag & drop files here, or click to select
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, JPG, or PNG files, up to 10MB each.
              </p>
            </div>
          </div>

          <div className="flex flex-col min-h-0">
            <h3 className="text-sm font-semibold mb-3">Uploaded Files</h3>
            <ScrollArea className="flex-1 pr-2 -mr-2">
              {files.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                  No files uploaded yet.
                </div>
              ) : (
                <div className="space-y-2 pb-2">
                  {files.map((fileWithPreview, index) => {
                    const assignedStudent = students.find(
                      s => s.student_id === fileWithPreview.assignedStudentId
                    );
                    
                    return (
                      <div
                        key={index}
                        className="flex flex-col gap-2 p-3 border rounded-lg bg-card"
                      >
                        <div className="flex items-start gap-2">
                          {fileWithPreview.preview ? (
                            <Image
                              src={fileWithPreview.preview}
                              alt="Preview"
                              className="w-10 h-10 object-cover rounded flex-shrink-0"
                              width={40}
                              height={40}
                            />
                          ) : (
                            <FileText className="w-10 h-10 text-muted-foreground flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {fileWithPreview.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(fileWithPreview.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {assignedStudent && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                              <User className="h-3 w-3" />
                              <span className="truncate">
                                {assignedStudent.first_name} {assignedStudent.last_name}
                              </span>
                            </div>
                          )}
                          <Select
                            onValueChange={(value) => assignStudent(index, value)}
                            value={fileWithPreview.assignedStudentId}
                          >
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue placeholder="Assign..." />
                            </SelectTrigger>
                            <SelectContent>
                              {students.map((student) => (
                                <SelectItem
                                  key={student.student_id}
                                  value={student.student_id}
                                  disabled={assignedStudentIds.has(student.student_id) && fileWithPreview.assignedStudentId !== student.student_id}
                                >
                                  {student.first_name} {student.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="text-sm">
              {unassignedStudentCount > 0 ? (
                <div className="flex items-center gap-2 text-amber-600">
                  <User className="h-4 w-4" />
                  <span>{unassignedStudentCount} file(s) need assignment</span>
                </div>
              ) : files.length > 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>All files assigned. Ready to submit.</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Upload files to begin.</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending || files.length === 0 || unassignedStudentCount > 0}
              >
                {isPending ? 'Submitting...' : `Submit ${files.length} File(s)`}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}