//src/app/(dashboard)/dashboard/exams/exams-client.tsx
'use client'

import { useState, useTransition } from 'react';
import { toast } from 'sonner'; // toast is already imported
import { Plus } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';

import { Button } from '@/components/ui/button';
import { ExamsTable } from '@/components/exams/exams-table';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Assessment, deleteAssessment } from '@/lib/actions/assessments';
import { Subject } from '@/lib/types';
import { ExamDialog } from '@/components/exams/exam-dialog';

interface ExamsClientProps {
  assessments: Assessment[];
  subjects: Subject[];
}

export function ExamsClient({ assessments, subjects }: ExamsClientProps) {
  const [assessmentList, setAssessmentList] = useState<Assessment[]>(assessments);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const resetState = () => {
    setSelectedAssessment(undefined);
    setDialogOpen(false);
    setDeleteDialogOpen(false);
  };

  const handleOpenNewDialog = () => {
    setSelectedAssessment(undefined);
    setDialogOpen(true);
  };

  useHotkeys('n', handleOpenNewDialog, {
    preventDefault: true,
    description: 'Create new assessment',
  });

  useHotkeys('escape', resetState, {
    preventDefault: true,
    description: 'Close dialogs',
  });

  const handleDelete = () => {
    if (!selectedAssessment) return;

    // Move toast.promise OUTSIDE of startTransition
    toast.promise(
      deleteAssessment(selectedAssessment.assessment_id),
      {
        loading: 'Deleting assessment...',
        success: (res) => {
          if (res.error) {
            throw new Error(res.error.message);
          }
          // Use startTransition only for the state update
          startTransition(() => {
            setAssessmentList((prevList) =>
              prevList.filter((item) => item.assessment_id !== selectedAssessment.assessment_id),
            );
          });
          resetState();
          return res.data?.message || 'Assessment deleted successfully.';
        },
        error: (err) => {
          return err.message || 'Failed to delete assessment.';
        },
      }
    );
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div />
        <Button onClick={handleOpenNewDialog} id="create-assessment">
          <Plus className="mr-2 h-4 w-4" />
          New Assessment
        </Button>
      </div>

      <ExamsTable
        data={assessmentList}
        onEdit={(assessment) => {
          setSelectedAssessment(assessment);
          setDialogOpen(true);
        }}
        onDelete={(assessment) => {
          setSelectedAssessment(assessment);
          setDeleteDialogOpen(true);
        }}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Are you sure?"
        description={`This will permanently delete the "${selectedAssessment?.title || 'assessment'}" and all of its associated data. This action cannot be undone.`}
        confirmText={isPending ? 'Deleting...' : 'Yes, Delete Assessment'}
        isDestructive
      />

      <ExamDialog
        key={selectedAssessment?.assessment_id || 'new'}
        open={dialogOpen}
        subjects={subjects}
        assessment={selectedAssessment}
        onOpenChange={(open) => {
          if (!open) {
            resetState();
          } else {
            setDialogOpen(true);
          }
        }}
      />
    </>
  );
}
