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
import { Subject, Class } from '@/lib/types'
import { Assessment, createAssessment } from '@/lib/actions/assessments'
import { getClasses } from '@/lib/actions/classes'
import { cn } from '@/lib/utils'

const createSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  courseId: z.string().uuid('Please select a subject'),
  classId: z.string().uuid('Please select a class'),
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

const updateSchema = createSchema.partial().refine(
    (data) => Object.values(data).some(Boolean), {
    message: 'At least one field must be provided',
})

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
  const [classes, setClasses] = useState<Class[]>([])

  useEffect(() => {
    if (open) {
      getClasses().then(({ data, error }) => {
        if (error) {
          toast.error('Failed to load classes', { description: error.message });
        }
        if (data) {
          setClasses(data);
        }
      });
    }
  }, [open]);

  const form = useForm<
    z.infer<typeof createSchema> | z.infer<typeof updateSchema>
  >({
    resolver: zodResolver(assessment?.assessment_id ? updateSchema : createSchema),
    defaultValues: {
      title: assessment?.title || '',
      courseId: assessment?.classId || initialCourseId || '',
      classId: assessment?.classId || '',
      scheme: undefined,
      enableAiGrading: assessment
        ? assessment.assessment_type === 'AI_ASSISTED_GRADING'
        : false,
    },
  })

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
    
    // FIXED: The property on the 'data' object is 'courseId', not 'subjectId'.
    // This now correctly reads the value from the form state and appends it to FormData.
    if (data.courseId) formData.append('courseId', data.courseId)
    if (data.classId) formData.append('classId', data.classId)
    if (data.title) formData.append('title', data.title)
    if (data.scheme) formData.append('scheme', data.scheme)
    if (data.enableAiGrading !== undefined) {
      formData.append('enableAiGrading', String(data.enableAiGrading))
    }

    const { data: saved, error } = assessment?.assessment_id
      ? await Promise.resolve({ data: null, error: { message: 'Update not implemented yet.' } })
      : await createAssessment(formData)

    if (saved) {
      onOpenChange(false)
      form.reset()
      setPdfPreview(undefined)
      toast.success('Success', {
        description: 'Assessment created successfully',
      })
      router.push(`/dashboard/assessments/${saved.id}`)
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
            Create a new assessment and assign it to a class.
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
                    <Input placeholder="e.g., Mid-Term Biology Exam" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="courseId"
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
                          <SelectValue placeholder="Select..." />
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
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.class_id} value={c.class_id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="scheme"
              render={({ field: { value } }) => (
                <FormItem>
                  <FormLabel>Marking Guide (PDF)</FormLabel>
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
                      This will allow you to use the AI to grade student submissions.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create Assessment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
