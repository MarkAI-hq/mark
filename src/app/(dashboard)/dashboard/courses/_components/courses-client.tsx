'use client'

// src/app/(dashboard)/dashboard/courses/_components/courses-client.tsx

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams }          from 'next/navigation'
import { Plus, BookOpen, ArrowRight, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

import { Button }          from '@/components/ui/button'
import { Course, Subject } from '@/lib/types'
import { createCourse, updateCourse, deleteCourse } from '@/lib/actions/courses'
import { CoursesTable }    from '@/components/courses/courses-table'
import { CourseForm, CourseData } from '@/components/courses/course-form'
import { ConfirmDialog }   from '@/components/common/confirm-dialog'

interface CoursesClientProps {
  initialCourses: Course[]
  subjects:       Subject[]
}

export function CoursesClient({ initialCourses, subjects }: CoursesClientProps) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [courses,        setCourses]        = useState<Course[]>(initialCourses)
  const [selectedCourse, setSelectedCourse] = useState<Course | undefined>(undefined)
  const [isFormOpen,     setIsFormOpen]     = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | undefined>(undefined)
  const [isPending,      startTransition]   = useTransition()

  // Auto-open create form when arriving from ?new=true
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setSelectedCourse(undefined)
      setIsFormOpen(true)
      router.replace('/dashboard/courses')
    }
  }, [searchParams, router])

  const handleCreate = (data: CourseData) => {
    startTransition(async () => {
      try {
        const newCourse = await createCourse(data)
        setCourses(prev => [newCourse, ...prev])
      } catch (err) {
        toast({
          title:       'Failed to create course',
          description: err instanceof Error ? err.message : 'An unknown error occurred.',
          variant:     'destructive',
        })
      }
    })
  }

  const handleUpdate = (data: CourseData) => {
    if (!selectedCourse) return
    startTransition(async () => {
      try {
        const updatedCourse = await updateCourse(selectedCourse.id, data)
        setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c))
        toast({ title: 'Success', description: 'Course updated successfully.' })
        setIsFormOpen(false)
        setSelectedCourse(undefined)
      } catch (err) {
        toast({
          title:       'Failed to update course',
          description: err instanceof Error ? err.message : 'An unknown error occurred.',
          variant:     'destructive',
        })
      }
    })
  }

  const handleDelete = () => {
    if (!courseToDelete) return
    startTransition(async () => {
      try {
        await deleteCourse(courseToDelete.id)
        setCourses(prev => prev.filter(c => c.id !== courseToDelete.id))
        toast({ title: 'Success', description: 'Course deleted successfully.' })
        setCourseToDelete(undefined)
      } catch (err) {
        toast({
          title:       'Failed to delete course',
          description: err instanceof Error ? err.message : 'An unknown error occurred.',
          variant:     'destructive',
        })
      }
    })
  }

  const openCreateForm = () => {
    setSelectedCourse(undefined)
    setIsFormOpen(true)
  }

  const openEditForm = (course: Course) => {
    setSelectedCourse(course)
    setIsFormOpen(true)
  }

  // ── No subjects — prerequisite missing ──────────────────────────────────
  if (subjects.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center gap-5">
        <AlertCircle className="h-8 w-8 text-amber-500" />
        <div className="text-center space-y-1.5">
          <h3 className="text-base font-semibold text-foreground">
            Create a subject first
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Courses belong to subjects. Add at least one subject before creating a course.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/settings/subjects?new=true')}>
          Go to Subjects
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    )
  }

  // ── No courses yet ───────────────────────────────────────────────────────
  if (courses.length === 0) {
    return (
      <>
        <div className="py-24 flex flex-col items-center gap-5">
          <BookOpen className="h-8 w-8 text-muted-foreground/40" />
          <div className="text-center space-y-1.5">
            <h3 className="text-base font-semibold text-foreground">No courses yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Courses hold your assessments for a topic — e.g.{' '}
              <span className="text-foreground">&quot;S3 Mathematics&quot;</span> or{' '}
              <span className="text-foreground">&quot;P6 English&quot;</span>.
            </p>
          </div>
          <Button onClick={openCreateForm}>
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Button>
        </div>

        <CourseForm
          key="create-new"
          open={isFormOpen}
          onOpenChange={open => { if (!open) setIsFormOpen(false) }}
          onSubmit={handleCreate}
          isSubmitting={isPending}
          subjects={subjects}
        />
      </>
    )
  }

  // ── Courses exist ────────────────────────────────────────────────────────
  return (
    <>
      <CoursesTable
        data={courses}
        onEdit={openEditForm}
        onDelete={setCourseToDelete}
        headerSlot={
          <Button onClick={openCreateForm}>
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Button>
        }
      />

      <CourseForm
        key={selectedCourse ? `edit-${selectedCourse.id}` : 'create-new'}
        open={isFormOpen}
        onOpenChange={open => {
          if (!open) {
            setIsFormOpen(false)
            setSelectedCourse(undefined)
          }
        }}
        onSubmit={selectedCourse ? handleUpdate : handleCreate}
        isSubmitting={isPending}
        initialData={selectedCourse}
        subjects={subjects}
      />

      <ConfirmDialog
        open={!!courseToDelete}
        onOpenChange={() => setCourseToDelete(undefined)}
        onConfirm={handleDelete}
        title="Are you sure?"
        description={`This will permanently delete the course "${courseToDelete?.title}". This action cannot be undone.`}
        confirmText="Yes, Delete Course"
        isDestructive
      />
    </>
  )
}