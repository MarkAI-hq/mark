'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';

import { Button } from '@/components/ui/button';
import { SubjectsTable } from '@/components/subjects/subjects-table';
import { SubjectData, SubjectForm } from '@/components/subjects/subject-form';
import { DeleteSubjectDialog } from '@/components/subjects/delete-subject-dialog';
import { Subject } from '@/lib/types';
import { createSubject, updateSubject, deleteSubject } from '@/lib/actions/subjects';
import { ExamDialog } from '@/components/exams/exam-dialog';

export function SubjectsClient({ subjects }: { subjects: Subject[] }) {
  const [subjectList, setSubjectList] = useState<Subject[]>(subjects);
  const [selectedSubject, setSelectedSubject] = useState<Subject | undefined>(undefined);
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | undefined>(undefined);
  const [lastCreatedSubject, setLastCreatedSubject] = useState<Subject | null>(null);
  const [showCreateExamPrompt, setShowCreateExamPrompt] = useState(false);
  const [examDialogOpen, setExamDialogOpen] = useState(false);

  // Show create exam prompt after creating a subject
  useEffect(() => {
    if (!lastCreatedSubject) return;
    
    const timeout = setTimeout(() => {
      setShowCreateExamPrompt(true);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [lastCreatedSubject]);

  // Keyboard shortcuts
  useHotkeys('c', () => setIsCreatingSubject(true), { preventDefault: true });
  useHotkeys('escape', () => {
    setSelectedSubject(undefined);
    setIsCreatingSubject(false);
    setSubjectToDelete(undefined);
    setShowCreateExamPrompt(false);
    setExamDialogOpen(false);
    // Only reset lastCreatedSubject if we're not trying to show the exam prompt
    if (!subjectToDelete) {
      setLastCreatedSubject(null);
    }
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
      setSubjectList(prev =>
        prev.map(s => s.id === updatedSubject.id ? updatedSubject : s)
      );
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

  // Memoize the subject for form to prevent unnecessary re-renders
  const formSubject = useMemo(() => selectedSubject, [selectedSubject]);

  // Memoize the create exam prompt to prevent unnecessary re-renders
  const shouldShowCreateExam = useMemo(() => 
    lastCreatedSubject && showCreateExamPrompt, 
    [lastCreatedSubject, showCreateExamPrompt]
  );

  // Memoize props for child components
  const tableProps = useMemo(() => ({
    data: subjectList,
    onEdit: setSelectedSubject,
    onDelete: setSubjectToDelete,
    headerSlot: (
      <Button onClick={() => setIsCreatingSubject(true)} id="create-subject">
        <Plus className="mr-2 h-4 w-4" />
        New Subject
      </Button>
    )
  }), [subjectList]);

  const formProps = useMemo(() => ({
    open: !!selectedSubject || isCreatingSubject,
    onOpenChange: (open: boolean) => {
      if (!open) {
        setSelectedSubject(undefined);
        setIsCreatingSubject(false);
      }
    },
    initialData: formSubject,
    onSubmit: formSubject ? handleUpdate : handleCreate
  }), [selectedSubject, isCreatingSubject, formSubject, handleUpdate, handleCreate]);

  return (
    <>
      <SubjectsTable {...tableProps} />

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
              Subject &quot;{lastCreatedSubject?.name}&quot; created successfully. Would you like to create an exam for this subject now?
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
                Yes, create exam.
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
  );
}
