// src/components/students/student-overview-tab.tsx
'use client'

import { ReactNode } from 'react'
import { format } from 'date-fns'
import { Student } from '@/lib/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StudentOverviewTabProps {
  student: Student
}

// Helper component for displaying detail items to reduce repetition
function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  if (!value) return null
  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-base">{value}</span>
    </div>
  )
}

export function StudentOverviewTab({ student }: StudentOverviewTabProps) {
  const formattedDob = student.date_of_birth
    ? format(new Date(student.date_of_birth), 'MMMM d, yyyy')
    : 'N/A'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Information</CardTitle>
        <CardDescription>
          Core profile and enrollment details for the student.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Email Address" value={student.email} />
          <DetailItem
            label="Student School ID"
            value={student.student_school_id || 'N/A'}
          />
          <DetailItem label="Date of Birth" value={formattedDob} />
          <DetailItem label="Gender" value={student.gender || 'N/A'} />
          <DetailItem
            label="Enrollment Status"
            value={<Badge variant="secondary">{student.enrollment_status}</Badge>}
          />
          <DetailItem
            label="Account Status"
            value={
              <Badge variant={student.is_active ? 'default' : 'destructive'}>
                {student.is_active ? 'Active' : 'Inactive'}
              </Badge>
            }
          />
          <DetailItem
            label="Guardian Name"
            value={student.guardian_name || 'N/A'}
          />
          <DetailItem
            label="Guardian Phone"
            value={student.guardian_phone || 'N/A'}
          />
          <DetailItem
            label="Guardian Email"
            value={student.guardian_email || 'N/A'}
          />
        </div>
      </CardContent>
    </Card>
  )
}
