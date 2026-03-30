'use client'

// src/app/(dashboard)/dashboard/classes/[id]/_components/class-teachers-tab.tsx

import { useState, useTransition } from 'react'
import { useRouter }                from 'next/navigation'
import { formatDistanceToNow }      from 'date-fns'
import {
  Users, UserPlus, Trash2, MailCheck,
  CheckCircle2, Hourglass, XCircle, Loader2, Settings2, ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

import type { ClassTeacher }     from '@/lib/actions/classes'
import type { OrganizationUser } from '@/lib/actions/organizations'
import { assignTeacherToClass, removeTeacherFromClass, updateTeacherPrivileges } from '@/lib/actions/classes'

import { Button }                 from '@/components/ui/button'
import { Badge }                  from '@/components/ui/badge'
import { Switch }                 from '@/components/ui/switch'
import { Label }                  from '@/components/ui/label'
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
  classId:     string
  teachers:    ClassTeacher[]
  orgTeachers: OrganizationUser[]
}

// ── Component ──────────────────────────────────────────────────────────────

export function ClassTeachersTab({ classId, teachers: initialTeachers, orgTeachers }: ClassTeachersTabProps) {
  const router = useRouter()
  const [isPending,       startTransition]  = useTransition()
  const [teachers,        setTeachers]      = useState<ClassTeacher[]>(initialTeachers)
  const [selectedEmail,   setSelectedEmail] = useState('')
  const [newPrivileges,   setNewPrivileges] = useState<Privileges>(DEFAULT_PRIVILEGES)
  const [showPrivileges,  setShowPrivileges] = useState(false)
  const [teacherToRemove, setTeacherToRemove] = useState<ClassTeacher | null>(null)
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null)

  const assignedEmails    = new Set(teachers.map((t) => t.email))
  const availableTeachers = orgTeachers.filter((t) => !assignedEmails.has(t.email))

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
            const config     = STATUS_CONFIG[teacher.status]
            const StatusIcon = config.icon
            const initials   = `${teacher.first_name[0]}${teacher.last_name[0]}`.toUpperCase()
            const isExpanded = expandedTeacher === teacher.teacher_id

            return (
              <div key={teacher.class_teacher_id} className="bg-card">
                <div className="flex items-center gap-3 px-4 py-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {teacher.first_name} {teacher.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{teacher.email}</p>
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

        {availableTeachers.length === 0 ? (
          <p className="text-xs text-muted-foreground py-1">
            {orgTeachers.length === 0
              ? 'No teachers in your organisation yet. Invite one from Settings → Members.'
              : 'All organisation teachers are already assigned to this class.'}
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