'use client'

// src/app/(dashboard)/dashboard/classes/[id]/_components/class-teachers-tab.tsx

import { useState, useTransition } from 'react'
import { useRouter }                from 'next/navigation'
import { formatDistanceToNow }      from 'date-fns'
import {
  Users, UserPlus, Trash2, MailCheck,
  CheckCircle2, Hourglass, XCircle, Loader2, Settings2, ChevronUp,
  InboxIcon, Check, X, Plus, BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'

import type { ClassTeacher, AdminClassJoinRequest } from '@/lib/actions/classes'
import type { AssignedCourse } from '@/lib/types'
import type { OrganizationUser }                    from '@/lib/actions/organizations'
import type { Subject }                             from '@/lib/types'
import {
  assignTeacherToClass, removeTeacherFromClass, updateTeacherPrivileges,
  respondToJoinRequest, assignSubjectToClass, removeCourseFromClass,
  getOrgSubjects,
} from '@/lib/actions/classes'
import { inviteUserToOrganization } from '@/lib/actions/organizations'

import { Button }                 from '@/components/ui/button'
import { Badge }                  from '@/components/ui/badge'
import { Switch }                 from '@/components/ui/switch'
import { Label }                  from '@/components/ui/label'
import { Input }                  from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator }              from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/common/confirm-dialog'

// ── Types ──────────────────────────────────────────────────────────────────

interface Privileges {
  can_add_students:       boolean
  can_create_assessments: boolean
  can_grade:              boolean
  can_view_analytics:     boolean
}

const DEFAULT_PRIVILEGES: Privileges = {
  can_add_students:       true,
  can_create_assessments: true,
  can_grade:              true,
  can_view_analytics:     true,
}

const PRIVILEGE_LABELS: { key: keyof Privileges; label: string }[] = [
  { key: 'can_add_students',       label: 'Add/import students' },
  { key: 'can_create_assessments', label: 'Create assessments' },
  { key: 'can_grade',              label: 'Grade submissions' },
  { key: 'can_view_analytics',     label: 'View analytics' },
]

const STATUS_CONFIG = {
  active: {
    label:     'Active',
    icon:      CheckCircle2,
    className: 'text-emerald-600 border-emerald-200 bg-emerald-50',
  },
  pending: {
    label:     'Pending',
    icon:      Hourglass,
    className: 'text-amber-600 border-amber-200 bg-amber-50',
  },
  declined: {
    label:     'Declined',
    icon:      XCircle,
    className: 'text-rose-600 border-rose-200 bg-rose-50',
  },
} satisfies Record<ClassTeacher['status'], { label: string; icon: React.ElementType; className: string }>

interface ClassTeachersTabProps {
  classId:          string
  teachers:         ClassTeacher[]
  orgTeachers:      OrganizationUser[]
  organizationId:   string
  joinRequests?:    AdminClassJoinRequest[]
  initialCourses?:  AssignedCourse[]
  onCourseAssigned?: (course: AssignedCourse) => void
  onCourseRemoved?:  (courseId: string) => void
}

// ── Component ──────────────────────────────────────────────────────────────

export function ClassTeachersTab({
  classId, teachers: initialTeachers, orgTeachers, organizationId,
  joinRequests: initialRequests = [],
  initialCourses = [],
  onCourseAssigned,
  onCourseRemoved,
}: ClassTeachersTabProps) {
  const router = useRouter()
  const [isPending,       startTransition]  = useTransition()
  const [teachers,        setTeachers]      = useState<ClassTeacher[]>(initialTeachers)
  const [joinReqs,        setJoinReqs]      = useState<AdminClassJoinRequest[]>(initialRequests)
  const [localCourses,    setLocalCourses]  = useState<AssignedCourse[]>(initialCourses)
  const [allSubjects,     setAllSubjects]   = useState<Subject[]>([])
  const [subjectsLoaded,  setSubjectsLoaded] = useState(false)
  const [selectedEmail,   setSelectedEmail] = useState('')
  const [newPrivileges,   setNewPrivileges] = useState<Privileges>(DEFAULT_PRIVILEGES)
  const [showPrivileges,  setShowPrivileges] = useState(false)
  const [teacherToRemove, setTeacherToRemove] = useState<ClassTeacher | null>(null)
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null)
  const [inviteEmail,     setInviteEmail]    = useState('')
  const [isInviting,      setIsInviting]     = useState(false)

  // Subject picker state
  const [subjectTeacherId,  setSubjectTeacherId]  = useState<string | null>(null)
  const [selectedCourseId,  setSelectedCourseId]  = useState('')
  const [courseAssigning,   setCourseAssigning]   = useState(false)
  const [courseRemoving,    setCourseRemoving]    = useState<string | null>(null)

  const assignedEmails    = new Set(teachers.map((t) => t.email))
  const availableTeachers = orgTeachers.filter((t) => !assignedEmails.has(t.email))

  async function loadSubjects() {
    if (subjectsLoaded) return
    const { data } = await getOrgSubjects()
    if (data) setAllSubjects(data)
    setSubjectsLoaded(true)
  }

  async function openSubjectPicker(teacherId: string) {
    setSubjectTeacherId(teacherId)
    setSelectedCourseId('')
    await loadSubjects()
  }

  async function handleAssignCourse(teacherId: string) {
    if (!selectedCourseId) return
    setCourseAssigning(true)
    try {
      await assignSubjectToClass(classId, selectedCourseId, teacherId)
      const subject  = allSubjects.find((s) => s.id === selectedCourseId)!
      const teacher  = teachers.find((t) => t.teacher_id === teacherId)!
      const newEntry: AssignedCourse = {
        id:                 `${selectedCourseId}-${teacherId}`,
        course_id:          selectedCourseId,
        course_title:       subject.name,
        course_code:        subject.code ?? '',
        course_description: subject.description ?? null,
        teacher_id:         teacherId,
        teacher_name:       teacher.first_name,
        teacher_lastname:   teacher.last_name,
        assigned_at:        new Date().toISOString(),
      } as AssignedCourse
      setLocalCourses((prev) => [...prev, newEntry])
      onCourseAssigned?.(newEntry)
      setSubjectTeacherId(null)
      setSelectedCourseId('')
      toast.success(`"${subject.name}" assigned to ${teacher.first_name}.`)
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to assign subject.')
    } finally {
      setCourseAssigning(false)
    }
  }

  async function handleRemoveCourse(courseId: string, courseTitle: string) {
    setCourseRemoving(courseId)
    try {
      await removeCourseFromClass(classId, courseId)
      setLocalCourses((prev) => prev.filter((c) => c.course_id !== courseId))
      onCourseRemoved?.(courseId)
      toast.success(`"${courseTitle}" removed.`)
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to remove subject.')
    } finally {
      setCourseRemoving(null)
    }
  }

  const handleInviteTeacher = async () => {
    if (!inviteEmail || isInviting) return
    setIsInviting(true)
    try {
      const { error } = await inviteUserToOrganization(organizationId, inviteEmail, 'Teacher')
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Invitation sent.', { description: `${inviteEmail} will receive an invite to join as a Teacher.` })
        setInviteEmail('')
        router.refresh()
      }
    } catch {
      toast.error('Failed to send invitation.')
    } finally {
      setIsInviting(false)
    }
  }

  const handleAssign = () => {
    if (!selectedEmail) return
    startTransition(async () => {
      try {
        await assignTeacherToClass(classId, selectedEmail, newPrivileges)
        toast.success('Invitation sent.', {
          description: 'The teacher will appear as pending until they accept.',
        })
        setSelectedEmail('')
        setNewPrivileges(DEFAULT_PRIVILEGES)
        setShowPrivileges(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to assign teacher.')
      }
    })
  }

  const handlePrivilegeChange = (teacher: ClassTeacher, key: keyof Privileges, value: boolean) => {
    startTransition(async () => {
      try {
        await updateTeacherPrivileges(classId, teacher.teacher_id, { [key]: value })
        setTeachers((prev) =>
          prev.map((t) => t.teacher_id === teacher.teacher_id ? { ...t, [key]: value } : t),
        )
        toast.success('Privileges updated.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update privileges.')
      }
    })
  }

  const handleRemove = () => {
    if (!teacherToRemove) return
    startTransition(async () => {
      try {
        await removeTeacherFromClass(classId, teacherToRemove.teacher_id)
        setTeachers((prev) => prev.filter((t) => t.teacher_id !== teacherToRemove.teacher_id))
        toast.success(`${teacherToRemove.first_name} removed from class.`)
        setTeacherToRemove(null)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to remove teacher.')
      }
    })
  }

  return (
    <div className="space-y-4">

      {/* ── Teacher list ────────────────────────────────────────────────── */}
      {teachers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground rounded-lg border border-dashed">
          <Users className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-sm font-medium">No teachers assigned yet.</p>
          <p className="text-xs mt-1">Use the form below to assign a teacher.</p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border overflow-hidden">
          {teachers.map((teacher) => {
            const config          = STATUS_CONFIG[teacher.status]
            const StatusIcon      = config.icon
            const initials        = `${teacher.first_name[0]}${teacher.last_name[0]}`.toUpperCase()
            const isExpanded      = expandedTeacher === teacher.teacher_id
            const isPickerOpen    = subjectTeacherId === teacher.teacher_id
            const teacherCourses  = localCourses.filter((c) => c.teacher_id === teacher.teacher_id)
            const unassignedSubjects = allSubjects.filter(
              (s) => !localCourses.some((lc) => lc.course_id === s.id),
            )

            return (
              <div key={teacher.class_teacher_id} className="bg-card">
                <div className="flex items-start gap-3 px-4 py-3">
                  <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    {/* Name + email */}
                    <p className="text-sm font-medium truncate">
                      {teacher.first_name} {teacher.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{teacher.email}</p>

                    {/* Subject chips */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {teacherCourses.map((c) => (
                        <span
                          key={c.course_id}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        >
                          <BookOpen className="h-2.5 w-2.5" />
                          {c.course_title}
                          <button
                            onClick={() => handleRemoveCourse(c.course_id, c.course_title)}
                            disabled={courseRemoving === c.course_id}
                            className="ml-0.5 hover:text-destructive transition-colors disabled:opacity-50"
                            title={`Remove ${c.course_title}`}
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))}

                      {teacher.status === 'active' && (
                        <button
                          onClick={() => isPickerOpen ? setSubjectTeacherId(null) : openSubjectPicker(teacher.teacher_id)}
                          className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-muted-foreground/40 px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <Plus className="h-2.5 w-2.5" />
                          {teacherCourses.length === 0 ? 'Assign subject' : 'Subject'}
                        </button>
                      )}

                      {teacher.status === 'pending' && teacherCourses.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">
                          Awaiting invite acceptance — assign subjects once active
                        </span>
                      )}
                    </div>

                    {/* Inline subject picker */}
                    {isPickerOpen && (
                      <div className="mt-2 flex items-center gap-2">
                        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                          <SelectTrigger className="h-8 flex-1 text-xs">
                            <SelectValue placeholder={!subjectsLoaded ? 'Loading…' : unassignedSubjects.length === 0 ? 'No subjects available' : 'Select subject'} />
                          </SelectTrigger>
                          <SelectContent>
                            {unassignedSubjects.map((s) => (
                              <SelectItem key={s.id} value={s.id} className="text-xs">
                                {s.name}
                                {s.code && <span className="text-muted-foreground ml-1.5">· {s.code}</span>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="h-8 text-xs px-3"
                          onClick={() => handleAssignCourse(teacher.teacher_id)}
                          disabled={!selectedCourseId || courseAssigning || unassignedSubjects.length === 0}
                        >
                          {courseAssigning ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Assign'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs px-2"
                          onClick={() => setSubjectTeacherId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-xs ${config.className}`}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {teacher.accepted_at
                        ? `Joined ${formatDistanceToNow(new Date(teacher.accepted_at), { addSuffix: true })}`
                        : `Invited ${formatDistanceToNow(new Date(teacher.invited_at), { addSuffix: true })}`}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => setExpandedTeacher(isExpanded ? null : teacher.teacher_id)}
                      title="Edit privileges"
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <Settings2 className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setTeacherToRemove(teacher)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* ── Privileges panel ── */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 bg-muted/30 border-t space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Privileges for this class
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {PRIVILEGE_LABELS.map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-2">
                          <Switch
                            id={`${teacher.teacher_id}-${key}`}
                            checked={teacher[key] as boolean}
                            onCheckedChange={(val) => handlePrivilegeChange(teacher, key, val)}
                            disabled={isPending}
                          />
                          <Label htmlFor={`${teacher.teacher_id}-${key}`} className="text-xs cursor-pointer">
                            {label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Separator />

      {/* ── Assign new teacher ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-sm font-medium flex items-center gap-1.5">
          <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
          Assign a Teacher
        </p>

        {orgTeachers.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              No teachers in your organisation yet. Invite one directly:
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="teacher@school.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInviteTeacher()}
                className="flex-1 h-9 text-sm"
              />
              <Button
                size="sm"
                onClick={handleInviteTeacher}
                disabled={!inviteEmail || isInviting}
              >
                {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invite Teacher'}
              </Button>
            </div>
          </div>
        ) : availableTeachers.length === 0 ? (
          <p className="text-xs text-muted-foreground py-1">
            All organisation teachers are already assigned to this class.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Select value={selectedEmail} onValueChange={setSelectedEmail} disabled={isPending}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a teacher…" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachers.map((t) => (
                    <SelectItem key={t.user_id} value={t.email}>
                      <span className="font-medium">{t.first_name} {t.last_name}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{t.email}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPrivileges((p) => !p)}
                className="text-muted-foreground"
                title="Set privileges before assigning"
              >
                {showPrivileges ? <ChevronUp className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
              </Button>

              <Button onClick={handleAssign} disabled={!selectedEmail || isPending}>
                {isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><MailCheck className="mr-1.5 h-4 w-4" />Assign</>}
              </Button>
            </div>

            {showPrivileges && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Privileges for this assignment
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {PRIVILEGE_LABELS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        id={`new-${key}`}
                        checked={newPrivileges[key]}
                        onCheckedChange={(val) => setNewPrivileges((p) => ({ ...p, [key]: val }))}
                      />
                      <Label htmlFor={`new-${key}`} className="text-xs cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Join Requests ────────────────────────────────────────────────── */}
      {joinReqs.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <InboxIcon className="h-3.5 w-3.5 text-muted-foreground" />
              Join Requests
              <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white leading-none">
                {joinReqs.filter(r => r.status === 'pending').length}
              </span>
            </p>
            <div className="divide-y rounded-lg border overflow-hidden">
              {joinReqs.map(req => (
                <div key={req.request_id} className="flex items-center gap-3 px-4 py-3 bg-card">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-800">
                    {req.first_name[0]}{req.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{req.first_name} {req.last_name}</p>
                    <p className="text-xs text-muted-foreground">{req.email}</p>
                    {req.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">&ldquo;{req.message}&rdquo;</p>
                    )}
                  </div>
                  {req.status === 'pending' ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="h-7 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={isPending}
                        onClick={() => {
                          startTransition(async () => {
                            const { error } = await respondToJoinRequest(classId, req.request_id, 'approve')
                            if (error) { toast.error(error.message); return }
                            setJoinReqs(prev => prev.filter(r => r.request_id !== req.request_id))
                            router.refresh()
                            toast.success(`${req.first_name} added to class.`)
                          })
                        }}
                      >
                        <Check className="h-3 w-3" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs text-destructive border-destructive/40 hover:bg-destructive/5"
                        disabled={isPending}
                        onClick={() => {
                          startTransition(async () => {
                            const { error } = await respondToJoinRequest(classId, req.request_id, 'decline')
                            if (error) { toast.error(error.message); return }
                            setJoinReqs(prev => prev.map(r => r.request_id === req.request_id ? { ...r, status: 'declined' } : r))
                            toast.info(`Request from ${req.first_name} declined.`)
                          })
                        }}
                      >
                        <X className="h-3 w-3" /> Decline
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className={req.status === 'approved'
                      ? 'text-emerald-700 border-emerald-200 bg-emerald-50 text-xs'
                      : 'text-rose-700 border-rose-200 bg-rose-50 text-xs'}>
                      {req.status === 'approved' ? 'Approved' : 'Declined'}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!teacherToRemove}
        onOpenChange={() => setTeacherToRemove(null)}
        onConfirm={handleRemove}
        title="Remove teacher?"
        description={
          teacherToRemove
            ? `This will remove ${teacherToRemove.first_name} ${teacherToRemove.last_name} from this class immediately.`
            : ''
        }
        confirmText="Yes, Remove"
        isDestructive
      />
    </div>
  )
}
