'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { z } from 'zod'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Subject } from '@/lib/types'
// FIXED: Import the new Assessment type and createAssessment action
import { Assessment, createAssessment } from '@/lib/actions/assessments'
import { cn } from '@/lib/utils'

// The schema now correctly includes the 'enableAiGrading' field
const createSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  // FIXED: Renamed to subjectId for clarity, as it's what the user selects
  subjectId: z.string().uuid('Please select a subject'),
  scheme: z
    .instanceof(File, { message: 'Please upload a marking guide' })
    .refine(
      (file) => file.type === 'application/pdf',
      'Only PDF files are allowed',
    )
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'File size must be less than 5MB',
    ),
  enableAiGrading: z.boolean().default(false).optional(),
})

// Update schema is simplified for now, can be expanded later
const updateSchema = createSchema.partial().refine(
    (data) => Object.values(data).some(Boolean), {
    message: 'At least one field must be provided',
})

// FIXED: The props interface is updated to use the Assessment type
interface ExamDialogProps {
  open: boolean
  subjects: Subject[]
  onOpenChange: (open: boolean) => void
  assessment?: Assessment
  initialCourseId?: string
  disableCourseSelect?: boolean
}

export function ExamDialog({
  open,
  subjects,
  onOpenChange,
  assessment,
  initialCourseId,
  disableCourseSelect = false,
}: ExamDialogProps) {
  const router = useRouter()
  const [pdfPreview, setPdfPreview] = useState<string>()

  const form = useForm<
    z.infer<typeof createSchema> | z.infer<typeof updateSchema>
  >({
    resolver: zodResolver(assessment?.assessment_id ? updateSchema : createSchema),
    defaultValues: {
      title: assessment?.title || '',
      // FIXED: Use subjectId and map from assessment.classId
      subjectId: assessment?.classId || initialCourseId || '',
      scheme: undefined,
      enableAiGrading: assessment
        ? assessment.assessment_type === 'AI_ASSISTED_GRADING'
        : false,
    },
  })

  useEffect(() => {
    if (initialCourseId && !assessment?.assessment_id) {
      form.setValue('subjectId', initialCourseId)
    }
  }, [initialCourseId, form, assessment?.assessment_id])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        form.setValue('scheme', file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setPdfPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    },
    [form],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    maxSize: 5 * 1024 * 1024,
  })

  const clearFile = () => {
    form.setValue('scheme', undefined)
    setPdfPreview(undefined)
  }

  async function onSubmit(
    data: z.infer<typeof createSchema> | z.infer<typeof updateSchema>,
  ) {
    const formData = new FormData()
    // The backend DTO expects 'courseId', but our form uses 'subjectId' for clarity. We map it here.
    if (data.subjectId) formData.append('courseId', data.subjectId)
    if (data.title) formData.append('title', data.title)
    if (data.scheme) formData.append('scheme', data.scheme)
    if (data.enableAiGrading !== undefined) {
      formData.append('enableAiGrading', String(data.enableAiGrading))
    }

    // FIXED: Call the new createAssessment action. Update is not implemented yet.
    const { data: saved, error } = assessment?.assessment_id
      ? await Promise.resolve({ data: null, error: { message: 'Update not implemented yet.' } }) // Placeholder for update
      : await createAssessment(formData)

    if (saved) {
      onOpenChange(false)
      form.reset()
      setPdfPreview(undefined)
      toast.success('Success', {
        description: assessment?.assessment_id
          ? 'Assessment updated successfully'
          : 'Assessment created successfully',
      })
      router.push(`/dashboard/assessments/${saved.assessment_id}`)
    }

    if (error) {
      toast.error('Error', {
        description: error.message,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {assessment?.assessment_id ? 'Edit Assessment' : 'Create Assessment'}
          </DialogTitle>
          <DialogDescription>
            {assessment?.assessment_id
              ? 'Update the assessment details.'
              : 'Add a new assessment. You can enable AI grading features.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter assessment title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={disableCourseSelect}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheme"
              render={({ field: { value } }) => (
                <FormItem>
                  <FormLabel>Marking / Assessment Guide</FormLabel>
                  <FormControl>
                    <div
                      {...getRootProps({
                        className: cn(
                          'relative cursor-pointer rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 transition-colors hover:border-gray-400 dark:hover:border-gray-600',
                          isDragActive && 'border-primary bg-primary/5',
                        ),
                      })}
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        {value || pdfPreview ? (
                          <div className="relative w-full max-w-sm">
                            <div className="flex items-center justify-between rounded-md border bg-muted p-2">
                              <div className="flex items-center gap-2">
                                <div className="h-10 w-10 shrink-0 rounded bg-white">
                                  <embed
                                    src={pdfPreview}
                                    type="application/pdf"
                                    className="h-full w-full rounded object-cover"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <p className="text-sm font-medium">
                                    {value?.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {(
                                      (value?.size ?? 0) /
                                      1024 /
                                      1024
                                    ).toFixed(2)}
                                    MB
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  clearFile()
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <p className="font-medium">
                              {isDragActive
                                ? 'Drop the file here'
                                : 'Click or drag & drop'}
                            </p>
                            <p className="text-muted-foreground">
                              PDF file (max 5MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enableAiGrading"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enable AI-Assisted Grading</FormLabel>
                    <FormDescription>
                      Allow this assessment to be graded using the AI pipeline.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  form.reset()
                  setPdfPreview(undefined)
                }}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? assessment?.assessment_id
                    ? 'Updating...'
                    : 'Creating...'
                  : assessment?.assessment_id
                  ? 'Update Assessment'
                  : 'Create Assessment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
