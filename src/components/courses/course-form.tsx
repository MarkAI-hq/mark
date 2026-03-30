// src/components/courses/course-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm }   from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }         from 'zod'
import { ArrowRight } from 'lucide-react'

import { Button }   from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Course, Subject } from '@/lib/types'

const formSchema = z.object({
  title:       z.string().min(1, 'Course Title is required'),
  code:        z.string().min(1, 'Course Code is required'),
  subject_id:  z.string({ required_error: 'Please select a subject.' }),
  description: z.string().optional(),
  grade_level: z.string().optional(),
})

export type CourseData = z.infer<typeof formSchema>

interface CourseFormProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  onSubmit:     (data: CourseData) => void
  isSubmitting: boolean
  initialData?: Course
  subjects:     Subject[]
}

export function CourseForm({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
  subjects,
}: CourseFormProps) {
  const router    = useRouter()
  const isEdit    = !!initialData
  const [createdTitle, setCreatedTitle] = useState<string | null>(null)

  const form = useForm<CourseData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title:       initialData?.title       || '',
      code:        initialData?.code        || '',
      subject_id:  initialData?.subject_id  || '',
      description: initialData?.description || '',
      grade_level: initialData?.grade_level || '',
    },
  })

  const handleSubmit = (data: CourseData) => {
    if (!isEdit) setCreatedTitle(data.title)
    onSubmit(data)
  }

  const handleClose = () => {
    setCreatedTitle(null)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">

        {/* ── Success state ──────────────────────────────────────────── */}
        {createdTitle && !isSubmitting ? (
          <div className="py-6 flex flex-col items-center text-center gap-5">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 11l5 5 9-9" stroke="#C9A84C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#C9A84C' }}>
                Course created
              </p>
              <h3 className="text-base font-semibold text-foreground" style={{ fontFamily: 'Georgia, serif' }}>
                &ldquo;{createdTitle}&rdquo; is ready.
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Now create an assessment — Mirror will grade every script against it.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full pt-1">
              <button
                className="w-full sm:w-auto text-sm font-semibold px-5 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                style={{ background: '#C9A84C', color: '#060E24' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#E8C96A')}
                onMouseLeave={e => (e.currentTarget.style.background = '#C9A84C')}
                onClick={() => { handleClose(); router.push('/dashboard/exams?new=true') }}
              >
                Create assessment
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                className="w-full sm:w-auto text-sm px-5 py-2.5 rounded-lg transition-colors"
                style={{ color: 'hsl(var(--muted-foreground))' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--foreground))')}
                onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--muted-foreground))')}
                onClick={handleClose}
              >
                Back to courses
              </button>
            </div>
          </div>

        ) : (

        /* ── Form state ────────────────────────────────────────────── */
        <>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Edit Course' : 'Create New Course'}
            </DialogTitle>
            <DialogDescription>
              Courses are specific units of study within a subject, like &apos;Calculus I&apos;.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="subject_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the subject this course belongs to" />
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
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Calculus I" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. MATH-101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grade_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Grade 12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A brief description of the course."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? isEdit ? 'Saving…'   : 'Creating…'
                    : isEdit ? 'Save Changes' : 'Create Course'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </>
        )}

      </DialogContent>
    </Dialog>
  )
}