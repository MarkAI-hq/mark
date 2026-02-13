// src/app/(dashboard)/dashboard/profile/cognitive-profile/page.tsx
import { getStudent } from '@/lib/actions/students';
import { getCognitiveAssessment } from '@/lib/actions/cognitive';
import LearningCompassAssessment from './learning-compass-assessment';
import { getStudentEnrollments, getStudentCognitiveProfiles, StudentCognitiveProfile } from '@/lib/actions/student-details';
import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';

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
  const [studentResponse, assessmentResponse, enrollmentsResponse, profileHistoryResponse] = await Promise.all([
    getStudent(studentId),
    getCognitiveAssessment(),
    getStudentEnrollments(studentId),
    getStudentCognitiveProfiles(studentId),
  ]);

  const { data: student, error: studentError } = studentResponse;
  const { data: assessmentData, error: assessmentError } = assessmentResponse;
  const { data: enrollments, error: enrollmentsError } = enrollmentsResponse;
  const { data: profileHistory, error: profileHistoryError } = profileHistoryResponse;

  if (studentError || assessmentError || enrollmentsError || profileHistoryError || !student || !assessmentData) {
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
    <div className="container mx-auto py-8 space-y-8">
      {/* Past Cognitive Profiles */}
      {profileHistory && profileHistory.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Past Cognitive Profiles</h2>
          <div className="space-y-4">
            {profileHistory.map((profile: StudentCognitiveProfile) => (
              <Card key={profile.student_profile_id}>
                <CardContent>
                  <p><strong>Date:</strong> {profile.assessment_date ? new Date(profile.assessment_date).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Profile:</strong> {profile.profile_name || 'N/A'}</p>
                  <p><strong>Focus:</strong> {profile.profile_focus || 'N/A'}</p>
                  <p><strong>Mental Energy Score:</strong> {profile.mental_energy_score ?? 'N/A'}</p>
                  <p><strong>Learning Strategy Score:</strong> {profile.learning_strategy_score ?? 'N/A'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Current Cognitive Assessment */}
      <LearningCompassAssessment
        className={activeEnrollment.class_name}
        studentId={student.user_id}
        studentName={studentName}
        assessmentData={assessmentData}
        classId={activeEnrollment.class_id}
      />
    </div>
  );
}
