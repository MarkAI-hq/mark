import { notFound } from 'next/navigation';
import { getSubmissionResults } from '@/lib/actions/results';
import { getAssessment } from '@/lib/actions/assessments';
import { getStudent } from '@/lib/actions/students';
import { getErrorTaxonomy, getBloomsTaxonomy, getStudentCognitiveProfile } from '@/lib/actions/cognitive';
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
 
  const resolvedParams = await params;
  const assessmentId = resolvedParams.id;
  const { submissionId } = resolvedParams;

  // FIX 1: Destructure all 5 results from the Promise.all array
  // FIX 2: getStudentCognitiveProfile now only takes studentId (results.student_id) 
  // but since we need results first, we move the profile fetch below or fetch by studentId if available
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

  // Fetch student and their cognitive profile using the student_id from results
  const [studentRes, profileRes] = await Promise.all([
    getStudent(results.student_id),
    getStudentCognitiveProfile(results.student_id) // FIX 3: Passed 1 argument instead of 2
  ]);

  const { data: student, error: studentError } = studentRes;
  const { data: cognitiveProfile, error: profileError } = profileRes;

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
      // Pass the profile to the client if your ResultsClient expects it
      cognitiveProfile={cognitiveProfile?.[0] ?? null} 
    />
  );
}