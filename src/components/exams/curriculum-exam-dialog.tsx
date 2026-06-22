'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Sparkles, Loader2, BookOpen } from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { generateFromCurriculum, getExamJobStatus } from '@/lib/actions/exam-builder'

const GRADE_LEVELS = [
  'S1', 'S2', 'S3', 'S4', 'S5', 'S6',
  'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12',
  'P.1', 'P.2', 'P.3', 'P.4', 'P.5', 'P.6', 'P.7',
  'Year 1', 'Year 2', 'Year 3', 'Year 4',
]

const schema = z.object({
  grade_level:          z.string().min(1, 'Select a grade level'),
  total_marks:          z.coerce.number().min(10).max(300),
  duration_minutes:     z.coerce.number().min(20).max(240),
  assessment_type:      z.enum(['summative', 'formative', 'diagnostic']).default('summative'),
  copies:               z.coerce.number().refine(v => v === 1 || v === 2).default(1) as z.ZodType<1|2>,
  special_instructions: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface CurriculumExamDialogProps {
  open:          boolean
  onOpenChange:  (open: boolean) => void
  subjectId:     string
  subjectName:   string
}

export function CurriculumExamDialog({
  open,
  onOpenChange,
  subjectId,
  subjectName,
}: CurriculumExamDialogProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      grade_level:          '',
      total_marks:          80,
      duration_minutes:     120,
      assessment_type:      'summative',
      copies:               1,
      special_instructions: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setIsGenerating(true)
    const { data, error } = await generateFromCurriculum({
      subject_id:           subjectId,
      grade_level:          values.grade_level,
      total_marks:          values.total_marks,
      duration_minutes:     values.duration_minutes,
      assessment_type:      values.assessment_type,
      copies:               values.copies,
      special_instructions: values.special_instructions || undefined,
    })

    if (error || !data) {
      setIsGenerating(false)
      toast.error(error?.message ?? 'Failed to queue exam generation')
      return
    }

    toast.success('Exam generation queued — this takes ~30 seconds.')
    onOpenChange(false)
    form.reset()

    // Poll until complete then redirect to the preview page
    const jobId = data.job_id
    const poll = setInterval(async () => {
      const { data: status } = await getExamJobStatus(jobId)
      if (!status) return
      if (status.status === 'COMPLETED' && status.exam_id) {
        clearInterval(poll)
        setIsGenerating(false)
        router.push(`/dashboard/exam-builder/preview/${status.exam_id}`)
      } else if (status.status === 'FAILED') {
        clearInterval(poll)
        setIsGenerating(false)
        toast.error('Exam generation failed. Please try again.')
      }
    }, 4000)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !isGenerating) { onOpenChange(false); form.reset() } }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <BookOpen className="h-4 w-4 text-amber-600" />
            </div>
            <DialogTitle>Generate from Curriculum</DialogTitle>
          </div>
          <DialogDescription>
            Mirror will assemble exam questions grounded in the <strong>{subjectName}</strong> curriculum schema — no file upload needed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form id="curriculum-exam-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="grade_level" render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade / Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="assessment_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="summative">Summative</SelectItem>
                      <SelectItem value="formative">Formative</SelectItem>
                      <SelectItem value="diagnostic">Diagnostic</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="total_marks" render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Marks</FormLabel>
                  <FormControl><Input type="number" min={10} max={300} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="duration_minutes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (min)</FormLabel>
                  <FormControl><Input type="number" min={20} max={240} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="copies" render={({ field }) => (
                <FormItem>
                  <FormLabel>Variants</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 (A only)</SelectItem>
                      <SelectItem value="2">2 (A + B)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="special_instructions" render={({ field }) => (
              <FormItem>
                <FormLabel>Special Instructions <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g. Focus on photosynthesis and cell division. Include a diagram question."
                    className="resize-none min-h-[72px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </form>
        </Form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => { onOpenChange(false); form.reset() }} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="curriculum-exam-form"
            disabled={isGenerating}
            className="gap-2 border-0 text-white"
            style={{ background: isGenerating ? '#a8893d' : '#c9a84c' }}
          >
            {isGenerating
              ? <><Loader2 className="h-4 w-4 animate-spin" />Generating…</>
              : <><Sparkles className="h-4 w-4" />Generate Exam</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
