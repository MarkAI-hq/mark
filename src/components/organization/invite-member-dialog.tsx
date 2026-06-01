'use client'

// src/components/organization/invite-member-dialog.tsx

import { useForm }   from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }         from 'zod'
import { Loader2 }   from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'

// ── Schema ─────────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  role:  z.string().min(1, { message: 'Please select a role.' }),
})

export type InviteMemberData = z.infer<typeof inviteSchema>

// ── Props ──────────────────────────────────────────────────────────────────

interface InviteMemberDialogProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  onSubmit:     (data: InviteMemberData) => void
  isSubmitting: boolean
  availableRoles?: { role_name: string; description?: string | null }[]
}

const DEFAULT_ROLES = [
  { role_name: 'Teacher',  description: 'Can create assessments and view students' },
  { role_name: 'Admin',    description: 'Full organization management' },
]

// ── Component ──────────────────────────────────────────────────────────────

export function InviteMemberDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  availableRoles,
}: InviteMemberDialogProps) {
  const roles = availableRoles?.length ? availableRoles : DEFAULT_ROLES

  const form = useForm<InviteMemberData>({
    resolver:      zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'Teacher' },
  })

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite New Member</DialogTitle>
          <DialogDescription>
            Enter the email address and role for the new member. They will
            receive an email with instructions to join.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map(r => (
                        <SelectItem key={r.role_name} value={r.role_name}>
                          <span>{r.role_name}</span>
                          {r.description && (
                            <span className="text-muted-foreground ml-1 text-xs">— {r.description}</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
