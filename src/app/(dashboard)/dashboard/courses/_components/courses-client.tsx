// src/app/(dashboard)/dashboard/courses/_components/courses-client.tsx
'use client'

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Course, Subject } from '@/lib/types';
import { createCourse, updateCourse, deleteCourse } from '@/lib/actions/courses';
import { CoursesTable } from '@/components/courses/courses-table';
import { CourseForm, CourseData } from '@/components/courses/course-form';
import { ConfirmDialog } from '@/components/common/confirm-dialog';

interface CoursesClientProps {
  initialCourses: Course[];
  subjects: Subject[];
}

export function CoursesClient({ initialCourses, subjects }: CoursesClientProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [selectedCourse, setSelectedCourse] = useState<Course | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (data: CourseData) => {
    startTransition(async () => {
      try {
        const newCourse = await createCourse(data);
        setCourses((prev) => [newCourse, ...prev]);
        toast({ title: 'Success', description: `Course "${newCourse.title}" created.` });
        setIsFormOpen(false);
      } catch (err) {
        toast({
          title: 'Failed to create course',
          description: err instanceof Error ? err.message : 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleUpdate = (data: CourseData) => {
    if (!selectedCourse) return;
    startTransition(async () => {
      try {
        const updatedCourse = await updateCourse(selectedCourse.id, data);
        setCourses((prev) =>
          prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c)),
        );
        toast({ title: 'Success', description: 'Course updated successfully.' });
        setIsFormOpen(false);
        setSelectedCourse(undefined);
      } catch (err) {
        toast({
          title: 'Failed to update course',
          description: err instanceof Error ? err.message : 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleDelete = () => {
    if (!courseToDelete) return;
    startTransition(async () => {
      try {
        await deleteCourse(courseToDelete.id);
        setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id));
        toast({ title: 'Success', description: 'Course deleted successfully.' });
        setCourseToDelete(undefined);
      } catch (err) {
        toast({
          title: 'Failed to delete course',
          description: err instanceof Error ? err.message : 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    });
  };

  const openCreateForm = () => {
    setSelectedCourse(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (course: Course) => {
    setSelectedCourse(course);
    setIsFormOpen(true);
  };

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
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setSelectedCourse(undefined);
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
  );
}
