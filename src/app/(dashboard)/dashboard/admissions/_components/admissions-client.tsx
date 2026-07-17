'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Check,
  X,
  Sparkles,
  Clock,
  User,
  Mail,
  MapPin,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import type { ApplicationRecord } from '@/lib/actions/admissions'
import { approveApplication, declineApplication } from '@/lib/actions/admissions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  initialApplications: ApplicationRecord[]
  total: number
}

const FIT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  strong_fit: { label: 'Strong fit', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  borderline: { label: 'Borderline', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  non_traditional: { label: 'Non-traditional', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  offer_sent: { label: 'Offer sent', color: 'text-[#C9A84C] bg-[#FBF5E6] border-[#C9A84C]/30' },
  approved: { label: 'Approved', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  declined: { label: 'Declined', color: 'text-red-600 bg-red-50 border-red-200' },
  more_info: { label: 'More info', color: 'text-blue-600 bg-blue-50 border-blue-200' },
}

function ApplicationCard({ app, onApprove, onDecline }: {
  app: ApplicationRecord
  onApprove: (id: string) => void
  onDecline: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [declineReason, setDeclineReason] = useState('')

  const fit = app.ai_fit_category ? FIT_CONFIG[app.ai_fit_category] : null
  const status = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending
  const isPending = app.status === 'pending' || app.status === 'more_info'

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/10 text-sm font-bold text-[#C9A84C]">
              {app.first_name[0]}{app.last_name[0]}
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {app.first_name} {app.last_name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{app.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {fit && (
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${fit.bg} ${fit.color}`}>
                {fit.label}
              </span>
            )}
            {!fit && app.status === 'pending' && (
              <span className="flex items-center gap-1 rounded-full border border-border/50 bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                AI screening...
              </span>
            )}
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {app.country && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {app.country}
            </div>
          )}
          {app.education_level && (
            <div className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {app.education_level}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(app.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </div>
        </div>

        {/* AI summary */}
        {app.ai_summary && (
          <div className="mt-3 rounded-lg border border-[#C9A84C]/20 bg-[#FBF5E6] px-3 py-2.5 dark:bg-[#1a1600]">
            <div className="mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[#C9A84C]" />
              <span className="text-xs font-medium text-[#C9A84C]">AI Assessment</span>
            </div>
            <p className="text-xs text-muted-foreground">{app.ai_summary}</p>
          </div>
        )}
      </div>

      {/* Expandable details */}
      {(app.motivation || app.goals) && (
        <div className="border-t border-border/50">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
          >
            <span>Application details</span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {expanded && (
            <div className="px-4 pb-4 space-y-3">
              {app.motivation && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Motivation</p>
                  <p className="text-sm text-foreground">{app.motivation}</p>
                </div>
              )}
              {app.goals && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Goals</p>
                  <p className="text-sm text-foreground">{app.goals}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isPending && !declining && (
        <div className="border-t border-border/50 flex divide-x divide-border/50">
          <button
            onClick={() => onApprove(app.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            <Check className="h-4 w-4" />
            Approve
          </button>
          <button
            onClick={() => setDeclining(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <X className="h-4 w-4" />
            Decline
          </button>
        </div>
      )}

      {isPending && declining && (
        <div className="border-t border-border/50 p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Reason for declining (optional — sent to applicant):</p>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="e.g. Applications are currently closed, or no matching curriculum..."
            rows={2}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeclining(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => onDecline(app.id)}
              className="flex-1 bg-red-500 text-white hover:bg-red-600"
            >
              Confirm decline
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function AdmissionsClient({ initialApplications, total }: Props) {
  const [apps, setApps] = useState<ApplicationRecord[]>(initialApplications)
  const [isPending, startTransition] = useTransition()

  function handleApprove(id: string) {
    startTransition(async () => {
      const { error } = await approveApplication(id)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Application approved. Student account created.')
      setApps((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'approved' as const } : a)),
      )
    })
  }

  function handleDecline(id: string) {
    startTransition(async () => {
      const { error } = await declineApplication(id)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Application declined.')
      setApps((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'declined' as const } : a)),
      )
    })
  }

  const pending = apps.filter((a) => a.status === 'pending' || a.status === 'more_info')
  const reviewed = apps.filter(
    (a) => a.status === 'approved' || a.status === 'declined' || a.status === 'offer_sent',
  )
  const strongFit = pending.filter((a) => a.ai_fit_category === 'strong_fit').length
  const borderline = pending.filter((a) => a.ai_fit_category === 'borderline').length
  const nonTraditional = pending.filter((a) => a.ai_fit_category === 'non_traditional').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and approve student applications. AI screens each one automatically.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: total, color: 'text-foreground' },
          { label: 'Strong fit', value: strongFit, color: 'text-emerald-600' },
          { label: 'Borderline', value: borderline, color: 'text-amber-600' },
          { label: 'Non-traditional', value: nonTraditional, color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-border/50 bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pending queue */}
      {pending.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Awaiting review ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                onApprove={handleApprove}
                onDecline={handleDecline}
              />
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <Check className="mb-3 h-10 w-10 text-emerald-500/40" />
          <p className="font-medium text-muted-foreground">No pending applications</p>
          <p className="mt-1 text-sm text-muted-foreground">
            New applications will appear here automatically.
          </p>
        </div>
      )}

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Reviewed ({reviewed.length})
          </h2>
          <div className="space-y-2">
            {reviewed.map((app) => {
              const status = STATUS_CONFIG[app.status]
              return (
                <div
                  key={app.id}
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-card/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {app.first_name[0]}{app.last_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {app.first_name} {app.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{app.email}</p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
