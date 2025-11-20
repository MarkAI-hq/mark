import { notFound } from 'next/navigation';
import { getSubmissionResults } from '@/lib/actions/results';
import { getAssessment } from '@/lib/actions/assessments';
import { getStudent } from '@/lib/actions/students';
import { getErrorTaxonomy, getBloomsTaxonomy } from '@/lib/actions/cognitive';
import { ResultsClient } from '@/components/results/results-client';

interface ResultsPageProps {
  params: Promise<{
    id: string;
    submissionId: string;
  }>;
}

export default async function SubmissionResultsPage({
  params,
}: ResultsPageProps) {
 
  const resolvedParams = await params; // Await the params to satisfy the types
  const assessmentId = resolvedParams.id;
  const { submissionId } = resolvedParams;

  const [resultsRes, assessmentRes, errorsRes, bloomsRes] = await Promise.all([
    getSubmissionResults(submissionId),
    getAssessment(assessmentId),
    getErrorTaxonomy(),
    getBloomsTaxonomy(),
  ]);

  const { data: results, error: resultsError } = resultsRes;
  const { data: assessment, error: assessmentError } = assessmentRes;
  const { data: errorTaxonomy, error: errorsError } = errorsRes;
  const { data: bloomsTaxonomy, error: bloomsError } = bloomsRes;

  if (
    resultsError ||
    assessmentError ||
    errorsError ||
    bloomsError ||
    !results ||
    !assessment
  ) {
    return notFound();
  }

  const { data: student, error: studentError } = await getStudent(
    results.student_id,
  );

  if (studentError || !student) {
    return notFound();
  }

  return (
    <ResultsClient
      submissionResults={results}
      assessment={assessment}
      student={student}
      errorTaxonomy={errorTaxonomy ?? []}
      bloomsTaxonomy={bloomsTaxonomy ?? []}
    />
  );
}