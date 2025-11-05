// src/app/(dashboard)/dashboard/profile/cognitive-profile/page.tsx
import { getStudent } from '@/lib/actions/students';
import { getCognitiveAssessment } from '@/lib/actions/cognitive';
import LearningCompassAssessment from './learning-compass-assessment';
import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
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

  // Fetch all necessary data in parallel
  const [studentResponse, assessmentResponse, enrollmentsResponse] = await Promise.all([
    getStudent(studentId),
    getCognitiveAssessment(),
    getStudentEnrollments(studentId), // Fetch the student's classes
  ]);

  const { data: student, error: studentError } = studentResponse;
  const { data: assessmentData, error: assessmentError } = assessmentResponse;
  const { data: enrollments, error: enrollmentsError } = enrollmentsResponse;

  if (studentError || assessmentError || enrollmentsError || !student || !assessmentData) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Data</h2>
            <p className="text-gray-700">
              Could not load the necessary student or assessment data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Find the student's active class to get the classId and className
  const activeEnrollment = (enrollments || []).find(e => e.status === 'active');
  if (!activeEnrollment) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-red-600 mb-2">Enrollment Error</h2>
            <p className="text-gray-700">
              This student is not actively enrolled in any class, so an assessment cannot be performed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const studentName = `${student.first_name} ${student.last_name || ''}`.trim();

  return (
    <div className="container mx-auto py-8">
      <LearningCompassAssessment
        className={activeEnrollment.class_name} // Pass the real class name
        studentId={student.user_id}
        studentName={studentName}
        assessmentData={assessmentData}
        classId={activeEnrollment.class_id}   // FIX: Pass the required classId prop
      />
    </div>
  );
}
