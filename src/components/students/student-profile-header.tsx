// src/components/students/student-profile-header.tsx
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Printer, PenSquare, BrainCircuit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AppBreadcrumb } from '@/components/ui/app-breadcrumb';
import { AssignAssessmentDialog } from './assign-assessment-dialog';
import type { StudentSubmission, StudentCognitiveProfile } from '@/lib/actions/student-details';
import { generateCognitiveReport } from '@/lib/actions/reports';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface StudentProfileHeaderProps {
  studentName: string;
  studentId: string;
  classId: string;
  breadcrumbItems: BreadcrumbItem[];
  hasSubmissions: boolean;
  hasCognitiveProfile: boolean;
}

export function StudentProfileHeader({
  studentName,
  studentId,
  classId,
  breadcrumbItems,
  hasSubmissions,
  hasCognitiveProfile,
}: StudentProfileHeaderProps) {
  const router = useRouter();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const handlePrintReport = () => {
    toast.info('Generating report...');
    // [TODO] Call the actual report generation action
    setTimeout(() => toast.success('Report downloaded!'), 1000);
  };

  const handleAssessProfile = () => {
    // FIX: Use the correct, user-centric URL structure for navigation.
    router.push(`/dashboard/students/${studentId}/assess`);
  };

  return (
    <>
      <AppBreadcrumb items={breadcrumbItems} />

      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{studentName}</h1>
          <p className="text-muted-foreground">
            Student Profile & Academic Record
          </p>
        </div>
        <div className="flex gap-2">
          {hasSubmissions && (
            <Button variant="outline" onClick={handlePrintReport}>
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          )}
          <Button onClick={() => setIsAssignDialogOpen(true)}>
            <PenSquare className="mr-2 h-4 w-4" />
            Assign Assessment
          </Button>
          <Button onClick={handleAssessProfile}>
            <BrainCircuit className="mr-2 h-4 w-4" />
            {hasCognitiveProfile ? 'Re-assess Profile' : 'Assess Profile'}
          </Button>
        </div>
      </header>

      <AssignAssessmentDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        studentName={studentName}
        classId={classId}
      />
    </>
  );
}