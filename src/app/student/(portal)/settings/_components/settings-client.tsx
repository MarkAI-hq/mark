'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, User, KeyRound, Bell, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  updateOwnProfile,
  changeOwnPin,
  updateNotificationSettings,
  type NotificationSettings,
} from '@/lib/actions/student-settings'

export function SettingsClient({
  user,
  notificationSettings,
}: {
  user: any
  notificationSettings: NotificationSettings | null
}) {
  const [firstName, setFirstName] = useState(user?.first_name ?? '')
  const [lastName, setLastName] = useState(user?.last_name ?? '')
  const [phone, setPhone] = useState(user?.phone_number ?? '')
  const [savingProfile, startProfileTransition] = useTransition()

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [savingPin, startPinTransition] = useTransition()

  const [emailEnabled, setEmailEnabled] = useState(notificationSettings?.email_enabled ?? true)
  const [inAppEnabled, setInAppEnabled] = useState(notificationSettings?.in_app_enabled ?? true)
  const [savingNotifications, startNotificationsTransition] = useTransition()

  function handleSaveProfile() {
    startProfileTransition(async () => {
      const { error } = await updateOwnProfile({
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Profile updated.')
    })
  }

  function handleChangePin() {
    if (!currentPin || !newPin) {
      toast.error('Enter your current and new PIN.')
      return
    }
    startPinTransition(async () => {
      const { error } = await changeOwnPin(currentPin, newPin)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('PIN changed.')
      setCurrentPin('')
      setNewPin('')
    })
  }

  function handleSaveNotifications(next: { email?: boolean; inApp?: boolean }) {
    const email = next.email ?? emailEnabled
    const inApp = next.inApp ?? inAppEnabled
    setEmailEnabled(email)
    setInAppEnabled(inApp)
    startNotificationsTransition(async () => {
      const { error } = await updateNotificationSettings({ email_enabled: email, in_app_enabled: inApp })
      if (error) toast.error(error.message)
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile, security, and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Phone number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4" /> Change PIN</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Current PIN</Label>
              <Input type="password" inputMode="numeric" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>New PIN (4-6 digits)</Label>
              <Input type="password" inputMode="numeric" value={newPin} onChange={(e) => setNewPin(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleChangePin} disabled={savingPin}>
            {savingPin ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Change PIN
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email notifications</p>
              <p className="text-xs text-muted-foreground">Receive updates by email.</p>
            </div>
            <Switch checked={emailEnabled} disabled={savingNotifications} onCheckedChange={(v) => handleSaveNotifications({ email: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">In-app notifications</p>
              <p className="text-xs text-muted-foreground">Show alerts inside Mark.</p>
            </div>
            <Switch checked={inAppEnabled} disabled={savingNotifications} onCheckedChange={(v) => handleSaveNotifications({ inApp: v })} />
          </div>
          <p className="text-xs text-muted-foreground pt-1 border-t">
            These control account-wide notifications. Study-reminder channels (including WhatsApp) are set separately under{' '}
            <Link href="/student/schedule?tab=timetable" className="text-gold hover:underline">Schedule → Nudge me on</Link>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Study pace &amp; reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Manage your daily study pace, reminder times, pacing mode, and which channels (in-app, email, WhatsApp) nudge you to study — all from the Schedule page.
          </p>
          <Button asChild variant="outline">
            <Link href="/student/schedule?tab=timetable">Go to Schedule</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
