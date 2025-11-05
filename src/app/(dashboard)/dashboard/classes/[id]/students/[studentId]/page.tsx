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

/**
 * FIX: The 'params' type is updated to satisfy the Next.js 15 build-time type checker.
 */
interface StudentDetailPageProps {
  params: Promise<{
    id: string; // classId
    studentId: string;
  }>;
}

export default async function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  // FIX: Await the params object before accessing its properties.
  const resolvedParams = await params;

  const [studentRes, classRes, submissionsRes, profilesRes] = await Promise.all([
    getStudent(resolvedParams.studentId),
    getClassDetails(resolvedParams.id),
    getStudentSubmissions(resolvedParams.studentId),
    getStudentCognitiveProfiles(resolvedParams.studentId),
  ]);

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
          <TabsTrigger value="cognitive-profile">Cognitive Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <StudentOverviewTab student={student} />
        </TabsContent>

        <TabsContent value="assessments" className="mt-4">
          <StudentAssessmentsTab submissions={submissions} />
        </TabsContent>

        <TabsContent value="cognitive-profile" className="mt-4">
          <StudentCognitiveProfileTab profiles={cognitiveProfiles} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
