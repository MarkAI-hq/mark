'use client'

import { useState, useTransition } from 'react'
import { Lock, BookOpen, Loader2, Hourglass, XCircle, CheckCircle2, GraduationCap } from 'lucide-react'
import { toast }          from 'sonner'
import { formatDistanceToNow } from 'date-fns'

import type { Class }            from '@/lib/types'
import type { ClassJoinRequest, TeacherClass } from '@/lib/actions/classes'
import { requestToJoinClass, cancelJoinRequest } from '@/lib/actions/classes'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge }   from '@/components/ui/badge'
import { Button }  from '@/components/ui/button'

interface Props {
  allClasses:      Class[]
  myJoinRequests:  ClassJoinRequest[]
  myClasses:       TeacherClass[]
}

type RequestStatus = 'none' | 'pending' | 'approved' | 'declined'

export function BrowseClassesTab({ allClasses, myJoinRequests: initial, myClasses }: Props) {
  const [requests, setRequests] = useState<ClassJoinRequest[]>(initial)
  const [isPending, start]      = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)

  const assignedIds = new Set(myClasses.map(c => c.class_id))

  function getStatus(classId: string): { status: RequestStatus; requestId?: string } {
    if (assignedIds.has(classId)) return { status: 'approved' }
    const req = requests.find(r => r.class_id === classId)
    if (!req) return { status: 'none' }
    return { status: req.status === 'approved' ? 'approved' : req.status === 'declined' ? 'declined' : 'pending', requestId: req.request_id }
  }

  const handleRequest = (classId: string) => {
    setActionId(classId)
    start(async () => {
      const { data, error } = await requestToJoinClass(classId)
      if (error) {
        toast.error('Could not send request', { description: error.message })
      } else if (data) {
        setRequests(prev => [...prev.filter(r => r.class_id !== classId), data])
        toast.success('Request sent to your admin.')
      }
      setActionId(null)
    })
  }

  const handleCancel = (classId: string) => {
    setActionId(classId)
    start(async () => {
      const { error } = await cancelJoinRequest(classId)
      if (error) {
        toast.error('Could not cancel request', { description: error.message })
      } else {
        setRequests(prev => prev.filter(r => r.class_id !== classId))
        toast.info('Request cancelled.')
      }
      setActionId(null)
    })
  }

  if (allClasses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <GraduationCap className="h-10 w-10 mb-3 opacity-25" />
        <p className="text-sm font-medium">No classes found in your school yet.</p>
        <p className="text-xs mt-1">Ask your admin to create classes first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        These are all classes at your school. You can request to be added — your admin will approve or decline.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allClasses.map(cls => {
          const { status, requestId } = getStatus(cls.class_id)
          const isActing = isPending && actionId === cls.class_id

          return (
            <ClassBrowseCard
              key={cls.class_id}
              cls={cls}
              status={status}
              requestId={requestId}
              isActing={isActing}
              onRequest={handleRequest}
              onCancel={handleCancel}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Individual locked class card ───────────────────────────────────────────

interface CardProps {
  cls:       Class
  status:    RequestStatus
  requestId?: string
  isActing:  boolean
  onRequest: (classId: string) => void
  onCancel:  (classId: string) => void
}

function ClassBrowseCard({ cls, status, isActing, onRequest, onCancel }: CardProps) {
  return (
    <Card className="flex flex-col relative overflow-hidden opacity-90 hover:opacity-100 transition-opacity">
      {/* Lock overlay stripe */}
      <div className="absolute top-0 right-0 p-2 text-muted-foreground/40">
        <Lock className="h-4 w-4" />
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <CardTitle className="text-sm leading-snug line-clamp-2">{cls.name}</CardTitle>
            {cls.grade_level && (
              <p className="text-xs text-muted-foreground mt-0.5">{cls.grade_level}</p>
            )}
          </div>
        </div>
        {cls.description && (
          <CardDescription className="text-xs line-clamp-2 mt-1">{cls.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex flex-col flex-1 justify-end gap-3 pt-0">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          Created {formatDistanceToNow(new Date(cls.createdAt), { addSuffix: true })}
        </p>

        {status === 'approved' && (
          <Badge className="w-fit text-xs bg-emerald-50 text-emerald-700 border-emerald-200" variant="outline">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Assigned
          </Badge>
        )}

        {status === 'pending' && (
          <div className="flex items-center justify-between gap-2">
            <Badge className="text-xs bg-amber-50 text-amber-700 border-amber-200" variant="outline">
              <Hourglass className="mr-1 h-3 w-3" /> Pending
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground hover:text-destructive px-2"
              onClick={() => onCancel(cls.class_id)}
              disabled={isActing}
            >
              {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cancel request'}
            </Button>
          </div>
        )}

        {status === 'declined' && (
          <div className="flex items-center justify-between gap-2">
            <Badge className="text-xs bg-rose-50 text-rose-700 border-rose-200" variant="outline">
              <XCircle className="mr-1 h-3 w-3" /> Declined
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2"
              onClick={() => onRequest(cls.class_id)}
              disabled={isActing}
            >
              {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Re-request'}
            </Button>
          </div>
        )}

        {status === 'none' && (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => onRequest(cls.class_id)}
            disabled={isActing}
          >
            {isActing
              ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Sending…</>
              : 'Request to Join'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
