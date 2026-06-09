'use client'

import { useState, useTransition } from 'react'
import { MessageSquare, Loader2 }  from 'lucide-react'
import { toast }                   from 'sonner'

import { contactAdmin }      from '@/lib/actions/organizations'
import { Button }            from '@/components/ui/button'
import { Textarea }          from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'

const SUBJECTS = [
  { value: 'class_assignment', label: 'Needs class assignment' },
  { value: 'technical_issue', label: 'Technical issue' },
  { value: 'question',        label: 'General question' },
  { value: 'other',           label: 'Other' },
]

interface Props {
  open:           boolean
  onOpenChange:   (open: boolean) => void
  organizationId: string
}

export function ContactAdminDialog({ open, onOpenChange, organizationId }: Props) {
  const [subject,    setSubject]    = useState('')
  const [message,    setMessage]    = useState('')
  const [isPending,  startTransition] = useTransition()

  const canSubmit = subject && message.trim().length >= 10

  const handleSubmit = () => {
    if (!canSubmit) return
    startTransition(async () => {
      const subjectLabel = SUBJECTS.find(s => s.value === subject)?.label ?? subject
      const { error } = await contactAdmin(organizationId, subjectLabel, message.trim())
      if (error) {
        toast.error('Could not send message', { description: error.message })
        return
      }
      toast.success('Message sent to your admin.')
      setSubject('')
      setMessage('')
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Contact Admin
          </DialogTitle>
          <DialogDescription>
            Send a message to your school administrator. They will receive it and follow up with you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Subject</label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="What's this about?" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="Describe your issue or question…"
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={500}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isPending ? 'Sending…' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
