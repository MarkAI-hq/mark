// src/components/subjects/subject-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useHotkeys } from 'react-hotkeys-hook'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Subject } from '@/lib/types'

const formSchema = z.object({
  name: z.string().min(1, 'Subject Name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
})

export type SubjectData = z.infer<typeof formSchema>

interface SubjectFormProps {
  open: boolean
  initialData?: Subject
  onOpenChange: (open: boolean) => void
  onSubmit: (data: SubjectData) => Promise<void>
}

export function SubjectForm({
  open,
  initialData,
  onOpenChange,
  onSubmit,
}: SubjectFormProps) {
  const isEditing = !!initialData

  const form = useForm<SubjectData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      code: initialData?.code || '',
      description: initialData?.description || '',
    },
  })

  const { isSubmitting } = form.formState

  useHotkeys(
    'enter',
    () => {
      form.handleSubmit(onSubmit)()
    },
    {
      enableOnFormTags: true,
      preventDefault: true,
    },
  )

  // Determine button text based on state for better readability in JSX
  const buttonText = isSubmitting
    ? isEditing
      ? 'Saving...'
      : 'Creating...'
    : isEditing
    ? 'Save Changes'
    : 'Create Subject'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Subject' : 'Create New Subject'}
          </DialogTitle>
          <DialogDescription>
            Subjects are broad categories for your courses, like 'Mathematics'
            or 'History'.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            {/* Form Fields Group */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Mathematics" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. MATH" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A brief description of the subject and what it entails."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {buttonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
