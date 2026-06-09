'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { goPrivate } from '@/lib/actions/organizations'

interface Props {
  open:         boolean
  onOpenChange: (open: boolean) => void
  onSuccess:    () => void
}

export function GoPrivateDialog({ open, onOpenChange, onSuccess }: Props) {
  const [isPending, startT] = useTransition()

  function handleConfirm() {
    startT(async () => {
      const { error } = await goPrivate()
      if (error) {
        toast({ title: 'Failed to remove listing', description: error.message, variant: 'destructive' })
      } else {
        toast({ title: 'Your school has been removed from the public listing.' })
        onOpenChange(false)
        onSuccess()
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove your school from the listing?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Your school profile will be hidden from the directory and new student applications will be paused.
            </span>
            <span className="block">
              <strong>Admissions</strong>, <strong>School Hub</strong>, and <strong>Verification</strong> will be removed from your nav. You can re-list at any time.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={e => { e.preventDefault(); handleConfirm() }}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isPending
              ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Removing…</>
              : 'Go Private'
            }
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
