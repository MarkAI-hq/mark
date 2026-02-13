// src/app/(dashboard)/dashboard/classes/[id]/students/[studentId]/page.tsx
import { notFound } from 'next/navigation';

import { getStudent } from '@/lib/actions/students';
import { getClassDetails } from '@/lib/actions/classes';
import {
  getStudentSubmissions,
  getStudentCognitiveProfiles,
} from '@/lib/actions/student-details';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { StudentOverviewTab } from '@/components/students/student-overview-tab';
import { StudentAssessmentsTab } from '@/components/students/student-assessments-tab';
import { StudentCognitiveProfileTab } from '@/components/students/student-cognitive-profile-tab';
import { StudentProfileHeader } from '@/components/students/student-profile-header';

interface StudentDetailPageProps {
  params: Promise<{
    id: string; // classId
    studentId: string;
  }>;
}

export default async function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  const resolvedParams = await params;

  const [studentRes, classRes, submissionsRes, profilesRes] = await Promise.all([
    getStudent(resolvedParams.studentId),
    getClassDetails(resolvedParams.id),
    getStudentSubmissions(resolvedParams.studentId),
    getStudentCognitiveProfiles(resolvedParams.studentId),
  ]);

  // --- DEBUG SECTION ---
  // This will log to your server terminal (stdout)
  console.log(`[Debug] StudentId: ${resolvedParams.studentId}`);
  console.log(`[Debug] Profiles Response:`, JSON.stringify(profilesRes, null, 2));
  
  if (profilesRes.error) {
    console.error(`[Error] Failed to fetch profiles: ${profilesRes.error}`);
  }
  // ---------------------

  if (
    studentRes.error ||
    !studentRes.data ||
    classRes.error ||
    !classRes.data
  ) {
    return notFound();
  }

  const student = studentRes.data;
  const currentClass = classRes.data;
  const submissions = submissionsRes.data ?? [];
  const cognitiveProfiles = profilesRes.data ?? [];
  const studentName = `${student.first_name} ${student.last_name}`.trim();

  const breadcrumbItems = [
    { label: 'Classes', href: '/dashboard/classes' },
    {
      label: currentClass.name,
      href: `/dashboard/classes/${currentClass.class_id}`,
    },
    { label: studentName },
  ];

  const hasSubmissions = submissions.length > 0;
  const hasCognitiveProfile = cognitiveProfiles.length > 0;

  return (
    <div className="space-y-6">
      {/* Visual Debug Alert (Visible only in development) */}
      {process.env.NODE_ENV === 'development' && !hasCognitiveProfile && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-700 text-sm">
          <strong>Debug Note:</strong> getStudentCognitiveProfiles returned 0 records for student <code>{resolvedParams.studentId}</code>. 
          Check if the DB table <code>cognitive_profiles</code> has an entry for this UUID.
        </div>
      )}

      <StudentProfileHeader
        studentName={studentName}
        studentId={student.user_id}
        classId={currentClass.class_id}
        breadcrumbItems={breadcrumbItems}
        hasSubmissions={hasSubmissions}
        hasCognitiveProfile={hasCognitiveProfile}
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          {/* We keep the trigger visible but can style it or disable it if no data */}
          <TabsTrigger 
            value="cognitive-profile" 
            className={!hasCognitiveProfile ? "opacity-50" : ""}
          >
            Cognitive Profile {!hasCognitiveProfile && " (Empty)"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <StudentOverviewTab student={student} />
        </TabsContent>

        <TabsContent value="assessments" className="mt-4">
          <StudentAssessmentsTab submissions={submissions} />
        </TabsContent>

        <TabsContent value="cognitive-profile" className="mt-4">
          {hasCognitiveProfile ? (
            <StudentCognitiveProfileTab profiles={cognitiveProfiles} />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
               <p className="text-muted-foreground">No cognitive profile data found for this student.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}