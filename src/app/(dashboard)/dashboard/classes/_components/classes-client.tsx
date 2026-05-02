'use client'

// src/app/(dashboard)/dashboard/classes/_components/classes-client.tsx

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams }          from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Class } from '@/lib/types';
import { createClass, updateClass, deleteClass } from '@/lib/actions/classes';
import { ClassesTable } from '@/components/classes/classes-table';
import { ClassForm, ClassData } from '@/components/classes/class-form';
import { ConfirmDialog } from '@/components/common/confirm-dialog';

interface ClassesClientProps {
  initialClasses: Class[];
}

export function ClassesClient({ initialClasses }: ClassesClientProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [classes,       setClasses]       = useState<Class[]>(initialClasses);
  const [selectedClass, setSelectedClass] = useState<Class | undefined>(undefined);
  const [isFormOpen,    setIsFormOpen]    = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | undefined>(undefined);
  const [isPending,     startTransition]  = useTransition();

  // Auto-open create form when arriving from ?new=true
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setSelectedClass(undefined)
      setIsFormOpen(true)
      router.replace('/dashboard/classes')
    }
  }, [searchParams, router])

  const handleCreate = (data: ClassData) => {
    startTransition(async () => {
      try {
        const payload = { ...data, grade_level: data.name, description: data.description || null };
        const newClass = await createClass(payload);
        setClasses((prev) => [newClass, ...prev]);
        toast.success(`Class "${newClass.name}" created.`);
        setIsFormOpen(false);
        router.push(`/dashboard/classes/${newClass.class_id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create class.');
      }
    });
  };

  const handleUpdate = (data: ClassData) => {
    if (!selectedClass) return;
    startTransition(async () => {
      try {
        const payload = { ...data, grade_level: data.name, description: data.description || null };
        const updatedClass = await updateClass(selectedClass.class_id, payload);
        setClasses((prev) =>
          prev.map((c) => (c.class_id === updatedClass.class_id ? updatedClass : c)),
        );
        toast.success('Class updated successfully.');
        setIsFormOpen(false);
        setSelectedClass(undefined);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update class.');
      }
    });
  };

  const handleDelete = () => {
    if (!classToDelete) return;
    startTransition(async () => {
      try {
        await deleteClass(classToDelete.class_id);
        setClasses((prev) => prev.filter((c) => c.class_id !== classToDelete.class_id));
        toast.success('Class deleted successfully.');
        setClassToDelete(undefined);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete class.');
      }
    });
  };

  const openCreateForm = () => {
    setSelectedClass(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (cls: Class) => {
    setSelectedClass(cls);
    setIsFormOpen(true);
  };

  return (
    <>
      <ClassesTable
        data={classes}
        onEdit={openEditForm}
        onDelete={setClassToDelete}
        headerSlot={
          <Button onClick={openCreateForm}>
            <Plus className="mr-2 h-4 w-4" />
            New Class
          </Button>
        }
      />

      <ClassForm
        key={selectedClass ? `edit-${selectedClass.class_id}` : 'create-new'}
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setSelectedClass(undefined);
          }
        }}
        onSubmit={selectedClass ? handleUpdate : handleCreate}
        isSubmitting={isPending}
        initialData={selectedClass}
      />

      <ConfirmDialog
        open={!!classToDelete}
        onOpenChange={() => setClassToDelete(undefined)}
        onConfirm={handleDelete}
        title="Are you sure?"
        description={`This will permanently delete the class "${classToDelete?.name}". This action cannot be undone.`}
        confirmText="Yes, Delete Class"
        isDestructive
      />
    </>
  );
}