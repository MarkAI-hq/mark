// src/components/students/student-form.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, X } from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem,
  FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form'
import { Input }     from '@/components/ui/input'
import { Button }    from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Student }   from '@/lib/types'
import { CreateStudentData } from '@/lib/actions/students'

const formSchema = z.object({
  name:              z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  student_school_id: z.string().optional(),
  date_of_birth:     z.string().optional(),
  gender:            z.string().optional(),
  guardian_name:     z.string().optional(),
  guardian_phone:    z.string().optional(),
  guardian_email:    z.string().email({ message: 'Invalid email address.' }).optional().or(z.literal('')),
})

export type StudentFormData = CreateStudentData

interface StudentFormProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  onSubmit:     (data: StudentFormData, photo?: File) => void
  isSubmitting: boolean
  student?:     Student
}

export function StudentForm({
  open, onOpenChange, onSubmit, isSubmitting, student,
}: StudentFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile,    setPhotoFile]    = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<StudentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name:              student ? `${student.first_name} ${student.last_name || ''}`.trim() : '',
      student_school_id: student?.student_school_id || '',
      date_of_birth:     student?.date_of_birth     || '',
      gender:            student?.gender             || '',
      guardian_name:     student?.guardian_name      || '',
      guardian_phone:    student?.guardian_phone     || '',
      guardian_email:    student?.guardian_email     || '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        student
          ? {
              name:              `${student.first_name} ${student.last_name || ''}`.trim(),
              student_school_id: student.student_school_id || '',
              date_of_birth:     student.date_of_birth     || '',
              gender:            student.gender             || '',
              guardian_name:     student.guardian_name      || '',
              guardian_phone:    student.guardian_phone     || '',
              guardian_email:    student.guardian_email     || '',
            }
          : {
              name: '', student_school_id: '', date_of_birth: '',
              gender: '', guardian_name: '', guardian_phone: '', guardian_email: '',
            },
      )
      setPhotoPreview(null)
      setPhotoFile(null)
    }
  }, [form, student, open])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = (data: StudentFormData) => {
    onSubmit(data, photoFile ?? undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? 'Edit Student Profile' : 'Add New Student'}</DialogTitle>
          <DialogDescription>
            {student
              ? 'Update the student\'s details below.'
              : 'Enter the student\'s details to create their account.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 pt-2">

            {/* ── Photo ───────────────────────────────────────────────── */}
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted hover:border-primary/50 transition-colors overflow-hidden"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-7 w-7 text-muted-foreground/50" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Photo (Optional)</p>
                <p className="text-xs text-muted-foreground">Click to upload a student photo</p>
                {photoFile && (
                  <button
                    type="button"
                    onClick={() => { setPhotoPreview(null); setPhotoFile(null) }}
                    className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            <Separator />

            {/* ── Basic info ──────────────────────────────────────────── */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Student Details
              </p>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name <span className="text-rose-500">*</span></FormLabel>
                    <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="student_school_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student ID</FormLabel>
                      <FormControl><Input placeholder="Auto-generated" {...field} /></FormControl>
                      <FormDescription className="text-xs">Leave blank to auto-assign</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <FormControl><Input placeholder="e.g. Female" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* ── Guardian info ───────────────────────────────────────── */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Guardian Details (Optional)
              </p>

              <FormField
                control={form.control}
                name="guardian_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guardian Name</FormLabel>
                    <FormControl><Input placeholder="Parent or guardian's full name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="guardian_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Phone</FormLabel>
                      <FormControl><Input placeholder="+256 700 000000" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guardian_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Email</FormLabel>
                      <FormControl><Input placeholder="guardian@email.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
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