'use server'

// src/lib/actions/classes.ts

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'
import type { Class, ServerActionResponse, AssignedCourse } from '@/lib/types'

export type CreateClassData = Omit<Class, 'class_id' | 'created_by' | 'organization_id' | 'createdAt' | 'updatedAt'>
export type UpdateClassData = Partial<CreateClassData>

// ── Teacher-assigned class (from /classes — the class_teachers module) ────
export interface TeacherClass {
  class_id:               string
  name:                   string
  description:            string | null
  organization_id:        string
  created_by:             string
  createdAt:              string
  status:                 'active' | 'pending' | 'declined'
  accepted_at:            string | null
  can_add_students:       boolean
  can_create_assessments: boolean
  can_grade:              boolean
  can_view_analytics:     boolean
}

// ── Teacher assignment record (attached to a class) ───────────────────────
export interface ClassTeacher {
  class_teacher_id:       string
  teacher_id:             string
  status:                 'active' | 'pending' | 'declined'
  invited_at:             string
  accepted_at:            string | null
  first_name:             string
  last_name:              string
  email:                  string
  can_add_students:       boolean
  can_create_assessments: boolean
  can_grade:              boolean
  can_view_analytics:     boolean
}

// ── Class with its assigned teachers (from /classes) ─────────────────────
export interface ClassWithTeachers extends Class {
  teachers: ClassTeacher[]
}

// Class-level analytics
export interface ClassAnalytics {
  classId:           string
  totalStudents:     number
  averageScore:      number
  averagePercentage: number
  bloomDistribution: Array<{ level_code: string; level_name: string; count: number; percentage: number }>
  errorDistribution: Array<{ error_code: string; error_name: string; description: string; count: number; percentage: number }>
  scoreDistribution: Array<{ range: string; count: number }>
  studentSummaries:  Array<{
    studentId:   string
    studentName: string
    avgScore:    number
    avgPct:      number
    submissions: number
    topError:    string | null
    topBloom:    string | null
  }>
}

function handleMutationResponse<T>(response: ServerActionResponse<T>): T {
  if (response.error) throw new Error(response.error.message)
  if (response.data === null || response.data === undefined)
    throw new Error('API returned success but no data was received.')
  return response.data
}

export async function createClass(data: CreateClassData): Promise<Class> {
  const response = await fetcher<Class>('/academics/classes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  const newClass = handleMutationResponse(response)
  revalidatePath('/dashboard/classes')
  return newClass
}

export async function getClasses(): Promise<ServerActionResponse<Class[]>> {
  return fetcher<Class[]>('/academics/classes', { cache: 'no-store' })
}

// ── Admin: get all classes with their teacher assignments ─────────────────
// Hits /classes (ClassesService) — includes teacher list per class
export async function getClassesWithTeachers(): Promise<ServerActionResponse<ClassWithTeachers[]>> {
  return fetcher<ClassWithTeachers[]>('/classes', { cache: 'no-store' })
}

// ── Teacher: get only classes assigned to the logged-in teacher ───────────
export async function getMyClasses(): Promise<ServerActionResponse<TeacherClass[]>> {
  return fetcher<TeacherClass[]>('/classes', { cache: 'no-store' })
}

export async function getClassDetails(id: string): Promise<ServerActionResponse<Class>> {
  return fetcher<Class>(`/academics/classes/${id}`, { cache: 'no-store' })
}

export async function getAssignedCourses(id: string): Promise<ServerActionResponse<AssignedCourse[]>> {
  return fetcher<AssignedCourse[]>(`/academics/classes/${id}/courses`, { cache: 'no-store' })
}

export async function getClassAnalytics(classId: string): Promise<ClassAnalytics | null> {
  const { data, error } = await fetcher<ClassAnalytics>(`/analytics/class/${classId}`)
  if (error || !data) return null
  return data
}

export async function updateClass(id: string, data: UpdateClassData): Promise<Class> {
  const response = await fetcher<Class>(`/academics/classes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  const updated = handleMutationResponse(response)
  revalidatePath('/dashboard/classes')
  revalidatePath(`/dashboard/classes/${id}`)
  return updated
}

export async function deleteClass(id: string): Promise<{ message: string }> {
  const response = await fetcher<{ message: string }>(`/academics/classes/${id}`, {
    method: 'DELETE',
  })
  const msg = handleMutationResponse(response)
  revalidatePath('/dashboard/classes')
  return msg
}

// ── Admin: assign a teacher (by email) to a class with optional privileges ──
export async function assignTeacherToClass(
  classId:      string,
  teacherEmail: string,
  privileges?: {
    can_add_students?:       boolean
    can_create_assessments?: boolean
    can_grade?:              boolean
    can_view_analytics?:     boolean
  },
): Promise<{ message: string }> {
  const response = await fetcher<{ message: string }>(`/classes/${classId}/teachers`, {
    method: 'POST',
    body:   JSON.stringify({ email: teacherEmail, ...privileges }),
  })
  const result = handleMutationResponse(response)
  revalidatePath(`/dashboard/classes/${classId}`)
  return result
}

// ── Admin: update teacher privileges for a class ──────────────────────────
export async function updateTeacherPrivileges(
  classId:   string,
  teacherId: string,
  privileges: {
    can_add_students?:       boolean
    can_create_assessments?: boolean
    can_grade?:              boolean
    can_view_analytics?:     boolean
  },
): Promise<{ message: string }> {
  const response = await fetcher<{ message: string }>(
    `/classes/${classId}/teachers/${teacherId}/privileges`,
    { method: 'PATCH', body: JSON.stringify(privileges) },
  )
  const result = handleMutationResponse(response)
  revalidatePath(`/dashboard/classes/${classId}`)
  return result
}

// ── Admin: remove a teacher from a class ─────────────────────────────────
export async function removeTeacherFromClass(
  classId:   string,
  teacherId: string,
): Promise<{ message: string }> {
  const response = await fetcher<{ message: string }>(
    `/classes/${classId}/teachers/${teacherId}`,
    { method: 'DELETE' },
  )
  const result = handleMutationResponse(response)
  revalidatePath(`/dashboard/classes/${classId}`)
  return result
}

// ── Teacher: accept a class invitation in-app ─────────────────────────────
export async function acceptClassInvite(
  classId: string,
): Promise<{ message: string }> {
  const response = await fetcher<{ message: string }>(`/classes/${classId}/accept`, {
    method: 'POST',
  })
  const result = handleMutationResponse(response)
  revalidatePath('/dashboard/teacher/classes')
  return result
}

// ── Teacher: decline a class invitation in-app ────────────────────────────
export async function declineClassInvite(
  classId: string,
): Promise<{ message: string }> {
  const response = await fetcher<{ message: string }>(`/classes/${classId}/decline`, {
    method: 'POST',
  })
  const result = handleMutationResponse(response)
  revalidatePath('/dashboard/teacher/classes')
  return result
}

// ── Student enrolled in a class ───────────────────────────────────────────
export interface ClassStudent {
  student_id:    string
  first_name:    string
  last_name:     string
  date_of_birth: string | null
  gender:        string | null
  enrollment_id: string
  enrolled_at:   string
}

// ── Teacher: get only ACTIVE assigned classes (for dropdowns etc.) ─────────
export async function getMyActiveClasses(): Promise<ServerActionResponse<TeacherClass[]>> {
  const result = await fetcher<TeacherClass[]>('/classes', { cache: 'no-store' })
  if (result.data) {
    return { data: result.data.filter((c) => c.status === 'active'), error: null }
  }
  return result
}

// ── Teacher: aggregate all courses from active classes as Subject[] ────────
// Used in ExamDialog subject dropdown for teachers
export async function getMyCoursesAsSubjects(): Promise<ServerActionResponse<{ id: string; name: string }[]>> {
  const classesRes = await getMyActiveClasses()
  if (classesRes.error || !classesRes.data?.length) {
    return { data: [], error: null }
  }
  const courseArrays = await Promise.all(
    classesRes.data.map((c) => getAssignedCourses(c.class_id)),
  )
  const seen = new Set<string>()
  const subjects: { id: string; name: string }[] = []
  for (const res of courseArrays) {
    if (!res.data) continue
    for (const course of res.data) {
      const id = course.course_id ?? (course as any).id
      if (id && !seen.has(id)) {
        seen.add(id)
        subjects.push({ id, name: course.course_title ?? (course as any).name ?? id })
      }
    }
  }
  return { data: subjects, error: null }
}

// ── Shared: get students enrolled in a class ──────────────────────────────
export async function getClassStudents(classId: string): Promise<ServerActionResponse<ClassStudent[]>> {
  return fetcher<ClassStudent[]>(`/classes/${classId}/students`, { cache: 'no-store' })
}

// ── Shared: get assessments for a class ──────────────────────────────────
export async function getClassAssessments(classId: string): Promise<ServerActionResponse<import('@/lib/actions/assessments').Assessment[]>> {
  return fetcher(`/assessments?classId=${classId}`, { cache: 'no-store' })
}

// ── Admin: assign a course (+ responsible teacher) to a class ─────────────
export async function assignCourseToClass(
  classId:   string,
  courseId:  string,
  teacherId: string,
): Promise<{ message: string }> {
  const response = await fetcher<{ message: string }>(
    `/academics/classes/${classId}/courses`,
    { method: 'POST', body: JSON.stringify({ course_id: courseId, teacher_id: teacherId }) },
  )
  const result = handleMutationResponse(response)
  revalidatePath(`/dashboard/classes/${classId}`)
  return result
}

// ── Admin: remove a course from a class ───────────────────────────────────
export async function removeCourseFromClass(
  classId:  string,
  courseId: string,
): Promise<{ message: string }> {
  const response = await fetcher<{ message: string }>(
    `/academics/classes/${classId}/courses/${courseId}`,
    { method: 'DELETE' },
  )
  const result = handleMutationResponse(response)
  revalidatePath(`/dashboard/classes/${classId}`)
  return result
}

export interface StudentGroupMember {
  studentId:   string
  studentName: string
  avgPct:      number
  submissions: number
  topError:    string
  topErrorId:  string
}
 
export interface StudentGroup {
  domain:      string
  label:       string
  description: string
  color:       string
  students:    StudentGroupMember[]
  topErrors:   string[]
}
 
export interface ClassGroupsData {
  classId:     string
  groups:      StudentGroup[]
  ungrouped:   StudentGroupMember[]
  generatedAt: string
}
 
// ── Get class groups action ────────────────────────────────────────────────
 
export async function getClassGroups(
  classId: string,
): Promise<ServerActionResponse<ClassGroupsData>> {
  return fetcher<ClassGroupsData>(
    `/analytics/class/${classId}/groups`,
    { cache: 'no-store' },
  )
}