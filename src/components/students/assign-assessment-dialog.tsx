// src/components/students/assign-assessment-dialog.tsx
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
  classId: string; // We need the classId to filter relevant assessments
}

export function AssignAssessmentDialog({
  open,
  onOpenChange,
  studentName,
  classId,
}: AssignAssessmentDialogProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      getAssessments()
        .then(({ data, error }) => {
          if (error) {
            toast.error('Failed to fetch assessments', { description: error.message });
            setAssessments([]);
          } else {
            // [Business Logic] Filter assessments to show only those for the current class
            const relevantAssessments = (data || []).filter(a => a.classId === classId);
            setAssessments(relevantAssessments);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, classId]);

  const handleSubmit = () => {
    if (!selectedAssessmentId) {
      toast.warning('Please select an assessment to assign.');
      return;
    }
    setIsSubmitting(true);
    toast.info(`Assigning assessment to ${studentName}...`);
    // [TODO] Here you would call a Server Action to create the assignment record.
    // For now, we'll simulate it.
    setTimeout(() => {
      toast.success('Assessment assigned successfully!');
      setIsSubmitting(false);
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Assessment to {studentName}</DialogTitle>
          <DialogDescription>
            Select an assessment from the list to assign to this student.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="assessment-select">Assessment</Label>
          {isLoading ? (
            <p>Loading assessments...</p>
          ) : assessments.length > 0 ? (
            <Select onValueChange={setSelectedAssessmentId}>
              <SelectTrigger id="assessment-select">
                <SelectValue placeholder="Select an assessment" />
              </SelectTrigger>
              <SelectContent>
                {assessments.map((assessment) => (
                  <SelectItem key={assessment.id} value={assessment.id}>
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoading || assessments.length === 0}>
            {isSubmitting ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
