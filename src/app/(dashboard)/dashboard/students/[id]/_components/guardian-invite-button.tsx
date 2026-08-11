'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'
import { inviteGuardian } from '@/lib/actions/students'

export function GuardianInviteButton({
  studentId,
  guardianId,
}: {
  studentId: string
  guardianId: string
}) {
  const [isPending, start] = useTransition()

  const handleInvite = () => {
    start(async () => {
      const { data, error } = await inviteGuardian(studentId, guardianId)
      if (error) {
        toast.error('Failed to send invitation', { description: error.message })
        return
      }
      toast.success(data?.message ?? 'Invitation sent')
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleInvite} disabled={isPending}>
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      Invite to portal
    </Button>
  )
}
