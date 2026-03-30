'use client';

// src/components/subjects/subjects-client.tsx

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams }                from 'next/navigation';
import { toast }           from 'sonner';
import { Plus }            from 'lucide-react';
import { useHotkeys }      from 'react-hotkeys-hook';

import { Button }                   from '@/components/ui/button';
import { SubjectsTable }            from '@/components/subjects/subjects-table';
import { SubjectData, SubjectForm } from '@/components/subjects/subject-form';
import { DeleteSubjectDialog }      from '@/components/subjects/delete-subject-dialog';
import { Subject }                  from '@/lib/types';
import { createSubject, updateSubject, deleteSubject } from '@/lib/actions/subjects';
import { ExamDialog }               from '@/components/exams/exam-dialog';

interface SubjectsClientProps {
  subjects: Subject[]
  isAdmin:  boolean
}

export function SubjectsClient({ subjects, isAdmin }: SubjectsClientProps) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [subjectList,          setSubjectList]          = useState<Subject[]>(subjects);
  const [selectedSubject,      setSelectedSubject]      = useState<Subject | undefined>(undefined);
  const [isCreatingSubject,    setIsCreatingSubject]    = useState(false);
  const [subjectToDelete,      setSubjectToDelete]      = useState<Subject | undefined>(undefined);
  const [lastCreatedSubject,   setLastCreatedSubject]   = useState<Subject | null>(null);
  const [showCreateExamPrompt, setShowCreateExamPrompt] = useState(false);
  const [examDialogOpen,       setExamDialogOpen]       = useState(false);

  // Auto-open create form when arriving from ?new=true
  useEffect(() => {
    if (isAdmin && searchParams.get('new') === 'true') {
      setIsCreatingSubject(true)
      router.replace('/dashboard/subjects')
    }
  }, [searchParams, router, isAdmin])

  // Show create exam prompt after creating a subject
  useEffect(() => {
    if (!lastCreatedSubject) return;
    const timeout = setTimeout(() => setShowCreateExamPrompt(true), 1000);
    return () => clearTimeout(timeout);
  }, [lastCreatedSubject]);

  useHotkeys('c', () => { if (isAdmin) setIsCreatingSubject(true) }, { preventDefault: true });
  useHotkeys('escape', () => {
    setSelectedSubject(undefined);
    setIsCreatingSubject(false);
    setSubjectToDelete(undefined);
    setShowCreateExamPrompt(false);
    setExamDialogOpen(false);
    if (!subjectToDelete) setLastCreatedSubject(null);
  }, { preventDefault: true });

  const handleCreate = useCallback(async (data: SubjectData) => {
    const { data: subject, error } = await createSubject(data);
    if (subject) {
      setSubjectList(prev => [subject, ...prev]);
      toast.success(`Subject "${subject.name}" created successfully`);
      setLastCreatedSubject(subject);
      setIsCreatingSubject(false);
    }
    if (error) {
      toast.error('Failed to create subject', { description: error.message });
    }
  }, []);

  const handleUpdate = useCallback(async (data: SubjectData) => {
    if (!selectedSubject) return;
    const { data: updatedSubject, error } = await updateSubject(selectedSubject.id, data);
    if (updatedSubject) {
      setSubjectList(prev => prev.map(s => s.id === updatedSubject.id ? updatedSubject : s));
      toast.success('Subject updated successfully');
      setSelectedSubject(undefined);
    }
    if (error) {
      toast.error('Failed to update subject', { description: error.message });
    }
  }, [selectedSubject]);

  const handleDelete = useCallback(async () => {
    if (!subjectToDelete) return;
    const { data, error } = await deleteSubject(subjectToDelete.id);
    if (data) {
      setSubjectList(prev => prev.filter(s => s.id !== subjectToDelete.id));
      toast.success('Subject deleted');
      setSubjectToDelete(undefined);
    }
    if (error) {
      toast.error('Failed to delete subject', { description: error.message });
    }
  }, [subjectToDelete]);

  const formSubject          = useMemo(() => selectedSubject, [selectedSubject]);
  const shouldShowCreateExam = useMemo(
    () => lastCreatedSubject && showCreateExamPrompt,
    [lastCreatedSubject, showCreateExamPrompt],
  );

  const tableProps = useMemo(() => ({
    data:      subjectList,
    onEdit:    isAdmin ? setSelectedSubject : undefined,
    onDelete:  isAdmin ? setSubjectToDelete : undefined,
    headerSlot: isAdmin ? (
      <Button onClick={() => setIsCreatingSubject(true)} id="create-subject">
        <Plus className="mr-2 h-4 w-4" />
        New Subject
      </Button>
    ) : null,
  }), [subjectList, isAdmin]);

  const formProps = useMemo(() => ({
    open: !!selectedSubject || isCreatingSubject,
    onOpenChange: (open: boolean) => {
      if (!open) {
        setSelectedSubject(undefined);
        setIsCreatingSubject(false);
      }
    },
    initialData: formSubject,
    onSubmit: formSubject ? handleUpdate : handleCreate,
  }), [selectedSubject, isCreatingSubject, formSubject, handleUpdate, handleCreate]);

  return (
    <>
      <SubjectsTable {...tableProps} />

      {isAdmin && (
        <>
          <SubjectForm
            key={formSubject ? `edit-${formSubject.id}` : 'create-new'}
            {...formProps}
          />

          <DeleteSubjectDialog
            open={!!subjectToDelete}
            onOpenChange={(open) => !open && setSubjectToDelete(undefined)}
            onConfirm={handleDelete}
            subjectTitle={subjectToDelete?.name ?? ''}
          />

          {shouldShowCreateExam && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
              <div className="bg-background text-foreground border border-border p-6 rounded-xl shadow-xl w-full max-w-md">
                <p className="mb-4">
                  Subject &quot;{lastCreatedSubject?.name}&quot; created successfully. Would you like
                  to create an exam for this subject now?
                </p>
                <div className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateExamPrompt(false);
                      setLastCreatedSubject(null);
                    }}
                  >
                    Not now
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCreateExamPrompt(false);
                      setExamDialogOpen(true);
                    }}
                  >
                    Yes, create exam
                  </Button>
                </div>
              </div>
            </div>
          )}

          <ExamDialog
            open={examDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                setExamDialogOpen(false);
                setLastCreatedSubject(null);
              }
            }}
            subjects={lastCreatedSubject ? [lastCreatedSubject] : subjectList}
            initialCourseId={lastCreatedSubject?.id}
            disableCourseSelect={Boolean(lastCreatedSubject)}
          />
        </>
      )}
    </>
  );
}