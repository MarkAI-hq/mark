// src/app/(dashboard)/dashboard/teacher/settings/page.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter }    from 'next/navigation'
import { useForm }      from 'react-hook-form'
import { zodResolver }  from '@hookform/resolvers/zod'
import { z }            from 'zod'
import { useCookies }   from 'next-client-cookies'
import { toast }        from 'sonner'
import { User, Lock, Bell, Eye, EyeOff } from 'lucide-react'

import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input }     from '@/components/ui/input'
import { Button }    from '@/components/ui/button'
import { Switch }    from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { updateTeacherProfile, updateTeacherPassword } from '@/lib/actions/teacher'
import { exportAccountData, deleteAccount, logout } from '@/lib/actions/auth'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertTriangle, Download, Trash2, Shield,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// ── Schemas ────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  lastName:  z.string().min(2, 'At least 2 characters'),
  phone:     z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword:     z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path:    ['confirmPassword'],
})

type ProfileData  = z.infer<typeof profileSchema>
type PasswordData = z.infer<typeof passwordSchema>

// ── Page ───────────────────────────────────────────────────────────────────
export default function TeacherSettingsPage() {
  const router  = useRouter()
  const cookies = useCookies()
  const [profilePending,  startProfile]  = useTransition()
  const [passwordPending, startPassword] = useTransition()
  const [exportPending,   startExport]   = useTransition()
  const [deletePending,   startDelete]   = useTransition()
  const [showCurrent, setShowCurrent]    = useState(false)
  const [showNew,     setShowNew]        = useState(false)
  const [showConfirm, setShowConfirm]    = useState(false)
  const [deleteOpen,  setDeleteOpen]     = useState(false)
  const [confirmText, setConfirmText]    = useState('')

  // Notification preferences (local state — wire to API when ready)
  const [emailNotifs,  setEmailNotifs]  = useState(true)
  const [inAppNotifs,  setInAppNotifs]  = useState(true)
  const [gradingNotifs, setGradingNotifs] = useState(true)

  const deleteConfirmed = confirmText.trim().toLowerCase() === 'delete my account'

  const handleExport = () => {
    startExport(async () => {
      const { data, error } = await exportAccountData()
      if (error) { toast.error('Export failed', { description: error.message }); return }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `mirror-data-${new Date().toISOString().slice(0, 10)}.json`
      a.click(); URL.revokeObjectURL(url)
      toast.success('Data exported.')
    })
  }

  const handleDelete = () => {
    startDelete(async () => {
      const { error } = await deleteAccount()
      if (error) { toast.error('Deletion failed', { description: error.message }); return }
      await logout()
      router.push('/login?deleted=1')
    })
  }

  // Parse user from cookie
  let user: { name?: string; email?: string; firstName?: string; lastName?: string; phone?: string } = {}
  try {
    const raw = cookies.get('user')
    if (raw) user = JSON.parse(decodeURIComponent(raw))
  } catch {}

  const nameParts = user.name?.split(' ') ?? []
  const initials  = nameParts.map(n => n[0]).slice(0, 2).join('').toUpperCase()

  // ── Profile form ──────────────────────────────────────────────────────
  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: nameParts[0] ?? '',
      lastName:  nameParts.slice(1).join(' ') ?? '',
      phone:     user.phone ?? '',
    },
  })

  const onProfileSubmit = (data: ProfileData) => {
    startProfile(async () => {
      const { error } = await updateTeacherProfile(data)
      if (error) {
        toast.error('Failed to update profile', { description: error.message })
      } else {
        toast.success('Profile updated successfully')
      }
    })
  }

  // ── Password form ─────────────────────────────────────────────────────
  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onPasswordSubmit = (data: PasswordData) => {
    startPassword(async () => {
      const { error } = await updateTeacherPassword(data)
      if (error) {
        toast.error('Failed to update password', { description: error.message })
      } else {
        toast.success('Password updated successfully')
        passwordForm.reset()
      }
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── Profile ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your name and contact details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <span className="text-xs text-muted-foreground/60">(cannot be changed)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Teacher</p>
            </div>
          </div>

          <Separator />

          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={profileForm.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={profileForm.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={profileForm.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Phone
                    <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl><Input type="tel" placeholder="+256 700 000 000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex justify-end">
                <Button type="submit" disabled={profilePending}>
                  {profilePending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ── Password ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Change Password
          </CardTitle>
          <CardDescription>
            Use a strong password of at least 8 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">

              <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showCurrent ? 'text' : 'password'} className="pr-9" {...field} />
                      <button type="button" tabIndex={-1}
                        onClick={() => setShowCurrent(p => !p)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showNew ? 'text' : 'password'} className="pr-9" placeholder="Min 8 chars" {...field} />
                        <button type="button" tabIndex={-1}
                          onClick={() => setShowNew(p => !p)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showConfirm ? 'text' : 'password'} className="pr-9" placeholder="Repeat" {...field} />
                        <button type="button" tabIndex={-1}
                          onClick={() => setShowConfirm(p => !p)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={passwordPending}>
                  {passwordPending ? 'Updating...' : 'Update Password'}
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ── Notification Preferences ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Control how and when you receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">In-App Notifications</p>
              <p className="text-xs text-muted-foreground">See notifications in the dashboard</p>
            </div>
            <Switch checked={inAppNotifs} onCheckedChange={setInAppNotifs} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Grading Updates</p>
              <p className="text-xs text-muted-foreground">Notify when AI grading completes</p>
            </div>
            <Switch checked={gradingNotifs} onCheckedChange={setGradingNotifs} />
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => toast.success('Preferences saved')}>
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Account & Privacy ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Account & Privacy
          </CardTitle>
          <CardDescription>
            Your data rights and account lifecycle options.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export my data</p>
              <p className="text-xs text-muted-foreground">Download all personal data as JSON (GDPR)</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exportPending}>
              <Download className="mr-2 h-3.5 w-3.5" />
              {exportPending ? 'Exporting…' : 'Export'}
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-destructive">Delete account</p>
              <p className="text-xs text-muted-foreground">Permanently anonymise your account</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete your account?
            </DialogTitle>
            <DialogDescription>
              This will permanently anonymise your account. You will be logged out
              immediately and cannot recover your data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm">
              Type <strong>delete my account</strong> to confirm
            </label>
            <Input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="delete my account"
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setConfirmText('') }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!deleteConfirmed || deletePending}
              onClick={handleDelete}
            >
              {deletePending ? 'Deleting…' : 'Yes, delete my account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}