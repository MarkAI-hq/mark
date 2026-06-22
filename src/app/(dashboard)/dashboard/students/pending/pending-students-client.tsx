'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, X, Loader2, GraduationCap, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  approvePendingStudent,
  declinePendingStudent,
  type PendingStudent,
} from '@/lib/actions/students'

export function PendingStudentsClient({
  initial,
}: {
  initial: PendingStudent[]
}) {
  const router = useRouter()
  const [rows, setRows] = useState<PendingStudent[]>(initial)
  const [busy, setBusy] = useState<string | null>(null)

  async function handleApprove(s: PendingStudent) {
    setBusy(s.student_id)
    try {
      const { error } = await approvePendingStudent(s.student_id)
      if (error) {
        toast.error(error.message ?? 'Could not approve')
        return
      }
      setRows((prev) => prev.filter((r) => r.student_id !== s.student_id))
      toast.success(
        `${s.first_name ?? 'Student'} approved${
          s.requested_class_name ? ` → ${s.requested_class_name}` : ''
        }`,
      )
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  async function handleDecline(s: PendingStudent) {
    setBusy(s.student_id)
    try {
      const { error } = await declinePendingStudent(s.student_id)
      if (error) {
        toast.error(error.message ?? 'Could not decline')
        return
      }
      setRows((prev) => prev.filter((r) => r.student_id !== s.student_id))
      toast.success(`${s.first_name ?? 'Student'}'s request declined`)
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Users className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No pending requests</p>
          <p className="text-sm text-muted-foreground">
            New self-enrollment requests will appear here for approval.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3">
      {rows.map((s) => (
        <Card key={s.student_id}>
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gold" />
                <span className="font-semibold">
                  {[s.first_name, s.last_name].filter(Boolean).join(' ') ||
                    'Unnamed student'}
                </span>
                {s.education_level && (
                  <Badge variant="secondary">{s.education_level}</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {s.email && <span>{s.email}</span>}
                {s.student_school_id && (
                  <span className="font-mono text-xs">{s.student_school_id}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline">
                  {s.requested_class_name
                    ? `Requested: ${s.requested_class_name}`
                    : 'No class chosen'}
                </Badge>
                {(s.elective_subjects ?? []).map((e) => (
                  <Badge key={e} variant="secondary" className="capitalize">
                    {e}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={busy === s.student_id}
                onClick={() => handleDecline(s)}
              >
                {busy === s.student_id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Decline
              </Button>
              <Button
                size="sm"
                className="font-semibold"
                disabled={busy === s.student_id}
                onClick={() => handleApprove(s)}
              >
                {busy === s.student_id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Approve
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
