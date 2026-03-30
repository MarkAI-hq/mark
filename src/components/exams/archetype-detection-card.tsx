'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { detectArchetype } from '@/lib/actions/exam-builder'
import { ExamDetectionResult } from '@/lib/types'
import { toast } from 'sonner'

interface DetectionProps {
  onDetected: (result: ExamDetectionResult, sourceText: string) => void
}

export function ArchetypeDetectionCard({ onDetected }: DetectionProps) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    multiple: false
  })

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    const { data, error } = await detectArchetype(formData)

    if (error) {
      toast.error(error.message)
    } else if (data) {
      toast.success("Content Analysed Successfully")
      // The backend returns extracted_text in the detection logic usually, 
      // but if not, we assume Task 1 will need the source_content.
      onDetected(data, (data as any).extracted_text || "") 
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4 border rounded-xl p-6 bg-white shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <FileText size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Auto-Generation</h3>
          <p className="text-sm text-muted-foreground">Upload a syllabus or teaching notes to generate a matching exam.</p>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300",
          file && "border-green-500 bg-green-50"
        )}
      >
        <input {...getInputProps()} />
        {file ? (
          <>
            <CheckCircle2 className="text-green-500" size={32} />
            <p className="font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
          </>
        ) : (
          <>
            <Upload className="text-gray-400" size={32} />
            <p className="font-medium">Click or drag files to upload</p>
            <p className="text-xs text-muted-foreground">PDF or TXT (Max 20MB)</p>
          </>
        )}
      </div>

      <Button 
        className="w-full" 
        disabled={!file || loading} 
        onClick={handleUpload}
      >
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysing Content...</> : 'Analyse with Mark·AI'}
      </Button>
    </div>
  )
}