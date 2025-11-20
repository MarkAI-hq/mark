// src/app/(dashboard)/dashboard/students/[id]/assess/page.tsx
import { getStudent } from '@/lib/actions/students';
import LearningCompassAssessment from '@/app/(dashboard)/dashboard/profile/cognitive-profile/learning-compass-assessment';
import { Metadata } from 'next';
import { getCognitiveAssessment } from '@/lib/actions/cognitive';
import { getStudentEnrollments } from '@/lib/actions/student-details';

interface AssessPageProps {
  params: Promise<{
    id: string; // This is the studentId
  }>;
}

export async function generateMetadata({ params }: AssessPageProps): Promise<Metadata> {
  const { id } = await params;
  const { data: student } = await getStudent(id);
  const studentName = student ? `${student.first_name} ${student.last_name}`.trim() : 'Student';
  
  return {
    title: `Cognitive Assessment for ${studentName} - Mark`,
    description: `Assess the cognitive profile for ${studentName}.`,
  };
}

export default async function AssessPage({ params }: AssessPageProps) {
  const { id: studentId } = await params;

  // Fetch all required data in parallel
  const [studentResponse, assessmentResponse, enrollmentsResponse] = await Promise.all([
    getStudent(studentId),
    getCognitiveAssessment(),
    getStudentEnrollments(studentId), // Fetch the student's classes
  ]);

  const { data: student, error: studentError } = studentResponse;
  const { data: assessmentData, error: assessmentError } = assessmentResponse;
  const { data: enrollments, error: enrollmentsError } = enrollmentsResponse;

  if (studentError || assessmentError || enrollmentsError || !student || !assessmentData) {
    return <div>Error loading assessment data. Please try again later.</div>;
  }

  // Find the student's active class to pass its ID for redirection and revalidation
  const activeEnrollment = (enrollments || []).find(e => e.status === 'active');
  if (!activeEnrollment) {
    return <div>Error: Student is not actively enrolled in any class.</div>;
  }

  const studentName = `${student.first_name} ${student.last_name}`.trim();
  
  return (
    <div className="container mx-auto py-8">
      <LearningCompassAssessment
        studentId={student.user_id}
        studentName={studentName}
        assessmentData={assessmentData}
        className={activeEnrollment.class_name} // Pass the real class name
        classId={activeEnrollment.class_id}   // Pass the class ID
      />
    </div>
  );
}
