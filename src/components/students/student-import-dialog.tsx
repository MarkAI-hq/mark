// src/components/students/student-import-dialog.tsx
'use client'

import { useState, useTransition } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { UploadCloud, File as FileIcon, X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { importStudentsFromFile } from '@/lib/actions/students'

interface StudentImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
}

export function StudentImportDialog({
  open,
  onOpenChange,
  classId,
}: StudentImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
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
      } else if (data) {
        const successCount = data.successful.length
        const failureCount = data.failed.length
        toast.success('Import Complete', {
          description: `${successCount} students imported successfully. ${failureCount} rows failed.`,
        })
        onOpenChange(false)
        setFile(null)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Students from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with student data. The file should contain columns
            for &apos;name&apos;, &apos;class&apos;, and optionally &apos;stream&apos;.
          </DialogDescription>
        </DialogHeader>

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
                : 'Drag &apos;n&apos; drop a CSV file here, or click to select'}
            </p>
            <p className="text-xs text-muted-foreground">CSV files only, up to 5MB</p>
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-between p-2 border rounded-md">
              <div className="flex items-center gap-2">
                <FileIcon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || isPending}>
            {isPending ? 'Importing...' : 'Import Students'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
