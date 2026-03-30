'use client'

// src/app/(dashboard)/dashboard/teacher/classes/_components/teacher-classes-client.tsx

import { useState, useTransition } from 'react'
import { formatDistanceToNow }     from 'date-fns'
import {
  BookOpen, Clock, AlertCircle, CheckCircle2,
  XCircle, ChevronRight, GraduationCap, Hourglass,
  Check, X, Loader2,
} from 'lucide-react'
import Link   from 'next/link'
import { toast } from 'sonner'

import type { TeacherClass }      from '@/lib/actions/classes'
import { acceptClassInvite, declineClassInvite } from '@/lib/actions/classes'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge }      from '@/components/ui/badge'
import { Button }     from '@/components/ui/button'
import { Separator }  from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

// ── Types ──────────────────────────────────────────────────────────────────

interface TeacherClassesClientProps {
  classes: TeacherClass[]
  error?:  string
  user:    { name?: string; role?: string }
}

// ── Status helpers ─────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active: {
    label:     'Active',
    variant:   'default' as const,
    icon:      CheckCircle2,
    className: 'text-emerald-600 border-emerald-200 bg-emerald-50',
  },
  pending: {
    label:     'Pending',
    variant:   'outline' as const,
    icon:      Hourglass,
    className: 'text-amber-600 border-amber-200 bg-amber-50',
  },
  declined: {
    label:     'Declined',
    variant:   'outline' as const,
    icon:      XCircle,
    className: 'text-rose-600 border-rose-200 bg-rose-50',
  },
} satisfies Record<TeacherClass['status'], { label: string; variant: 'default' | 'outline'; icon: React.ElementType; className: string }>

// ── Component ──────────────────────────────────────────────────────────────

export function TeacherClassesClient({ classes: initialClasses, error, user }: TeacherClassesClientProps) {
  const [classes, setClasses] = useState<TeacherClass[]>(initialClasses)

  const activeClasses   = classes.filter((c) => c.status === 'active')
  const pendingClasses  = classes.filter((c) => c.status === 'pending')
  const declinedClasses = classes.filter((c) => c.status === 'declined')

  const handleAccept = (classId: string, className: string) => {
    setClasses((prev) =>
      prev.map((c) =>
        c.class_id === classId
          ? { ...c, status: 'active', accepted_at: new Date().toISOString() }
          : c,
      ),
    )
    toast.success(`You've joined ${className}.`)
  }

  const handleDecline = (classId: string, className: string) => {
    setClasses((prev) =>
      prev.map((c) =>
        c.class_id === classId ? { ...c, status: 'declined' } : c,
      ),
    )
    toast.info(`Declined ${className}.`)
  }

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
          <p className="text-muted-foreground mt-1">
            Classes assigned to you by your school administrator.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{activeClasses.length} active</p>
            <p className="text-xs text-muted-foreground">{pendingClasses.length} pending</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Pending notice ───────────────────────────────────────────────── */}
      {pendingClasses.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <Hourglass className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            You have <span className="font-semibold">{pendingClasses.length}</span> pending class{pendingClasses.length > 1 ? 'es' : ''}. Accept to get access.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!error && classes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No classes assigned yet.</p>
            <p className="text-xs mt-1 max-w-xs">
              Once an administrator assigns you to a class, it will appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Active classes ───────────────────────────────────────────────── */}
      {activeClasses.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Active Classes
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeClasses.map((cls) => (
              <ClassCard key={cls.class_id} cls={cls} onAccept={handleAccept} onDecline={handleDecline} />
            ))}
          </div>
        </section>
      )}

      {activeClasses.length > 0 && pendingClasses.length > 0 && <Separator />}

      {/* ── Pending classes ──────────────────────────────────────────────── */}
      {pendingClasses.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Pending Invitations
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingClasses.map((cls) => (
              <ClassCard key={cls.class_id} cls={cls} onAccept={handleAccept} onDecline={handleDecline} />
            ))}
          </div>
        </section>
      )}

      {/* ── Declined classes ─────────────────────────────────────────────── */}
      {declinedClasses.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Declined
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {declinedClasses.map((cls) => (
              <ClassCard key={cls.class_id} cls={cls} onAccept={handleAccept} onDecline={handleDecline} />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}

// ── ClassCard ──────────────────────────────────────────────────────────────

interface ClassCardProps {
  cls:       TeacherClass
  onAccept:  (classId: string, className: string) => void
  onDecline: (classId: string, className: string) => void
}

function ClassCard({ cls, onAccept, onDecline }: ClassCardProps) {
  const config     = STATUS_CONFIG[cls.status]
  const StatusIcon = config.icon
  const isActive   = cls.status === 'active'
  const isPending  = cls.status === 'pending'

  const [isPendingAction, startTransition] = useTransition()

  const handleAccept = () => {
    startTransition(async () => {
      try {
        await acceptClassInvite(cls.class_id)
        onAccept(cls.class_id, cls.name)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to accept invitation.')
      }
    })
  }

  const handleDecline = () => {
    startTransition(async () => {
      try {
        await declineClassInvite(cls.class_id)
        onDecline(cls.class_id, cls.name)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to decline invitation.')
      }
    })
  }

  return (
    <Card className="group flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <Badge variant="outline" className={config.className}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        </div>
        <CardTitle className="mt-3 text-base leading-snug line-clamp-2">
          {cls.name}
        </CardTitle>
        {cls.description && (
          <CardDescription className="line-clamp-2 text-xs">
            {cls.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-end gap-4 pt-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span>
            {cls.accepted_at
              ? `Joined ${formatDistanceToNow(new Date(cls.accepted_at), { addSuffix: true })}`
              : `Invited ${formatDistanceToNow(new Date(cls.createdAt), { addSuffix: true })}`}
          </span>
        </div>

        {/* Active — go to class */}
        {isActive && (
          <Button asChild size="sm" className="w-full">
            <Link href={`/dashboard/teacher/classes/${cls.class_id}`}>
              View Class
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        )}

        {/* Pending — accept or decline */}
        {isPending && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleAccept}
              disabled={isPendingAction}
            >
              {isPendingAction
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <><Check className="mr-1 h-3.5 w-3.5" />Accept</>}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleDecline}
              disabled={isPendingAction}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Decline
            </Button>
          </div>
        )}

        {/* Declined — inform admin */}
        {cls.status === 'declined' && (
          <p className="text-xs text-muted-foreground text-center">
            Contact your administrator to be re-invited.
          </p>
        )}
      </CardContent>
    </Card>
  )
}