'use client'

import { useState, useTransition } from 'react'
import { BookOpen, Clock, Loader2, CheckCircle2, Send } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { TeacherClass, ClassJoinRequest } from '@/lib/actions/classes'
import type { Class } from '@/lib/types'
import { requestToJoinClass } from '@/lib/actions/classes'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  allClasses: Class[]
  myJoinRequests: ClassJoinRequest[]
  myClasses: TeacherClass[]
}

export function BrowseClassesTab({ allClasses, myJoinRequests, myClasses }: Props) {
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(
    new Set(myJoinRequests.map((r) => r.class_id)),
  )
  const [isTransitioning, startTransition] = useTransition()

  const myClassIds = new Set(myClasses.map((c) => c.class_id))

  function handleRequestJoin(classId: string, className: string) {
    startTransition(async () => {
      const { error } = await requestToJoinClass(classId)
      if (error) {
        toast.error(error.message)
        return
      }
      setPendingRequests((prev) => new Set([...prev, classId]))
      toast.success(`Join request sent for "${className}".`)
    })
  }

  if (allClasses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-16 text-center">
        <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">No classes found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask your admin to create classes for this school.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {allClasses.length} class{allClasses.length !== 1 ? 'es' : ''} at your school. Request to join any class — your admin will approve.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allClasses.map((cls) => {
          const isAlreadyIn = myClassIds.has(cls.class_id)
          const hasPending = pendingRequests.has(cls.class_id)

          return (
            <Card key={cls.class_id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  {isAlreadyIn && (
                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Enrolled
                    </Badge>
                  )}
                  {hasPending && !isAlreadyIn && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">
                      <Clock className="mr-1 h-3 w-3" />
                      Requested
                    </Badge>
                  )}
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
              <CardContent className="flex flex-1 flex-col justify-end gap-3 pt-0">
                {isAlreadyIn ? (
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={`/dashboard/teacher/classes/${cls.class_id}`}>
                      View Class
                    </Link>
                  </Button>
                ) : hasPending ? (
                  <Button size="sm" variant="outline" className="w-full" disabled>
                    <Clock className="mr-1.5 h-3.5 w-3.5" />
                    Request pending
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleRequestJoin(cls.class_id, cls.name)}
                    disabled={isTransitioning}
                  >
                    {isTransitioning
                      ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      : <Send className="mr-1.5 h-3.5 w-3.5" />}
                    Request to Join
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
