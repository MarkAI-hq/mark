// src/components/students/student-cognitive-profile-tab.tsx
'use client'

import { format } from 'date-fns'
import { StudentCognitiveProfile } from '@/lib/actions/student-details'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StudentCognitiveProfileTabProps {
  profiles: StudentCognitiveProfile[]
}

export function StudentCognitiveProfileTab({
  profiles,
}: StudentCognitiveProfileTabProps) {
  // Sort profiles to show the most recent first
  const sortedProfiles = [...profiles].sort(
    (a, b) =>
      new Date(b.assessment_date || 0).getTime() -
      new Date(a.assessment_date || 0).getTime(),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cognitive Profile History</CardTitle>
        <CardDescription>
          A record of the student&apos;s cognitive assessments over time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedProfiles.length > 0 ? (
          <div className="space-y-4">
            {sortedProfiles.map((profile) => (
              <div
                key={profile.student_profile_id}
                className="rounded-lg border p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">
                      Assessed on{' '}
                      {profile.assessment_date
                        ? format(
                            new Date(profile.assessment_date),
                            'MMMM d, yyyy',
                          )
                        : 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Profile ID: {profile.primary_profile_id}
                    </p>
                  </div>
                  {profile.is_current && (
                    <Badge variant="default">Current Profile</Badge>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Mental Energy Score</p>
                    <p>{profile.mental_energy_score ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Learning Strategy Score</p>
                    <p>{profile.learning_strategy_score ?? 'N/A'}</p>
                  </div>
                </div>
                {profile.notes && (
                  <div className="mt-4">
                    <p className="font-medium text-sm">Notes</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No cognitive profiles found for this student.
          </div>
        )}
      </CardContent>
    </Card>
  )
}