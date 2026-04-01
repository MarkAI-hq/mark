'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter }             from 'next/navigation'
import { zodResolver }           from '@hookform/resolvers/zod'
import { useForm }               from 'react-hook-form'
import { toast }                 from 'sonner'
import { useDropzone }           from 'react-dropzone'
import { Upload, X, School, BookOpen } from 'lucide-react'
import { z }                     from 'zod'

import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormDescription,
  FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input }    from '@/components/ui/input'
import { Button }   from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Assessment, createAssessment } from '@/lib/actions/assessments'
import { InlineClassDialog } from '@/components/classes/inline-class-dialog'
import { cn } from '@/lib/utils'

import { getCurricula } from '@/lib/actions/curricula'
import { CurriculumSchemaMetadata } from '@/types/curricula'

// ── Schema ─────────────────────────────────────────────────────────────────

const createSchema = z.object({
  title:           z.string().min(1, 'Title is required'),
  courseId:        z.string().uuid('Please select a subject'),
  classId:         z.string().uuid('Please select a class'),
  curriculumId:    z.string().min(1, 'Please select a curriculum framework'),
  scheme:          z
    .instanceof(File, { message: 'Please upload a marking guide' })
    .refine(f => f.type === 'application/pdf',  'Only PDF files are allowed')
    .refine(f => f.size <= 5 * 1024 * 1024,     'File size must be less than 5MB'),
  enableAiGrading: z.boolean().default(false).optional(),
})

const updateSchema = createSchema.partial().refine(
  data => Object.values(data).some(Boolean),
  { message: 'At least one field must be provided' },
)

// ── Props ──────────────────────────────────────────────────────────────────

interface ExamDialogProps {
  open:                boolean
  subjects:            { id: string; name: string }[]
  classes?:            { class_id: string; name: string }[]
  onOpenChange:        (open: boolean) => void
  assessment?:         Assessment
  initialCourseId?:    string
  initialClassId?:     string
  disableCourseSelect?: boolean
  disableClassSelect?:  boolean
  role?:               'Admin' | 'Teacher'
}

// ── Component ──────────────────────────────────────────────────────────────

export function ExamDialog({
  open,
  subjects,
  classes,
  onOpenChange,
  assessment,
  initialCourseId,
  initialClassId,
  disableCourseSelect = false,
  disableClassSelect  = false,
  role                = 'Admin',
}: ExamDialogProps) {
  const router = useRouter()

  const [pdfPreview,         setPdfPreview]         = useState<string>()
  const [classList,          setClassList]          = useState<{ class_id: string; name: string }[]>(classes ?? [])
  const [curricula,          setCurricula]          = useState<CurriculumSchemaMetadata[]>([])
  const [inlineClassOpen,    setInlineClassOpen]    = useState(false)
  const [isLoadingCurricula, setIsLoadingCurricula] = useState(false)

  useEffect(() => { setClassList(classes ?? []) }, [classes])

  // Fetch curricula once on mount so data is ready before the dialog opens.
  // Previously this was gated on `open`, causing a visible loading delay
  // every time the dialog was shown.
  useEffect(() => {
    setIsLoadingCurricula(true)
    getCurricula()
      .then(({ data, error }) => {
        if (error) {
          toast.error('Failed to load curriculum frameworks')
        } else if (data) {
          setCurricula(data)
        }
      })
      .finally(() => setIsLoadingCurricula(false))
  }, [])

  const subjectList = subjects ?? []
  const noClasses   = classList.length === 0

  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(assessment?.assessment_id ? updateSchema : createSchema),
    defaultValues: {
      title:           assessment?.title || '',
      courseId:        initialCourseId || '',
      classId:         assessment?.classId || initialClassId || '',
      curriculumId:    assessment?.curriculum_id || '',
      scheme:          undefined,
      enableAiGrading: assessment
        ? assessment.assessment_type === 'AI_ASSISTED_GRADING'
        : false,
    },
  })

  useEffect(() => {
    if (initialCourseId) form.setValue('courseId', initialCourseId)
  }, [initialCourseId, form])

  const handleClassReady = (cls: { class_id: string; name: string }) => {
    setClassList(prev => {
      const exists = prev.find(c => c.class_id === cls.class_id)
      return exists ? prev : [...prev, cls]
    })
    form.setValue('classId', cls.class_id)
    toast.success(`Class "${cls.name}" linked to this assessment.`)
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return
      form.setValue('scheme', file)
      const reader = new FileReader()
      reader.onloadend = () => setPdfPreview(reader.result as string)
      reader.readAsDataURL(file)
    },
    [form],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:   { 'application/pdf': ['.pdf'] },
    multiple: false,
    maxSize:  5 * 1024 * 1024,
  })

  const clearFile = () => {
    form.setValue('scheme', undefined as any)
    setPdfPreview(undefined)
  }

  async function onSubmit(data: z.infer<typeof createSchema>) {
    const formData = new FormData()
    if (data.courseId)          formData.append('courseId',        data.courseId)
    if (data.classId)           formData.append('classId',         data.classId)
    if (data.curriculumId)      formData.append('curriculumId',    data.curriculumId)
    if (data.title)             formData.append('title',           data.title)
    if (data.scheme)            formData.append('scheme',          data.scheme)
    if (data.enableAiGrading !== undefined)
      formData.append('enableAiGrading', String(data.enableAiGrading))

    const { data: saved, error } = assessment?.assessment_id
      ? await Promise.resolve({ data: null, error: { message: 'Update not implemented yet.' } })
      : await createAssessment(formData)

    if (saved) {
      onOpenChange(false)
      form.reset()
      setPdfPreview(undefined)
      toast.success('Assessment created successfully.')
      router.push(`/dashboard/assessments/${saved.id}`)
    }

    if (error) toast.error(error.message)
  }

  const schemeValue = form.watch('scheme')

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* WIDENED DIALOG TO 600px */}
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {assessment?.assessment_id ? 'Edit Assessment' : 'Create Assessment'}
            </DialogTitle>
            <DialogDescription>
              Create a new assessment and link it to a curriculum framework.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

              {/* ROW 1: Title & Curriculum */}
              <div className="grid grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="curriculumId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        Curriculum Framework
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingCurricula ? 'Loading…' : 'Select framework…'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {curricula.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ROW 2: Subject & Class */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Subject</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={disableCourseSelect}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={subjectList.length === 0 ? 'No subjects' : 'Select…'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjectList.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
                      {noClasses && !disableClassSelect ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full h-9 gap-2 border-amber-200 text-amber-800 hover:bg-amber-50 text-xs"
                          onClick={() => setInlineClassOpen(true)}
                        >
                          <School className="h-3.5 w-3.5" />
                          Create a class first
                        </Button>
                      ) : (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={disableClassSelect}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select…">
                                {field.value
                                  ? classList.find(c => c.class_id === field.value)?.name ?? 'Select…'
                                  : 'Select…'
                                }
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classList.map(c => (
                              <SelectItem key={c.class_id} value={c.class_id}>
                                {c.name}
                              </SelectItem>
                            ))}
                            {!disableClassSelect && (
                              <div
                                className="flex items-center gap-2 px-3 py-2 text-xs text-primary cursor-pointer hover:bg-muted border-t mt-1"
                                onClick={() => setInlineClassOpen(true)}
                              >
                                <School className="h-3.5 w-3.5" />
                                Create new class…
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ROW 3: Marking guide upload */}
              <FormField
                control={form.control}
                name="scheme"
                render={() => (
                  <FormItem>
                    <FormLabel>Marking Guide (PDF)</FormLabel>
                    <FormControl>
                      <div
                        {...getRootProps({
                          className: cn(
                            'relative cursor-pointer rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 transition-colors hover:border-gray-400',
                            isDragActive && 'border-primary bg-primary/5',
                          ),
                        })}
                      >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center justify-center gap-2 text-center">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          {schemeValue || pdfPreview ? (
                            <div className="relative w-full max-w-sm">
                              <div className="flex items-center justify-between rounded-md border bg-muted p-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-10 w-10 shrink-0 rounded bg-white overflow-hidden">
                                    <embed src={pdfPreview} type="application/pdf" className="h-full w-full" />
                                  </div>
                                  <div className="flex flex-col text-left">
                                    <p className="text-sm font-medium truncate max-w-[150px]">{schemeValue?.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {((schemeValue?.size ?? 0) / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={e => { e.stopPropagation(); clearFile() }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm">
                              <p className="font-medium">
                                {isDragActive ? 'Drop the file here' : 'Click or drag & drop'}
                              </p>
                              <p className="text-muted-foreground">PDF file (max 5MB)</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ROW 4: AI grading */}
              <FormField
                control={form.control}
                name="enableAiGrading"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable AI-Assisted Grading</FormLabel>
                      <FormDescription>
                        Let Mirror grade student submissions for this assessment.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Creating…' : 'Create Assessment'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <InlineClassDialog
        open={inlineClassOpen}
        onOpenChange={setInlineClassOpen}
        existingClasses={classList}
        onClassReady={handleClassReady}
      />
    </>
  )
}