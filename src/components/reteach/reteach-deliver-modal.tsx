'use client'

// src/components/reteach/reteach-deliver-modal.tsx

import { useState, useTransition, useEffect } from 'react'
import { toast }                from 'sonner'
import { CheckCircle2, Loader2, Calendar, Monitor, Printer } from 'lucide-react'
import { format, parseISO }     from 'date-fns'
import { Button }               from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Label }                from '@/components/ui/label'
import { Input }                from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { markSessionDelivered }     from '@/lib/actions/reteach-history'
import { getClassAssessments }      from '@/lib/actions/classes'
import type { ReteachSessionRecord } from '@/lib/actions/reteach-history'
import type { Assessment }           from '@/lib/actions/assessments'

interface ReteachDeliverModalProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  sessionId:    string
  scope:        ReteachSessionRecord['scope']
  errorType:    string
  onDelivered:  (updated: ReteachSessionRecord) => void
  classId?:     string
}

export function ReteachDeliverModal({
  open,
  onOpenChange,
  sessionId,
  scope,
  errorType,
  onDelivered,
  classId,
}: ReteachDeliverModalProps) {
  const [followUpDate,         setFollowUpDate]         = useState('')
  const [followUpAssessmentId, setFollowUpAssessmentId] = useState('')
  const [assessments,          setAssessments]          = useState<Assessment[]>([])
  const [loadingAssessments,   setLoadingAssessments]   = useState(false)
  const [deliveryMode,         setDeliveryMode]         = useState<'digital' | 'print'>('digital')
  const [showBackdate,         setShowBackdate]         = useState(false)
  const [deliveredAt,          setDeliveredAt]          = useState('')
  const [isPending,            startTransition]         = useTransition()

  const scopeLabel = scope === 'class' || scope === 'group' ? 'the class' : 'this student'

  useEffect(() => {
    if (!open || !classId) return
    setLoadingAssessments(true)
    getClassAssessments(classId)
      .then(({ data }) => setAssessments(data ?? []))
      .catch(() => setAssessments([]))
      .finally(() => setLoadingAssessments(false))
  }, [open, classId])

  useEffect(() => {
    if (!open) {
      setFollowUpDate('')
      setFollowUpAssessmentId('')
      setDeliveryMode('digital')
      setShowBackdate(false)
      setDeliveredAt('')
    }
  }, [open])

  const submit = (skipFollowUp?: boolean) => {
    startTransition(async () => {
      const { data, error } = await markSessionDelivered(
        sessionId,
        skipFollowUp ? undefined : (followUpDate || undefined),
        skipFollowUp ? undefined : (followUpAssessmentId.trim() || undefined),
        deliveryMode,
        deliveredAt || undefined,
      )
      if (error || !data) {
        toast.error(error?.message ?? 'Failed to mark session as delivered.')
        return
      }
      toast.success('Session marked as delivered. Baseline captured.')
      onDelivered(data)
      onOpenChange(false)
    })
  }

  // Only published assessments are valid follow-ups
  const publishedAssessments = assessments.filter((a) => a.is_published)

  // Format assessment date for display
  const formatAssessmentDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null
    try { return format(parseISO(dateStr), 'MMM d, yyyy') }
    catch { return null }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Mark session as delivered
          </DialogTitle>
          <DialogDescription className="text-sm mt-1">
            You ran the <span className="font-medium">{errorType}</span> intervention
            with {scopeLabel}. Link a follow-up assessment to automatically measure
            whether it worked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">

          {/* G2: Delivery mode toggle */}
          <div className="space-y-2">
            <Label className="text-sm">How did you deliver this session?</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryMode('digital')}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                  deliveryMode === 'digital'
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-muted text-muted-foreground hover:border-primary/50'
                }`}
              >
                <Monitor className="h-4 w-4 shrink-0" />
                <div className="text-left">
                  <p className="font-medium text-xs">Digital</p>
                  <p className="text-[10px] opacity-70">Students used devices</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMode('print')}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                  deliveryMode === 'print'
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-muted text-muted-foreground hover:border-primary/50'
                }`}
              >
                <Printer className="h-4 w-4 shrink-0" />
                <div className="text-left">
                  <p className="font-medium text-xs">Print</p>
                  <p className="text-[10px] opacity-70">Printed &amp; handed out</p>
                </div>
              </button>
            </div>
            {deliveryMode === 'print' && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
                Log exit ticket results after class to get a leading indicator before formal impact is calculated.
              </p>
            )}
          </div>

          {/* Follow-up assessment dropdown */}
          {classId && (
            <div className="space-y-1.5">
              <Label className="text-sm">
                Link a follow-up assessment
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  (recommended)
                </span>
              </Label>

              {/* Guidance — tells teacher exactly what to pick */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose the next assessment this class will sit after today&apos;s
                session. When it&apos;s graded, Mirror will automatically compare
                scores and tell you whether the intervention worked.
              </p>

              <Select
                value={followUpAssessmentId}
                onValueChange={setFollowUpAssessmentId}
                disabled={loadingAssessments}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingAssessments
                        ? 'Loading assessments…'
                        : publishedAssessments.length === 0
                          ? 'No published assessments yet'
                          : 'Select the next assessment…'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {publishedAssessments.map((a) => {
                    const dateLabel = formatAssessmentDate(a.createdAt)
                    return (
                      <SelectItem key={a.assessment_id} value={a.assessment_id}>
                        <div className="flex flex-col gap-0.5 py-0.5">
                          <span className="font-medium">{a.title}</span>
                          {dateLabel && (
                            <span className="text-xs text-muted-foreground">
                              Created {dateLabel}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              {/* Confirmation when an assessment is selected */}
              {followUpAssessmentId && (
                <p className="text-xs text-green-700 dark:text-green-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  Impact will be calculated automatically when this assessment is graded.
                </p>
              )}
            </div>
          )}

          {/* Follow-up date */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Target re-assessment date
              <span className="text-xs text-muted-foreground font-normal ml-1">
                (optional)
              </span>
            </Label>
            <Input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* G6: Backdate delivery */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setShowBackdate(v => !v)}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              Delivered on a different date?
            </button>
            {showBackdate && (
              <Input
                type="date"
                value={deliveredAt}
                onChange={(e) => setDeliveredAt(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="text-sm"
              />
            )}
          </div>

          {/* What gets captured right now */}
          <div className="rounded-lg bg-muted/50 border p-3 space-y-1.5">
            <p className="text-xs font-medium text-foreground">
              Captured automatically right now:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                Current avg score as baseline
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                Current <span className="font-medium mx-0.5">{errorType}</span> error rate as baseline
              </li>
              {followUpAssessmentId && (
                <li className="flex items-center gap-1.5 text-green-700 dark:text-green-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                  Improvement delta calculated automatically after follow-up grading
                </li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => submit(true)}
            disabled={isPending}
          >
            {isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : 'Skip follow-up'
            }
          </Button>
          <Button
            size="sm"
            onClick={() => submit()}
            disabled={isPending}
            className="gap-2"
          >
            {isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <CheckCircle2 className="h-3.5 w-3.5" />
            }
            Confirm delivery
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}