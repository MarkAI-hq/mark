// src/components/students/student-form.tsx
'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Button } from '@/components/ui/button'
import { Student } from '@/lib/types'
import { CreateStudentData } from '@/lib/actions/students'

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Full name must be at least 2 characters.',
  }),
  student_school_id: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
})

export type StudentFormData = CreateStudentData;

interface StudentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: StudentFormData) => void
  isSubmitting: boolean
  student?: Student
}

export function StudentForm({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  student,
}: StudentFormProps) {
  const form = useForm<StudentFormData>({
    resolver: zodResolver(formSchema),
    // FIXED: This now correctly accesses first_name and last_name from the
    // updated Student type, resolving the previous type error.
    defaultValues: {
      name: student ? `${student.first_name} ${student.last_name || ''}`.trim() : '',
      student_school_id: student?.student_school_id || '',
      date_of_birth: student?.date_of_birth || '',
      gender: student?.gender || '',
    },
  })

  useEffect(() => {
    if (open) {
      // FIXED: The form reset logic is also now type-safe.
      form.reset(
        student
          ? {
              name: `${student.first_name} ${student.last_name || ''}`.trim(),
              student_school_id: student.student_school_id || '',
              date_of_birth: student.date_of_birth || '',
              gender: student.gender || '',
            }
          : {
              name: '',
              student_school_id: '',
              date_of_birth: '',
              gender: '',
            },
      )
    }
  }, [form, student, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {student ? 'Edit Student Profile' : 'Add New Student'}
          </DialogTitle>
          <DialogDescription>
            Enter the student&apos;s details. This will create a new user account for them.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="student_school_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="School-specific ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Female" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                {isSubmitting ? 'Saving...' : 'Save Student'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
