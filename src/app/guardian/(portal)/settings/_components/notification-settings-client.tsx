'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import type { GuardianChild, GuardianNotificationPreferences } from '@/lib/actions/guardian'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/actions/guardian'

const PREFERENCE_LABELS: Record<keyof GuardianNotificationPreferences, string> = {
  enrollment: 'Enrollment updates',
  certificate: 'Certificates earned',
  streak_at_risk: 'Study streak at risk',
  exam_registration: 'Exam registration updates',
}

function ChildNotificationCard({ child }: { child: GuardianChild }) {
  const [prefs, setPrefs] = useState<GuardianNotificationPreferences | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    getNotificationPreferences(child.student_id).then(({ data }) => {
      if (data) setPrefs(data)
    })
  }, [child.student_id])

  const handleToggle = async (
    key: keyof GuardianNotificationPreferences,
    value: boolean,
  ) => {
    if (!prefs) return
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    setSaving(key)
    const { error } = await updateNotificationPreferences(child.student_id, next)
    setSaving(null)
    if (error) {
      toast.error('Failed to update preference')
      setPrefs(prefs)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {child.first_name} {child.last_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!prefs && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        )}
        {prefs &&
          (Object.keys(PREFERENCE_LABELS) as Array<keyof GuardianNotificationPreferences>).map(
            (key) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`${child.student_id}-${key}`} className="text-sm font-normal">
                  {PREFERENCE_LABELS[key]}
                </Label>
                <Switch
                  id={`${child.student_id}-${key}`}
                  checked={prefs[key] !== false}
                  disabled={saving === key}
                  onCheckedChange={(checked) => handleToggle(key, checked)}
                />
              </div>
            ),
          )}
      </CardContent>
    </Card>
  )
}

export function NotificationSettingsClient({ students }: { students: GuardianChild[] }) {
  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No children linked to this account yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {students.map((child) => (
        <ChildNotificationCard key={child.student_id} child={child} />
      ))}
    </div>
  )
}
