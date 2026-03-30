'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getAssessments } from '@/lib/actions/assessments';
import type { Assessment } from '@/lib/actions/assessments';
import { getSubjects } from '@/lib/actions/subjects';
import { getClasses } from '@/lib/actions/classes';
import { Subject } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';

import { ExamDialog } from '@/components/exams/exam-dialog';
import { BatchGradingDialog } from '@/components/grading/batch-grading-dialog';

interface AssignAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  classId: string;
  studentId: string;
}

export function AssignAssessmentDialog({
  open,
  onOpenChange,
  studentName,
  classId,
  studentId,
}: AssignAssessmentDialogProps) {
  const [assessments,          setAssessments]          = useState<Assessment[]>([]);
  const [subjects,             setSubjects]             = useState<Subject[]>([]);
  const [classes,              setClasses]              = useState<{ class_id: string; name: string }[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | undefined>(undefined);
  const [isLoading,            setIsLoading]            = useState(false);
  const [isSubmitting,         setIsSubmitting]         = useState(false);

  const [showCreateDialog,  setShowCreateDialog]  = useState(false);
  const [showSuccessPrompt, setShowSuccessPrompt] = useState(false);
  const [showGradingDialog, setShowGradingDialog] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    Promise.all([getAssessments(), getSubjects(), getClasses()])
      .then(([{ data: assessData }, { data: subjData }, { data: classData }]) => {
        const relevant = (assessData ?? []).filter((a) => a.classId === classId);
        setAssessments(relevant);
        if (subjData)  setSubjects(subjData);
        // getClasses() returns role-scoped results (all org classes for admin,
        // assigned classes for teacher) — map to the shape ExamDialog expects
        if (classData) setClasses(
          (classData as any[]).map((c) => ({ class_id: c.class_id, name: c.name }))
        );
      })
      .finally(() => setIsLoading(false));
  }, [open, classId]);

  const handleSubmit = () => {
    if (!selectedAssessmentId) return toast.warning('Select an assessment');
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onOpenChange(false);
      setShowSuccessPrompt(true);
    }, 1000);
  };

  return (
    <>
      {/* 1. ASSIGN DIALOG */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign to {studentName}</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {assessments.length > 0 ? (
              <>
                <Label>Select Assessment</Label>
                <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
                  <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                  <SelectContent>
                    {assessments.map((a) => (
                      <SelectItem key={a.assessment_id} value={a.assessment_id}>
                        {a.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No assessments found for this class.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            {assessments.length > 0 ? (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Assigning...' : 'Assign Now'}
              </Button>
            ) : (
              <Button onClick={() => { onOpenChange(false); setShowCreateDialog(true); }}>
                Create New Assessment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. SUCCESS PROMPT */}
      <Dialog open={showSuccessPrompt} onOpenChange={setShowSuccessPrompt}>
        <DialogContent className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <DialogHeader>
            <DialogTitle>Assessment Assigned!</DialogTitle>
            <DialogDescription>
              Would you like to upload {studentName}&apos;s submission and start grading now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button className="w-full" onClick={() => { setShowSuccessPrompt(false); setShowGradingDialog(true); }}>
              Yes, Grade Submission
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowSuccessPrompt(false)}>
              No, I&apos;ll do it later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. CREATE DIALOG — class pre-selected and locked */}
      <ExamDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        subjects={subjects}
        classes={classes}
        initialClassId={classId}
        disableClassSelect={true}
      />

      {/* 4. GRADING DIALOG */}
      {selectedAssessmentId && (
        <BatchGradingDialog
          open={showGradingDialog}
          onOpenChange={setShowGradingDialog}
          assessmentId={selectedAssessmentId}
          classId={classId}
          initialStudentId={studentId}
        />
      )}
    </>
  );
}