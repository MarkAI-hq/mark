'use client'

// src/components/classes/class-form.tsx

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

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
import { Class }    from '@/lib/types'

const formSchema = z.object({
  name:        z.string().min(1, 'Class name is required'),
  description: z.string().optional(),
})

export type ClassData = z.infer<typeof formSchema>

interface ClassFormProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  onSubmit:     (data: ClassData) => void
  isSubmitting: boolean
  initialData?: Class
}

export function ClassForm({ open, onOpenChange, onSubmit, isSubmitting, initialData }: ClassFormProps) {
  const isEdit = !!initialData

  const form = useForm<ClassData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name:        initialData?.name        ?? '',
      description: initialData?.description ?? '',
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Class' : 'Create New Class'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the class name or description.'
              : 'A class is a group of students — e.g. "Form 4 East".'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Form 4 East" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description
                    <span className="ml-1 text-xs text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A brief description of this class."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEdit ? 'Saving…' : 'Creating…'
                  : isEdit ? 'Save Changes' : 'Create Class'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}