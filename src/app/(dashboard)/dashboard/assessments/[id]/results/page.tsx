import { notFound } from 'next/navigation';
import { getSubmissionsForAssessment } from '@/lib/actions/submissions';
import { getAssessment } from '@/lib/actions/assessments';
import { SubmissionsListClient } from '@/components/results/submissions-list-client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';

interface SubmissionsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SubmissionsPage({ params }: SubmissionsPageProps) {
  // Await the params to safely access its properties
  const resolvedParams = await params;
  const assessmentId = resolvedParams.id;

  const [submissionsRes, assessmentRes] = await Promise.all([
    getSubmissionsForAssessment(assessmentId),
    getAssessment(assessmentId),
  ]);

  const { data: submissions, error: submissionsError } = submissionsRes;
  const { data: assessment, error: assessmentError } = assessmentRes;

  if (submissionsError || assessmentError || !assessment) {
    return notFound();
  }

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/exams">Assessments</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/dashboard/assessments/${assessment.assessment_id}`}>
                {assessment.title}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Student Results</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Results</h1>
          <p className="text-muted-foreground">
            Results for &quot;{assessment.title}&quot;
          </p>
        </div>
      </div>

      <SubmissionsListClient
        initialSubmissions={submissions ?? []}
        assessmentId={assessmentId}
      />
    </div>
  );
}
