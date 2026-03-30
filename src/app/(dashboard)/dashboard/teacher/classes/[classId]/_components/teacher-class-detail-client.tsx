'use client'

// src/app/(dashboard)/dashboard/teacher/classes/[classId]/_components/teacher-class-detail-client.tsx

import { useState }  from 'react'
import Link          from 'next/link'
import { useRouter } from 'next/navigation'
import { format }    from 'date-fns'
import {
  ArrowLeft, BookOpen, BarChart2, Users, FileText,
  ClipboardCheck, Lock, UserPlus, Search,
} from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

import type { AssignedCourse, ClassStudent } from '@/lib/actions/classes'
import type { Assessment }                   from '@/lib/actions/assessments'

interface Privileges {
  can_add_students:       boolean
  can_create_assessments: boolean
  can_grade:              boolean
  can_view_analytics:     boolean
}

interface ClassInfo {
  class_id:        string
  name:            string
  description:     string | null
  organization_id: string
  created_by:      string
  createdAt:       string
}

interface Props {
  cls:         ClassInfo
  courses:     AssignedCourse[]
  students:    ClassStudent[]
  assessments: Assessment[]
  privileges:  Privileges
}

function LockedState({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
        <Lock className="h-5 w-5 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-medium">Access restricted</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
        Your administrator has not granted you {feature} access for this class.
      </p>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType; title: string; description: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
        <Icon className="h-5 w-5 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function TeacherClassDetailClient({ cls, courses, students, assessments, privileges }: Props) {
  const router = useRouter()
  const [studentSearch, setStudentSearch] = useState('')

  const filteredStudents     = students.filter((s) => {
    const q = studentSearch.toLowerCase()
    return s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q)
  })
  const publishedAssessments = assessments.filter((a) => a.is_published)
  const draftAssessments     = assessments.filter((a) => !a.is_published)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">

      {/* Breadcrumb */}
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
        <Link href="/dashboard/teacher/classes">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          My Classes
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{cls.name}</h1>
          {cls.description && (
            <p className="text-sm text-muted-foreground mt-1">{cls.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold tracking-tight">{students.length}</p>
          <p className="text-xs text-muted-foreground">students</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Students',    value: students.length             },
          { label: 'Courses',     value: courses.length              },
          { label: 'Assessments', value: assessments.length          },
          { label: 'Published',   value: publishedAssessments.length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">
            Students
            <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">{students.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="courses">
            Courses
            <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">{courses.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          {privileges.can_grade && <TabsTrigger value="grading">Grading</TabsTrigger>}
          {privileges.can_view_analytics && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
        </TabsList>

        {/* Students */}
        <TabsContent value="students" className="mt-6">
          {students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students enrolled yet"
              description="Students will appear here once enrolled in this class."
              action={privileges.can_add_students ? (
                <Button size="sm" variant="outline">
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />Import Students
                </Button>
              ) : undefined}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search students…"
                    className="pl-9 h-9 text-sm"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                {privileges.can_add_students && (
                  <Button size="sm" variant="outline">
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />Import
                  </Button>
                )}
              </div>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-center">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Gender</TableHead>
                      <TableHead className="hidden md:table-cell">Enrolled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                          No students match your search.
                        </TableCell>
                      </TableRow>
                    ) : filteredStudents.map((s, i) => (
                      <TableRow key={s.student_id}>
                        <TableCell className="text-center text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{s.first_name} {s.last_name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground capitalize">{s.gender ?? '—'}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {s.enrolled_at ? format(new Date(s.enrolled_at), 'MMM d, yyyy') : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Courses */}
        <TabsContent value="courses" className="mt-6">
          {courses.length === 0 ? (
            <EmptyState icon={BookOpen} title="No courses assigned" description="Your administrator will assign courses to this class." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const id    = course.course_id ?? (course as any).id
                const title = course.course_title ?? (course as any).name
                return (
                  <div key={id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug">{title}</p>
                        {course.course_code && (
                          <p className="text-xs text-muted-foreground mt-0.5">{course.course_code}</p>
                        )}
                        {course.course_description && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{course.course_description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Assessments */}
        <TabsContent value="assessments" className="mt-6">
          {!privileges.can_create_assessments ? (
            <LockedState feature="assessment creation" />
          ) : assessments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No assessments yet"
              description="Create your first assessment for this class."
              action={
                <Button size="sm" onClick={() => router.push(`/dashboard/exams?classId=${cls.class_id}`)}>
                  <FileText className="mr-1.5 h-3.5 w-3.5" />Create Assessment
                </Button>
              }
            />
          ) : (
            <div className="space-y-5">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => router.push(`/dashboard/exams?classId=${cls.class_id}`)}>
                  <FileText className="mr-1.5 h-3.5 w-3.5" />New Assessment
                </Button>
              </div>
              {[{ label: 'Drafts', items: draftAssessments }, { label: 'Published', items: publishedAssessments }].map(({ label, items }) =>
                items.length === 0 ? null : (
                  <div key={label}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead className="hidden sm:table-cell">Type</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((a) => (
                            <TableRow key={a.assessment_id} className="cursor-pointer"
                              onClick={() => router.push(`/dashboard/assessments/${a.assessment_id}`)}>
                              <TableCell className="font-medium text-sm">{a.title}</TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                {a.assessment_type?.replace(/_/g, ' ') ?? '—'}
                              </TableCell>
                              <TableCell>
                                {a.is_published
                                  ? <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">Published</Badge>
                                  : <Badge variant="secondary" className="text-xs">Draft</Badge>
                                }
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </TabsContent>

        {/* Grading */}
        {privileges.can_grade && (
          <TabsContent value="grading" className="mt-6">
            {publishedAssessments.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No assessments to grade"
                description="Publish an assessment first, then upload student submissions here."
              />
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assessment</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {publishedAssessments.map((a) => (
                      <TableRow key={a.assessment_id}>
                        <TableCell className="font-medium text-sm">{a.title}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline"
                            onClick={() => router.push(`/dashboard/exams?grade=${a.assessment_id}&classId=${cls.class_id}`)}>
                            <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />Grade
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        )}

        {/* Analytics */}
        {privileges.can_view_analytics && (
          <TabsContent value="analytics" className="mt-6">
            <EmptyState
              icon={BarChart2}
              title="No analytics data yet"
              description="Analytics will appear once students complete graded assessments."
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}