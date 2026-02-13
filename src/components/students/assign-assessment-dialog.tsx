'use client'

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getAssessments } from '@/lib/actions/assessments';
import type { Assessment } from '@/lib/actions/assessments';
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
}: AssignAssessmentDialogProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setIsLoading(true);
    getAssessments()
      .then(({ data, error }) => {
        if (error) {
          toast.error('Failed to fetch assessments', { description: error.message });
          setAssessments([]);
          setSelectedAssessmentId(undefined);
        } else {
          const relevantAssessments = (data || []).filter(a => a.classId === classId);
          setAssessments(relevantAssessments);
          setSelectedAssessmentId(undefined);
        }
      })
      .finally(() => setIsLoading(false));
  }, [open, classId]);

  const handleSubmit = () => {
    if (!selectedAssessmentId) {
      toast.warning('Please select an assessment to assign.');
      return;
    }

    setIsSubmitting(true);
    toast.info(`Assigning assessment to ${studentName}...`);

    // Simulate server action
    setTimeout(() => {
      toast.success('Assessment assigned successfully!');
      setIsSubmitting(false);
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Assessment to {studentName}</DialogTitle>
          <DialogDescription>
            Select an assessment from the list to assign to this student.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 w-full">
          <Label htmlFor="assessment-select">Assessment</Label>

          {isLoading ? (
            <p>Loading assessments...</p>
          ) : assessments.length > 0 ? (
            <Select
              value={selectedAssessmentId}
              onValueChange={setSelectedAssessmentId}
            >
              <SelectTrigger id="assessment-select" className="w-full">
                <SelectValue placeholder="Select an assessment" />
              </SelectTrigger>
              <SelectContent className="w-full max-h-60 overflow-auto">
                {assessments.map((assessment) => (
                  <SelectItem
                    key={assessment.assessment_id}
                    value={assessment.assessment_id}
                  >
                    {assessment.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              No assessments found for this class.
            </p>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || assessments.length === 0}
          >
            {isSubmitting ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
